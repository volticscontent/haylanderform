# ADR 0004: Unificação da Ficha de Lead e Arquitetura de Componentes Compartilhados

## Status
Aceito

## Contexto
Anteriormente, o sistema possuía duas implementações distintas para visualização de leads:
1.  **LeadList.tsx:** Uma barra lateral robusta, editável e com integração Serpro.
2.  **ChatInterface.tsx:** Um componente simplificado (`LeadSheet`) que apresentava dados desatualizados e limitados.

Essa redundância causava inconsistência de dados (o chat não mostrava campos novos como "Faturamento" ou "Situação") e aumentava a carga de manutenção. Tentamos inicialmente resolver via redirecionamento para a lista, mas isso prejudicava o fluxo de atendimento do usuário.

## Decisão
Decidimos extrair a lógica da ficha de lead para um componente compartilhado único, `LeadDetailsSidebar.tsx`, localizado em `src/components/`.

### Pontos Chave:
1.  **Fonte Única de Verdade:** Tanto a `/lista` quanto o `/atendimento` (chat) consomem o mesmo componente. Qualquer melhoria na ficha é refletida em ambos os locais.
2.  **Tipagem Estrita:** Criado `src/types/lead.ts` para padronizar o contrato de dados entre o banco de dados (actions) e o frontend.
3.  **Acesso Inline:** No chat, a ficha abre como uma barra lateral sobreposta, mantendo o contexto da conversa.
4.  **Sincronização de Estado:** O componente aceita um callback `onUpdate` que permite que a interface pai (ex: lista de chats) se atualize sem necessidade de um reload completo da página.

## Consequências
- **Positivas:** Consistência visual e de dados garantida; redução de código duplicado (~400 linhas removidas do `LeadList.tsx`); UX de atendimento superior.
- **Negativas:** Maior complexidade nas props do componente compartilhado para lidar com diferentes contextos de atualização (router refresh vs state update).
- **Riscos:** Dependência de server actions externas que devem estar sempre disponíveis.
