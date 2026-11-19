"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChartNoAxesCombined,
  ChevronRight,
  CircleCheck,
  Compass,
  ContactRound,
  Download,
  Globe,
  LayoutDashboard,
  ListTodo,
  LoaderCircle,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { api, RequestError } from "@/lib/client";
import { contactStatuses, csv, stages } from "@/lib/domain";
import type { CRMData, Section, Task, User } from "@/lib/domain";
import { AccessibilityControls, Brand, getError, Modal } from "@/components/ui";
import { initials } from "@/components/records-ui";
import { Auth } from "./auth";
import { Portal } from "./portal";
import { Editor } from "./editor";
import type { EditorState } from "./editor";
import { Dashboard } from "./dashboard";
import { Records } from "./records";
import { download, Settings } from "./settings";
import { firebaseSignOut } from "@/lib/firebase-client";

const navigation = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "contacts", label: "Contatos", icon: ContactRound },
  { id: "opportunities", label: "Oportunidades", icon: Target },
  { id: "tasks", label: "Tarefas", icon: ListTodo },
  { id: "reports", label: "Relatórios", icon: ChartNoAxesCombined },
  { id: "settings", label: "Configurações", icon: Settings2 },
] as const;

const subtitles: Record<Section, string> = {
  dashboard: "Indicadores consolidados, agenda prioritária e evolução das suas oportunidades.",
  contacts: "Gerencie pessoas físicas e empresas com histórico individualizado de relacionamento.",
  opportunities: "Conduza cada proposta comercial pelas cinco etapas do funil até o fechamento.",
  tasks: "Acompanhe prazos, prioridades e próximos retornos vinculados à sua carteira.",
  reports: "Métricas calculadas em tempo real a partir dos registros efetivos da sua conta.",
  settings: "Dados do titular, credenciais de acesso, recuperação e portabilidade integral.",
};

const emptyData = (user: User): CRMData => ({ user, contacts: [], opportunities: [], tasks: [] });

export default function CRM() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<CRMData | null>(null);
  const [boot, setBoot] = useState(true);
  const [view, setView] = useState<"portal" | "auth" | "crm">("portal");
  const [authMode, setAuthMode] = useState<"login" | "register" | "recover">("login");
  const [pendingSection, setPendingSection] = useState<Section | null>(null);
  const [error, setError] = useState("");
  const [initialError, setInitialError] = useState("");
  const [section, setSection] = useState<Section>("dashboard");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleting, setDeleting] = useState<{ type: string; id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [updated, setUpdated] = useState("");

  const navigate = (next: Section) => {
    setSection(next);
    setView("crm");
    setSearch("");
    setFilter("all");
    setPage(1);
    setMobile(false);
    window.history.replaceState(null, "", "#" + next);
  };

  const openPortal = () => {
    setView("portal");
    setMobile(false);
    window.history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAuth = (mode: "login" | "register", targetSection?: Section) => {
    setAuthMode(mode);
    setPendingSection(targetSection || null);
    setInitialError("");
    setView("auth");
    window.history.replaceState(null, "", mode === "register" ? "#cadastro" : "#acesso");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = useCallback(async () => {
    try {
      const result = await api<CRMData>("/api/data");
      setData(result);
      setUser(result.user);
      setError("");
      setUpdated(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) {
        setUser(null);
        setData(null);
        setInitialError(error.message);
        setView("auth");
      } else setError(getError(error));
      throw error;
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    api<{ user: User | null }>("/api/session")
      .then(async result => {
        const matchedSection = navigation.find(item => item.id === hash)?.id;
        if (matchedSection) setSection(matchedSection);
        if (result.user) {
          setUser(result.user);
          setData(emptyData(result.user));
          setView(["portal", "inicio", "servicos-rapidos", "eixos", "destaques", "publicacoes"].includes(hash) ? "portal" : "crm");
          await refresh();
        } else if (hash === "acesso" || hash === "entrar" || hash === "login") {
          setAuthMode("login");
          setView("auth");
        } else if (hash === "cadastro" || hash === "criar-conta") {
          setAuthMode("register");
          setView("auth");
        } else if (matchedSection) {
          setPendingSection(matchedSection);
          setAuthMode("login");
          setView("auth");
        } else {
          setView("portal");
        }
      })
      .catch(err => {
        setInitialError(getError(err));
        if (hash === "acesso" || hash === "cadastro") setView("auth");
      })
      .finally(() => setBoot(false));
  }, [refresh]);

  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  async function authenticated(nextUser: User, code?: string) {
    const destination = pendingSection || section || "dashboard";
    setUser(nextUser);
    setData(emptyData(nextUser));
    setInitialError("");
    setPendingSection(null);
    setSection(destination);
    setView("crm");
    window.history.replaceState(null, "", "#" + destination);
    if (code) setRecoveryCode(code);
    try {
      await refresh();
    } catch {
      /* O painel apresenta o erro. */
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await api("/api/auth/logout", "POST", {});
      await firebaseSignOut();
      setUser(null);
      setData(null);
      setError("");
      setSection("dashboard");
      setRecoveryCode("");
      setView("portal");
      window.history.replaceState(null, "", window.location.pathname);
    } catch (error) {
      setError(getError(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/${deleting.type}/${deleting.id}`, "DELETE");
      setDeleting(null);
      await refresh();
      setToast("Registro excluído.");
    } catch (error) {
      setError(getError(error));
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task: Task) {
    setBusy(true);
    try {
      await api(`/api/tasks/${task.id}`, "PUT", {
        ...task,
        completed: !task.completed,
        due_date: task.due_date?.slice(0, 10) || null,
      });
      await refresh();
      setToast(task.completed ? "Tarefa reaberta." : "Tarefa concluída!");
    } catch (error) {
      setError(getError(error));
    } finally {
      setBusy(false);
    }
  }

  function exportContacts() {
    if (!data) return;
    const found = data.contacts.filter(
      contact =>
        [contact.name, contact.email, contact.company, contact.phone]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")) &&
        (filter === "all" || contact.status === filter),
    );
    download(
      csv([
        ["Nome", "E-mail", "Telefone", "Empresa", "Tipo", "Relacionamento", "Observações"],
        ...found.map(contact => [
          contact.name,
          contact.email,
          contact.phone,
          contact.company,
          contact.kind === "company" ? "Empresa" : "Pessoa",
          contactStatuses[contact.status],
          contact.notes,
        ]),
      ]),
      "trabalhoerenda-contatos.csv",
      "text/csv;charset=utf-8",
    );
  }

  if (boot) {
    return (
      <main className="loading-screen">
        <Brand />
        <LoaderCircle className="spin" size={28} />
        <p>Preparando seu ambiente de trabalho...</p>
      </main>
    );
  }

  if (view === "portal") {
    return (
      <Portal
        user={user}
        onOpenAuth={openAuth}
        onEnterCRM={(nextSection = "dashboard") => {
          if (user && data) navigate(nextSection);
          else openAuth("login", nextSection);
        }}
      />
    );
  }

  if (!user || !data || view === "auth") {
    return (
      <Auth
        key={authMode}
        initialMode={authMode}
        onAuth={authenticated}
        initialError={initialError}
        onBackToPortal={openPortal}
      />
    );
  }

  const pending = data.tasks.filter(task => !task.completed).length;
  const canCreate = section === "contacts" || section === "opportunities" || section === "tasks";
  const createLabels = { contacts: "Novo contato", opportunities: "Nova oportunidade", tasks: "Nova tarefa" };

  return (
    <div className="app-layout">
      <a href="#conteudo-principal" className="skip-link">
        Pular para o conteúdo principal
      </a>

      {mobile && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMobile(false)} />}

      <aside className={`sidebar ${mobile ? "sidebar-open" : ""}`}>
        <Brand light subtitle="PAINEL EXECUTIVO · CRM" />

        <div className="workspace">
          <span className="workspace-icon">
            <Building2 size={18} />
          </span>
          <div>
            <strong>{user.company}</strong>
            <small>Espaço corporativo isolado</small>
          </div>
          <span className="workspace-dot" />
        </div>

        <p className="nav-caption">NAVEGAÇÃO DO PAINEL</p>
        <nav aria-label="Navegação principal">
          {navigation.map(({ id, label, icon: Icon }, index) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={`${section === id ? "active" : ""} ${index === 5 ? "nav-settings" : ""}`}
              aria-current={section === id ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "tasks" && pending > 0 && <small>{pending}</small>}
            </button>
          ))}
          <button type="button" className="nav-portal-link" onClick={openPortal}>
            <Globe size={18} />
            <span>Portal Inicial</span>
          </button>
        </nav>

        <div className="sidebar-tip">
          <Compass size={19} />
          <strong>Cadência gera resultados.</strong>
          <p>Registre contatos estratégicos e mantenha sempre um próximo retorno agendado.</p>
          <button
            onClick={() => {
              navigate("contacts");
              setEditor({ type: "contacts" });
            }}
          >
            Adicionar contato <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="sidebar-account">
          <span className="avatar">{initials(user.name)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button className="icon-button" aria-label="Sair da conta" onClick={logout} disabled={busy}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setMobile(true)}>
              <Menu size={21} />
            </button>
            <button type="button" className="breadcrumb-portal-btn" onClick={openPortal}>
              Portal
            </button>
            <ChevronRight size={14} />
            <span>Área Restrita</span>
            <ChevronRight size={14} />
            <strong>{navigation.find(item => item.id === section)?.label}</strong>
          </div>

          <div className="topbar-right">
            <AccessibilityControls compact />
            <span className="private-indicator">
              <ShieldCheck size={14} /> Espaço privado
            </span>
            <button
              className="avatar avatar-small"
              onClick={() => navigate("settings")}
              aria-label="Abrir configurações da conta"
            >
              {initials(user.name)}
            </button>
          </div>
        </header>

        <main id="conteudo-principal" className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {section === "dashboard" ? "PAINEL DE GESTÃO · VISÃO EXECUTIVA" : "TRABALHO & RENDA · ÁREA RESTRITA"}
              </p>
              <h1>
                {section === "dashboard"
                  ? `Olá, ${user.name.split(" ")[0]}. Bom trabalho hoje.`
                  : navigation.find(item => item.id === section)?.label}
              </h1>
              <p>{subtitles[section]}</p>
            </div>
            <div className="heading-actions">
              <button
                className="secondary icon-only"
                aria-label="Atualizar dados"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await refresh();
                    setToast("Dados atualizados.");
                  } catch {
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <RefreshCw size={17} className={busy ? "spin" : ""} />
              </button>
              {canCreate ? (
                <button className="primary" onClick={() => setEditor({ type: section } as EditorState)}>
                  <Plus size={18} />
                  {createLabels[section]}
                </button>
              ) : (
                section === "dashboard" && (
                  <button className="primary" onClick={() => setEditor({ type: "opportunities" })}>
                    <Plus size={18} /> Nova oportunidade
                  </button>
                )
              )}
            </div>
          </div>

          {error && (
            <div className="alert error" role="alert">
              {error}
              <button
                className="text-button"
                onClick={() => {
                  void refresh().catch(() => {});
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {(section === "dashboard" || section === "reports") && (
            <Dashboard
              data={data}
              report={section === "reports"}
              navigate={navigate}
              edit={setEditor}
              toggleTask={toggleTask}
              busy={busy}
            />
          )}

          {canCreate && (
            <>
              <div className="toolbar">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    aria-label="Buscar registros"
                    placeholder={
                      section === "contacts"
                        ? "Buscar por nome, empresa, e-mail ou telefone..."
                        : "Buscar por título ou contato..."
                    }
                    value={search}
                    onChange={event => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <select
                  aria-label="Filtrar registros"
                  value={filter}
                  onChange={event => {
                    setFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">
                    {section === "contacts"
                      ? "Todos os relacionamentos"
                      : section === "opportunities"
                        ? "Todas as etapas"
                        : "Todas as tarefas"}
                  </option>
                  {Object.entries(
                    section === "contacts"
                      ? contactStatuses
                      : section === "opportunities"
                        ? stages
                        : { pending: "Pendentes", done: "Concluídas", overdue: "Em atraso" },
                  ).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                {section === "contacts" && (
                  <button className="secondary" onClick={exportContacts}>
                    <ArrowDownToLine size={16} /> Exportar CSV
                  </button>
                )}
              </div>
              <Records
                section={section}
                data={data}
                search={search}
                filter={filter}
                page={page}
                setPage={setPage}
                edit={setEditor}
                remove={setDeleting}
                toggleTask={toggleTask}
                busy={busy}
              />
            </>
          )}

          {section === "settings" && (
            <Settings data={data} refresh={refresh} notify={setToast} onCode={setRecoveryCode} />
          )}

          <footer className="content-footer">
            <span>
              TRABALHO &amp; RENDA <span>PAINEL EXECUTIVO CRM</span>
            </span>
            <span>{updated ? `Dados sincronizados às ${updated}` : "Ambiente isolado por conta"}</span>
          </footer>
        </main>
      </div>

      {editor && (
        <Editor
          key={editor.type + (editor.item?.id || "new")}
          state={editor}
          contacts={data.contacts}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            await refresh();
            setToast("Registro salvo com sucesso.");
          }}
        />
      )}

      {deleting && (
        <Modal
          title="Excluir registro?"
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p className="muted">
            Você vai excluir <strong>{deleting.name}</strong>. Esta ação não pode ser desfeita.
          </p>
          {deleting.type === "contacts" && (
            <p className="form-hint">
              As tarefas e oportunidades vinculadas serão mantidas, sem o contato associado.
            </p>
          )}
          <div className="modal-actions">
            <button className="secondary" onClick={() => setDeleting(null)} disabled={busy}>
              Cancelar
            </button>
            <button className="danger" onClick={remove} disabled={busy}>
              {busy ? "Excluindo..." : "Excluir registro"}
            </button>
          </div>
        </Modal>
      )}

      {recoveryCode && (
        <Modal title="Guarde seu código de recuperação" onClose={() => setRecoveryCode("")}>
          <div className="recovery-icon">
            <ShieldCheck size={28} />
          </div>
          <p className="muted">
            Este código permite recuperar sua conta caso esqueça a senha. Ele é exibido apenas agora. Salve-o em um
            local seguro.
          </p>
          <code className="recovery-code">{recoveryCode}</code>
          <button
            className="secondary full"
            onClick={() =>
              download(
                `TRABALHOERENDA.COM\nConta: ${user.email}\nCódigo de recuperação: ${recoveryCode}\n\nGuarde este arquivo em local seguro. Não compartilhe seu código.`,
                "trabalhoerenda-recuperacao.txt",
                "text/plain",
              )
            }
          >
            <Download size={16} /> Baixar código de recuperação
          </button>
          <button className="primary full" onClick={() => setRecoveryCode("")}>
            Guardei meu código. Continuar <ArrowRight size={16} />
          </button>
        </Modal>
      )}

      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={19} />
          <span>{toast}</span>
          <button aria-label="Fechar aviso" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
