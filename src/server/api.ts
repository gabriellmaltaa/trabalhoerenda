import type { Pool, PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { z, ZodError } from "zod";
import { contactSchema, loginSchema, opportunitySchema, passwordSchema, profileSchema, recoverSchema, registerSchema, taskSchema } from "./validation.ts";
import type { User } from "../lib/domain.ts";
import { digest, hashPassword, randomToken, sameDigest, verifyPassword } from "./security.ts";
import { schema } from "./schema.ts";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
const publicUser = (row: User): User => ({ id: row.id, name: row.name, company: row.company, email: row.email });
const cookieName = "tr_session";
const sessionDays = 7;
function cookie(token: string, clear = false) {
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : sessionDays * 86400}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
function tokenFrom(request: Request) {
  return (request.headers.get("cookie") || "").split(";").map(c => c.trim()).find(c => c.startsWith(cookieName + "="))?.slice(cookieName.length + 1) || "";
}
function json(data: unknown, status = 200, sessionCookie?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (sessionCookie) headers["Set-Cookie"] = sessionCookie;
  return new Response(status === 204 ? null : JSON.stringify(data), { status, headers });
}
async function body(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError(415, "Envie os dados em JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Dados ausentes.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 32768) { await reader.cancel(); throw new ApiError(413, "Formulário muito grande."); }
    chunks.push(part.value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ApiError(400, "JSON inválido."); }
}

export function createApi(pool: Pool) {
  let initialized: Promise<unknown> | undefined;
  const ready = () => initialized ||= pool.query(schema).catch(error => { initialized = undefined; throw error; });
  async function session(userId: string, db: Pool | PoolClient = pool) {
    const token = randomToken();
    await db.query("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES ($1,$2,$3)", [digest(token), userId, new Date(Date.now() + sessionDays * 86400000)]);
    return cookie(token);
  }
  async function limit(key: string, maximum: number) {
    const bucket = Math.floor(Date.now() / 900000);
    const result = await pool.query("INSERT INTO auth_limits(key,hits,expires_at) VALUES ($1,1,$2) ON CONFLICT (key) DO UPDATE SET hits = auth_limits.hits + 1 RETURNING hits", [digest(key) + ":" + bucket, new Date((bucket + 1) * 900000)]);
    if (Number(result.rows[0].hits) > maximum) throw new ApiError(429, "Muitas tentativas. Aguarde 15 minutos e tente novamente.");
    await pool.query("DELETE FROM auth_limits WHERE expires_at < $1", [new Date()]);
  }
  async function userFor(request: Request) {
    const token = tokenFrom(request);
    if (!/^[a-f0-9]{64}$/.test(token)) return null;
    const found = await pool.query("SELECT u.id,u.name,u.company,u.email FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at > $2", [digest(token), new Date()]);
    return found.rows[0] ? publicUser(found.rows[0]) : null;
  }
  async function transaction<T>(fn: (client: PoolClient) => Promise<T>) {
    const client = await pool.connect();
    try { await client.query("BEGIN"); const result = await fn(client); await client.query("COMMIT"); return result; }
    catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  return async function handle(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, "");
      const method = request.method;
      if (!["GET", "HEAD"].includes(method)) {
        const origin = request.headers.get("origin");
        const allowed = origin && (process.env.APP_ORIGIN ? origin === process.env.APP_ORIGIN : (() => { try { return new URL(origin).host === url.host; } catch { return false; } })());
        if (!allowed || request.headers.get("sec-fetch-site") === "cross-site") throw new ApiError(403, "Origem da requisição não permitida.");
      }
      await ready();
      if (path === "/api/health" && method === "GET") { await pool.query("SELECT 1"); return json({ status: "ok", database: "connected" }); }
      if (path === "/api/session" && method === "GET") return json({ user: await userFor(request) });
      if (path === "/api/auth/register" && method === "POST") {
        const input = registerSchema.parse(await body(request));
        const remote = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
        await limit("register:" + remote, 20);
        const user = { id: randomUUID(), name: input.name, company: input.company, email: input.email };
        const passwordHash = await hashPassword(input.password);
        const recoveryCode = randomToken();
        const sessionCookie = await transaction(async client => {
          const inserted = await client.query("INSERT INTO users(id,name,company,email,password_hash,recovery_hash) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(email) DO NOTHING RETURNING id", [user.id,user.name,user.company,user.email,passwordHash,digest(recoveryCode)]);
          if (!inserted.rowCount) throw new ApiError(409, "Não foi possível criar esta conta. Se já possui cadastro, entre ou recupere seu acesso.");
          return session(user.id, client);
        });
        return json({ user, recoveryCode }, 201, sessionCookie);
      }
      if (path === "/api/auth/login" && method === "POST") {
        const input = loginSchema.parse(await body(request));
        await limit("login:" + input.email, 10);
        const result = await transaction(async client => {
          const found = await client.query("SELECT * FROM users WHERE email=$1 FOR UPDATE", [input.email]);
          const row = found.rows[0];
          const valid = await verifyPassword(input.password, row?.password_hash || "scrypt:00000000000000000000000000000000:" + "0".repeat(128));
          if (!row || !valid) throw new ApiError(401, "E-mail ou senha incorretos.");
          await client.query("DELETE FROM sessions WHERE expires_at < $1", [new Date()]);
          return { user: publicUser(row), sessionCookie: await session(row.id, client) };
        });
        return json({ user: result.user }, 200, result.sessionCookie);
      }
      if (path === "/api/auth/recover" && method === "POST") {
        const input = recoverSchema.parse(await body(request));
        await limit("recover:" + input.email, 8);
        const passwordHash = await hashPassword(input.password);
        await transaction(async client => {
          const found = await client.query("SELECT id,recovery_hash FROM users WHERE email=$1 FOR UPDATE", [input.email]);
          const row = found.rows[0];
          if (!row || !sameDigest(digest(input.recoveryCode), row.recovery_hash)) throw new ApiError(401, "E-mail ou código de recuperação inválido.");
          await client.query("UPDATE users SET password_hash=$1,recovery_hash=NULL WHERE id=$2", [passwordHash,row.id]);
          await client.query("DELETE FROM sessions WHERE user_id=$1", [row.id]);
        });
        return json({ message: "Senha atualizada. Entre novamente e gere um novo código em Configurações." }, 200, cookie("", true));
      }
      if (path === "/api/auth/logout" && method === "POST") {
        await pool.query("DELETE FROM sessions WHERE token_hash=$1", [digest(tokenFrom(request))]);
        return json(null, 204, cookie("", true));
      }
      const user = await userFor(request);
      if (!user) throw new ApiError(401, "Sua sessão expirou. Entre novamente.");
      if (path === "/api/data" && method === "GET") {
        const [contacts, opportunities, tasks] = await Promise.all([
          pool.query("SELECT * FROM contacts WHERE owner_id=$1 ORDER BY created_at DESC", [user.id]),
          pool.query("SELECT * FROM opportunities WHERE owner_id=$1 ORDER BY created_at DESC", [user.id]),
          pool.query("SELECT * FROM tasks WHERE owner_id=$1 ORDER BY created_at DESC", [user.id]),
        ]);
        return json({ user, contacts: contacts.rows, opportunities: opportunities.rows.map(row => ({ ...row, value: Number(row.value) })), tasks: tasks.rows });
      }
      if (path === "/api/profile" && method === "PUT") {
        const input = profileSchema.parse(await body(request));
        const result = await pool.query("UPDATE users SET name=$1,company=$2 WHERE id=$3 RETURNING id,name,company,email", [input.name,input.company,user.id]);
        return json({ user: publicUser(result.rows[0]) });
      }
      if (path === "/api/account" && method === "DELETE") {
        const input = z.object({ currentPassword: z.string().min(1).max(128) }).parse(await body(request));
        await limit("account:" + user.id, 8);
        await transaction(async client => {
          const found = await client.query("SELECT password_hash FROM users WHERE id=$1 FOR UPDATE", [user.id]);
          if (!found.rowCount || !await verifyPassword(input.currentPassword,found.rows[0].password_hash)) throw new ApiError(400,"Senha atual incorreta.");
          await client.query("DELETE FROM users WHERE id=$1",[user.id]);
        });
        return json(null,204,cookie("",true));
      }
      if ((path === "/api/password" || path === "/api/recovery-code") && method === "POST") {
        const input = z.object({ currentPassword: z.string().min(1).max(128), password: passwordSchema.optional() }).parse(await body(request));
        await limit("password:" + user.id, 10);
        const newHash = input.password ? await hashPassword(input.password) : null;
        const result = await transaction(async client => {
          const found = await client.query("SELECT password_hash FROM users WHERE id=$1 FOR UPDATE", [user.id]);
          if (!await verifyPassword(input.currentPassword, found.rows[0].password_hash)) throw new ApiError(400, "Senha atual incorreta.");
          if (path === "/api/recovery-code") {
            const recoveryCode = randomToken();
            await client.query("UPDATE users SET recovery_hash=$1 WHERE id=$2", [digest(recoveryCode),user.id]);
            return { recoveryCode, sessionCookie: undefined };
          }
          if (!newHash) throw new ApiError(400, "Informe a nova senha.");
          await client.query("UPDATE users SET password_hash=$1 WHERE id=$2", [newHash,user.id]);
          await client.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
          return { recoveryCode: undefined, sessionCookie: await session(user.id, client) };
        });
        return json(result.recoveryCode ? { recoveryCode: result.recoveryCode } : { message: "Senha alterada. As outras sessões foram encerradas." }, 200, result.sessionCookie);
      }
      const match = path.match(/^\/api\/(contacts|opportunities|tasks)(?:\/([a-f0-9-]+))?$/);
      if (match) {
        const table = match[1]; // Identificador limitado pela expressão acima, nunca fornecido livremente.
        const id = match[2];
        if (id && !z.uuid().safeParse(id).success) throw new ApiError(404, "Registro não encontrado.");
        if (method === "DELETE" && id) {
          const removed = await pool.query(`DELETE FROM ${table} WHERE id=$1 AND owner_id=$2 RETURNING id`, [id,user.id]);
          if (!removed.rowCount) throw new ApiError(404, "Registro não encontrado.");
          return json(null, 204);
        }
        if ((method === "POST" && !id) || (method === "PUT" && id)) {
          const validator = table === "contacts" ? contactSchema : table === "opportunities" ? opportunitySchema : taskSchema;
          const input = validator.parse(await body(request));
          if ("contact_id" in input && input.contact_id) {
            const contact = await pool.query("SELECT id FROM contacts WHERE id=$1 AND owner_id=$2", [input.contact_id,user.id]);
            if (!contact.rowCount) throw new ApiError(400, "Selecione um contato da sua conta.");
          }
          const keys = Object.keys(input); // Chaves são exclusivamente produzidas pelos schemas Zod, que descartam campos extras.
          const values: unknown[] = Object.values(input);
          let result;
          if (id) {
            result = await pool.query(`UPDATE ${table} SET ${keys.map((key,index) => `${key}=$${index+1}`).join(",")},updated_at=NOW() WHERE id=$${keys.length+1} AND owner_id=$${keys.length+2} RETURNING *`, [...values,id,user.id]);
            if (!result.rowCount) throw new ApiError(404, "Registro não encontrado.");
          } else {
            result = await pool.query(`INSERT INTO ${table}(id,owner_id,${keys.join(",")}) VALUES(${[...values,0,0].map((_,index) => "$"+(index+1)).join(",")}) RETURNING *`, [randomUUID(),user.id,...values]);
          }
          return json(result.rows[0], id ? 200 : 201);
        }
      }
      throw new ApiError(404, "Rota não encontrada.");
    } catch (error) {
      if (error instanceof ZodError) return json({ error: error.issues[0]?.message || "Verifique os campos informados." }, 400);
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "internal";
      console.error("CRM API error:", code);
      return json({ error: "Não foi possível concluir a operação. Confira a conexão com o banco e tente novamente." }, 503);
    }
  };
}

