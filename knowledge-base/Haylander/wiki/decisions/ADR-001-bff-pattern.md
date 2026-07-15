---
title: "ADR-001: BFF Pattern — Frontend como cliente leve"
type: decision
tags: [bff, frontend, arquitetura]
created: 2026-04-20
status: accepted
---

# ADR-001: BFF Pattern

## Decisão

O frontend Next.js não acessa diretamente PostgreSQL, Redis nem Serpro. Toda lógica de negócio reside no `bot-backend` Express. O frontend faz proxy via `backendGet/backendPost` (Server Actions).

## Motivação

- Libs pesadas (`pg`, `ioredis`, `node-forge`) foram removidas do `package.json` principal em MÓDULO 1.
- Rotas `src/app/api/` antigas (quando existiam) eram proxies frágeis sem tratamento de erro adequado.
- Bot-backend já tem toda infraestrutura (Redis, pool PG, Serpro) — faz sentido centralizar.

## Consequências

✅ Frontend deployável em Vercel/edge sem dependências nativas.
✅ Lógica de negócio testável isoladamente no backend.
✅ Uma única fonte de verdade para dados.
⚠️ Latência extra de uma request HTTP (localhost, negligível em prod).
