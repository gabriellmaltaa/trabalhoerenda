"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Eye, EyeOff, ShieldCheck, Users, TrendingUp } from "lucide-react";
import { api } from "@/lib/client";
import type { User } from "@/lib/domain";
import { Brand, Field, getError } from "@/components/ui";
import { firebaseSignOut, googleSignIn } from "@/lib/firebase-client";

export function Auth({ onAuth, initialError }: { onAuth: (user: User, recoveryCode?: string) => void; initialError?: string }) {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [error, setError] = useState(initialError || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const switchMode = (next: typeof mode) => { setMode(next); setError(""); setMessage(""); };
  async function google() {
    setBusy(true); setError(""); setMessage("");
    try { await googleSignIn(); const result = await api<{ user:User }>("/api/session"); onAuth(result.user); }
    catch (error) { await firebaseSignOut().catch(() => {}); setError(getError(error)); }
    finally { setBusy(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === "recover") {
        const result = await api<{ message: string }>("/api/auth/recover", "POST", data);
        setMode("login"); setMessage(result.message);
      } else {
        const result = await api<{ user: User; recoveryCode?: string }>(`/api/auth/${mode === "login" ? "login" : "register"}`, "POST", data);
        onAuth(result.user, result.recoveryCode);
      }
    } catch (error) { setError(getError(error)); }
    finally { setBusy(false); }
  }
  return <div className="auth-layout">
    <aside className="auth-story"><Brand light /><div className="auth-story-content"><div className="eyebrow light"><span className="live-dot" /> MAIS CONEXÕES. MAIS POSSIBILIDADES.</div><h1>Boas relações.<br />Novas oportunidades.<br /><span>Mais resultados.</span></h1><p>O seu trabalho merece uma gestão à altura. Conecte pessoas, organize oportunidades e acompanhe cada próximo passo.</p>
      <div className="story-visual" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="visual-card"><span className="visual-icon"><TrendingUp size={22} /></span><div><small>O próximo passo está aqui</small><strong>Relacionar. Acompanhar. Crescer.</strong></div><ArrowUpRight size={20} /></div><div className="visual-tag"><Users size={16} /> Pessoas no centro de tudo</div></div>
      <div className="auth-benefits"><span><Check size={15} /> Contatos organizados</span><span><Check size={15} /> Funil de oportunidades</span><span><Check size={15} /> Rotina sob controle</span></div>
    </div><p className="auth-footer">TRABALHOERENDA.COM <span>Seu relacionamento, bem cuidado.</span></p></aside>
    <main className="auth-main"><div className="auth-mobile-brand"><Brand /></div><div className="auth-form-wrap"><span className="pill"><ShieldCheck size={14} /> SEU ESPAÇO DE TRABALHO</span><h2>{mode === "login" ? "Bom ter você por aqui." : mode === "register" ? "Vamos começar?" : "Recupere seu acesso."}</h2><p className="auth-description">{mode === "login" ? "Entre na sua conta e dê o próximo passo." : mode === "register" ? "Crie sua conta e organize suas oportunidades." : "Use o código de recuperação que você guardou ao criar sua conta."}</p>
      {mode !== "recover" && <div className="auth-tabs" role="tablist" aria-label="Acesso à conta"><button role="tab" aria-selected={mode === "login"} onClick={() => switchMode("login")}>Entrar</button><button role="tab" aria-selected={mode === "register"} onClick={() => switchMode("register")}>Criar conta</button></div>}
      {mode !== "recover" && <><button className="google-button full" type="button" onClick={google} disabled={busy}><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.2H12v4.2h5.4a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.7Z"/><path fill="#34a853" d="M12 22c2.7 0 5-1 6.7-2.5l-3.3-2.6c-.9.6-2.1.9-3.4.9-2.6 0-4.9-1.8-5.7-4.2H2.9v2.7A10 10 0 0 0 12 22Z"/><path fill="#fbbc05" d="M6.3 13.6a6 6 0 0 1 0-3.2V7.7H2.9a10 10 0 0 0 0 8.6l3.4-2.7Z"/><path fill="#ea4335" d="M12 6.2c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.5 9.5 0 0 0 12 2a10 10 0 0 0-9.1 5.7l3.4 2.7C7.1 8 9.4 6.2 12 6.2Z"/></svg>{busy ? "Aguarde..." : "Continuar com Google"}</button><div className="auth-divider"><span>ou use e-mail e senha</span></div></>}
      {error && <div className="alert error" role="alert">{error}</div>}{message && <div className="alert success" role="status">{message}</div>}
      <form key={mode} onSubmit={submit} className="form-stack">
        {mode === "register" && <><Field label="Seu nome"><input name="name" autoComplete="name" placeholder="Como podemos chamar você?" minLength={2} maxLength={100} required /></Field><Field label="Empresa ou negócio"><input name="company" autoComplete="organization" placeholder="Nome do seu negócio" minLength={2} maxLength={150} required /></Field></>}
        <Field label="E-mail"><input name="email" type="email" autoComplete="email" placeholder="voce@empresa.com.br" maxLength={254} required /></Field>
        {mode === "recover" && <Field label="Código de recuperação"><input name="recoveryCode" autoComplete="off" placeholder="Cole seu código de recuperação" minLength={20} maxLength={100} required /></Field>}
        <Field label={mode === "recover" ? "Nova senha" : "Senha"}><div className="password-input"><input name="password" type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "login" ? "Digite sua senha" : "Pelo menos 10 caracteres"} minLength={mode === "login" ? 1 : 10} maxLength={128} required /><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></Field>
        {mode === "login" && <button type="button" className="text-button forgot" onClick={() => switchMode("recover")}>Esqueci minha senha</button>}
        {mode === "register" && <p className="form-hint">Seus registros ficam separados das outras contas. Guarde o código de recuperação exibido após o cadastro.</p>}
        <button className="primary full" disabled={busy}>{busy ? "Aguarde..." : mode === "login" ? "Entrar no meu CRM" : mode === "register" ? "Criar minha conta" : "Atualizar senha"}<ArrowRight size={18} /></button>
        {mode === "recover" && <button type="button" className="text-button" onClick={() => switchMode("login")}>Voltar para entrar</button>}
      </form><p className="auth-note"><ShieldCheck size={15} /> Sua conta. Seus contatos. Suas oportunidades.</p>
    </div><p className="auth-bottom">Feito para quem transforma conexões em trabalho e renda.</p></main>
  </div>;
}
