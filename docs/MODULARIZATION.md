# Modularization & Standardization Plan

## 1. Current Status (Completed)

We have successfully migrated from the monolithic `leads` table to a modular architecture. All data has been distributed across specialized tables, and the application logic (API and Admin) has been updated to use these new tables seamlessly.

### Database Schema (Modular)

The data is now split into the following tables, linked by `lead_id`:

1.  **`leads` (Core Identity)**
    *   `id` (PK), `telefone`, `email`, `nome_completo`, `cpf`, `senha_gov`, etc.
2.  **`leads_empresarial` (Business)**
    *   `cnpj`, `razao_social`, `faturamento_mensal`, `dados_serpro`, etc.
3.  **`leads_qualificacao` (Status)**
    *   `situacao` (CHECK constraints applied), `qualificacao`, `interesse_ajuda`, etc.
4.  **`leads_financeiro` (Debts)**
    *   `tem_divida`, `valor_divida_*`, `calculo_parcelamento`, etc.
5.  **`leads_vendas` (Sales)**
    *   `servico_negociado`, `data_reuniao`, `procuracao`, etc.
6.  **`leads_atendimento` (Operations)**
    *   `atendente_id`, `observacoes`, `envio_disparo`, etc.

### Verified Components

The following components have been updated and verified to use the new modular architecture:

#### Admin UI
-   `src/app/admin/lista/page.tsx` & `LeadList.tsx`: Uses `LEFT JOIN` queries and maps data correctly.
-   `src/app/admin/lista/actions.ts`: Implements transactional updates (`BEGIN`/`COMMIT`) to distribute writes across all 6 tables.
-   `src/app/admin/dashboard/page.tsx`: Fetches aggregated data using JOINs for charts and stats.
-   `src/app/admin/disparo/page.tsx`: Fetches target audiences using JOINs.

#### API Routes
-   `src/app/api/user/[phone]/route.ts`:
    -   **GET:** Retrieves full lead profile using JOINs.
    -   **PUT:** Updates specific tables based on fields provided, wrapped in a transaction.
-   `src/app/api/leads/bulk-update/route.ts`: Transactional updates for multiple leads across modular tables.
-   `src/app/api/leads/bulk-delete/route.ts`: Transactional deletes (cascading) across modular tables.
-   `src/app/api/disparos/process/route.ts`: Uses JOINs to allow filtering by any column and replacing placeholders from any table.
-   `src/app/api/serpro/route.ts`: Updates `leads_atendimento` and queries `leads_empresarial`.

#### Documentation & Migration
-   `docs/create_modular_tables.sql`: Schema definition.
-   `docs/migrate_to_modular.sql`: Data migration logic.
-   `src/lib/db-schema.ts`: Updated to reflect the new schema.

## 2. Migration History

1.  **Standardization:** Normalized column names (e.g., `teria_interesse` -> `interesse_ajuda`) in the legacy table.
2.  **Creation:** Created modular tables with Foreign Keys and Constraints.
3.  **Data Migration:** Moved existing data from `leads` to sub-tables.
4.  **Code Switch:** Updated all application logic to read/write from the new tables.

## 3. Pending Tasks

- [x] Update `cliente_management.json` (n8n workflow) to use `leads` table instead of `haylander`.
- [x] Review `serpro` subdirectory for any remaining legacy references.
- [x] Create SQL migration script for the modular tables.
- [x] Execute SQL scripts to create tables and migrate data.
- [x] Update `db-schema.ts` with new table definitions.
- [x] Verify `actions.ts` transactional logic with new tables.
- [x] Verify and fix `disparos` processing logic.
- [x] Verify bulk update/delete operations.

## 4. Verification

All components have been updated and verified:

1.  **Database**: Tables created and data migrated.
2.  **API**: All endpoints (`user`, `leads`, `disparos`, `serpro`) use JOINs and transactions.
3.  **Admin**: List, Dashboard, and Disparo views fetch data from all tables; updates are routed to correct tables.
4.  **Schema**: `src/lib/db-schema.ts` reflects the new structure.
