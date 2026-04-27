---
title: Serpro × Apolo — Integração Completa de Tools
type: feature
tags: [serpro, apolo, bot, tools, cpf, sitfis, ccmei, cnd, caixa-postal]
created: 2026-04-26
updated: 2026-04-26
status: current
---

# Serpro × Apolo — Integração Completa de Tools

## Contexto

Antes de 2026-04-26, o Apolo tinha apenas `consultar_pgmei_serpro` (Camada 1) e uma `consultar_situacao_fiscal_serpro` quebrada (Camada 2) porque nunca passava CPF. Auditoria revelou que os serviços CPF-based do Serpro (`SIT_FISCAL_SOLICITAR`, `SIT_FISCAL_RELATORIO`, `CND`) precisam do CPF do *empresário*, não do CNPJ — e o bot não obtinha isso.

## Helpers Criados

### `resolveEmpresarioCpf(cnpj: string): Promise<string | null>`
**Arquivo:** `bot-backend/src/ai/agents/apolo/workflow-regularizacao.ts`

Chama `CCMEI_DADOS` via Serpro, faz parse do campo `dados` (JSON string aninhado) e extrai `empresario.cpf`. Retorna CPF limpo (só números) ou `null` se falhar.

```
CCMEI_DADOS response → envelope.dados (JSON string) → dados.empresario.cpf
```

### `extractSitfisProtocolo(envelope): string | undefined`
Tenta extrair o protocolo do SITFIS em múltiplos campos possíveis (o Serpro varia a chave por versão):
- `envelope.protocoloRelatorio`
- `envelope.nrProtocolo`
- `envelope.protocolo`
- `envelope.numProtocolo`
- Aninhado em `envelope.dados` (JSON string)

## Camada 1

| Tool | Função | Status |
|------|---------|--------|
| `consultar_pgmei_serpro` | PGMEI + PGFN_CONSULTAR em paralelo | ✅ Existia, mantido |

## Camada 2 — Tools Adicionadas

| Tool | Serviço Serpro | Requer CPF? | Status |
|------|----------------|-------------|--------|
| `consultar_ccmei_serpro` | `CCMEI_DADOS` | Não | ✅ Adicionado |
| `consultar_divida_ativa_serpro` | `DIVIDA_ATIVA` | Não | ✅ Existia |
| `consultar_situacao_fiscal_serpro` | `SIT_FISCAL_SOLICITAR` → `SIT_FISCAL_RELATORIO` | Auto (via CCMEI) | ✅ Corrigido |
| `consultar_cnd_serpro` | `SIT_FISCAL_SOLICITAR` → `CND` | Auto (via CCMEI) | ✅ Adicionado |
| `consultar_caixa_postal_serpro` | `CAIXA_POSTAL` | Não | ✅ Adicionado |

## Fluxo SITFIS (2 etapas)

```
1. resolveEmpresarioCpf(cnpj)   → CPF do empresário (auto-fetch via CCMEI_DADOS)
2. SIT_FISCAL_SOLICITAR + cpf   → { protocoloRelatorio: "..." }
3. await 4000ms                 → processamento Serpro
4. SIT_FISCAL_RELATORIO + cpf + protocoloRelatorio → relatório
```

O mesmo fluxo se aplica a `consultar_cnd_serpro` mas termina em `CND` ao invés de `SIT_FISCAL_RELATORIO`.

## Restrição de Procuração

Todas as tools de Camada 1 e 2 passam por `resolveUserCnpjAndProcuracaoStatus()` antes de consultar. Retorna `error_type: 'procuracao_obrigatoria'` se não houver procuração confirmada. Exceção: `iniciar_coleta_situacao_whatsapp` (Opção B) — não requer procuração.

## Armadilha: dados em JSON string aninhado

A resposta do Serpro para `CCMEI_DADOS` entrega o payload principal como uma *string* JSON dentro do campo `dados`, não como objeto direto. Sempre fazer:

```ts
const dadosRaw = envelope.dados;
const dados = typeof dadosRaw === 'string' ? JSON.parse(dadosRaw) : dadosRaw;
```

## Script de Teste

`bot-backend/src/scripts/test-serpro-apis.ts` — testa todos os 22 serviços via `http://127.0.0.1:3001/api/serpro`.

```bash
npx tsx src/scripts/test-serpro-apis.ts [CNPJ] [CPF]
```

Output: tabela padded com ✅/❌/⚠️ AVISO/⚠️ SKIP + timing + resumo.
