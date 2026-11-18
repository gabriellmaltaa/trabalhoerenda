import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { newDb } from "pg-mem";
import { createApi } from "../src/server/api.ts";

const memory = newDb();
const { Pool } = memory.adapters.createPg();
const pool = new Pool();
const api = createApi(pool);
let cookie = "";
let secondCookie = "";
let contactId = "";
let recoveryCode = "";
const base = "http://localhost:3000";

async function call(path: string, method = "GET", body?: unknown, session = cookie, origin = base) {
  const response = await api(new Request(base + path, {
    method,
    headers: { "Content-Type": "application/json", Origin: origin, Cookie: session },
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  return { response, data };
}

before(() => { Reflect.set(process.env, "NODE_ENV", "test"); });
after(async () => { await pool.end(); });

test("dados privados exigem autenticação", async () => {
  const { response } = await call("/api/data");
  assert.equal(response.status, 401);
});

test("cadastro rejeita senha fraca", async () => {
  const { response } = await call("/api/auth/register", "POST", { name: "Teste", company: "Empresa", email: "teste@example.com", password: "123" });
  assert.equal(response.status, 400);
});

test("cadastro cria sessão HttpOnly e código de recuperação", async () => {
  const { response, data } = await call("/api/auth/register", "POST", { name: "Maria Teste", company: "Empresa Teste", email: "maria@example.com", password: "SenhaTeste!2026" });
  assert.equal(response.status, 201);
  assert.equal(data.user.email, "maria@example.com");
  assert.ok(data.recoveryCode.length >= 30);
  recoveryCode = data.recoveryCode;
  assert.match(response.headers.get("set-cookie")!, /HttpOnly/);
  cookie = response.headers.get("set-cookie")!.split(";")[0];
  assert.equal(data.user.password_hash, undefined);
});

test("origem externa não pode alterar dados", async () => {
  const { response } = await call("/api/contacts", "POST", { name: "Inválido" }, cookie, "https://outro.site");
  assert.equal(response.status, 403);
});

test("contato tem validação e persiste no banco", async () => {
  const invalid = await call("/api/contacts", "POST", { name: "" });
  assert.equal(invalid.response.status, 400);
  const { response, data } = await call("/api/contacts", "POST", { name: "João Cliente", email: "joao@example.com", phone: "11999990000", company: "Acme", status: "lead", kind: "person", notes: "Primeiro contato" });
  assert.equal(response.status, 201);
  contactId = data.id;
  const saved = await call("/api/data");
  assert.equal(saved.data.contacts[0].name, "João Cliente");
});

test("valores negativos e datas inválidas são rejeitados", async () => {
  assert.equal((await call("/api/opportunities", "POST", { title: "Proposta", value: -1, stage: "new" })).response.status, 400);
  assert.equal((await call("/api/tasks", "POST", { title: "Retornar", due_date: "2026-02-31" })).response.status, 400);
});

test("oportunidades e tarefas possuem CRUD", async () => {
  const deal = await call("/api/opportunities", "POST", { title: "Contrato mensal", value: 250050, stage: "proposal", contact_id: contactId, expected_date: "2027-01-10", notes: "" });
  assert.equal(deal.response.status, 201);
  assert.equal((await call(`/api/opportunities/${deal.data.id}`, "PUT", { title: "Contrato fechado", value: 250050, stage: "won", contact_id: contactId, expected_date: "2027-01-10", notes: "Fechado" })).response.status, 200);
  const task = await call("/api/tasks", "POST", { title: "Enviar contrato", contact_id: contactId, due_date: "2027-01-11", priority: "high", completed: false, notes: "" });
  assert.equal(task.response.status, 201);
  assert.equal((await call(`/api/tasks/${task.data.id}`, "PUT", { title: "Enviar contrato", contact_id: contactId, due_date: "2027-01-11", priority: "high", completed: true, notes: "" })).response.status, 200);
  const data = (await call("/api/data")).data;
  assert.equal(data.opportunities[0].stage, "won");
  assert.equal(data.tasks[0].completed, true);
  assert.equal((await call(`/api/tasks/${task.data.id}`, "DELETE")).response.status, 204);
});

test("segunda conta não lê, altera ou vincula contato de outra conta", async () => {
  const registered = await call("/api/auth/register", "POST", { name: "Outra Pessoa", company: "Outra Empresa", email: "outra@example.com", password: "SenhaTeste!2026" }, "");
  secondCookie = registered.response.headers.get("set-cookie")!.split(";")[0];
  const ownData = await call("/api/data", "GET", undefined, secondCookie);
  assert.deepEqual(ownData.data.contacts, []);
  assert.equal((await call(`/api/contacts/${contactId}`, "DELETE", undefined, secondCookie)).response.status, 404);
  assert.equal((await call("/api/tasks", "POST", { title: "Vínculo proibido", contact_id: contactId }, secondCookie)).response.status, 400);
});

test("login incorreto é genérico; logout invalida sessão", async () => {
  const wrong = await call("/api/auth/login", "POST", { email: "maria@example.com", password: "SenhaErrada!2026" }, "");
  assert.equal(wrong.response.status, 401);
  const login = await call("/api/auth/login", "POST", { email: "maria@example.com", password: "SenhaTeste!2026" }, "");
  assert.equal(login.response.status, 200);
  const session = login.response.headers.get("set-cookie")!.split(";")[0];
  assert.equal((await call("/api/auth/logout", "POST", {}, session)).response.status, 204);
  assert.equal((await call("/api/data", "GET", undefined, session)).response.status, 401);
});

test("recuperação troca senha, invalida sessões antigas e consome código", async () => {
  const changed = await call("/api/auth/recover", "POST", { email: "maria@example.com", recoveryCode, password: "NovaSenha!2027" }, "");
  assert.equal(changed.response.status, 200);
  assert.equal((await call("/api/data")).response.status, 401);
  assert.equal((await call("/api/auth/recover", "POST", { email: "maria@example.com", recoveryCode, password: "OutraSenha!2027" }, "")).response.status, 401);
  assert.equal((await call("/api/auth/login", "POST", { email: "maria@example.com", password: "NovaSenha!2027" }, "")).response.status, 200);
});

test("exclusão de conta exige senha e remove a própria sessão", async () => {
  assert.equal((await call("/api/account", "DELETE", { currentPassword: "errada" }, secondCookie)).response.status, 400);
  assert.equal((await call("/api/account", "DELETE", { currentPassword: "SenhaTeste!2026" }, secondCookie)).response.status, 204);
  assert.equal((await call("/api/data", "GET", undefined, secondCookie)).response.status, 401);
});
