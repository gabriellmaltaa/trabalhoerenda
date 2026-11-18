# Integração Firebase e GitHub

## Objetivo

Repositório privado `gabriellmaltaa/trabalhoerenda`, login com conta Google e banco Firestore dedicado no projeto `trabalhoerenda-crm-2026`.

## Decisões

- Projeto Firebase exclusivo, escolhido pelo usuário.
- Banco Firestore Native em `us-east4`, próximo à aplicação Railway existente em Northern Virginia; nenhuma conta de cobrança é vinculada.
- Autenticação Google pelo Firebase SDK. O navegador não recebe chaves administrativas.
- Novos acessos Google persistem perfil, contatos, oportunidades e tarefas em caminhos privados por UID no Firestore.
- O acesso atual por senha e os registros PostgreSQL são preservados. Não mesclar automaticamente contas com o mesmo e-mail nem mover dados existentes sem validar a identidade.
- A API compartilha a validação existente, verifica o ID token Google/Firebase e encaminha operações Firestore usando o próprio token do usuário, sujeito às Security Rules.
- As tabelas e os indicadores da interface mantêm o contrato atual. Não inserir contatos demonstrativos como registros reais.

## Plano

1. Criar repositório e enviar histórico local.
2. Criar projeto Firebase, app web, Google Auth e banco; confirmar edição e domínio autorizado.
3. Escrever testes da API Firebase e regras antes da implementação de CRUD.
4. Implementar botão Google, retomada de sessão, logout e configurações adequadas ao provedor.
5. Publicar regras e código Railway; verificar CRUD, isolamento, login Google e fluxo legado.
6. Registrar o que foi verificado e enviar o código final ao GitHub.

## Configuração publicada

- Projeto: `trabalhoerenda-crm-2026`, nome Trabalho e Renda CRM.
- Banco: `crm-dados`, Firestore Enterprise Native, `us-east4`, `freeTier: true`.
- Plano Firebase: Spark, sem conta de cobrança vinculada nesta tarefa.
- App web: `1:534428962631:web:3f6b95c8f67104f87a8662`.
- Google Authentication ativado. Endereço Railway incluído nos domínios autorizados.
- O arquivo `src/lib/firebase-config.ts` contém apenas os identificadores públicos do app web. Não contém uma chave de conta de serviço nem segredo OAuth.

## Modelo de dados

```text
users/{firebaseUid}                       Perfil privado (nome, e-mail, empresa)
users/{firebaseUid}/contacts/{uuid}       Contatos de pessoas e empresas
users/{firebaseUid}/opportunities/{uuid}  Oportunidades e etapas do funil
users/{firebaseUid}/tasks/{uuid}          Tarefas, prazos e prioridades
```

Os documentos são criados ao usar o CRM. Uma base nova começa vazia, sem contatos ou valores demonstrativos. Ao entrar com Google, o perfil é criado automaticamente e todas as abas estão prontas para receber registros.

As Security Rules restringem todos os documentos ao UID autenticado com Google e e-mail verificado, validam campos e tipos e impedem alteração de proprietário ou de campos de identidade. As regras estão versionadas e possuem testes em emulador.

A API usa consultas de documentos `runQuery` dentro do caminho privado do usuário. Na validação publicada, a listagem de metadados `ListDocuments` recusava a leitura das coleções recém-criadas, mesmo com perfil autorizado; a consulta equivalente a `getDocs` resolveu o caso sem ampliar permissões.

Contatos excluídos têm os dados pessoais apagados e mantêm somente um marcador técnico. Esse marcador impede reativação e evita referências órfãs durante alterações simultâneas. Na interface e na exportação, os contatos excluídos são omitidos, e os vínculos correspondentes aparecem sem contato.

## Verificar

```powershell
npm run check
npx -y firebase-tools@latest emulators:exec --only firestore --project demo-trabalhoerenda 'node --test tests/firestore.rules.test.mjs'
```

O emulador requer Java 21. Os testes não alteram a base de produção.

Para publicar mudanças nas regras, com o Firebase CLI autenticado:

```powershell
npx -y firebase-tools@latest deploy --only firestore:rules --project trabalhoerenda-crm-2026
```

## Compatibilidade

As contas antigas por e-mail/senha continuam no PostgreSQL do Railway. O login Google usa Firestore. Contas com o mesmo e-mail nesses dois acessos não são mescladas automaticamente e seus registros permanecem separados. Uma migração ou vinculação exige confirmação de identidade e uma etapa específica.
