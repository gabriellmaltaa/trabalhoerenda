# CRM Trabalho e Renda — próximas etapas

## Implementado

Cadastro, login e logout; recuperação por código; perfil e troca de senha; contatos; oportunidades em cinco etapas; tarefas e conclusão; dashboard; relatórios; filtros e busca; exportação CSV/JSON; interface responsiva; PostgreSQL persistente no Railway.

A aplicação está publicada em https://trabalhoerenda-crm-production.up.railway.app. Configuração, instruções e limites estão no README.

## Evoluções possíveis

1. Registrar trabalhoerenda.com, conectar DNS e atualizar a origem pública permitida.
2. Definir uma política de backup, restauração e retenção do PostgreSQL.
3. Confirmar as regras de negócio e se haverá equipes e colaboração entre contas.
4. Integrar um provedor de e-mail para verificação de conta e recuperação por e-mail, caso desejado.
5. Avaliar deploy contínuo a partir do repositório privado `gabriellmaltaa/trabalhoerenda`, que já possui o código e verificações automáticas. A publicação atual continua sendo uma Railway Function.
6. Introduzir migrations versionadas antes de mudanças no schema e paginação no servidor para bases maiores.
7. Avaliar integrações de WhatsApp, agenda e automações conforme a necessidade real.

Nenhuma dessas integrações está sendo apresentada como implementada.

Login com Google e Firestore dedicado foram implementados posteriormente; veja `docs/FIREBASE.md`. As contas antigas e seus registros PostgreSQL foram preservados.
