"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Building2, ChartNoAxesCombined, ChevronRight, CircleCheck, ContactRound, Download, LayoutDashboard, ListTodo, LoaderCircle, LogOut, Menu, Plus, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Target, X } from "lucide-react";
import { api, RequestError } from "@/lib/client";
import { contactStatuses, csv, stages } from "@/lib/domain";
import type { CRMData, Section, Task, User } from "@/lib/domain";
import { Brand, getError, Modal } from "@/components/ui";
import { initials } from "@/components/records-ui";
import { Auth } from "./auth";
import { Editor } from "./editor";
import type { EditorState } from "./editor";
import { Dashboard } from "./dashboard";
import { Records } from "./records";
import { download, Settings } from "./settings";
import { firebaseSignOut } from "@/lib/firebase-client";

const navigation = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard }, { id: "contacts", label: "Contatos", icon: ContactRound },
  { id: "opportunities", label: "Oportunidades", icon: Target }, { id: "tasks", label: "Tarefas", icon: ListTodo },
  { id: "reports", label: "Relatórios", icon: ChartNoAxesCombined }, { id: "settings", label: "Configurações", icon: Settings2 },
] as const;
const subtitles = { dashboard: "Um olhar sobre seus relacionamentos e resultados.", contacts: "Cada pessoa é o começo de uma boa oportunidade.", opportunities: "Acompanhe cada conversa até o próximo resultado.", tasks: "Um próximo passo claro faz toda a diferença.", reports: "Seus dados transformados em decisões melhores.", settings: "Seu negócio, seu perfil e sua segurança." };
const emptyData = (user: User): CRMData => ({ user, contacts: [], opportunities: [], tasks: [] });

export default function CRM() {
  const [user,setUser] = useState<User | null>(null);
  const [data,setData] = useState<CRMData | null>(null);
  const [boot,setBoot] = useState(true);
  const [error,setError] = useState("");
  const [initialError,setInitialError] = useState("");
  const [section,setSection] = useState<Section>("dashboard");
  const [search,setSearch] = useState("");
  const [filter,setFilter] = useState("all");
  const [page,setPage] = useState(1);
  const [editor,setEditor] = useState<EditorState | null>(null);
  const [deleting,setDeleting] = useState<{ type: string; id: string; name: string } | null>(null);
  const [busy,setBusy] = useState(false);
  const [mobile,setMobile] = useState(false);
  const [toast,setToast] = useState("");
  const [recoveryCode,setRecoveryCode] = useState("");
  const [updated,setUpdated] = useState("");
  const navigate = (next: Section) => { setSection(next); setSearch(""); setFilter("all"); setPage(1); setMobile(false); window.history.replaceState(null,"","#"+next); };
  const refresh = useCallback(async () => {
    try { const result = await api<CRMData>("/api/data"); setData(result); setUser(result.user); setError(""); setUpdated(new Date().toLocaleTimeString("pt-BR",{ hour: "2-digit", minute: "2-digit" })); }
    catch (error) { if (error instanceof RequestError && error.status === 401) { setUser(null); setData(null); setInitialError(error.message); } else setError(getError(error)); throw error; }
  },[]);
  useEffect(() => {
    api<{ user: User | null }>("/api/session").then(async result => { const selected = window.location.hash.slice(1); if (navigation.some(item => item.id === selected)) setSection(selected as Section); if (result.user) { setUser(result.user); setData(emptyData(result.user)); await refresh(); } }).catch(error => setInitialError(getError(error))).finally(() => setBoot(false));
  },[refresh]);
  useEffect(() => { if (toast) { const timeout = setTimeout(() => setToast(""),4500); return () => clearTimeout(timeout); } },[toast]);
  async function authenticated(nextUser: User, code?: string) { setUser(nextUser); setData(emptyData(nextUser)); setInitialError(""); if (code) setRecoveryCode(code); try { await refresh(); } catch { /* O painel apresenta o erro. */ } }
  async function logout() { setBusy(true); try { await api("/api/auth/logout","POST",{}); await firebaseSignOut(); setUser(null); setData(null); setError(""); setSection("dashboard"); setRecoveryCode(""); window.history.replaceState(null,"",window.location.pathname); } catch (error) { setError(getError(error)); } finally { setBusy(false); } }
  async function remove() { if (!deleting) return; setBusy(true); try { await api(`/api/${deleting.type}/${deleting.id}`,"DELETE"); setDeleting(null); await refresh(); setToast("Registro excluído."); } catch (error) { setError(getError(error)); } finally { setBusy(false); } }
  async function toggleTask(task: Task) { setBusy(true); try { await api(`/api/tasks/${task.id}`,"PUT",{ ...task, completed: !task.completed, due_date: task.due_date?.slice(0,10) || null }); await refresh(); setToast(task.completed ? "Tarefa reaberta." : "Tarefa concluída!"); } catch (error) { setError(getError(error)); } finally { setBusy(false); } }
  function exportContacts() { if (!data) return; const found = data.contacts.filter(contact => [contact.name,contact.email,contact.company,contact.phone].join(" ").toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")) && (filter === "all" || contact.status === filter)); download(csv([["Nome","E-mail","Telefone","Empresa","Tipo","Relacionamento","Observações"],...found.map(contact => [contact.name,contact.email,contact.phone,contact.company,contact.kind === "company" ? "Empresa" : "Pessoa",contactStatuses[contact.status],contact.notes])]),"trabalhoerenda-contatos.csv","text/csv;charset=utf-8"); }
  if (boot) return <main className="loading-screen"><Brand /><LoaderCircle className="spin" size={28} /><p>Preparando seu espaço de trabalho...</p></main>;
  if (!user || !data) return <Auth onAuth={authenticated} initialError={initialError} />;
  const pending = data.tasks.filter(task => !task.completed).length;
  const canCreate = section === "contacts" || section === "opportunities" || section === "tasks";
  const createLabels = { contacts: "Novo contato", opportunities: "Nova oportunidade", tasks: "Nova tarefa" };
  return <div className="app-layout">
    {mobile && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMobile(false)} />}
    <aside className={`sidebar ${mobile ? "sidebar-open" : ""}`}><Brand light /><div className="workspace"><span className="workspace-icon"><Building2 size={18} /></span><div><strong>{user.company}</strong><small>Meu espaço de trabalho</small></div><span className="workspace-dot" /></div><p className="nav-caption">PRINCIPAL</p><nav aria-label="Navegação principal">{navigation.map(({ id,label,icon: Icon },index) => <button key={id} onClick={() => navigate(id)} className={`${section === id ? "active" : ""} ${index === 5 ? "nav-settings" : ""}`} aria-current={section === id ? "page" : undefined}><Icon size={19} /><span>{label}</span>{id === "tasks" && pending > 0 && <small>{pending}</small>}</button>)}</nav><div className="sidebar-tip"><Sparkles size={20} /><strong>Um contato de cada vez.</strong><p>Grandes resultados começam com pequenos próximos passos.</p><button onClick={() => { navigate("contacts"); setEditor({ type: "contacts" }); }}>Criar um contato <ArrowUpRight size={15} /></button></div><div className="sidebar-account"><span className="avatar">{initials(user.name)}</span><div><strong>{user.name}</strong><small>Minha conta</small></div><button className="icon-button" aria-label="Sair da conta" onClick={logout} disabled={busy}><LogOut size={18} /></button></div></aside>
    <div className="app-content"><header className="topbar"><div className="breadcrumbs"><button className="icon-button mobile-menu" aria-label="Abrir menu" onClick={() => setMobile(true)}><Menu size={21} /></button><span>Meu CRM</span><ChevronRight size={14} /><strong>{navigation.find(item => item.id === section)?.label}</strong></div><div className="topbar-right"><span className="private-indicator"><ShieldCheck size={14} /> Espaço privado</span><button className="avatar avatar-small" onClick={() => navigate("settings")} aria-label="Abrir configurações da conta">{initials(user.name)}</button></div></header>
    <main className="content"><div className="page-heading"><div><p className="eyebrow">{section === "dashboard" ? "SEU NEGÓCIO EM MOVIMENTO" : "TRABALHO & RENDA"}</p><h1>{section === "dashboard" ? `Olá, ${user.name.split(" ")[0]}. Vamos em frente?` : navigation.find(item => item.id === section)?.label}</h1><p>{subtitles[section]}</p></div><div className="heading-actions"><button className="secondary icon-only" aria-label="Atualizar dados" disabled={busy} onClick={async () => { setBusy(true); try { await refresh(); setToast("Dados atualizados."); } catch {} finally { setBusy(false); } }}><RefreshCw size={17} className={busy ? "spin" : ""} /></button>{canCreate ? <button className="primary" onClick={() => setEditor({ type: section } as EditorState)}><Plus size={18} />{createLabels[section]}</button> : section === "dashboard" && <button className="primary" onClick={() => setEditor({ type: "opportunities" })}><Plus size={18} /> Nova oportunidade</button>}</div></div>
    {error && <div className="alert error" role="alert">{error}<button className="text-button" onClick={() => { void refresh().catch(() => {}); }}>Tentar novamente</button></div>}
    {(section === "dashboard" || section === "reports") && <Dashboard data={data} report={section === "reports"} navigate={navigate} edit={setEditor} toggleTask={toggleTask} busy={busy} />}
    {canCreate && <><div className="toolbar"><div className="search-box"><Search size={18} /><input aria-label="Buscar registros" placeholder={section === "contacts" ? "Buscar por nome, empresa, e-mail ou telefone..." : "Buscar por título ou contato..."} value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div><select aria-label="Filtrar registros" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="all">{section === "contacts" ? "Todos os relacionamentos" : section === "opportunities" ? "Todas as etapas" : "Todas as tarefas"}</option>{Object.entries(section === "contacts" ? contactStatuses : section === "opportunities" ? stages : { pending: "Pendentes", done: "Concluídas", overdue: "Em atraso" }).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>{section === "contacts" && <button className="secondary" onClick={exportContacts}><ArrowDownToLine size={16} /> Exportar</button>}</div><Records section={section} data={data} search={search} filter={filter} page={page} setPage={setPage} edit={setEditor} remove={setDeleting} toggleTask={toggleTask} busy={busy} /></>}
    {section === "settings" && <Settings data={data} refresh={refresh} notify={setToast} onCode={setRecoveryCode} />}
    <footer className="content-footer"><span>trabalho&renda <span>CRM</span></span><span>{updated ? `Dados atualizados às ${updated}` : "Seu espaço de trabalho"}</span></footer></main></div>
    {editor && <Editor key={editor.type + (editor.item?.id || "new")} state={editor} contacts={data.contacts} onClose={() => setEditor(null)} onSaved={async () => { await refresh(); setToast("Registro salvo com sucesso."); }} />}
    {deleting && <Modal title="Excluir registro?" onClose={() => { if (!busy) setDeleting(null); }}><p className="muted">Você vai excluir <strong>{deleting.name}</strong>. Esta ação não pode ser desfeita.</p>{deleting.type === "contacts" && <p className="form-hint">As tarefas e oportunidades vinculadas serão mantidas, sem o contato associado.</p>}<div className="modal-actions"><button className="secondary" onClick={() => setDeleting(null)} disabled={busy}>Cancelar</button><button className="danger" onClick={remove} disabled={busy}>{busy ? "Excluindo..." : "Excluir registro"}</button></div></Modal>}
    {recoveryCode && <Modal title="Guarde seu código de recuperação" onClose={() => setRecoveryCode("")}><div className="recovery-icon"><ShieldCheck size={28} /></div><p className="muted">Este código permite recuperar sua conta se você esquecer a senha. Ele será exibido apenas agora. Guarde-o em um lugar seguro.</p><code className="recovery-code">{recoveryCode}</code><button className="secondary full" onClick={() => download(`TRABALHOERENDA.COM\nConta: ${user.email}\nCódigo de recuperação: ${recoveryCode}\n\nGuarde este arquivo em local seguro. Não compartilhe seu código.`,"trabalhoerenda-recuperacao.txt","text/plain")}><Download size={16} /> Baixar código de recuperação</button><button className="primary full" onClick={() => setRecoveryCode("")}>Guardei meu código. Continuar <ArrowRight size={16} /></button></Modal>}
    {toast && <div className="toast" role="status"><CircleCheck size={19} /><span>{toast}</span><button aria-label="Fechar aviso" onClick={() => setToast("")}><X size={16} /></button></div>}
  </div>;
}
