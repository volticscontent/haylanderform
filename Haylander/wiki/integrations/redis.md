---
title: Redis — Padrões de Uso
type: integration
tags: [redis, cache, bullmq, locks, debounce]
updated: 2026-04-20
status: current
---

# Redis — Padrões de Uso

**Arquivo:** `bot-backend/src/lib/redis.ts`

Duas conexões distintas:
- `redis` (default export) — cache geral, pub/sub, operações síncronas
- `createRedisConnection()` — exclusivo para BullMQ workers (não bloqueia)

## Keys Utilizadas

| Key Pattern | TTL | Uso |
|---|---|---|
| `chat_history:{phone}` | 7 dias (DB) | Histórico de chat (15 msgs por contexto) |
| `agent_routing:{phone}` | 24h | Override manual de agente |
| `bot_context:{phone}` | 24h | Contexto injetado pelo frontend admin |
| `bot_lock:{phone}` | Auto | Lock distribuído por usuário (evita race) |
| `debounce:{phone}` | 1.5s | Debounce de mensagens (Lua script) |
| `lid:{lid}` | Permanente | Mapa LID → telefone normalizado |
| `evolution:last_activity` | Permanente | Timestamp última atividade WhatsApp |
| `dynamic_context` | — | Knowledge base do bot (contexto dinâmico) |

## Padrão Bot Context (Frontend → Bot)

```
Frontend Admin (Server Action)
    ↓ POST /api/bot/context-update { userPhone, context: {...} }
    ↓
Redis SET bot_context:{phone} EX 86400
    ↓
prepareAgentContext() carrega e injeta em {{DYNAMIC_CONTEXT}}
    ↓
Agente vê contexto na próxima mensagem do cliente
```

## Debounce (Lua Script)

Garante que múltiplas mensagens rápidas do usuário sejam agrupadas em 1 processamento.
Usa Lua atomicamente para evitar race conditions entre workers.
