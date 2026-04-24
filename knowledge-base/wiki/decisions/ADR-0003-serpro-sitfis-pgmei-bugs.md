---
name: ADR-0003 — Bugs serpro.ts/serpro-config.ts (2026-04-23)
description: 4 bugs silenciosos nas APIs Serpro que causavam falha em quase todos os serviços
type: decision
date: 2026-04-23
status: resolved
---

# ADR-0003 — Bugs serpro.ts + serpro-config.ts

## Contexto

Diagnóstico disparado por CNPJ de teste (`14511139000104`) em que quase todas as chamadas Serpro retornavam erro. Análise revelou 4 bugs de código, independentes do CNPJ específico.

## Bugs Encontrados e Corrigidos

### Bug 1 — `anoCalendario` ausente para PGMEI_EXTRATO / PGMEI_BOLETO / PGMEI_ATU_BENEFICIO

**Arquivo:** `serpro.ts:259`

A lista do `else if` externo não incluía esses 3 serviços. O `inner else if` os tinha, mas nunca era atingido porque o outer guard os bloqueava. Resultado: chamadas sem `options.ano` enviavam `dados: {}` sem `anoCalendario` → erro 400 Serpro.

**Fix:** Adicionados à lista do outer `else if`; inner logic simplificado (DCTFWEB → `anoPA`, demais → `anoCalendario`).

### Bug 2 — SITFIS enviava CNPJ como contribuinte sem CPF

**Arquivo:** `serpro.ts:315-316`

`SIT_FISCAL_SOLICITAR`, `SIT_FISCAL_RELATORIO` e `CND` são CPF-based no Integra Contador. Quando `options.cpf` não era fornecido, o código silenciosamente usava o CNPJ como `contribuinte.numero` com `tipo: 2 (CNPJ)` — payload inválido para a Serpro.

**Fix:** Throw explícito antes do payload ser montado:
```typescript
if (isSitfis && !cpfNumero) throw new Error(`${nomeServico} requer options.cpf (CPF do empresário — SITFIS é CPF-based)`);
```

### Bug 3 — DIVIDA_ATIVA e PGFN_CONSULTAR são aliases não documentados de PGMEI

**Arquivo:** `serpro-config.ts`

Ambos usam `default_sistema: 'PGMEI'` e `default_servico: 'DIVIDAATIVA24'` — idênticos ao serviço `PGMEI`. Sem override de env vars, as 3 entradas chamam o mesmo endpoint Serpro.

**Diferenças reais:**
- `PGMEI`: `versaoSistema: '2.4'`, usado pelo bot/workers
- `DIVIDA_ATIVA`: `versaoSistema: '2.4'`, alias com env vars separadas
- `PGFN_CONSULTAR`: `versaoSistema: '1.0'` (default), sem `versaoSistema` explícita

**Fix:** Comentários adicionados explicando o propósito como alias com env vars separadas.

**Why:** Mantidos porque `PGFN_CONSULTAR` é usado em `server-tools.ts:599` e `workflow-regularizacao.ts:108`; `DIVIDA_ATIVA` em `workflow-regularizacao.ts:187`. Remover quebraria o bot.

### Bug 4 — Mensagem de erro CND obscura

**Arquivo:** `serpro.ts:325`

Quando `CND` era chamado sem `protocoloRelatorio`, o erro dizia apenas `"SIT_FISCAL_RELATORIO exige options.protocoloRelatorio"` — não explicava o fluxo obrigatório de 2 etapas.

**Fix:** Mensagem reescrita para deixar claro o fluxo:
```
CND requer options.protocoloRelatorio — fluxo obrigatório 2 etapas:
1) SIT_FISCAL_SOLICITAR → obtém protocolo
2) CND com o protocolo retornado
```

## Causa Raiz mais Provável para "quase todas as APIs falhando"

Além dos bugs de código, a causa mais comum de falha ampla em APIs Serpro para um CNPJ específico é **ausência de procuração ativa**. O Integra Contador exige procuração eletrônica para a maioria dos serviços fiscais. O sistema não valida procuração antes de chamar — só descobre no erro de resposta.

**Checklist quando APIs falham em massa para um CNPJ:**
1. Verificar se procuração está ativa (`PROCURACAO` service ou campo `procuracao_ativa` em `leads_processo`)
2. Verificar se o CNPJ ainda é MEI (serviços MEI-específicos falham para não-MEI)
3. Verificar validade do certificado `.pfx`
4. Verificar `CONTRATANTE_CNPJ` env var

## How to Apply

- Sempre passar `options.cpf` ao chamar `SIT_FISCAL_SOLICITAR`, `SIT_FISCAL_RELATORIO` ou `CND`
- Sempre chamar `SIT_FISCAL_SOLICITAR` antes de `CND`/`SIT_FISCAL_RELATORIO` para obter o protocolo
- Para emitir DAS PGMEI_EXTRATO/PGMEI_BOLETO, passar `options.ano` e `options.mes` explicitamente
