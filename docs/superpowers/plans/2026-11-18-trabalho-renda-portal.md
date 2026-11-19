# Portal Trabalho & Renda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer a entrada e a área autenticada do TRABALHOERENDA.COM com navegação inspirada em um portal público, mantendo identidade própria e todas as funções atuais.

**Architecture:** Next App Router continua montando `CRM`; React gerencia telas e sessão. A página de entrada alterna uma apresentação pública e os formulários existentes; a área autenticada recebe novo cabeçalho/navegação e estilos compartilhados. APIs, Firebase Auth/Firestore, PostgreSQL e payload alternativo de Railway permanecem como estão.

**Tech Stack:** Next 16.4.6, React 19.3.1, TypeScript, CSS existente em `src/app/crm.css`, lucide-react, build Next e empacotador `scripts/build-railway.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-18-trabalho-renda-portal-design.md`

## Global Constraints

- Preservar login Google, login/cadastro e recuperação por e-mail, sessão, contatos, oportunidades, tarefas, relatórios e configurações.
- Usar somente informações e recursos existentes; não inventar vagas, serviços municipais ou conteúdo de notícias.
- Identidade própria; sem brasão, logotipo ou chancela que sugira produto oficial da Prefeitura.
- Manter páginas responsivas, contraste legível, foco de teclado e navegação móvel acessível.
- Preservar compatibilidade do empacotamento do frontend para a função Railway com Preact compat e limite de payload existente.
- Esta mudança visual não altera dados, API, autenticação ou regras de isolamento.

## Review Focus

- Ao abrir a URL sem sessão, a pessoa deve entender o produto e alcançar entrar/criar conta.
- A troca entre apresentação e formulários deve manter estados e erros compreensíveis, incluindo o retorno da recuperação de acesso.
- Após login, cada aba atual deve continuar acessível; menu móvel deve abrir, navegar e fechar por teclado e toque.
- Estados vazios e carregamento não podem sugerir ou mostrar registros fictícios.
- Tamanhos estreitos e amplos não podem cortar navegação, campos, botões ou cartões.

---

### Task 1: Entrada pública e acesso à conta

**Files:**
- Modify: `src/features/auth.tsx`
- Modify: `src/components/ui.tsx` (apenas componentes de marca ou acessibilidade compartilhados, se necessário)
- Modify: `src/app/crm.css`

**Interfaces:**
- Mantém a assinatura pública `Auth({ onAuth, initialError })`.
- Preserva `mode` de login/cadastro/recuperação e acrescenta estado interno da apresentação pública.

- [ ] Construir cabeçalho público Trabalho & Renda, link externo para `https://buzios.rj.gov.br`, destaque de boas-vindas e CTA de acesso.
- [ ] Mostrar quatro cartões informativos — contatos, oportunidades, tarefas e relatórios — baseados nos recursos reais do CRM; direcionar o CTA de acesso aos formulários existentes.
- [ ] Adicionar retorno à apresentação a partir do formulário, preservando login Google, login/cadastro e recuperação.
- [ ] Estilizar a entrada e os estados de conta com cores próprias, cartões, hierarquia e controles legíveis do portal.

### Task 2: Navegação autenticada com linguagem de portal

**Files:**
- Modify: `src/features/crm.tsx`
- Modify: `src/app/crm.css`

**Interfaces:**
- Mantém `navigation`, `subtitles`, `navigate`, ações de sessão e callbacks atuais.
- Mantém `section` e âncora `#dashboard`, `#contacts`, `#opportunities`, `#tasks`, `#reports`, `#settings`.

- [ ] Reorganizar o cabeçalho autenticado para exibir a marca, navegação das seis seções, estado de privacidade e conta/sair.
- [ ] Adaptar o menu móvel para menu recolhível com `aria-expanded`, rótulos acessíveis e fechamento após navegação.
- [ ] Manter ações de criação, atualização, busca, exportação e avisos nas mesmas telas que hoje.

### Task 3: Acabamento responsivo das áreas do CRM

**Files:**
- Modify: `src/app/crm.css`
- Adjust only if needed: `src/features/dashboard.tsx`, `src/features/records.tsx`, `src/features/settings.tsx`

**Interfaces:**
- Não muda tipos de `CRMData`, `Section`, `Task` ou assinaturas dos componentes de tela.
- Preserva as classes funcionais de estado, etapa, prioridade, modal e foco já utilizadas pelas telas.

- [ ] Harmonizar painéis, métricas, kanban, tabelas, formulários, relatórios e configurações com o cabeçalho e a identidade escolhida.
- [ ] Revisar desktop, tablet e celular; reduzir navegação e grades sem ocultar ações primárias ou estado do usuário.
- [ ] Revisar foco de teclado, contraste, alvo de toque, `prefers-reduced-motion` e semântica de `nav`/`main`.
- [ ] Validar sem criar ou executar testes: `npm run typecheck`, `npm run build` e `npm run build:railway`; verificar os resultados no dashboard local e inspecionar o tamanho do artefato.

## Notas de verificação

Não adicionar nem executar testes automatizados para esta alteração visual. A validação é composta pelos comandos de typecheck e build listados na Task 3 e revisão visual/manual dos principais estados (deslogado, formulário, carregando, painel vazio e menu móvel).
