"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChartNoAxesCombined,
  CheckCircle2,
  Compass,
  ContactRound,
  Download,
  FileSpreadsheet,
  KeyRound,
  Layers,
  Lock,
  Menu,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Section, User } from "@/lib/domain";
import { AccessibilityControls, Brand, Modal } from "@/components/ui";

type QuickService = {
  id: string;
  title: string;
  short: string;
  category: string;
  section: Section;
  icon: LucideIcon;
  summary: string;
  highlights: string[];
};

type DocEntry = {
  code: string;
  tag: string;
  title: string;
  summary: string;
  details: string[];
  section?: Section;
};

const QUICK_SERVICES: QuickService[] = [
  {
    id: "contatos",
    title: "Cadastro de Contatos",
    short: "Pessoas, empresas e histórico",
    category: "relacionamento",
    section: "contacts",
    icon: ContactRound,
    summary: "Centralize clientes, parceiros, fornecedores e leads com classificação clara entre pessoa física e empresa, telefone, e-mail e observações estratégicas.",
    highlights: ["Busca instantânea por nome, empresa, telefone ou e-mail", "Filtro por estágio de relacionamento: Lead, Cliente ou Inativo", "Exportação imediata da base filtrada em formato CSV"],
  },
  {
    id: "oportunidades",
    title: "Funil de Oportunidades",
    short: "Negociações em 5 etapas",
    category: "negocios",
    section: "opportunities",
    icon: Target,
    summary: "Acompanhe cada proposta comercial desde a primeira conversa até o fechamento, com valores em reais (R$), previsão de conclusão e vínculo direto ao contato.",
    highlights: ["Quadro visual em 5 etapas: Novas, Qualificação, Proposta, Ganhas e Perdidas", "Soma automática de volume em negociação e receita conquistada", "Edição rápida de valores, prazos e observações de retorno"],
  },
  {
    id: "agenda",
    title: "Agenda & Compromissos",
    short: "Prazos, prioridades e retornos",
    category: "planejamento",
    section: "tasks",
    icon: CalendarClock,
    summary: "Transforme conversas em próximos passos concretos. Organize retornos com data limite, nível de prioridade e sinalização automática de pendências.",
    highlights: ["Classificação por prioridade Baixa, Normal ou Alta", "Conclusão com um clique diretamente no painel ou na lista", "Identificação imediata de compromissos em atraso"],
  },
  {
    id: "relatorios",
    title: "Painel de Indicadores",
    short: "Métricas reais e exportação",
    category: "planejamento",
    section: "reports",
    icon: ChartNoAxesCombined,
    summary: "Visualize o desempenho consolidado da sua operação com cálculos em tempo real a partir dos registros efetivos da sua conta, sem estimativas artificiais.",
    highlights: ["Taxa de conversão, ticket médio ganho e distribuição por etapa", "Balanço completo da rede de contatos por perfil", "Exportação de planilha executiva em CSV compatível com Excel"],
  },
  {
    id: "portabilidade",
    title: "Portabilidade de Dados",
    short: "Cópia integral em CSV e JSON",
    category: "governanca",
    section: "settings",
    icon: FileSpreadsheet,
    summary: "Seus registros pertencem exclusivamente a você. Gere cópias completas para auditoria interna, planilha financeira ou backup estruturado quando desejar.",
    highlights: ["Exportação JSON estruturada de toda a conta em configurações", "Relatórios e listas de contatos em CSV com codificação UTF-8", "Nenhuma credencial sensível ou token é exposto nos arquivos"],
  },
  {
    id: "seguranca",
    title: "Acesso & Recuperação",
    short: "Google Auth ou código privado",
    category: "governanca",
    section: "settings",
    icon: ShieldCheck,
    summary: "Escolha entre autenticação oficial Google com isolamento em nuvem ou credencial própria protegida por criptografia scrypt e código único de recuperação.",
    highlights: ["Sessões protegidas com cookies HttpOnly e validação de origem", "Isolamento estrito de dados entre contas independentes", "Código de recuperação individual gerado no cadastro"],
  },
];

const CATEGORIES = [
  { id: "todos", label: "Todos os Eixos", icon: Compass },
  { id: "relacionamento", label: "Relacionamento", icon: UserCheck },
  { id: "negocios", label: "Negócios & Renda", icon: BriefcaseBusiness },
  { id: "planejamento", label: "Agenda & Metas", icon: Layers },
  { id: "governanca", label: "Governança & Dados", icon: Lock },
] as const;

const FEATURED_BRIEFS = [
  {
    code: "EIXO 01 · COMERCIAL",
    title: "Previsibilidade financeira com funil em cinco estágios objetivos",
    excerpt: "Visualize rapidamente quanto está em negociação aberta, quais propostas exigem retorno prioritário e qual o ticket médio das oportunidades ganhas.",
    section: "opportunities" as Section,
  },
  {
    code: "EIXO 02 · ATENDIMENTO",
    title: "Histórico unificado de pessoas e empresas em um único ambiente",
    excerpt: "Evite informações dispersas em anotações soltas: associe tarefas e propostas diretamente a cada cliente ou parceiro comercial.",
    section: "contacts" as Section,
  },
  {
    code: "EIXO 03 · AUTONOMIA",
    title: "Arquitetura com isolamento por conta e exportação aberta",
    excerpt: "Cada profissional ou empresa opera em seu próprio espaço privado, com opção de login Google ou senha dedicada e portabilidade integral.",
    section: "settings" as Section,
  },
];

const PUBLICATIONS: Record<"guias" | "funil" | "seguranca" | "perguntas", { label: string; items: DocEntry[] }> = {
  guias: {
    label: "Guias Operacionais",
    items: [
      {
        code: "GUIA 01 / 2026",
        tag: "Primeiros Passos",
        title: "Estruturação inicial da base de contatos e qualificação de relacionamento",
        summary: "Orienta o cadastro padronizado de pessoas físicas e jurídicas, uso dos status Lead, Cliente e Inativo e registro de observações de contexto.",
        details: [
          "Comece registrando os contatos ativos e potenciais clientes com telefone, e-mail e empresa vinculada.",
          "Utilize o status 'Lead' para prospecções iniciais e promova para 'Cliente' assim que o primeiro negócio for firmado.",
          "Mantenha notas objetivas após cada conversa para preservar o histórico de atendimento.",
        ],
        section: "contacts",
      },
      {
        code: "GUIA 02 / 2026",
        tag: "Rotina Diária",
        title: "Gestão de retornos, prazos críticos e cadência de acompanhamento",
        summary: "Estabelece boas práticas para vincular tarefas às negociações abertas, priorizando retornos urgentes na agenda principal do painel.",
        details: [
          "Toda oportunidade em etapa de Qualificação ou Proposta deve possuir um próximo passo agendado.",
          "Classifique como prioridade 'Alta' os compromissos com impacto direto no fechamento da semana.",
          "Use o painel Visão Geral diariamente para revisar pendências e concluir tarefas realizadas.",
        ],
        section: "tasks",
      },
      {
        code: "GUIA 03 / 2026",
        tag: "Análise Executiva",
        title: "Leitura de indicadores de conversão, receita ganha e exportação gerencial",
        summary: "Apresenta como interpretar a taxa de fechamento, o valor médio por contrato e a extração de relatórios em CSV para controle externo.",
        details: [
          "O indicador de Receita Conquistada soma exclusivamente oportunidades marcadas na etapa 'Ganhas'.",
          "O módulo Relatórios consolida automaticamente percentuais de conclusão de tarefas e conversão do funil.",
          "Exporte periodicamente o relatório em CSV para cruzar resultados com seu planejamento financeiro.",
        ],
        section: "reports",
      },
    ],
  },
  funil: {
    label: "Etapas do Funil",
    items: [
      {
        code: "ETAPA 01 — NOVAS",
        tag: "Entrada",
        title: "Mapeamento da demanda inicial e identificação da oportunidade",
        summary: "Registra o primeiro sinal de interesse comercial, indicação recebida ou possibilidade de parceria antes do diagnóstico detalhado.",
        details: ["Registre o título claro da demanda e vincule ao contato correspondente.", "Mesmo quando o valor ainda for estimado, registre a expectativa inicial em reais para dimensionar o potencial."],
        section: "opportunities",
      },
      {
        code: "ETAPA 02 — QUALIFICAÇÃO",
        tag: "Diagnóstico",
        title: "Alinhamento de escopo, necessidade real, prazo e viabilidade",
        summary: "Fase dedicada a compreender os requisitos do cliente, validar orçamento disponível e definir a data prevista de decisão.",
        details: ["Confirme quem participa da decisão e quais entregas geram maior valor.", "Atualize a previsão de fechamento conforme o cronograma conversado com o cliente."],
        section: "opportunities",
      },
      {
        code: "ETAPA 03 A 05 — DECISÃO",
        tag: "Proposta & Desfecho",
        title: "Envio formal de proposta comercial e consolidação em Ganhas ou Perdidas",
        summary: "Acompanha a negociação de condições comerciais até a conclusão contratual, preservando o histórico para cálculo fiel da conversão.",
        details: ["Mantenha em 'Proposta' todos os orçamentos enviados aguardando resposta.", "Ao encerrar, classifique em 'Ganhas' ou 'Perdidas' sem excluir o registro, garantindo relatórios precisos."],
        section: "opportunities",
      },
    ],
  },
  seguranca: {
    label: "Segurança & Privacidade",
    items: [
      {
        code: "NORMA 01 / 2026",
        tag: "Isolamento",
        title: "Segregação estrita de registros por titular da conta",
        summary: "Todas as leituras, gravações e exclusões verificam a titularidade do usuário autenticado no servidor e nas regras de banco de dados.",
        details: ["Contatos, oportunidades e tarefas nunca são compartilhados entre contas distintas.", "Tentativas de vínculo cruzado entre registros de contas diferentes são bloqueadas pela camada de validação."],
      },
      {
        code: "NORMA 02 / 2026",
        tag: "Autenticação",
        title: "Proteção criptográfica de senhas, sessões HttpOnly e login Google",
        summary: "Credenciais por senha utilizam derivação scrypt com salt exclusivo; o login Google opera com verificação oficial de token assinado.",
        details: ["Cookies de sessão utilizam atributos HttpOnly e SameSite=Lax, com Secure ativo em produção HTTPS.", "Alterações de senha ou uso do código de recuperação invalidam imediatamente sessões anteriores."],
      },
      {
        code: "NORMA 03 / 2026",
        tag: "Transparência",
        title: "Acesso e exportação dos dados cadastrados",
        summary: "Permite consultar os dados registrados e baixar uma cópia completa em formato JSON pelas Configurações.",
        details: ["Em Configurações, o titular pode baixar a qualquer momento um arquivo JSON com todos os seus registros.", "O código de recuperação deve ser guardado em local seguro logo após a criação da conta."],
        section: "settings",
      },
    ],
  },
  perguntas: {
    label: "Perguntas e Respostas",
    items: [
      {
        code: "PERGUNTA 01",
        tag: "Acesso",
        title: "Qual a diferença entre entrar com Google e criar conta com e-mail e senha?",
        summary: "Ambas oferecem todas as ferramentas do CRM com isolamento total, utilizando infraestruturas dedicadas e independentes.",
        details: ["Ao escolher 'Continuar com Google', seu perfil é preparado automaticamente e os dados ficam salvos com isolamento no Firestore.", "No cadastro por e-mail e senha, os dados são persistidos no PostgreSQL e você recebe um código exclusivo de recuperação."],
      },
      {
        code: "PERGUNTA 02",
        tag: "Recuperação",
        title: "Como funciona a recuperação de acesso caso eu esqueça minha senha?",
        summary: "Contas criadas por senha utilizam o código de recuperação individual exibido no momento do cadastro ou regenerado nas configurações.",
        details: ["Basta acessar a tela de entrada, clicar em 'Esqueci minha senha' e informar seu e-mail junto ao código guardado.", "Por segurança, o código utilizado é consumido na troca de senha; você pode gerar um novo em Configurações."],
      },
      {
        code: "PERGUNTA 03",
        tag: "Relatórios",
        title: "Posso usar os dados do CRM em planilhas externas?",
        summary: "Sim. Tanto a base de contatos quanto os indicadores consolidados contam com exportação nativa em CSV.",
        details: ["Os arquivos CSV já incluem separador ponto e vírgula e codificação UTF-8 compatível com planilhas em português.", "Para backup técnico completo de contatos, oportunidades e tarefas juntos, utilize a exportação JSON em Configurações."],
      },
    ],
  },
};

export function Portal({
  user,
  onOpenAuth,
  onEnterCRM,
}: {
  user: User | null;
  onOpenAuth: (mode: "login" | "register", targetSection?: Section) => void;
  onEnterCRM: (section?: Section) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [pubTab, setPubTab] = useState<keyof typeof PUBLICATIONS>("guias");
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedService, setSelectedService] = useState<QuickService | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocEntry | null>(null);
  const [searchMessage, setSearchMessage] = useState("");

  const openSection = (section: Section) => {
    if (user) onEnterCRM(section);
    else onOpenAuth("login", section);
  };

  const searchResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return [];
    const serviceHits = QUICK_SERVICES.filter(item =>
      [item.title, item.short, item.summary, ...item.highlights].join(" ").toLocaleLowerCase("pt-BR").includes(term),
    ).map(item => ({
      id: `srv-${item.id}`,
      badge: "Serviço Digital",
      title: item.title,
      description: item.short,
      action: () => setSelectedService(item),
    }));
    const docHits = Object.values(PUBLICATIONS)
      .flatMap(group => group.items)
      .filter(doc => [doc.code, doc.tag, doc.title, doc.summary].join(" ").toLocaleLowerCase("pt-BR").includes(term))
      .map(doc => ({
        id: `doc-${doc.code}`,
        badge: doc.tag,
        title: doc.title,
        description: doc.code,
        action: () => setSelectedDoc(doc),
      }));
    return [...serviceHits, ...docHits].slice(0, 6);
  }, [query]);

  const filteredServices = useMemo(
    () => (activeCategory === "todos" ? QUICK_SERVICES : QUICK_SERVICES.filter(item => item.category === activeCategory)),
    [activeCategory],
  );

  const firstName = user?.name.split(" ")[0];

  return (
    <div className="portal-shell">
      <a href="#conteudo-principal" className="skip-link">
        Pular para o conteúdo principal
      </a>

      {/* Barra Institucional Superior & Acessibilidade */}
      <div className="gov-bar">
        <div className="portal-container gov-bar-inner">
          <div className="gov-links">
            <a href="#servicos-rapidos">Serviços Digitais</a>
            <a href="#destaques">Destaques</a>
            <a href="#publicacoes">Guias &amp; Normas</a>
            <a href="https://buzios.rj.gov.br/" target="_blank" rel="noreferrer">Prefeitura de Búzios <ArrowUpRight size={13} aria-hidden="true" /></a>
            <button
              type="button"
              className="gov-link-btn"
              onClick={() => (user ? onEnterCRM("dashboard") : onOpenAuth("login"))}
            >
              Área Restrita
            </button>
          </div>
          <AccessibilityControls />
        </div>
      </div>

      {/* Cabeçalho Principal do Portal */}
      <header className="portal-header">
        <div className="portal-container portal-header-inner">
          <a href="#inicio" className="portal-brand-link" aria-label="Trabalho e Renda — Início">
            <Brand subtitle="PORTAL DE OPORTUNIDADES & GESTÃO" />
          </a>

          <nav className="portal-nav" aria-label="Navegação do portal">
            <a href="#inicio">Início</a>
            <a href="#servicos-rapidos">Serviços</a>
            <a href="#eixos">Eixos de Atuação</a>
            <a href="#destaques">Destaques</a>
            <a href="#publicacoes">Central de Guias</a>
          </nav>

          <div className="portal-header-actions">
            {user ? (
              <button
                type="button"
                id="portal-btn-enter-crm"
                className="primary"
                onClick={() => onEnterCRM("dashboard")}
              >
                <span>Painel de {firstName}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  id="portal-btn-register"
                  className="secondary portal-register-btn"
                  onClick={() => onOpenAuth("register")}
                >
                  Criar conta
                </button>
                <button
                  type="button"
                  id="portal-btn-login"
                  className="primary"
                  aria-label="Entrar na área restrita do CRM"
                  onClick={() => onOpenAuth("login")}
                >
                  <Lock size={15} />
                  <span>Área Restrita · CRM</span>
                </button>
              </>
            )}
            <button
              type="button"
              id="portal-mobile-toggle"
              className="icon-button portal-mobile-btn"
              aria-label={mobileNav ? "Fechar navegação" : "Abrir navegação"}
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              {mobileNav ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileNav && (
          <div className="portal-mobile-drawer">
            <nav aria-label="Menu móvel">
              <a href="#servicos-rapidos" onClick={() => setMobileNav(false)}>Serviços Digitais</a>
              <a href="#eixos" onClick={() => setMobileNav(false)}>Eixos de Atuação</a>
              <a href="#destaques" onClick={() => setMobileNav(false)}>Destaques</a>
              <a href="#publicacoes" onClick={() => setMobileNav(false)}>Central de Guias</a>
              <a href="https://buzios.rj.gov.br/" target="_blank" rel="noreferrer">Portal da Prefeitura de Búzios <ArrowUpRight size={14} aria-hidden="true" /></a>
            </nav>
            <div className="portal-mobile-cta">
              {user ? (
                <button type="button" className="primary full" onClick={() => onEnterCRM("dashboard")}>
                  Acessar meu painel <ArrowRight size={16} />
                </button>
              ) : (
                <>
                  <button type="button" className="secondary full" onClick={() => onOpenAuth("register")}>
                    Criar nova conta
                  </button>
                  <button type="button" className="primary full" onClick={() => onOpenAuth("login")}>
                    Entrar no CRM <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main id="conteudo-principal">
        {/* Hero Costeiro-Institucional com Busca Integrada */}
        <section id="inicio" className="portal-hero">
          <div className="portal-hero-backdrop" aria-hidden="true" />
          <div className="portal-container portal-hero-inner">
            <div className="portal-hero-copy">
              <p className="portal-overline">PLATAFORMA TRABALHO &amp; RENDA · GESTÃO DE RELACIONAMENTOS E NEGÓCIOS</p>
              <h1>Onde boas conexões se transformam em trabalho, negócios e renda.</h1>
              <p className="portal-lead">
                Encontre serviços digitais de gestão comercial, estruture sua rede de contatos, acompanhe propostas em
                reais e mantenha cada compromisso sob controle em um ambiente privado e confiável.
              </p>

              {/* Barra de Busca do Portal */}
              <div className="portal-search-wrap">
                <div className="portal-search-bar">
                  <Search size={20} aria-hidden="true" />
                  <input
                    id="portal-search-input"
                    type="search"
                    value={query}
                    onChange={event => {
                      setQuery(event.target.value);
                      setSearchMessage("");
                    }}
                    onKeyDown={event => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (searchResults[0]) {
                          searchResults[0].action();
                          setQuery("");
                          setSearchMessage("");
                        } else {
                          setSearchMessage(query.trim() ? "Nenhum resultado encontrado. Tente outros termos." : "Digite o que deseja pesquisar.");
                        }
                      }
                    }}
                    placeholder="O que você procura? Ex.: funil de propostas, contatos, relatórios CSV, recuperação..."
                    aria-label="Pesquisar serviços, módulos e guias no portal"
                  />
                  {query && (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Limpar pesquisa"
                      onClick={() => setQuery("")}
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    id="portal-search-submit"
                    className="primary portal-search-cta"
                    onClick={() => {
                      if (searchResults[0]) {
                        searchResults[0].action();
                        setQuery("");
                        setSearchMessage("");
                      } else {
                        setSearchMessage(query.trim() ? "Nenhum resultado encontrado. Tente outros termos." : "Digite o que deseja pesquisar.");
                      }
                    }}
                  >
                    Buscar
                  </button>
                </div>

                {searchMessage && <p className="portal-search-message" role="status">{searchMessage}</p>}

                {query.trim() !== "" && (
                  <div className="portal-search-results" role="region" aria-label="Resultados da busca">
                    {searchResults.length ? (
                      searchResults.map(hit => (
                        <button
                          key={hit.id}
                          type="button"
                          className="portal-search-hit"
                          onClick={() => {
                            hit.action();
                            setQuery("");
                          }}
                        >
                          <div>
                            <span className="hit-badge">{hit.badge}</span>
                            <strong>{hit.title}</strong>
                            <small>{hit.description}</small>
                          </div>
                          <ArrowUpRight size={16} />
                        </button>
                      ))
                    ) : (
                      <div className="portal-search-empty">
                        <span>Nenhum item correspondente para &ldquo;{query}&rdquo;.</span>
                        <span>Tente palavras como “contatos”, “tarefas” ou “relatórios”.</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="portal-quick-tags" aria-label="Sugestões rápidas">
                  <span>Acesso direto:</span>
                  <button type="button" onClick={() => setQuery("Funil")}>Funil em 5 etapas</button>
                  <button type="button" onClick={() => setQuery("Contatos")}>Rede de Contatos</button>
                  <button type="button" onClick={() => setQuery("CSV")}>Exportação CSV</button>
                  <button type="button" onClick={() => setQuery("Google")}>Login Google</button>
                </div>
              </div>
            </div>

            <aside className="portal-hero-card" aria-label="Resumo da plataforma">
              <div className="hero-card-header">
                <span className="hero-card-kicker">ATENDIMENTO DIGITAL</span>
                <strong>Seu escritório executivo na nuvem</strong>
              </div>
              <ul className="hero-card-list">
                <li>
                  <CheckCircle2 size={17} />
                  <div>
                    <strong>Contatos &amp; Empresas</strong>
                    <span>Histórico individualizado e exportação aberta</span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={17} />
                  <div>
                    <strong>Oportunidades em R$</strong>
                    <span>Da prospecção inicial à receita conquistada</span>
                  </div>
                </li>
                <li>
                  <CheckCircle2 size={17} />
                  <div>
                    <strong>Privacidade Garantida</strong>
                    <span>Isolamento total por conta com Google ou senha</span>
                  </div>
                </li>
              </ul>
              <div className="hero-card-actions">
                <button
                  type="button"
                  className="primary full"
                  onClick={() => (user ? onEnterCRM("dashboard") : onOpenAuth("register"))}
                >
                  <span>{user ? "Continuar no Meu CRM" : "Criar Minha Conta Agora"}</span>
                  <ArrowRight size={17} />
                </button>
                {!user && (
                  <button type="button" className="hero-card-sublink" onClick={() => onOpenAuth("login")}>
                    Já possui cadastro? Entrar na Área Restrita
                  </button>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* Faixa de Acesso Rápido (inspirada nos cartões superiores do portal de Búzios) */}
        <section id="servicos-rapidos" className="quick-strip-section" aria-label="Acesso rápido aos serviços">
          <div className="portal-container">
            <div className="quick-strip-grid">
              {QUICK_SERVICES.map(service => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    id={`quick-service-${service.id}`}
                    type="button"
                    className="quick-card"
                    onClick={() => setSelectedService(service)}
                  >
                    <span className="quick-card-icon">
                      <Icon size={21} />
                    </span>
                    <span className="quick-card-body">
                      <strong>{service.title}</strong>
                      <small>{service.short}</small>
                    </span>
                    <ArrowUpRight size={16} className="quick-card-arrow" />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Eixos de Atuação & Diretório de Serviços */}
        <section id="eixos" className="portal-section">
          <div className="portal-container">
            <div className="section-header">
              <div>
                <p className="eyebrow">SERVIÇOS PARA VOCÊ E SEU NEGÓCIO</p>
                <h2>Recursos pensados para organizar cada frente de trabalho</h2>
              </div>
              <p className="section-subtitle">
                Selecione um eixo temático para explorar as ferramentas disponíveis no portal e no painel de gestão.
              </p>
            </div>

            <div className="category-pills" role="tablist" aria-label="Filtrar serviços por eixo">
              {CATEGORIES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === id}
                  className={`category-pill ${activeCategory === id ? "active" : ""}`}
                  onClick={() => setActiveCategory(id)}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="services-directory">
              {filteredServices.map(service => {
                const Icon = service.icon;
                return (
                  <article key={service.id} className="directory-card">
                    <div className="directory-card-top">
                      <span className="directory-icon">
                        <Icon size={20} />
                      </span>
                      <span className="directory-tag">{CATEGORIES.find(c => c.id === service.category)?.label}</span>
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.summary}</p>
                    <div className="directory-card-footer">
                      <button type="button" className="text-button" onClick={() => setSelectedService(service)}>
                        Detalhes do serviço <ArrowRight size={14} />
                      </button>
                      <button type="button" className="secondary directory-open-btn" onClick={() => openSection(service.section)}>
                        Acessar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Destaques em Formato Editorial Assimétrico */}
        <section id="destaques" className="portal-section portal-section-sand">
          <div className="portal-container">
            <div className="section-header">
              <div>
                <p className="eyebrow">DESTAQUES DA PLATAFORMA</p>
                <h2>Gestão clara, hospitalidade no atendimento e foco no resultado</h2>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => (user ? onEnterCRM("dashboard") : onOpenAuth("login"))}
              >
                <span>Abrir Painel Completo</span>
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="editorial-grid">
              <article className="editorial-lead">
                <div
                  className="editorial-media"
                  role="img"
                  aria-label="Pavilhão de trabalho iluminado com vista para enseada costeira azul"
                />
                <div className="editorial-lead-body">
                  <span className="editorial-kicker">VISÃO INTEGRADA · TRABALHO &amp; RENDA</span>
                  <h3>Da primeira conversa ao contrato assinado: tudo registrado com rigor e simplicidade</h3>
                  <p>
                    Profissionais liberais, consultorias, prestadores de serviços e empresas locais encontram no CRM
                    Trabalho &amp; Renda uma estrutura limpa para cuidar da carteira de clientes, dimensionar receitas e
                    nunca perder o momento certo de um retorno.
                  </p>
                  <div className="editorial-metrics">
                    <div>
                      <strong>5 etapas</strong>
                      <span>no funil comercial</span>
                    </div>
                    <div>
                      <strong>CSV &amp; JSON</strong>
                      <span>exportação imediata</span>
                    </div>
                    <div>
                      <strong>100% privado</strong>
                      <span>dados isolados por conta</span>
                    </div>
                  </div>
                </div>
              </article>

              <div className="editorial-side">
                {FEATURED_BRIEFS.map(brief => (
                  <article key={brief.code} className="editorial-brief">
                    <span className="brief-code">{brief.code}</span>
                    <h3>{brief.title}</h3>
                    <p>{brief.excerpt}</p>
                    <button type="button" className="text-button" onClick={() => openSection(brief.section)}>
                      Explorar no painel <ArrowRight size={14} />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Central de Guias, Normas & Perguntas (inspirada em Últimas Publicações) */}
        <section id="publicacoes" className="portal-section">
          <div className="portal-container">
            <div className="section-header">
              <div>
                <p className="eyebrow">DOCUMENTAÇÃO &amp; TRANSPARÊNCIA OPERACIONAL</p>
                <h2>Central de Guias, Fluxos e Perguntas Frequentes</h2>
              </div>
              <p className="section-subtitle">
                Consulte orientações práticas de uso, critérios do funil de vendas e padrões de segurança da plataforma.
              </p>
            </div>

            <div className="pub-panel">
              <div className="pub-tabs" role="tablist" aria-label="Categorias de publicações e guias">
                {(Object.keys(PUBLICATIONS) as Array<keyof typeof PUBLICATIONS>).map(key => (
                  <button
                    key={key}
                    id={`pub-tab-${key}`}
                    type="button"
                    role="tab"
                    aria-selected={pubTab === key}
                    className={`pub-tab ${pubTab === key ? "active" : ""}`}
                    onClick={() => setPubTab(key)}
                  >
                    <BookOpenCheck size={15} />
                    <span>{PUBLICATIONS[key].label}</span>
                  </button>
                ))}
              </div>

              <div className="pub-list" role="tabpanel" aria-labelledby={`pub-tab-${pubTab}`}>
                {PUBLICATIONS[pubTab].items.map(doc => (
                  <article key={doc.code} className="pub-item">
                    <div className="pub-meta">
                      <strong>{doc.code}</strong>
                      <span className="badge">{doc.tag}</span>
                    </div>
                    <div className="pub-body">
                      <h3>{doc.title}</h3>
                      <p>{doc.summary}</p>
                    </div>
                    <div className="pub-action">
                      <button type="button" className="secondary" onClick={() => setSelectedDoc(doc)}>
                        Consultar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Banner Institucional Costeiro */}
        <section className="prestige-section">
          <div className="portal-container">
            <div className="prestige-banner">
              <div className="prestige-copy">
                <p className="portal-overline">EXCELÊNCIA EM GESTÃO DE RELACIONAMENTOS</p>
                <h2>Organize hoje as oportunidades que constroem seus próximos resultados.</h2>
                <p>
                  Acesse gratuitamente sua conta com Google ou crie uma credencial dedicada em segundos. Interface
                  responsiva para computador e celular, com indicadores calculados em tempo real.
                </p>
                <div className="prestige-pillars">
                  <span><TrendingUp size={15} /> Visão clara de receitas</span>
                  <span><Building2 size={15} /> Pessoas e empresas</span>
                  <span><KeyRound size={15} /> Recuperação autônoma</span>
                </div>
              </div>
              <div className="prestige-cta">
                {user ? (
                  <button type="button" className="primary prestige-primary" onClick={() => onEnterCRM("dashboard")}>
                    <span>Ir para o Painel Principal</span>
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <>
                    <button type="button" className="primary prestige-primary" onClick={() => onOpenAuth("register")}>
                      <span>Começar Gratuitamente</span>
                      <ArrowRight size={17} />
                    </button>
                    <button type="button" className="secondary prestige-secondary" onClick={() => onOpenAuth("login")}>
                      Entrar na minha conta
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé Institucional */}
      <footer className="portal-footer">
        <div className="portal-container portal-footer-grid">
          <div className="footer-brand-col">
            <Brand light subtitle="PLATAFORMA DE RELACIONAMENTOS E NEGÓCIOS" />
            <p>
              Ambiente digital dedicado à organização profissional de contatos, acompanhamento de propostas comerciais e
              gestão disciplinada de tarefas e receitas.
            </p>
          </div>

          <div>
            <h3>Acesso Rápido</h3>
            <ul>
              <li><a href="#servicos-rapidos">Serviços Digitais</a></li>
              <li><a href="#eixos">Eixos de Atuação</a></li>
              <li><a href="#destaques">Destaques</a></li>
              <li><a href="#publicacoes">Central de Guias</a></li>
              <li><a href="https://buzios.rj.gov.br/" target="_blank" rel="noreferrer">Prefeitura de Búzios <ArrowUpRight size={13} aria-hidden="true" /></a></li>
            </ul>
          </div>

          <div>
            <h3>Módulos do CRM</h3>
            <ul>
              <li><button type="button" onClick={() => openSection("dashboard")}>Visão Geral &amp; KPIs</button></li>
              <li><button type="button" onClick={() => openSection("contacts")}>Rede de Contatos</button></li>
              <li><button type="button" onClick={() => openSection("opportunities")}>Funil de Oportunidades</button></li>
              <li><button type="button" onClick={() => openSection("tasks")}>Agenda de Tarefas</button></li>
              <li><button type="button" onClick={() => openSection("reports")}>Relatórios &amp; CSV</button></li>
            </ul>
          </div>

          <div>
            <h3>Área Restrita &amp; Dados</h3>
            <ul>
              {user ? (
                <li><button type="button" onClick={() => onEnterCRM("settings")}>Configurações de {firstName}</button></li>
              ) : (
                <>
                  <li><button type="button" onClick={() => onOpenAuth("login")}>Entrar no CRM</button></li>
                  <li><button type="button" onClick={() => onOpenAuth("register")}>Criar Nova Conta</button></li>
                </>
              )}
              <li>
                <span className="footer-meta-note">
                  <Download size={13} /> Exportação aberta em CSV e JSON
                </span>
              </li>
              <li>
                <span className="footer-meta-note">
                  <ShieldCheck size={13} /> Sessões seguras e dados isolados
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="portal-footer-bottom">
          <div className="portal-container portal-footer-bottom-inner">
            <span>&copy; {new Date().getFullYear()} TRABALHOERENDA.COM — Todos os direitos reservados.</span>
            <span>Feito para transformar relacionamentos em trabalho e renda.</span>
          </div>
        </div>
      </footer>

      {/* Modal de Detalhes de Serviço */}
      {selectedService && (
        <Modal title={selectedService.title} onClose={() => setSelectedService(null)} wide>
          <p className="muted">{selectedService.summary}</p>
          <div className="modal-feature-list">
            {selectedService.highlights.map(item => (
              <div key={item} className="modal-feature-item">
                <CheckCircle2 size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={() => setSelectedService(null)}>
              Fechar
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => {
                const target = selectedService.section;
                setSelectedService(null);
                openSection(target);
              }}
            >
              <span>{user ? "Abrir módulo no CRM" : "Entrar para utilizar"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}

      {/* Modal de Leitura de Guia / Publicação */}
      {selectedDoc && (
        <Modal title={selectedDoc.title} onClose={() => setSelectedDoc(null)} wide>
          <div className="doc-modal-meta">
            <strong>{selectedDoc.code}</strong>
            <span className="badge">{selectedDoc.tag}</span>
          </div>
          <p className="muted">{selectedDoc.summary}</p>
          <div className="modal-feature-list">
            {selectedDoc.details.map(detail => (
              <div key={detail} className="modal-feature-item">
                <CheckCircle2 size={16} />
                <span>{detail}</span>
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={() => setSelectedDoc(null)}>
              Fechar consulta
            </button>
            {selectedDoc.section && (
              <button
                type="button"
                className="primary"
                onClick={() => {
                  const target = selectedDoc.section!;
                  setSelectedDoc(null);
                  openSection(target);
                }}
              >
                <span>Acessar módulo relacionado</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
