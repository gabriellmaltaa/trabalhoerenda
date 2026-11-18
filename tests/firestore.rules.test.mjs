import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

let env;
const now = new Date().toISOString();
const id = "c2f5b5d1-b0ee-4a71-aad1-705a6b049826";
const token = email => ({ email,email_verified:true,firebase:{ sign_in_provider:"google.com" } });
const contact = { id,owner_id:"alice",name:"Cliente de teste",email:"contato@example.test",phone:"",company:"",kind:"person",status:"lead",notes:"",deleted:false,created_at:now,updated_at:now };
before(async () => {
  env = await initializeTestEnvironment({ projectId:"demo-trabalhoerenda",firestore:{ host:"127.0.0.1",port:8090,rules:await readFile("firestore.rules","utf8") } });
});
after(async () => { await env?.cleanup(); });
test("não autenticado e outra conta não acessam contatos privados",async () => {
  const alice = env.authenticatedContext("alice",token("alice@example.test")).firestore();
  await assertSucceeds(setDoc(doc(alice,`users/alice/contacts/${id}`),contact));
  await assertSucceeds(getDocs(collection(alice,"users/alice/contacts")));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),`users/alice/contacts/${id}`)));
  await assertFails(getDoc(doc(env.authenticatedContext("bob",token("bob@example.test")).firestore(),`users/alice/contacts/${id}`)));
});
test("não pode mudar proprietário, inserir privilégio ou corromper tipos",async () => {
  const db = env.authenticatedContext("alice",token("alice@example.test")).firestore();
  const ref = doc(db,`users/alice/contacts/${id}`);
  await assertFails(updateDoc(ref,{ owner_id:"bob" }));
  await assertFails(updateDoc(ref,{ admin:true }));
  await assertFails(updateDoc(ref,{ name:42 }));
  await assertFails(updateDoc(ref,{ created_at:"2020-01-01T00:00:00.000Z" }));
  await assertSucceeds(updateDoc(ref,{ notes:"Contato atualizado",updated_at:now }));
});
test("perfil exige e-mail verificado e usuário Google e protege identidade",async () => {
  const db = env.authenticatedContext("alice",token("alice@example.test")).firestore();
  const profile = { id:"alice",email:"alice@example.test",provider:"google",name:"Alice Teste",company:"Empresa",created_at:now,updated_at:now };
  await assertSucceeds(setDoc(doc(db,"users/alice"),profile));
  await assertFails(updateDoc(doc(db,"users/alice"),{ email:"outro@example.test" }));
  const unverified = env.authenticatedContext("unverified",{ ...token("unverified@example.test"),email_verified:false }).firestore();
  await assertFails(setDoc(doc(unverified,"users/unverified"),{ ...profile,id:"unverified",email:"unverified@example.test" }));
  const password = env.authenticatedContext("password",{ ...token("password@example.test"),firebase:{ sign_in_provider:"password" } }).firestore();
  await assertFails(setDoc(doc(password,"users/password"),{ ...profile,id:"password",email:"password@example.test" }));
});
test("oportunidades validam valor e tarefa não pode vincular contato de outra conta",async () => {
  const db = env.authenticatedContext("alice",token("alice@example.test")).firestore();
  const dealId = "d2f5b5d1-b0ee-4a71-aad1-705a6b049826";
  const deal = { id:dealId,owner_id:"alice",title:"Proposta",contact_id:id,value:150050,stage:"proposal",expected_date:null,notes:"",created_at:now,updated_at:now };
  await assertSucceeds(setDoc(doc(db,`users/alice/opportunities/${dealId}`),deal));
  await assertFails(updateDoc(doc(db,`users/alice/opportunities/${dealId}`),{ value:-1 }));
  const bob = env.authenticatedContext("bob",token("bob@example.test")).firestore();
  await assertFails(setDoc(doc(bob,`users/bob/tasks/${dealId}`),{ id:dealId,owner_id:"bob",title:"Não vincular",contact_id:id,due_date:null,priority:"normal",completed:false,notes:"",created_at:now,updated_at:now }));
});
test("exclusão de contato remove dados pessoais, bloqueia novos vínculos e reativação",async () => {
  const db = env.authenticatedContext("alice",token("alice@example.test")).firestore();
  const ref = doc(db,`users/alice/contacts/${id}`);
  await assertFails(deleteDoc(ref));
  await assertSucceeds(setDoc(ref,{ ...contact,name:"Contato excluído",email:"",phone:"",company:"",notes:"",status:"inactive",deleted:true }));
  await assertFails(updateDoc(ref,{ deleted:false }));
  const taskId = "e2f5b5d1-b0ee-4a71-aad1-705a6b049826";
  await assertFails(setDoc(doc(db,`users/alice/tasks/${taskId}`),{ id:taskId,owner_id:"alice",title:"Não vincular",contact_id:id,due_date:null,priority:"normal",completed:false,notes:"",created_at:now,updated_at:now }));
});
test("leitura REST autenticada usa o mesmo isolamento das consultas SDK",async () => {
  const payload = { iss:"https://securetoken.google.com/demo-trabalhoerenda",aud:"demo-trabalhoerenda",sub:"alice",user_id:"alice",iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,...token("alice@example.test") };
  const bearer = Buffer.from(JSON.stringify({ alg:"none",typ:"JWT" })).toString("base64url")+"."+Buffer.from(JSON.stringify(payload)).toString("base64url")+".";
  const response = await fetch("http://127.0.0.1:8090/v1/projects/demo-trabalhoerenda/databases/(default)/documents/users/alice/contacts?pageSize=1000",{ headers:{ Authorization:"Bearer "+bearer } });
  if (response.status !== 200) throw new Error("REST list status "+response.status+": "+await response.text());
});
