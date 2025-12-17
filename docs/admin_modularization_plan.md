# Relatório de Migração e Modularização do Admin

Este documento detalha os arquivos e componentes que foram migrados da tabela `haylander` para a nova tabela padronizada `leads`, bem como as normalizações aplicadas.

## Status da Migração

- [x] Criação da tabela `leads` com constraints (`CHECK`).
- [x] Migração de dados legados para a nova estrutura.
- [x] Atualização de rotas de API.
- [x] Atualização de componentes do Admin.
- [x] Normalização de nomes de colunas (remoção de acentos e caracteres especiais).

## Tabela de Referência

| Tabela Antiga | Tabela Nova |
| :--- | :--- |
| `haylander` | `leads` |

## Mapeamento de Colunas (Normalização)

| Coluna Antiga | Coluna Nova (Leads) |
| :--- | :--- |
| `qualificação` | `qualificacao` |
| `motivo_qualificação` | `motivo_qualificacao` |
| `teria_interesse?` | `teria_interesse` |
| `cartão-cnpj` | `cartao_cnpj` |
| `tipo_negócio` | `tipo_negocio` |
| `possui_sócio` | `possui_socio` |
| `serviço_escolhido` | `servico_escolhido` |
| `reunião_agendada` | `reuniao_agendada` |
| `data_reunião` | `data_reuniao` |
| `confirmação_qualificação` | `confirmacao_qualificacao` |

## Arquivos Atualizados

Os seguintes arquivos foram modificados para utilizar a nova tabela `leads` e os nomes de colunas normalizados:

### 1. API Routes (Backend)

*   `src/app/api/disparos/process/route.ts`:
    *   Atualizado para `FROM leads`.
    *   Implementada substituição de variáveis (placeholders) no corpo da mensagem.
*   `src/app/api/ecac/submit/route.ts`: Atualizado para inserir/ler de `leads`.
*   `src/app/api/serpro/clients/route.ts`: Atualizado para listar de `leads`.
*   `src/app/api/serpro/route.ts`: Atualizado para webhook SERPRO.
*   `src/app/api/mei/submit/route.ts`: Atualizado para inserir/ler de `leads`.
*   `src/app/api/leads/bulk-update/route.ts`: 
    *   Atualizado para `leads`.
    *   Mapeamento `allowedUpdateColumns` atualizado com chaves normalizadas.
*   `src/app/api/leads/bulk-delete/route.ts`: 
    *   Atualizado para `leads`.
    *   Mapeamento `allowedColumns` atualizado.
*   `src/app/api/user/[phone]/route.ts`: Atualizado para buscar usuário na tabela `leads`.

### 2. Admin Server Actions & Pages

*   `src/app/admin/lista/actions.ts`:
    *   Funções `deleteLead` e `updateLeadFields` atualizadas para usar `leads`.
    *   Lista de colunas permitidas normalizada.
*   `src/app/admin/dashboard/page.tsx`:
    *   Query SQL atualizada para buscar colunas normalizadas (`situacao`, `qualificacao`, etc.) de `leads`.
*   `src/app/admin/disparo/page.tsx`:
    *   Busca de dados atualizada para usar `leads`.

### 3. Client Components (Frontend)

*   `src/app/admin/lista/LeadList.tsx`:
    *   Interface `LeadRecord` atualizada com nomes normalizados.
    *   Colunas da tabela e filtros atualizados.
*   `src/app/admin/disparo/ui/Disparo.tsx`:
    *   Interface `Record` atualizada.
    *   Opções de critérios (`<select>`) atualizadas com chaves normalizadas (ex: `tipo_negocio`).
    *   Lógica de placeholders compatível com as novas chaves.

## Próximos Passos (Modularização Avançada)

Agora que o sistema está estável na tabela `leads`, a separação em múltiplas tabelas pode ser feita com segurança:

1.  **Separação de Domínios**:
    *   Criar tabela `lead_qualifications` (vinculada por `lead_id`).
    *   Criar tabela `lead_sales` (vinculada por `lead_id`).
    *   Criar tabela `attendants` e `attendant_leads`.

2.  **Refatoração**:
    *   Substituir queries diretas (`SELECT * FROM leads`) por `JOIN`s com as novas tabelas quando elas forem criadas.
