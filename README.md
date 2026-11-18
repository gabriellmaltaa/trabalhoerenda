# TRABALHOERENDA.COM — CRM

CRM publicado em **https://trabalhoerenda-crm-production.up.railway.app**.

Repositório privado: **https://github.com/gabriellmaltaa/trabalhoerenda**.

**Login Google e Firebase:** clique em **Continuar com Google**. O perfil é preparado automaticamente, e contatos, oportunidades e tarefas desse acesso são salvos no Firestore do projeto `trabalhoerenda-crm-2026`, banco `crm-dados`. Veja [a configuração e o modelo de dados](docs/FIREBASE.md).

Abra o site e escolha **Criar conta**. Não existe senha padrão de administrador. Cada conta possui seus próprios dados. Guarde o código de recuperação exibido após o cadastro; é possível baixá-lo como arquivo.

O cadastro por e-mail/senha continua disponível para as contas PostgreSQL anteriores. Os dados de uma conta Google não são mesclados automaticamente com os de uma conta por senha, mesmo se tiverem o mesmo e-mail.

## Funcionalidades

- Login Google com Firebase Authentication e armazenamento privado no Firestore.
- Cadastro por senha, logout, recuperação por código e sessões de sete dias para o acesso legado.
- Dashboard com indicadores calculados dos registros reais da conta.
- Contatos de pessoas e empresas: criar, pesquisar, filtrar, editar, excluir e exportar CSV.
- Oportunidades: funil com cinco etapas, valores em reais, contato associado, previsão e observações.
- Tarefas: prioridade, prazo, contato associado, conclusão, edição e exclusão.
- Relatórios de oportunidades, receita ganha e tarefas, com exportação CSV.
- Perfil, alteração de senha, regeneração do código de recuperação e exportação dos dados em JSON.
- Interface adaptada para computador e celular.

## Railway

Foi usado o projeto indicado pelo usuário, originalmente chamado `investidor-brasileiro`. O projeto estava vazio antes desta implantação. O nome do projeto foi preservado.

| Recurso | Identificação |
| --- | --- |
| Projeto | `10948d59-3036-432f-baf7-b27805dc597b` |
| Ambiente production | `f63f0165-9fca-4086-8d74-953b5b23a962` |
| Aplicação trabalhoerenda-crm | `f0c22bda-ffe3-446d-a66b-849162253c06` |
| Postgres | `dc6820e0-a9a9-464e-a4e9-36318fb92c5d` |

A aplicação usa a referência privada `${{Postgres.DATABASE_URL}}`. O banco persiste em um volume Railway. Credenciais do banco não estão no código nem no navegador. A origem pública está configurada em `APP_ORIGIN`.

A publicação atual é uma Railway Function Bun. O pacote contém a API e os arquivos da interface comprimidos, respeitando o limite de 96 KB. A interface usa Preact compatível com React nesse pacote; o Next local continua usando React. Ambos compartilham as mesmas telas e regras de negócio. O Firebase Authentication é carregado do CDN oficial Google com versão fixa; os demais assets e estilos são servidos pelo próprio CRM.

Para atualizar a Function: executar `npm run build:railway` e enviar o conteúdo completo de `dist/railway-function.ts` pela ferramenta Railway de atualização de código, ou pelo editor do serviço no painel. O arquivo gerado não contém credenciais administrativas. O código está no GitHub, com verificações automáticas; a implantação atual da Function é atualizada explicitamente e não é disparada por push.

O arquivo `railway.json` também permite hospedar o Next diretamente quando houver uma conexão de repositório ou CLI autenticada.

## Executar localmente

Requer Node.js 22.18 ou superior, npm e um PostgreSQL.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Configure `DATABASE_URL` em `.env.local` com a conexão do seu banco de desenvolvimento. Depois:

```powershell
npm run dev
```

Abra http://localhost:3000. Sem banco configurado, a interface apresenta a mensagem correspondente; não há um modo de login falso. Em Linux/macOS, use `cp` no lugar de `Copy-Item`.

Opcionalmente, para subir PostgreSQL local pelo Docker:

```powershell
$env:POSTGRES_PASSWORD = 'ESCOLHA_UMA_SENHA_LOCAL'
docker compose up -d
```

Use a mesma senha local no `DATABASE_URL`. O banco local é separado do Railway. As tabelas e índices são criados de forma idempotente na primeira requisição à API; evoluções futuras do schema devem usar migrations versionadas.

## Validação

| Comando | Finalidade |
| --- | --- |
| `npm test` | Testes de API com banco em memória PostgreSQL compatível |
| `npm run lint` | Análise estática |
| `npm run typecheck` | Verificação TypeScript |
| `npm run build` | Compilação Next de produção |
| `npm run build:railway` | Pacote para Railway Functions |
| `npm run check` | Todas as verificações anteriores |
| `npm start` | Servir Next após a compilação |

Para validar a implantação real, criando e removendo apenas contas temporárias de teste:

```powershell
$env:CRM_TEST_URL = 'https://trabalhoerenda-crm-production.up.railway.app'
node scripts/smoke-deployed.mjs
```

O script verifica conexão PostgreSQL, autenticação, CRUD, isolamento entre contas, logout, perfil, recuperação e persistência. Os dados de teste são excluídos ao final.

## Estrutura

```text
src/app/          Next App Router, estilos e encaminhamento da API
src/components/   Elementos compartilhados e janelas acessíveis
src/features/     Login, painel, contatos, funil, tarefas e configurações
src/lib/          Tipos, formatação, exportação e cliente HTTP
src/server/       API, schema PostgreSQL, validação e senhas
src/railway/      Entradas da interface e servidor para o Railway
scripts/          Empacotamento e validação da implantação
tests/            Testes de integração da API
```

## Segurança e limites atuais

Senhas usam scrypt com salt aleatório. Cookies são HttpOnly, SameSite=Lax e Secure em produção; tokens são aleatórios e armazenados como hash no banco. As consultas validam a propriedade dos registros no servidor e usam parâmetros SQL. Alterações exigem origem permitida. Login e recuperação compartilham trava por usuário para evitar emissão de sessão com senha antiga durante uma recuperação.

As contas são individuais: não há equipes, convites ou compartilhamento entre contas. Não há integração de WhatsApp, pagamentos ou automações externas. No login Google, a segurança e a recuperação são gerenciadas pela conta Google. No acesso por senha, use o código de recuperação. Não foram configuradas rotinas próprias de backup; a operação e a política de backup dos bancos devem ser definidas antes de uso crítico.

## Domínio próprio

`trabalhoerenda.com` ainda não está registrado, conforme informado pelo usuário. A consulta RDAP oficial da Verisign realizada em 17/11/2026 às 23:17 (America/Sao_Paulo) retornou HTTP 404, sem registro encontrado, indicando aparente disponibilidade. A confirmação final ocorre no registrador; a consulta não reserva o domínio.

Nenhuma compra foi realizada. Após registrar, adicione o domínio no serviço Railway e aplique no provedor de DNS os registros retornados pelo Railway. Atualize `APP_ORIGIN` para o endereço escolhido e valide HTTPS e login nesse domínio. Enquanto isso, use o endereço Railway acima.
