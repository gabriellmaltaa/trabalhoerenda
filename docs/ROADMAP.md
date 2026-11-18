# Plano do CRM Trabalho e Renda

## Objetivo

Preparar a base técnica para o futuro site CRM TRABALHOERENDA.COM. O pedido atual cobre a criação e organização do repositório; as regras de negócio ainda precisam ser definidas.

## Decisões iniciais

- Next.js com TypeScript para reunir interface e futuras rotas de servidor no mesmo projeto.
- Português do Brasil na interface.
- CSS local para evitar dependência de um serviço de estilos ou fontes.
- Backend, autenticação e hospedagem sem provedor obrigatório nesta etapa.
- Módulos abaixo são uma proposta inicial, ajustável ao uso real do CRM.

## Sequência sugerida

1. Definir público do CRM, usuários, equipes e permissões.
2. Escolher banco e autenticação; configurar migrations e ambientes de desenvolvimento.
3. Implementar login, recuperação de senha e autorização no servidor.
4. Criar contatos e empresas com busca, paginação, validação e histórico.
5. Criar oportunidades com responsáveis, valores e etapas do funil.
6. Adicionar tarefas, prazos e retornos associados aos contatos.
7. Produzir indicadores a partir dos dados reais.
8. Validar isolamento entre equipes, backups, fluxos essenciais e acessibilidade.
9. Selecionar hospedagem e conectar o domínio mediante acesso à conta e ao DNS.

## Validação desta base

Instalar com `npm ci`, executar `npm run check` e verificar que o servidor retorna a página inicial. A integração contínua repetirá a análise estática e a compilação após o envio ao GitHub.
