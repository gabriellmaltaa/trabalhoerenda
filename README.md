# TRABALHOERENDA.COM

Repositório inicial para desenvolver o CRM **Trabalho e Renda**.

## Executar

Requer Node.js 22 ou superior e npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Em Linux/macOS, substitua `Copy-Item` por `cp`.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Desenvolvimento local |
| `npm run lint` | Análise estática |
| `npm run typecheck` | Verificação TypeScript |
| `npm run build` | Compilação de produção |
| `npm start` | Servidor após a compilação |
| `npm run check` | Lint, tipos e compilação |

## Estrutura

```text
src/app/          Rotas, layout e estilos globais
src/components/   Componentes compartilhados
src/features/     Futuros módulos do CRM
src/lib/          Futuras integrações e utilitários do servidor
public/           Arquivos públicos
docs/             Escopo e próximas etapas
.github/          Verificações automáticas no GitHub
```

Next.js App Router, React, TypeScript estrito e ESLint. O arquivo `package-lock.json` fixa as dependências para instalações reproduzíveis.

## Estado atual

Há uma página inicial de apresentação da base. Contatos, oportunidades, atividades e indicadores são **módulos planejados**, sem CRUD, autenticação, API ou persistência implementados. Não insira dados reais antes de implementar acesso e armazenamento adequados.

O nome TRABALHOERENDA.COM identifica o projeto. O domínio não foi comprado, conectado ou publicado. A página inicial usa `noindex` durante o desenvolvimento.

## Enviar ao GitHub

Este projeto começa como repositório Git local, na branch `main`. Após criar um repositório vazio na conta desejada, sem README adicional:

```powershell
git remote add origin https://github.com/SEU-USUARIO/trabalhoerenda.git
git push -u origin main
```

Substitua `SEU-USUARIO` pelo proprietário real. Nenhum endereço remoto é presumido.

## Próximas etapas

Consulte [o plano do CRM](docs/ROADMAP.md). O provedor de autenticação, banco de dados e hospedagem será escolhido na implementação. Arquivos `.env.local` e credenciais são ignorados pelo Git. Chaves privadas devem permanecer no servidor.
