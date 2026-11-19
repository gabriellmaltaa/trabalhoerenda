# Trabalho & Renda com referência de portal público

## Intenção

Refazer a apresentação do TRABALHOERENDA.COM para que se encaixe bem quando alguém chegar por um link do Portal da Prefeitura de Búzios. A referência é a organização em serviços, navegação clara, busca, cartões de acesso e acessibilidade do [portal buzios.rj.gov.br](https://buzios.rj.gov.br). O produto conserva identidade própria; não usa brasão, logotipo, selo, cores institucionais copiadas nem texto que o apresente como sistema oficial da Prefeitura.

## Abordagens consideradas

1. **Portal próprio inspirado na organização pública — recomendada e escolhida.** A entrada apresenta o Trabalho & Renda, as ferramentas reais do CRM e um acesso visível; as telas autenticadas recebem a mesma linguagem de portal. Atende ao vínculo visual sem sugerir endosso institucional.
2. **Reproduzir a identidade oficial da Prefeitura.** Ficaria mais próximo visualmente, mas depende de autorização formal para os elementos e a chancela. Não foi escolhido.
3. **Alterar só cores e tipografia no CRM existente.** Menor mudança, mas não atende ao pedido de aproximar a navegação do portal usado como referência.

## Escopo

- Criar uma entrada pública de boas-vindas, identificada como Trabalho & Renda, com ligação para o Portal da Prefeitura e CTA para entrar/criar conta.
- Apresentar em cartões os recursos que já existem: contatos, oportunidades, tarefas e relatórios; não anunciar vagas ou serviços municipais que o sistema não oferece.
- Organizar o CRM autenticado com navegação e blocos inspirados em um portal de serviços, adaptados para o uso de gestão.
- Manter login Google, login/cadastro por e-mail, recuperação de acesso, CRM e APIs, dados por conta no Firestore para contas Google e PostgreSQL para contas legadas.
- Tornar navegação, contraste, foco de teclado, texto e layout móvel acessíveis.

## Fora de escopo

- Mudar identidade da Prefeitura, integrar dados municipais, criar busca de vagas, formularios públicos ou conteúdo de notícias.
- Alterar autenticação, banco de dados, regras de acesso ou arquitetura de implantação.
- Sugerir que o CRM é oficial, endossado ou operado pela Prefeitura.

## Critérios de aceitação

- A página pública explica o propósito do produto e oferece um caminho óbvio para autenticação.
- Cada cartão público aponta para uma descrição fiel de uma função existente; dados do CRM só aparecem após login.
- As telas autenticadas continuam usando as APIs atuais, sem dados demonstrativos ou persistência no navegador.
- A marca e o texto deixam claro que este é o Trabalho & Renda, com identidade própria.
- O design funciona em desktop e celular, com controles e textos legíveis e operáveis por teclado.
- A compilação existente para Railway permanece compatível.

## Decisões de implementação

Proposta do implementador: manter Next/React/TypeScript, componentes, SDK Firebase e APIs atuais; reformular a página de acesso e a camada visual/layout do CRM. A estética pode usar cabeçalho de portal, área de destaque, cartões de acesso e navegação utilitária, com cores próprias do Trabalho & Renda. Nenhuma nova função de backend é necessária.
