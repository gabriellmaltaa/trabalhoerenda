"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { contactStatuses, priorities, stages } from "@/lib/domain";
import type { Contact, Opportunity, Task } from "@/lib/domain";
import { Field, getError, Modal } from "@/components/ui";

export type EditorState = { type: "contacts"; item?: Contact } | { type: "opportunities"; item?: Opportunity } | { type: "tasks"; item?: Task };
export function Editor({ state, contacts, onClose, onSaved }: { state: EditorState; contacts: Contact[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const item = state.item?.id ? state.item : undefined;
  const contact = state.type === "contacts" ? state.item : undefined;
  const deal = state.type === "opportunities" ? state.item : undefined;
  const task = state.type === "tasks" ? state.item : undefined;
  const label = state.type === "contacts" ? "contato" : state.type === "opportunities" ? "oportunidade" : "tarefa";
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const data = { ...fields, ...(state.type === "opportunities" ? { value: Math.round(Number(fields.value) * 100) } : {}), ...(state.type === "tasks" ? { completed: fields.completed === "true" } : {}) };
    try { await api(`/api/${state.type}${item ? "/" + item.id : ""}`, item ? "PUT" : "POST", data); await onSaved(); onClose(); }
    catch (error) { setError(getError(error)); }
    finally { setBusy(false); }
  }
  return <Modal title={`${item ? "Editar" : state.type === "opportunities" || state.type === "tasks" ? "Nova" : "Novo"} ${label}`} onClose={() => { if (!busy) onClose(); }} wide><form onSubmit={save} className="form-stack">
    {error && <div className="alert error" role="alert">{error}</div>}
    <Field label={state.type === "contacts" ? "Nome *" : "Título *"}><input autoFocus name={state.type === "contacts" ? "name" : "title"} defaultValue={contact?.name || deal?.title || task?.title || ""} placeholder={state.type === "contacts" ? "Nome da pessoa ou empresa" : state.type === "tasks" ? "O que precisa ser feito?" : "Nome da oportunidade"} minLength={2} maxLength={state.type === "contacts" ? 150 : 180} required /></Field>
    {state.type === "contacts" ? <><div className="form-grid"><Field label="E-mail"><input name="email" type="email" maxLength={254} defaultValue={contact?.email} placeholder="contato@empresa.com.br" /></Field><Field label="Telefone"><input name="phone" type="tel" maxLength={40} defaultValue={contact?.phone} placeholder="(11) 99999-9999" /></Field></div><Field label="Empresa"><input name="company" maxLength={150} defaultValue={contact?.company} placeholder="Empresa do contato" /></Field><div className="form-grid"><Field label="Tipo"><select name="kind" defaultValue={contact?.kind || "person"}><option value="person">Pessoa</option><option value="company">Empresa</option></select></Field><Field label="Relacionamento"><select name="status" defaultValue={contact?.status || "lead"}>{Object.entries(contactStatuses).map(([key,value]) => <option key={key} value={key}>{value}</option>)}</select></Field></div></> : <>
      <Field label="Contato relacionado"><select name="contact_id" defaultValue={deal?.contact_id || task?.contact_id || ""}><option value="">Sem contato vinculado</option>{contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></Field>
      {state.type === "opportunities" ? <><div className="form-grid"><Field label="Valor (R$)"><input name="value" type="number" min="0" max="999999999.99" step="0.01" defaultValue={deal ? deal.value / 100 : 0} required /></Field><Field label="Previsão de fechamento"><input name="expected_date" type="date" defaultValue={deal?.expected_date?.slice(0,10) || ""} /></Field></div><Field label="Etapa do funil"><select name="stage" defaultValue={deal?.stage || "new"}>{Object.entries(stages).map(([key,value]) => <option key={key} value={key}>{value}</option>)}</select></Field></> : <><div className="form-grid"><Field label="Prazo"><input name="due_date" type="date" defaultValue={task?.due_date?.slice(0,10) || ""} /></Field><Field label="Prioridade"><select name="priority" defaultValue={task?.priority || "normal"}>{Object.entries(priorities).map(([key,value]) => <option key={key} value={key}>{value}</option>)}</select></Field></div><Field label="Situação"><select name="completed" defaultValue={String(task?.completed || false)}><option value="false">Pendente</option><option value="true">Concluída</option></select></Field></>}
    </>}
    <Field label="Observações"><textarea name="notes" rows={3} maxLength={5000} defaultValue={item?.notes} placeholder="Detalhes que ajudam no próximo contato..." /></Field>
    <div className="modal-actions"><button type="button" className="secondary" onClick={onClose} disabled={busy}>Cancelar</button><button className="primary" disabled={busy}>{busy ? "Salvando..." : "Salvar " + label}</button></div>
  </form></Modal>;
}
