# CRM no Railway — implementação

## Escopo

Evoluir a base existente para um CRM funcional em português, com cadastro, login, logout, recuperação por código, perfil, contatos, oportunidades, tarefas e indicadores. Cada usuário tem dados isolados; colaboração entre contas não está incluída nesta primeira versão.

## Arquitetura

Manter Next.js e compartilhar a interface React e a API entre o servidor Next local e uma Railway Function Bun. A Function recebe um arquivo compilado contendo a API e os assets da interface; isso permite publicar pela conexão Railway disponível, sem depender de credenciais GitHub ou CLI. PostgreSQL persiste usuários, sessões, registros e limites de autenticação. A estrutura permite migrar futuramente para deploy direto do repositório sem reescrever a aplicação.

Alternativa: publicar o Next diretamente por CLI/GitHub. Exigiria autenticação adicional que não está disponível neste ambiente. Sites/Cloudflare não é usado para hospedar, pois o usuário escolheu Railway.

## Funcionalidades

- Cadastro público; senha com pelo menos 10 caracteres; sessões em cookie HttpOnly, SameSite=Lax e Secure em produção.
- Senhas derivadas com scrypt, tokens aleatórios e armazenados como hash. Recuperação com código mostrado somente no cadastro ou regeneração autenticada; não simular envio de e-mail.
- Contatos de pessoas/empresas com nome, e-mail, telefone, empresa, status e observações.
- Oportunidades com contato opcional, valor em centavos, previsão e etapas: novo, qualificação, proposta, ganho, perdido.
- Tarefas com contato opcional, data, prioridade e estado.
- Dashboard calculado de dados reais, busca, filtros, edição, exclusão confirmada e exportação CSV.
- Configurações de perfil, alteração de senha, regeneração do código de recuperação.
- Interface responsiva, estados vazios, carregamento, validação e erros visíveis.

## Plano e verificação

1. Escrever testes de validação, autenticação e isolamento antes da API.
2. Implementar schema PostgreSQL e API com autorização em cada consulta e validação no servidor.
3. Implementar interface React e fluxos de formulário.
4. Compilar Next e gerar arquivo de deploy Railway a partir das mesmas fontes.
5. Criar projeto e PostgreSQL dedicados, configurar referência privada DATABASE_URL e publicar.
6. Testar login, persistência, isolamento e CRUD contra a implantação; verificar a interface no navegador.
7. Registrar os IDs de infraestrutura, atualizar README e criar commit local.

O domínio próprio depende de acesso ao DNS. A primeira publicação usará endereço Railway. Não comprar domínio, configurar cobrança, incluir dados demonstrativos como reais ou inserir senhas padrão.
