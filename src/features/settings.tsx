"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck, UserRound, Download } from "lucide-react";
import type { CRMData } from "@/lib/domain";
import { api } from "@/lib/client";
import { Field, getError } from "@/components/ui";

export function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Settings({ data, refresh, notify, onCode }: { data: CRMData; refresh: () => Promise<void>; notify: (text: string) => void; onCode: (code: string) => void }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>, kind: string) {
    event.preventDefault(); const form = event.currentTarget;
    const input = Object.fromEntries(new FormData(form));
    setBusy(kind); setError("");
    try {
      const result = await api<{ message?: string; recoveryCode?: string }>("/api/" + kind, kind === "profile" ? "PUT" : "POST", input);
      if (kind === "profile") { await refresh(); notify("Perfil atualizado."); }
      else { form.reset(); if (result.recoveryCode) onCode(result.recoveryCode); else notify(result.message || "Alteração salva."); }
    } catch (error) { setError(getError(error)); }
    finally { setBusy(""); }
  }
  return <div className="settings-grid">{error && <div className="alert error span-all" role="alert">{error}</div>}
    <section className="panel"><div className="panel-title"><UserRound size={19} /><h2>Seu perfil</h2></div><p className="muted">Identifique você e seu negócio.</p><form className="form-stack" onSubmit={event => submit(event,"profile")}><Field label="Nome"><input name="name" defaultValue={data.user.name} minLength={2} maxLength={100} required /></Field><Field label="Empresa ou negócio"><input name="company" defaultValue={data.user.company} minLength={2} maxLength={150} required /></Field><Field label="E-mail de acesso"><input value={data.user.email} readOnly /></Field><p className="form-hint">O e-mail identifica a conta e não é alterado nesta versão.</p><button className="primary" disabled={!!busy}>{busy === "profile" ? "Salvando..." : "Salvar perfil"}</button></form></section>
    <section className="panel"><div className="panel-title"><KeyRound size={19} /><h2>Alterar senha</h2></div><p className="muted">Ao alterar, as outras sessões serão encerradas.</p><form className="form-stack" onSubmit={event => submit(event,"password")}><Field label="Senha atual"><input name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required /></Field><Field label="Nova senha"><input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} placeholder="Pelo menos 10 caracteres" required /></Field><button className="primary" disabled={!!busy}>{busy === "password" ? "Alterando..." : "Atualizar senha"}</button></form></section>
    <section className="panel"><div className="panel-title"><ShieldCheck size={19} /><h2>Recuperação de acesso</h2></div><p className="muted">O código substitui a recuperação por e-mail. Guarde-o em um lugar seguro. Gerar um novo invalida o anterior.</p><form className="form-stack" onSubmit={event => submit(event,"recovery-code")}><Field label="Confirme sua senha"><input name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required /></Field><button className="secondary" disabled={!!busy}>{busy === "recovery-code" ? "Gerando..." : "Gerar novo código"}</button></form></section>
    <section className="panel"><div className="panel-title"><Download size={19} /><h2>Seus dados</h2></div><p className="muted">Exporte uma cópia dos contatos, oportunidades e tarefas da sua conta. O arquivo contém os dados pessoais que você cadastrou.</p><div className="data-summary"><span>{data.contacts.length} contatos</span><span>{data.opportunities.length} oportunidades</span><span>{data.tasks.length} tarefas</span></div><button className="secondary" onClick={() => download(JSON.stringify({ exportedAt: new Date().toISOString(), ...data },null,2),"trabalhoerenda-dados.json","application/json")}><Download size={16} /> Exportar dados (JSON)</button><p className="form-hint">A exportação não contém senhas nem tokens de sessão.</p></section>
  </div>;
}
