import { before, test } from "node:test";
import assert from "node:assert/strict";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createFirebaseApi } from "../src/server/firebase-api.ts";

const projectId = "trabalhoerenda-crm-2026";
let pair: Awaited<ReturnType<typeof generateKeyPair>>;
let keys: ReturnType<typeof createLocalJWKSet>;
const docs = new Map<string, { name: string; fields: Record<string, unknown> }>();
const requested: string[] = [];
const base = "https://crm.example.test";
const rest = "https://firestore.googleapis.com/v1/projects/" + projectId + "/databases/crm-dados/documents/";
before(async () => { pair = await generateKeyPair("RS256"); keys = createLocalJWKSet({ keys:[{ ...await exportJWK(pair.publicKey),kid:"test",alg:"RS256" }] }); });
async function token(uid: string, options: { audience?: string; expired?: boolean; verified?: boolean; provider?: string } = {}) {
  return new SignJWT({ auth_time:Math.floor(Date.now()/1000),email:uid+"@example.test",email_verified:options.verified ?? true,name:"Pessoa Teste",firebase:{ sign_in_provider:options.provider || "google.com" } }).setProtectedHeader({ alg:"RS256",kid:"test" }).setSubject(uid).setIssuer("https://securetoken.google.com/"+projectId).setAudience(options.audience || projectId).setIssuedAt().setExpirationTime(options.expired ? "-1h" : "1h").sign(pair.privateKey);
}
const fakeFetch: typeof fetch = async (input, init) => {
  const url = String(input); requested.push(url);
  assert.ok(url.startsWith(rest), "Não acessar outro projeto ou banco.");
  const key = url.slice(rest.length).split("?")[0];
  if (key.endsWith(":runQuery")) {
    const query = JSON.parse(String(init?.body));
    const prefix = key.replace(":runQuery", "")+"/"+query.structuredQuery.from[0].collectionId;
    return Response.json([...docs].filter(([path]) => path.startsWith(prefix+"/") && path.split("/").length === prefix.split("/").length+1).map(([,document]) => ({ document })));
  }
  if (init?.method === "PATCH") {
    const value = JSON.parse(String(init.body));
    const saved = { name:rest.replace("https://firestore.googleapis.com/v1/", "")+key, fields:value.fields };
    docs.set(key,saved); return Response.json(saved);
  }
  if (init?.method === "DELETE") { docs.delete(key); return Response.json({}); }
  if (key.split("/").length % 2 === 1) return Response.json({ documents:[...docs].filter(([path]) => path.startsWith(key+"/") && path.split("/").length === key.split("/").length+1).map(([,value]) => value) });
  return docs.has(key) ? Response.json(docs.get(key)) : Response.json({ error:{ message:"Not found" } },{ status:404 });
};
async function call(path: string, method: string, bearer?: string, body?: unknown, origin = base) {
  const handle = createFirebaseApi({ projectId,databaseId:"crm-dados",keys,fetch:fakeFetch });
  const response = await handle(new Request(base+path,{ method, headers:{ Origin:origin, ...(bearer ? { Authorization:"Bearer "+bearer } : {}), "Content-Type":"application/json" },body:body === undefined ? undefined : JSON.stringify(body) }));
  const data = response.status === 204 ? null : await response.json();
  return { response,data };
}
test("Firebase exige token assinado, público correto, validade e e-mail Google verificado",async () => {
  for (const invalid of [undefined,"inválido",await token("alice",{ audience:"outro-projeto" }),await token("alice",{ expired:true }),await token("alice",{ verified:false }),await token("alice",{ provider:"password" })]) assert.equal((await call("/api/session","GET",invalid)).response.status,401);
  assert.equal(requested.length,0);
});
test("sessão Google prepara perfil e coleções vazias no Firestore",async () => {
  const bearer = await token("alice");
  const session = await call("/api/session","GET",bearer);
  assert.equal(session.response.status,200);
  assert.equal(session.data.user.provider,"google");
  assert.equal(session.data.user.email,"alice@example.test");
  const data = await call("/api/data","GET",bearer);
  assert.deepEqual(data.data.contacts,[]);
  assert.ok(requested.some(path => path.endsWith("/users/alice:runQuery")),"Ler coleções com consulta de documentos, não metadados administrativos.");
  assert.ok(docs.has("users/alice"));
});
test("CRUD Firestore é privado ao UID e descarta tentativa de mudar proprietário",async () => {
  const alice = await token("alice");
  const bob = await token("bob");
  const created = await call("/api/contacts","POST",alice,{ name:"Contato Alice",owner_id:"bob" });
  assert.equal(created.response.status,201);
  assert.equal(created.data.owner_id,"alice");
  const id = created.data.id;
  assert.equal((await call(`/api/contacts/${id}`,"DELETE",bob)).response.status,404);
  assert.equal((await call("/api/data","GET",bob)).data.contacts.length,0);
  assert.equal((await call("/api/tasks","POST",bob,{ title:"Vínculo inválido",contact_id:id })).response.status,400);
  assert.equal((await call(`/api/contacts/${id}`,"PUT",alice,{ name:"Contato editado" })).response.status,200);
  assert.equal((await call(`/api/contacts/${id}`,"DELETE",alice)).response.status,204);
  assert.equal((await call("/api/data","GET",alice)).data.contacts.length,0);
  assert.equal((await call("/api/tasks","POST",alice,{ title:"Não reusar contato excluído",contact_id:id })).response.status,400);
});
test("origem externa e tentativas de alterar senha Google são bloqueadas",async () => {
  const bearer = await token("alice");
  assert.equal((await call("/api/contacts","POST",bearer,{ name:"Não criar" },"https://outro.example.test")).response.status,403);
  assert.equal((await call("/api/password","POST",bearer,{ password:"Senha123456" })).response.status,400);
});
