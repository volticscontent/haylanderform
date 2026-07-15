# Gestão de Leads e Ficha Técnica Unificada

Este documento descreve a arquitetura e o funcionamento da gestão de leads no sistema Haylander, focando na unificação da interface entre a lista administrativa e a central de atendimento.

## Arquitetura de Componentes

A gestão de leads é baseada em três pilares:

1.  **Tipo de Dado Central (`LeadRecord`):** Localizado em `src/types/lead.ts`, define todos os campos que compõem o perfil de um cliente (Qualificação, Financeiro, Empresa, Contato).
2.  **Server Actions de Atualização:** Localizadas em `src/app/(admin)/lista/actions.ts`, fornecem a lógica `updateLeadFields` que realiza mudanças atômicas no banco de dados.
3.  **Componente Compartilhado (`LeadDetailsSidebar`):** O "cérebro" visual da ficha, que gerencia os estados de visualização e edição.

## Fluxo de Trabalho por Módulo

### 1. Na Lista de Leads (`/lista`)
- Exibe a tabela completa com filtros avançados.
- Ao clicar em "Visualizar" ou "Editar", abre o `LeadDetailsSidebar`.
- **Ações:** Excluir leads, Visualizar histórico Serpro, Editar campos.

### 2. Na Central de Atendimento (`/atendimento`)
- Permite que o atendente consulte o perfil do lead enquanto conversa via WhatsApp.
- O botão **"Ver Ficha"** renderiza o mesmo `LeadDetailsSidebar` de forma inline.
- **Sincronização:** Quando campos como "Situação" são alterados na ficha, a lista de chats é notificada para atualizar o badge visual do lead sem precisar recarregar a página.

## Campos Principais e Qualificação

A ficha técnica está dividida em seções lógicas:
- **Dados e Contato:** Telefone, Email, Razão Social, CNPJ.
- **Empresa e Qualificação:** Tipo de negócio, Faturamento, Qualificação (`MQL`, `ICP`, `SQL`), Situação.
- **Financeiro:** Valor de Dívidas Federais e Ativas.
- **Observações:** Notas internas para o time de vendas.

---

> [!IMPORTANT]
> **Manutenção:** Nunca crie uma nova ficha simplificada. Se houver necessidade de novos campos (ex: Dados de Crédito), adicione-os diretamente no `LeadDetailsSidebar.tsx` e no `LeadRecord` para que ambos os módulos recebam a atualização simultaneamente.
