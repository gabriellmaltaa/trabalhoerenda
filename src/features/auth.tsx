"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck, Target, Users } from "lucide-react";
import { api } from "@/lib/client";
import type { User } from "@/lib/domain";
import { AccessibilityControls, Brand, Field, getError } from "@/components/ui";
import { firebaseSignOut, googleSignIn } from "@/lib/firebase-client";

export function Auth({
  onAuth,
  initialError,
  initialMode = "login",
  onBackToPortal,
}: {
  onAuth: (user: User, recoveryCode?: string) => void;
  initialError?: string;
  initialMode?: "login" | "register" | "recover";
  onBackToPortal?: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register" | "recover">(initialMode);
  const [error, setError] = useState(initialError || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const switchMode = (next: typeof mode) => {
    setMode(next);
    setError("");
    setMessage("");
  };

  async function google() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await googleSignIn();
      const result = await api<{ user: User }>("/api/session");
      onAuth(result.user);
    } catch (error) {
      await firebaseSignOut().catch(() => {});
      setError(getError(error));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === "recover") {
        const result = await api<{ message: string }>("/api/auth/recover", "POST", data);
        setMode("login");
        setMessage(result.message);
      } else {
        const result = await api<{ user: User; recoveryCode?: string }>(
          `/api/auth/${mode === "login" ? "login" : "register"}`,
          "POST",
          data,
        );
        onAuth(result.user, result.recoveryCode);
      }
    } catch (error) {
      setError(getError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <div className="auth-story-top">
          <Brand light />
          {onBackToPortal && (
            <button type="button" className="auth-portal-back-light" onClick={onBackToPortal}>
              <ArrowLeft size={15} />
              <span>Portal Inicial</span>
            </button>
          )}
        </div>

        <div className="auth-story-content">
          <p className="portal-overline">ÁREA RESTRITA · GESTÃO COMERCIAL E ATENDIMENTO</p>
          <h1>
            Relações bem cuidadas constroem novos horizontes.
          </h1>
          <p>
            Organize sua carteira de pessoas e empresas, acompanhe negociações em reais e conduza cada retorno em um
            espaço de trabalho sereno, seguro e objetivo.
          </p>

          <div className="auth-highlights" aria-label="Recursos principais do painel">
            <div className="auth-highlight-row">
              <Users size={18} />
              <div>
                <strong>Carteira estruturada de contatos</strong>
                <span>Pessoas físicas e empresas com histórico individualizado</span>
              </div>
            </div>
            <div className="auth-highlight-row">
              <Target size={18} />
              <div>
                <strong>Funil de oportunidades em 5 estágios</strong>
                <span>Visibilidade clara do valor em negociação e negócios ganhos</span>
              </div>
            </div>
            <div className="auth-highlight-row">
              <CheckCircle2 size={18} />
              <div>
                <strong>Autonomia e portabilidade integral</strong>
                <span>Isolamento por conta e exportação aberta em CSV e JSON</span>
              </div>
            </div>
          </div>
        </div>

        <p className="auth-footer">
          TRABALHOERENDA.COM <span>Gestão profissional de relacionamentos e oportunidades.</span>
        </p>
      </aside>

      <main className="auth-main">
        <div className="auth-main-topbar">
          {onBackToPortal ? (
            <button type="button" id="auth-back-portal" className="text-button" onClick={onBackToPortal}>
              <ArrowLeft size={15} />
              <span>Voltar ao Portal</span>
            </button>
          ) : (
            <span />
          )}
          <AccessibilityControls compact />
        </div>

        <div className="auth-mobile-brand">
          <Brand />
        </div>

        <div className="auth-form-wrap">
          <p className="eyebrow">ACESSO SEGURO AO PAINEL</p>
          <h2>
            {mode === "login"
              ? "Bem-vindo de volta."
              : mode === "register"
                ? "Crie sua conta profissional."
                : "Recuperação de acesso."}
          </h2>
          <p className="auth-description">
            {mode === "login"
              ? "Entre na sua área restrita para acompanhar contatos, propostas e tarefas."
              : mode === "register"
                ? "Configure seu espaço privado em poucos segundos e organize suas oportunidades."
                : "Informe seu e-mail e o código de recuperação guardado no momento do cadastro."}
          </p>

          {mode !== "recover" && (
            <div className="auth-tabs" role="tablist" aria-label="Acesso à conta">
              <button role="tab" type="button" aria-selected={mode === "login"} onClick={() => switchMode("login")}>
                Entrar
              </button>
              <button role="tab" type="button" aria-selected={mode === "register"} onClick={() => switchMode("register")}>
                Criar conta
              </button>
            </div>
          )}

          {mode !== "recover" && (
            <>
              <button className="google-button full" type="button" onClick={google} disabled={busy}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285f4"
                    d="M21.6 12.2c0-.7-.1-1.4-.2-2.2H12v4.2h5.4a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.7Z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 22c2.7 0 5-1 6.7-2.5l-3.3-2.6c-.9.6-2.1.9-3.4.9-2.6 0-4.9-1.8-5.7-4.2H2.9v2.7A10 10 0 0 0 12 22Z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M6.3 13.6a6 6 0 0 1 0-3.2V7.7H2.9a10 10 0 0 0 0 8.6l3.4-2.7Z"
                  />
                  <path
                    fill="#ea4335"
                    d="M12 6.2c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.5 9.5 0 0 0 12 2a10 10 0 0 0-9.1 5.7l3.4 2.7C7.1 8 9.4 6.2 12 6.2Z"
                  />
                </svg>
                <span>{busy ? "Autenticando..." : "Continuar com Google"}</span>
              </button>
              <div className="auth-divider">
                <span>ou utilize e-mail e senha</span>
              </div>
            </>
          )}

          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="alert success" role="status">
              {message}
            </div>
          )}

          <form key={mode} onSubmit={submit} className="form-stack">
            {mode === "register" && (
              <>
                <Field label="Seu nome">
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Como podemos identificar você?"
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </Field>
                <Field label="Empresa ou atuação">
                  <input
                    name="company"
                    autoComplete="organization"
                    placeholder="Nome da empresa ou atividade profissional"
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </Field>
              </>
            )}

            <Field label="E-mail">
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                maxLength={254}
                required
              />
            </Field>

            {mode === "recover" && (
              <Field label="Código de recuperação">
                <input
                  name="recoveryCode"
                  autoComplete="off"
                  placeholder="Cole seu código de recuperação"
                  minLength={20}
                  maxLength={100}
                  required
                />
              </Field>
            )}

            <Field label={mode === "recover" ? "Nova senha" : "Senha"}>
              <div className="password-input">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={mode === "login" ? "Digite sua senha" : "Mínimo de 10 caracteres"}
                  minLength={mode === "login" ? 1 : 10}
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {mode === "login" && (
              <button type="button" className="text-button forgot" onClick={() => switchMode("recover")}>
                Esqueci minha senha
              </button>
            )}

            {mode === "register" && (
              <p className="form-hint">
                Cada conta possui espaço isolado. Após concluir, salve em local seguro o código individual de
                recuperação exibido na tela.
              </p>
            )}

            <button className="primary full" disabled={busy}>
              <span>
                {busy
                  ? "Aguarde..."
                  : mode === "login"
                    ? "Entrar no Painel CRM"
                    : mode === "register"
                      ? "Criar Minha Conta"
                      : "Confirmar Nova Senha"}
              </span>
              <ArrowRight size={18} />
            </button>

            {mode === "recover" && (
              <button type="button" className="text-button" onClick={() => switchMode("login")}>
                Voltar para a tela de entrada
              </button>
            )}
          </form>

          <p className="auth-note">
            <ShieldCheck size={15} /> Dados isolados por conta · Criptografia e sessão segura
          </p>
        </div>

        <p className="auth-bottom">Plataforma Trabalho &amp; Renda — Organização que gera oportunidades.</p>
      </main>
    </div>
  );
}
