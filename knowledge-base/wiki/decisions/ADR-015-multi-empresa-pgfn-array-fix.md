---
name: ADR-015 — Multi-Empresa Relacional + Fix Parser PGFN (Mai/2026)
description: Migração de cnpjs_adicionais JSONB para tabela relacional lead_empresa, cnpj_ativo movido para Redis, e fix crítico de false-negative no parseSerproData para serviços PGFN/DIVIDA_ATIVA
type: decision
tags: [multi-empresa, lead_empresa, redis, serpro, pgfn, parseSerproData, false-negative]
date: 2026-05-09
status: accepted
---

# ADR-015 — Multi-Empresa Relacional + Fix Parser PGFN

## Contexto

Dois problemas identificados em sequência durante desenvolvimento:

1. **Schema `cnpjs_adicionais`** como `JSONB` em `leads` criava problemas de race condition, impossibilitava procuração por-empresa e não escalava para clientes com múltiplos CNPJs (proprietário, sócio, representante).

2. **`parseSerproData` retornava `INCONCLUSIVO`** para todos os serviços `PGFN_CONSULTAR` e `DIVIDA_ATIVA` (v2.4). Descoberto via `test-serpro-pgfn.ts`. Dois cenários falhavam:
   - `dados` como array vazio `[]` + mensagem código `25001` ("Não há débitos") → deveria retornar `false`
   - `dados` como array não-vazio `[{situacaoDebito: "ENVIADO A PFN"}]` → deveria retornar `true`

---

## Decisões

### 1. Tabela relacional `lead_empresa`

**Schema:**
```sql
CREATE TABLE lead_empresa (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    cnpj VARCHAR(18) NOT NULL,
    tipo_vinculo VARCHAR(20) NOT NULL DEFAULT 'proprietario'
                CHECK (tipo_vinculo IN ('proprietario', 'socio', 'representante')),
    razao_social VARCHAR(255),
    procuracao BOOLEAN DEFAULT FALSE,
    procuracao_ativa BOOLEAN DEFAULT FALSE,
    procuracao_validade DATE,
    tem_divida BOOLEAN,
    valor_divida_pgfn NUMERIC(12,2),
    ...
    UNIQUE (lead_id, cnpj)
);
```

**Por quê:** Relação 1:N adequada, permite campos de procuração por-empresa, indexável por `cnpj`, sem race conditions de update JSONB concorrente.

**Migração:** `016_lead_empresa.sql` — copia dados de `leads.cnpjs_adicionais` (ambos os formatos: `string[]` e `{cnpj,tipo}[]`), depois dropa coluna.

### 2. `cnpj_ativo` → Redis (`session:cnpj_ativo:{leadId}`, TTL 24h)

**Por quê:** `cnpj_ativo` é estado de sessão, não dado permanente. Mover para Redis elimina writes desnecessários no DB e evita conflitos entre sessões paralelas do mesmo lead.

**Implementação:** Em `server-tools.ts`, `update_user({ cnpj_ativo: X })` → `redis.set(key, X, 'EX', 86400)`. Se `cnpj_ativo = ''` → `redis.del(key)`.

### 3. Fix `parseSerproData` — array handling + mensagens semafóricas

**Antes:** Tratava `dados` como `string | object`. Serviços PGFN v2.4 retornam `dados` como **array** `[{periodoApuracao, tributo, valor, situacaoDebito}]`.

**Depois:**
- Se `Array.isArray(dados)` e não-vazio → varre `situacaoDebito` em cada item. `"ENVIADO A PFN"` → `true`.
- Se array vazio → lê `mensagens_serpro`. Código `25001` ou texto "Não há débitos" → `false`.
- Fallback geral quando `!dados` → também lê mensagens antes de retornar `null`.

---

## Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/db/migrations/016_lead_empresa.sql` | Nova tabela + migração de dados |
| `bot-backend/src/ai/server-tools.ts` | `cnpj_adicionar` → INSERT `lead_empresa`; `cnpj_ativo` → Redis |
| `bot-backend/src/ai/agents/apolo/workflow-regularizacao.ts` | `resolveUserCnpjAndProcuracaoStatus` lê Redis; `parseSerproData` exportado + fix array |
| `bot-backend/src/routes/leads.ts` | JOIN via subquery `lead_empresa` → campo `empresas` |
| `src/types/lead.ts` | Remove `cnpjs_adicionais`/`cnpj_ativo`; adiciona `empresas` tipado |
| `src/app/(admin)/lista/page.tsx` | `getData()` → `backendGet('/api/leads/list')` |
| `src/app/api/leads/by-phone/route.ts` | Proxy → backend |
| `src/app/api/leads/update-meeting/route.ts` | Proxy → backend |

---

**Why:** Escalabilidade multi-empresa + zero false-negatives no detector de dívida PGFN.
**How to apply:** Rodar migration `016_lead_empresa.sql` antes de deploy.
