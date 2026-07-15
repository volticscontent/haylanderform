---
title: Arquitetura de Filas BullMQ
type: architecture
tags: [bullmq, redis, workers, queues, jobs]
updated: 2026-04-21
status: current
---

# Arquitetura de Filas — BullMQ + Redis

## Filas Registradas

| Fila | Arquivo | Concorrência | Rate Limit | Propósito |
|---|---|---|---|---|
| `message-sending` | `queues/message-queue.ts` | 5 | 20/1s | Envio sequencial WhatsApp |
| `follow-up` | `queues/message-queue.ts` | 3 | — | Nudges e lembretes (5min, 24h) |
| `message-debounce` | `queues/message-debounce.ts` | 5 | — | Debounce 1.5s + roteamento IA |
| `integra-pgmei` | `queues/integra/job-pgmei.ts` | 1 | — | Robô PGMEI (Serpro) |
| `integra-cnd` | `queues/integra/job-cnd.ts` | 1 | — | Robô CND (Serpro) |
| `integra-caixa-postal` | `queues/integra/job-caixa-postal.ts` | 1 | — | Robô Caixa Postal (Serpro) |

Todos inicializados em `src/index.ts` via `startXxxWorker()`.

## Padrão de Job: Integra Workers

```typescript
// Payload
{ execucaoId: number }

// Fluxo
1. Busca empresas ativas com serviço habilitado
2. Processa em lotes de 3 simultâneas (evitar throttle Serpro)
3. Delay 1500ms entre lotes
4. Salva resultado em integra_execucao_itens + integra_guias
5. Atualiza integra_execucoes (status, sucesso, falhas, duracao_ms)
6. Retry exponencial: 3x, backoff 5s
```

## Redis Keys (Debounce)

| Key | TTL | Uso |
|---|---|---|
| `msg_buffer:{phone}` | 120s | Buffer de mensagens pendentes (LIST) |
| `msg_meta:{phone}` | 120s | Metadata do buffer |
| `msg_lock:{phone}` | 180s | Lock distribuído por usuário |
| `msg_recheck:{phone}` | 60s | Flag para re-verificar após processamento |
| `msg_processed:{messageId}` | 1h | Deduplicação de mensagens |
| `last_activity:{phone}` | 24h | Timestamp última mensagem |
| `evolution:last_activity` | — | Para keep-alive do Evolution |
| `attendant_requested:{phone}` | — | Motivo da solicitação de atendente humano |
| `phone_lid:{phone}` | — | Mapa phone → LID (multi-chat Evolution) |
| `bot_context:{phone}` | 24h | Contexto injetado pelo frontend Admin |
| `agent_routing:{phone}` | 24h | Override de roteamento de agente |

## Debounce Flow (Lua Script)

```
Mensagem entra → bufferAndDebounce()
  ↓ Redis LPUSH msg_buffer:{phone}
  ↓ Check msg_lock:{phone}
  ↓ Se livre: agenda job no BullMQ com delay 1500ms
  ↓ Worker acorda, adquire lock
  ↓ Lua script: LRANGE + DEL atômico (flush)
  ↓ Concatena mensagens, detecta mídia
  ↓ resolveUserState() → escolhe agente
  ↓ Runner IA → resposta
  ↓ Enfileira em message-sending
  ↓ Verifica msg_recheck (mensagens que chegaram durante processamento)
```

## Disparos em Massa

Tabela `disparos` + `disparo_logs` para campanhas broadcast:

```sql
disparos: id, channel, instance_name, body, filters(JSONB), stats(JSONB),
          schedule_at, status (pending/processing/completed/failed)
disparo_logs: disparo_id, phone, status (pending/sent/failed/skipped)
```

Rota: `POST /api/admin/disparos` — cria disparo.
Worker processa fila, atualiza `disparo_logs` por phone.

## Cron Jobs Registrados

| Frequência | Job |
|---|---|
| `*/1 min` | Evolution API keep-alive |
| `*/30 min` | Follow-up leads inativos há 2h |
| `0 3 * * *` | Limpeza chat_history > 7 dias |
| `0 8 * * *` | Relatório diário → ATTENDANT_PHONE |
| `0 * * * *` | Scheduler integra: verifica `integra_robos` por dia+hora |
