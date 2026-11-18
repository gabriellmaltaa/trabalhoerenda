import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";

const origin = process.env.CRM_TEST_URL;
if (!origin?.startsWith("https://")) throw new Error("Defina CRM_TEST_URL com a URL HTTPS do CRM que deseja validar.");
const accounts = [];
async function call(path, method = "GET", body, account) {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(body === undefined ? {} : { "Content-Type":"application/json" }), ...(account?.cookie ? { Cookie:account.cookie } : {}) }, body:body === undefined ? undefined : JSON.stringify(body) });
  const result = response.status === 204 ? null : await response.json();
  const cookie = response.headers.get("set-cookie");
  if (cookie && account) account.cookie = cookie.split(";")[0];
  return { status:response.status, data:result, cookie };
}
async function register() {
  const account = { email:`qa-${randomUUID()}@example.test`, password:randomBytes(24).toString("base64url"), cookie:"" };
  const result = await call("/api/auth/register","POST",{ name:"Validação automática", company:"Conta temporária de teste", ...account },account);
  assert.equal(result.status,201,JSON.stringify(result.data));
  account.recoveryCode = result.data.recoveryCode;
  accounts.push(account);
  return account;
}
try {
  assert.equal((await call("/api/health")).data.database,"connected");
  assert.equal((await call("/api/data")).status,401);
  const a = await register();
  const b = await register();
  const contact = await call("/api/contacts","POST",{ name:"Contato temporário QA", email:"contato@example.test", phone:"11999990000", company:"Empresa QA", status:"lead", kind:"person", notes:"Teste descartável" },a);
  assert.equal(contact.status,201);
  const contactId = contact.data.id;
  assert.equal((await call(`/api/contacts/${contactId}`,"DELETE",undefined,b)).status,404);
  assert.equal((await call("/api/data","GET",undefined,b)).data.contacts.length,0);
  assert.equal((await call("/api/tasks","POST",{ title:"Vínculo proibido", contact_id:contactId },b)).status,400);
  const deal = await call("/api/opportunities","POST",{ title:"Proposta QA", contact_id:contactId, value:175050, stage:"proposal", expected_date:"2027-01-15", notes:"" },a);
  assert.equal(deal.status,201);
  assert.equal((await call(`/api/opportunities/${deal.data.id}`,"PUT",{ ...deal.data, value:175050, stage:"won", expected_date:"2027-01-15" },a)).status,200);
  const task = await call("/api/tasks","POST",{ title:"Retorno QA", contact_id:contactId, due_date:"2027-01-16", priority:"high", completed:false, notes:"" },a);
  assert.equal(task.status,201);
  assert.equal((await call(`/api/tasks/${task.data.id}`,"PUT",{ ...task.data, due_date:"2027-01-16", completed:true },a)).status,200);
  const data = (await call("/api/data","GET",undefined,a)).data;
  assert.equal(data.contacts.length,1);
  assert.equal(data.opportunities[0].value,175050);
  assert.equal(data.opportunities[0].stage,"won");
  assert.equal(data.tasks[0].completed,true);
  const oldCookie = a.cookie;
  assert.equal((await call("/api/auth/logout","POST",{},a)).status,204);
  assert.equal((await call("/api/data","GET",undefined,{ cookie:oldCookie })).status,401);
  assert.equal((await call("/api/auth/login","POST",{ email:a.email,password:a.password },a)).status,200);
  assert.equal((await call("/api/profile","PUT",{ name:"Perfil atualizado",company:"Negócio QA" },a)).status,200);
  const invalidatedCookie = a.cookie;
  const nextPassword = randomBytes(24).toString("base64url");
  const [racingLogin, recovered] = await Promise.all([
    call("/api/auth/login","POST",{ email:a.email,password:a.password },{ cookie:"" }),
    call("/api/auth/recover","POST",{ email:a.email,recoveryCode:a.recoveryCode,password:nextPassword },a),
  ]);
  assert.equal(recovered.status,200);
  if (racingLogin.status === 200) assert.equal((await call("/api/data","GET",undefined,{ cookie:racingLogin.cookie.split(";")[0] })).status,401,"Login com senha antiga não pode sobreviver à recuperação.");
  else assert.equal(racingLogin.status,401);
  a.password = nextPassword;
  assert.equal((await call("/api/data","GET",undefined,{ cookie:invalidatedCookie })).status,401);
  assert.equal((await call("/api/auth/login","POST",{ email:a.email,password:a.password },a)).status,200);
  assert.equal((await call("/api/data","GET",undefined,a)).data.contacts.length,1);
  console.log("PASS: PostgreSQL, cadastro, login, cookies, isolamento, contatos, oportunidades, tarefas, perfil, logout, recuperação e persistência.");
} finally {
  for (const account of accounts) {
    await call("/api/auth/login","POST",{ email:account.email,password:account.password },account);
    const deleted = await call("/api/account","DELETE",{ currentPassword:account.password },account);
    assert.equal(deleted.status,204,"Não foi possível remover a conta temporária de teste.");
  }
  console.log(`Limpeza: ${accounts.length} contas temporárias e seus registros excluídos.`);
}
