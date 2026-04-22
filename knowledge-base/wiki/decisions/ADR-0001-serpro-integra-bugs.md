---
title: ADR-0001 — Correção de Bugs Críticos no Módulo Integra Contador
type: decision
date: 2026-04-22
status: implemented
---

# ADR-0001 — Correção de Bugs Críticos no Módulo Integra Contador

## Contexto

Após a implementação inicial do Módulo 4 (Integra Contador), foram identificados 6 bugs que impediam o funcionamento das funções Serpro.

## Bugs Corrigidos

### 1. Caixa Postal Worker — chave de serviço errada (Crítico)
- **Arquivo:** `src/queues/integra/job-caixa-postal.ts:22`
- **Problema:** `consultarServico('CAIXAPOSTAL', ...)` — chave inexistente no SERVICE_CONFIG
- **Correção:** `consultarServico('CAIXA_POSTAL', ...)` (com underscore)
- **Impacto:** Worker falhava imediato em 100% dos jobs

### 2. CND Worker — fluxo de 2 passos ausente (Crítico)
- **Arquivo:** `src/queues/integra/job-cnd.ts`
- **Problema:** `consultarServico('CND', cnpj)` sem `protocoloRelatorio` sempre lança erro em `serpro.ts:326`
- **Correção:** Implementado fluxo `SIT_FISCAL_SOLICITAR` → extrair protocolo → `CND(protocoloRelatorio)`
- **Detalhe:** Função `extractProtocolo()` tenta campos: `nrProtocolo`, `protocolo`, `numProtocolo`, `protocoloRelatorio`, `numeroProtocolo`, e dentro de `dados` (JSON string)

### 3. consultar_situacao_fiscal_serpro — serviço inválido (Crítico)
- **Arquivo:** `src/ai/agents/apolo/workflow-regularizacao.ts:197`
- **Problema:** `checkCnpjSerpro(gate.cnpj, 'SIT_FISCAL')` — serviço `SIT_FISCAL` não existe no SERVICE_CONFIG
- **Correção:** Implementado fluxo 2 passos: `SIT_FISCAL_SOLICITAR` → extrair protocolo → `SIT_FISCAL_RELATORIO`

### 4. PGMEI Worker — código morto de guias (Moderado)
- **Arquivo:** `src/queues/integra/job-pgmei.ts`
- **Problema:** Worker tentava extrair `valorPrincipal`/`valor`/`codigoBarras` da resposta de `DIVIDAATIVA24`, que não retorna esses campos. Guias nunca eram persistidas.
- **Correção:** Removido o bloco de persistência de guias do worker PGMEI. O serviço `DIVIDAATIVA24` é para consulta de dívida ativa, não geração de DAS. Para guias DAS, usar `PGMEI_EXTRATO` (GERARDASPDF21).
- **Pendência:** Implementar job separado para geração de guias DAS via `PGMEI_EXTRATO` se necessário.

### 5. Rotas sem try-catch (Menor)
- **Arquivos:** `src/routes/integra/empresas.ts`, `src/routes/integra/robos.ts`
- **Problema:** Handlers async sem try-catch causam unhandled promise rejections em erros de DB
- **Correção:** Adicionado try-catch em todos os handlers

### 6. robos.ts — coluna `id` inexistente em integra_robos (Menor)
- **Arquivo:** `src/routes/integra/robos.ts:64`
- **Problema:** `SELECT id FROM integra_robos` — tabela usa `tipo_robo` como PK, não `id`
- **Correção:** `SELECT tipo_robo FROM integra_robos`

## Decisões de Design

### CND é sempre 2 passos
A emissão de CND via Integra Contador requer:
1. `SOLICITARPROTOCOLO91` (sistema SITFIS) → retorna protocolo
2. `RELATORIOSITFIS92` (sistema SITFIS, com `protocoloRelatorio`) → emite CND

O protocolo vem no campo `nrProtocolo` (ou variações) da resposta do passo 1.

### PGMEI ≠ Geração de DAS
O serviço `DIVIDAATIVA24` (configurado como `PGMEI`) consulta débitos em dívida ativa, não gera boletos. Para geração de guias:
- PDF: `PGMEI_EXTRATO` (GERARDASPDF21) — requer `periodoApuracao` em YYYYMM
- Código de barras: `PGMEI_BOLETO` (GERARDASCODBARRA22)

## Referências
- `src/lib/serpro-config.ts` — configuração de todos os serviços
- `src/lib/serpro.ts:325` — validação de protocolo para CND/SITFIS
- `src/queues/integra/` — todos os workers BullMQ
