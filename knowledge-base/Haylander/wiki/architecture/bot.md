---
title: Arquitetura do Bot — 3 Agentes + Roteador
type: architecture
tags: [bot, apolo, roteador, bullmq, debounce]
updated: 2026-04-20
status: current
---

# Arquitetura do Bot

## Fluxo de Entrada

```
WhatsApp → Evolution API Webhook (POST /api/webhook/whatsapp)
              ↓
         Message Processor
              ↓
         Debounce Queue (BullMQ + Lua script Redis, 1.5s)
              ↓
         message-debounce.ts → resolveUserState()
              ↓
         AGENT_MAP[userState] → runner()
              ↓
         OpenAI gpt-4o-mini + tools
              ↓
         Resposta via Evolution API
```

## Roteador — `resolveUserState()`

**Arquivo:** `bot-backend/src/queues/message-debounce.ts`

```
Estado DB                    → Agente
────────────────────────────────────────
lead (padrão)                → runApoloAgent (SDR)
qualificacao = MQL | SQL     → runVendedorAgent (Icaró)
cliente = true               → runAtendenteAgent
status_atendimento = humano  → null (humano direto)
Redis override               → qualquer agente (24h TTL)
```

Override manual via: `setAgentRouting(phone, 'vendedor'|'atendente'|null)`

## Os 3 Agentes

### 1. Apolo SDR (`runApoloAgent`)
**Arquivo:** `bot-backend/src/ai/agents/apolo/`
- **Missão:** Qualificar leads (não vender) e extrair dados progressivamente
- **Prompt:** `BASE_PROMPT + COMERCIAL_RULES + REGULARIZACAO_RULES + SUPORTE_RULES`
- **Ferramentas:** 20+ (update_user, enviar_lista_enumerada, iniciar_fluxo_regularizacao, consultar_pgmei_serpro...)
- **Transição:** Ao chamar `update_user(qualificacao: "MQL")` → `setAgentRouting(phone, 'vendedor')` automático
- **Lazy Verification:** O bot não bloqueia a conversa ao pedir procuração. Ele coleta dados da empresa enquanto a validação no e-CAC ocorre (ver [ADR-0003](../decisions/ADR-0003-apolo-state-machine.md)).

### 2. Vendedor Icaró (`runVendedorAgent`)
- **Missão:** Fechar venda, negociar contrato
- **Ativado quando:** `qualificacao = MQL | SQL`

### 3. Atendente (`runAtendenteAgent`)
- **Missão:** Suporte pós-venda
- **Ativado quando:** `cliente = true`

## Deduplicação

Lua script no Redis garante que a mesma mensagem processada 2x é ignorada na segunda.
Locks distribuídos por `userPhone` evitam race conditions em múltiplos workers.

## Contexto do Agente — `prepareAgentContext()`

**Arquivo:** `bot-backend/src/ai/shared-agent.ts`

Carregado antes de cada invocação:
1. `USER_DATA` — campos selecionados do DB (telefone, nome, qualificação, dívida...)
2. `DYNAMIC_CONTEXT` — `getDynamicContext()` (knowledge base Redis/DB) + `bot_context:{phone}` (contexto injetado pelo frontend)
3. `ATTENDANT_WARNING` — se atendente foi solicitado
4. `OUT_OF_HOURS_WARNING` — se fora do horário comercial
5. Chat history — últimas 15 mensagens

## Cron Jobs

**Arquivo:** `bot-backend/src/cron/index.ts`

| Job | Frequência | Função |
|---|---|---|
| Follow-up inatividade | */30 min | Leads sem resposta há 2h |
| Limpeza Redis | Diário 3h | Remove chat_history > 7 dias |
| Relatório diário | Diário 8h | Envia resumo para ATTENDANT_PHONE |
| Evolution keep-alive | */1 min | Reconecta se inativo > 2min |
| **Integra robôs** | */1h :00 | Dispara workers conforme `integra_robos` DB |
