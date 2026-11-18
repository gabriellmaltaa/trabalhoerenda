import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTVerifyGetKey } from "jose";
import { randomUUID } from "node:crypto";
import { z, ZodError } from "zod";
import { contactSchema, opportunitySchema, profileSchema, taskSchema } from "./validation.ts";
import { readJson } from "./api.ts";
import type { User } from "../lib/domain.ts";

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
type Value = { stringValue?: string; integerValue?: string; doubleValue?: number; booleanValue?: boolean; nullValue?: null };
type Document = { name: string; fields: Record<string, Value>; updateTime?: string };
class FirebaseApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export function encodeFields(data: Record<string, unknown>): Record<string,Value> {
  return Object.fromEntries(Object.entries(data).map(([key,value]) => [key, value === null ? { nullValue:null } : typeof value === "boolean" ? { booleanValue:value } : typeof value === "number" ? { integerValue:String(value) } : { stringValue:String(value) }]));
}
export function decodeFields(doc: Document): Record<string, unknown> {
  return Object.fromEntries(Object.entries(doc.fields || {}).map(([key,value]) => [key,"nullValue" in value ? null : value.stringValue ?? (value.integerValue !== undefined ? Number(value.integerValue) : value.doubleValue ?? value.booleanValue)]));
}
function json(data: unknown, status = 200) { return new Response(status === 204 ? null : JSON.stringify(data),{ status, headers:{ "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" } }); }
function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  if (process.env.APP_ORIGIN) return origin === process.env.APP_ORIGIN;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
export function createFirebaseApi(options: { projectId: string; databaseId: string; keys?: JWTVerifyGetKey; fetch?: typeof fetch }) {
  const fetcher = options.fetch || fetch;
  const root = `https://firestore.googleapis.com/v1/projects/${options.projectId}/databases/${options.databaseId}/documents`;
  return async function handle(request: Request) {
    try {
      const path = new URL(request.url).pathname.replace(/\/$/,"");
      const method = request.method;
      if (method !== "GET" && !allowedOrigin(request)) throw new FirebaseApiError(403,"Origem da requisição não permitida.");
      const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1];
      if (!token || token.length > 10000) throw new FirebaseApiError(401,"Entre com sua conta Google para continuar.");
      let identity;
      try {
        const { payload } = await jwtVerify(token,options.keys || googleKeys,{ algorithms:["RS256"],audience:options.projectId,issuer:"https://securetoken.google.com/"+options.projectId,requiredClaims:["exp","iat","sub","auth_time"] });
        const firebase = payload.firebase as { sign_in_provider?: string } | undefined;
        if (!payload.sub || !/^[a-zA-Z0-9_-]{1,128}$/.test(payload.sub) || payload.email_verified !== true || typeof payload.email !== "string" || firebase?.sign_in_provider !== "google.com" || typeof payload.auth_time !== "number" || payload.auth_time > Date.now()/1000 + 30) throw new Error("Identidade Google inválida");
        identity = { uid:payload.sub,email:payload.email.toLowerCase(),name:typeof payload.name === "string" ? payload.name : "Minha conta" };
      } catch { throw new FirebaseApiError(401,"Sua sessão Google expirou. Entre novamente."); }
      const uid = identity.uid;
      const namespace = "users/"+uid;
      async function rest(suffix: string, init: RequestInit = {}) {
        const response = await fetcher(root+suffix,{ ...init, headers:{ "Authorization":"Bearer "+token, "Content-Type":"application/json" },signal:AbortSignal.timeout(15000) });
        if (response.status === 404) throw new FirebaseApiError(404,"Registro não encontrado.");
        if (response.status === 409) throw new FirebaseApiError(409,"O registro foi alterado. Atualize a página e tente novamente.");
        if (response.status === 401) throw new FirebaseApiError(401,"Sua sessão Google expirou. Entre novamente.");
        if (response.status === 403) {
          const detail = await response.json().catch(() => ({})) as { error?: { message?: string } };
          console.error("Firestore denied:",init.method || "GET",suffix.replace(namespace,"users/[uid]"),detail.error?.message || "permission-denied");
          throw new FirebaseApiError(403,"O Firestore não autorizou esta operação. Confira as regras de acesso.");
        }
        if (response.status === 429) throw new FirebaseApiError(429,"Limite de uso do banco atingido. Aguarde e tente novamente.");
        if (!response.ok) throw new FirebaseApiError(503,"Não foi possível acessar o Firestore. Tente novamente.");
        return response.status === 204 ? {} : response.json();
      }
      const read = async (docPath: string) => rest("/"+docPath) as Promise<Document>;
      const write = async (docPath: string, data: Record<string, unknown>, exists: boolean) => rest("/"+docPath+"?currentDocument.exists="+exists,{ method:"PATCH",body:JSON.stringify({ fields:encodeFields(data) }) }) as Promise<Document>;
      async function list(collection: string): Promise<Record<string,unknown>[]> {
        const rows: Record<string,unknown>[] = [];
        let last: string | undefined;
        for (let page = 0; page < 100; page++) {
          // Consulta equivalente ao getDocs do SDK: ListDocuments pode tratar uma
          // coleção ainda não materializada como operação de metadados administrativos.
          const result = await rest(`/${namespace}:runQuery`,{ method:"POST",body:JSON.stringify({ structuredQuery:{ from:[{ collectionId:collection }],orderBy:[{ field:{ fieldPath:"__name__" },direction:"ASCENDING" }],limit:1000,...(last ? { startAt:{ values:[{ referenceValue:last }],before:false } } : {}) } }) }) as { document?: Document }[];
          const documents = result.flatMap(item => item.document ? [item.document] : []);
          rows.push(...documents.map(decodeFields));
          if (documents.length < 1000) return rows.sort((a,b) => String(b.created_at).localeCompare(String(a.created_at)));
          last = documents[documents.length-1].name;
        }
        throw new FirebaseApiError(413,"A base excede o limite de carregamento desta versão.");
      }
      async function profile(): Promise<User> {
        let doc;
        try { doc = await read(namespace); }
        catch (error) {
          if (!(error instanceof FirebaseApiError) || error.status !== 404) throw error;
          const now = new Date().toISOString();
          const displayName = identity!.name.trim().slice(0,100);
          const user = { id:uid,name:displayName.length >= 2 ? displayName : "Minha conta",email:identity!.email,company:"Meu negócio",provider:"google",created_at:now,updated_at:now };
          try { doc = await write(namespace,user,false); }
          catch (race) { if (!(race instanceof FirebaseApiError) || race.status !== 409) throw race; doc = await read(namespace); }
        }
        const record = decodeFields(doc);
        return { id:uid,name:String(record.name),email:identity!.email,company:String(record.company),provider:"google" };
      }
      if (path === "/api/session" && method === "GET") return json({ user:await profile() });
      if (path === "/api/data" && method === "GET") {
        const [user,allContacts,opportunities,tasks] = await Promise.all([profile(),list("contacts"),list("opportunities"),list("tasks")]);
        const contacts = allContacts.filter(contact => contact.deleted !== true);
        const contactIds = new Set(contacts.map(contact => contact.id));
        const normalize = (rows: Record<string,unknown>[]) => rows.map(row => ({ ...row,contact_id:contactIds.has(row.contact_id) ? row.contact_id : null }));
        return json({ user,contacts,opportunities:normalize(opportunities),tasks:normalize(tasks) });
      }
      if (path === "/api/auth/logout" && method === "POST") return json(null,204);
      if (["/api/password","/api/recovery-code","/api/account"].includes(path)) throw new FirebaseApiError(400,"Este acesso é gerenciado pela sua conta Google.");
      if (path === "/api/profile" && method === "PUT") {
        const input = profileSchema.parse(await readJson(request));
        const existing = decodeFields(await read(namespace));
        await write(namespace,{ ...existing,...input,updated_at:new Date().toISOString() },true);
        return json({ user:{ id:uid,...input,email:identity.email,provider:"google" } });
      }
      const match = path.match(/^\/api\/(contacts|opportunities|tasks)(?:\/([a-f0-9-]+))?$/);
      if (!match) throw new FirebaseApiError(404,"Rota não encontrada.");
      const table = match[1], id = match[2];
      if (id && !z.uuid().safeParse(id).success) throw new FirebaseApiError(404,"Registro não encontrado.");
      if (method === "DELETE" && id) {
        const target = `${namespace}/${table}/${id}`;
        const existing = await read(target);
        if (table === "contacts") {
          const old = decodeFields(existing);
          if (old.deleted === true) throw new FirebaseApiError(404,"Registro não encontrado.");
          // Um marcador sem dados pessoais evita referências órfãs e não sobrescreve
          // vínculos de tarefas/oportunidades editados simultaneamente em outra aba.
          await write(target,{ id,owner_id:uid,name:"Contato excluído",email:"",phone:"",company:"",notes:"",kind:"person",status:"inactive",deleted:true,created_at:old.created_at,updated_at:new Date().toISOString() },true);
          return json(null,204);
        }
        await rest("/"+target,{ method:"DELETE" }); return json(null,204);
      }
      if ((method === "POST" && !id) || (method === "PUT" && id)) {
        const validator = table === "contacts" ? contactSchema : table === "opportunities" ? opportunitySchema : taskSchema;
        const input = validator.parse(await readJson(request));
        if ("contact_id" in input && input.contact_id) {
          try { const contact = decodeFields(await read(`${namespace}/contacts/${input.contact_id}`)); if (contact.deleted === true) throw new FirebaseApiError(404,"Contato excluído."); }
          catch (error) { if (error instanceof FirebaseApiError && error.status === 404) throw new FirebaseApiError(400,"Selecione um contato da sua conta."); throw error; }
        }
        const docId = id || randomUUID();
        const target = `${namespace}/${table}/${docId}`;
        const existing = id ? decodeFields(await read(target)) : null;
        if (existing?.deleted === true) throw new FirebaseApiError(404,"Registro não encontrado.");
        const now = new Date().toISOString();
        const record = { ...input,id:docId,owner_id:uid,created_at:existing?.created_at || now,updated_at:now,...(table === "contacts" ? { deleted:false } : {}) };
        await write(target,record,!!id); return json(record,id ? 200 : 201);
      }
      throw new FirebaseApiError(404,"Rota não encontrada.");
    } catch (error) {
      if (error instanceof ZodError) return json({ error:error.issues[0]?.message || "Verifique os campos." },400);
      if (error instanceof Error && "status" in error && typeof error.status === "number") return json({ error:error.message },error.status);
      console.error("Firebase CRM:",error instanceof Error ? error.name : "internal");
      return json({ error:"Não foi possível concluir a operação no Firebase." },503);
    }
  };
}
