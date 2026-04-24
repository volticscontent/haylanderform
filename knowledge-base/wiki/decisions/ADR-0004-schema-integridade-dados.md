---
title: "ADR-0004 — Auditoria de Integridade de Schema: cliente × empresa × lead × cnpj × razao_social"
type: decision
tags: [schema, integridade, migrations, denormalization, audit-trail]
created: 2026-04-23
status: accepted
---

# ADR-0004 — Auditoria de Integridade de Schema

## Contexto

Audit completo solicitado para entender como `cliente`, `empresa`, `cnpj`, `razao_social` e `nome_completo` se correlacionam entre tabelas e rotas. O objetivo era identificar falhas de integridade antes de expandir o módulo Integra Contador.

## Diagrama de Correlação (pré-fix)

```
leads               leads_processo          integra_empresas
  id ←───────────── lead_id (FK)              lead_id (FK nullable)
  cnpj                procuracao              cnpj (text solto)
  nome_completo        procuracao_ativa       razao_social ← BUG: vinha de nome_completo
  razao_social (null)  procuracao_validade    regime
  cliente (ausente)    cliente (bool)
                                              ↕ sem sync
consultas_serpro
  cnpj (text solto)   ← sem FK para leads
  lead_id (ausente)
```

## 6 Problemas Identificados

| # | Problema | Severidade | Ação |
|---|---|---|---|
| 1 | `leads.cliente` não existia — obrigava JOIN para saber se é cliente | Médio | Migration 012 |
| 2 | Procuração sem audit trail — 3 booleans, sem histórico de quando/quem ativou | Alto | Migration 013 |
| 3 | `consultas_serpro` sem `lead_id` — consultas orphan, sem rastreabilidade | Médio | Migration 014 |
| 4 | `saveConsultation` não recebia `leadId` — nunca preencheria coluna nova | Alto | App: serpro-db.ts |
| 5 | `POST /serpro` não resolvia lead por CNPJ antes de salvar consulta | Alto | App: serpro-api.ts |
| 6 | `razao_social` na importação vinha de `nome_completo` (nome pessoal ≠ razão social) | Alto | App: empresas.ts + actions.ts |

## Decisões e Implementações

### Migration 012 — `leads.cliente` denormalizado

**Problema:** Toda query que precisava saber "este lead é cliente?" exigia JOIN com `leads_processo`.

**Decisão:** Adicionar coluna `leads.cliente BOOLEAN DEFAULT FALSE` + trigger que sincroniza automaticamente quando `leads_processo.cliente` muda.

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cliente BOOLEAN DEFAULT FALSE;
-- Trigger: fn_sync_cliente_to_leads → trg_sync_cliente_leads
-- Fonte de verdade permanece leads_processo.cliente
```

**Trade-off:** Denormalização controlada — risco de dessincronização mitigado pelo trigger. Aceito porque o JOIN custava 100% das queries de lista de leads.

**Arquivo:** `src/lib/db/migrations/012_cliente_denorm_leads.sql`

---

### Migration 013 — `leads_procuracao_historico`

**Problema:** Ativar/desativar procuração sobrescrevia os 3 booleans sem deixar rastro. Impossível saber: quando foi ativada, quem ativou, quantas vezes foi reativada.

**Decisão:** Nova tabela append-only `leads_procuracao_historico` com seed do estado atual.

```sql
CREATE TABLE leads_procuracao_historico (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    ativo BOOLEAN NOT NULL,
    validade DATE,
    protocolo VARCHAR(100),   -- para futura integração com Serpro
    operador VARCHAR(100),    -- atendente_id quando disponível
    origem VARCHAR(20) DEFAULT 'admin',  -- admin | bot | migration
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Seed:** Registra estado atual de todos os leads com procuração como evento `origem='migration'`.

**Integração app:** `PUT /serpro/procuracao/:leadId` agora insere registro após cada toggle.

**Arquivo:** `src/lib/db/migrations/013_procuracao_historico.sql`

---

### Migration 014 — `consultas_serpro.lead_id`

**Problema:** `consultas_serpro` armazenava apenas `cnpj` como texto livre — sem FK para `leads`. Impossível saber qual lead originou qual consulta sem runtime REGEXP_REPLACE.

**Decisão:** Adicionar `lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL` + backfill automático por match de CNPJ normalizado.

```sql
ALTER TABLE consultas_serpro
    ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL;

-- Backfill: DISTINCT ON para evitar ambiguidade (múltiplos leads por CNPJ = dados ruins)
UPDATE consultas_serpro cs SET lead_id = sub.lead_id
FROM (
    SELECT DISTINCT ON (REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g'))
        id AS lead_id, REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g') AS cnpj_clean
    FROM leads WHERE cnpj IS NOT NULL
    ORDER BY REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g'), id ASC
) sub WHERE cs.cnpj = sub.cnpj_clean AND cs.lead_id IS NULL;
```

**Nullable intencional:** Consultas órfãs (CNPJs sem cadastro) mantêm `lead_id = NULL` — preserva dados existentes.

**Arquivo:** `src/lib/db/migrations/014_consultas_lead_id.sql`

---

### App: `saveConsultation` + `leadId`

**Problema:** Mesmo com a coluna `lead_id` na tabela, a função nunca passaria o valor pois a assinatura não aceitava `leadId`.

**Fix:** `serpro-db.ts` — adicionado parâmetro `leadId?: number | null` e incluído na query INSERT.

**Fix:** `serpro-api.ts POST /serpro` — adicionado lookup `SELECT id FROM leads WHERE REGEXP_REPLACE(cnpj,...) = $1 LIMIT 1` antes de `saveConsultation`.

---

### App: `razao_social` — fonte de verdade

**Problema:** `importarLeadComoEmpresa` usava `lead.nome_completo` como `razao_social` da empresa — nome pessoal (ex: "João Silva") sendo salvo como razão social fiscal.

**Decisão:** Hierarquia de fonte:
1. `leads.razao_social` (fiscal, quando preenchida)
2. Fallback para `leads.nome_completo` apenas se `razao_social` null

**Propagação bidirecional:**
- `POST /integra/empresas` com `lead_id`: lookup `leads.razao_social` → se lead não tem razão social, sincroniza de volta com `COALESCE(razao_social, $1)` (sem sobrescrever)
- `PATCH /integra/empresas/:id`: quando `razao_social` atualizada e empresa tem `lead_id`, sincroniza para `leads.razao_social`

**`integra_empresas` é a fonte de verdade fiscal**. `leads.razao_social` é espelho para conveniência (evitar JOIN em listas).

---

### Decisão Não-Tomada: `integra_empresas.lead_id NOT NULL`

**Considerada:** Tornar `integra_empresas.lead_id` obrigatório (NOT NULL) para forçar vínculo.

**Rejeitada:** Quebraria registros existentes sem `lead_id`. Empresas podem ser importadas sem lead cadastrado previamente. Constraint deveria ser aplicada na criação futura via validação de aplicação, não DB constraint retroativa.

## Estado Pós-Fix

```
leads
  id ←───────────── leads_processo.lead_id (FK)
  cnpj                  cliente (bool) ──sync──→ leads.cliente (trigger)
  nome_completo          procuracao_ativa ──log──→ leads_procuracao_historico
  razao_social ←─sync─── integra_empresas.razao_social (quando lead_id presente)
  cliente (bool, denorm)

consultas_serpro
  cnpj (text normalizado)
  lead_id (FK nullable) ←── resolvido em serpro-api.ts POST /serpro
```

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/lib/db/migrations/012_cliente_denorm_leads.sql` | NOVO |
| `src/lib/db/migrations/013_procuracao_historico.sql` | NOVO |
| `src/lib/db/migrations/014_consultas_lead_id.sql` | NOVO |
| `bot-backend/src/lib/serpro-db.ts` | `saveConsultation` + `leadId` param |
| `bot-backend/src/routes/serpro-api.ts` | POST resolve `lead_id`; PUT loga historico |
| `bot-backend/src/routes/integra/empresas.ts` | POST/PATCH sync `razao_social` |
| `src/app/(admin)/serpro/integra/empresas/actions.ts` | Tipo `LeadParaImportar.razao_social` |
| `src/app/(admin)/serpro/integra/empresas/EmpresasClient.tsx` | Import usa `razao_social` primeiro |
