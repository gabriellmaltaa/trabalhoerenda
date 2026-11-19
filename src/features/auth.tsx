"use client";

import { useState } from "react";
import { BadgeCheck, BriefcaseBusiness, Building2, Check, ClipboardList, Eye, EyeOff, Handshake, ShieldCheck, Sparkles, Users, ChartNoAxesCombined } from "lucide-react";
import { api } from "@/lib/client";
import type { User } from "@/lib/domain";
import { Brand, Field, getError } from "@/components/ui";
import { firebaseSignOut, googleSignIn } from "@/lib/firebase-client";

const services = [
  { icon: Users, title: "Contatos", description: "Organize pessoas e empresas em uma base só." },
  { icon: Handshake, title: "Oportunidades", description: "Acompanhe conversas e cada etapa do relacionamento." },
  { icon: ClipboardList, title: "Tarefas", description: "Cuide dos próximos passos com mais clareza." },
  { icon: ChartNoAxesCombined, title: "Relatórios", description: "Veja seus resultados e acompanhe a evolução." },
];

export function Auth({ onAuth, initialError }: { onAuth: (user: User, recoveryCode?: string) => void; initialError?: string }) {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [showAccount, setShowAccount] = useState(Boolean(initialError));
  const [error, setError] = useState(initialError || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const switchMode = (next: typeof mode) => { setMode(next); setError(""); setMessage(""); };
  const openAccount = (next: "login" | "register" = "login") => { switchMode(next); setShowAccount(true); };
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
  return <div className="auth-layout portal-auth">
    <header className="portal-header">
      <a className="portal-brand-link" href="#inicio" aria-label="Trabalho & Renda, início"><Brand /></a>
      <nav className="portal-utility" aria-label="Links institucionais"><a href="https://buzios.rj.gov.br" target="_blank" rel="noreferrer">Portal da Prefeitura</a><a className="portal-access-link" href="#acesso" onClick={event => { event.preventDefault(); openAccount(); }}>Acessar minha conta</a></nav>
    </header>
    {showAccount ? <main className="portal-account-area" id="acesso">
      <section className="portal-account-welcome"><button className="portal-back-link" onClick={() => { setShowAccount(false); setError(""); setMessage(""); }}>Voltar ao início</button><span className="portal-kicker"><span className="portal-kicker-mark" /> TRABALHO & RENDA</span><h1>{mode === "recover" ? "Recupere seu acesso." : mode === "register" ? "Um novo começo para o seu negócio." : "Boas conexões começam por aqui."}</h1><p>Entre no seu espaço de trabalho para organizar contatos, oportunidades e os próximos passos do seu negócio.</p><div className="portal-account-assurance"><ShieldCheck size={18} /><span><strong>Seu espaço é privado</strong><small>Seus registros ficam protegidos na sua conta.</small></span></div></section>
      <section className="portal-account-card" aria-labelledby="account-title">
        <div className="portal-card-head"><span className="portal-card-icon"><BriefcaseBusiness size={20} /></span><span className="portal-card-caption">ÁREA DE ACESSO</span></div><h2 id="account-title">{mode === "login" ? "Bem-vindo de volta" : mode === "register" ? "Crie sua conta" : "Redefina sua senha"}</h2><p className="auth-description">{mode === "login" ? "Acesse sua plataforma de trabalho e renda." : mode === "register" ? "Comece a organizar suas oportunidades." : "Use o código de recuperação que guardou ao criar a conta."}</p>
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
          <button className="primary full" disabled={busy}>{busy ? "Aguarde..." : mode === "login" ? "Entrar no meu CRM" : mode === "register" ? "Criar minha conta" : "Atualizar senha"}</button>
          {mode === "recover" && <button type="button" className="text-button" onClick={() => switchMode("login")}>Voltar para entrar</button>}
        </form><p className="auth-note"><ShieldCheck size={15} /> Sua conta. Seus contatos. Suas oportunidades.</p>
      </section>
    </main> : <main className="portal-home" id="inicio">
      <section className="portal-hero"><div className="portal-hero-copy"><span className="portal-kicker"><span className="portal-kicker-mark" /> UMA PLATAFORMA PARA IR MAIS LONGE</span><h1>Trabalho bem cuidado.<br /><span>Oportunidades em movimento.</span></h1><p>Um espaço para organizar relações, acompanhar oportunidades e conduzir seu negócio com mais clareza.</p><div className="portal-hero-actions"><button className="portal-primary" onClick={() => openAccount()}><BriefcaseBusiness size={18} /> Acessar o Trabalho & Renda</button><a href="#recursos">Conheça a plataforma</a></div><div className="portal-trust-line"><BadgeCheck size={17} /> Uma plataforma de gestão com identidade própria.</div></div><div className="portal-hero-art" aria-hidden="true"><div className="portal-orbit orbit-a" /><div className="portal-orbit orbit-b" /><div className="portal-art-sun" /><div className="portal-art-land" /><div className="portal-art-water" /><div className="portal-float-card float-one"><span><Building2 size={17} /></span><div><small>Seu negócio, organizado</small><strong>Pessoas e relações</strong></div><Check size={17} /></div><div className="portal-float-card float-two"><span><Sparkles size={17} /></span><div><small>Um próximo passo de cada vez</small><strong>Novas possibilidades</strong></div></div></div></section>
      <section className="portal-services" id="recursos"><div className="portal-section-heading"><div><span className="portal-kicker"><span className="portal-kicker-mark" /> SEU TRABALHO EM UM SÓ LUGAR</span><h2>Ferramentas para seguir em frente</h2></div><p>Recursos simples para cuidar do seu relacionamento com clientes e acompanhar o dia a dia do seu negócio.</p></div><div className="portal-service-grid">{services.map(({ icon: Icon, title, description }, index) => <article className={`portal-service-card card-tone-${index + 1}`} key={title}><span className="portal-service-icon"><Icon size={21} /></span><span className="portal-service-index">0{index + 1}</span><h3>{title}</h3><p>{description}</p><button aria-label={`Saiba mais sobre ${title}`} onClick={() => openAccount()}>Conhecer recurso</button></article>)}</div></section>
      <section className="portal-final-cta"><div><span className="portal-kicker"><span className="portal-kicker-mark" /> TRABALHO & RENDA</span><h2>As suas próximas conquistas começam com um bom próximo passo.</h2></div><button className="portal-primary" onClick={() => openAccount()}>Acessar a plataforma</button></section>
    </main>}
    <footer className="portal-footer"><a className="portal-footer-brand" href="#inicio"><Brand /></a><p>TRABALHOERENDA.COM <span>·</span> Plataforma independente de gestão de relacionamentos.</p><a href="https://buzios.rj.gov.br" target="_blank" rel="noreferrer">Portal da Prefeitura de Búzios</a></footer>
  </div>;
}
