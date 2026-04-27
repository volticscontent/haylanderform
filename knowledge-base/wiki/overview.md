---
title: Overview — Haylanderform
type: overview
updated: 2026-04-20
---

# Haylanderform — Visão Geral da Arquitetura

**CRM/ERP + Automação WhatsApp para contabilidade de MEIs.**

---

## Stack

| Camada | Tech |
|---|---|
| Frontend Admin | Next.js App Router (BFF pattern — proxies para backend) |
| Bot Backend | Node.js, Express, BullMQ, Baileys/Evolution API |
| Banco de Dados | PostgreSQL (pool.query, parametrizado) |
| Cache/State | Redis (histórico, locks, debounce, routing override, bot context) |
| IA | OpenAI `gpt-4o-mini` (default), suporte a tools/function calling |
| Storage | R2 (PDFs de guias Serpro) |
| Real-time | Socket.io (`haylander-bot-events`) |

---

## Módulos — Status

| Módulo | Status | Documento Guia |
|---|---|---|
| MÓDULO 1: Frontend + API Architecture | ✅ Concluído + commitado | `docs/plan.master.frontend.md` |
| MÓDULO 2: Fluxo Bot + Auditoria Base | ✅ Concluído + commitado | `docs/plan.master.bot.md` |
| MÓDULO 3: Segurança Serpro + DART | ✅ Concluído + commitado | `docs/plan.master.serpro.md` |
| MÓDULO 4: Integra Contador | ⚠️ Código escrito, **não commitado, não validado** | `docs/plan.master.integra.md` |

---

## Bot Apolo — Status Atual

**100% operacional.** Ver [features/apolo-audit.md](features/apolo-audit.md) para auditoria completa.

- 3 agentes (Apolo SDR, Vendedor Icaró, Atendente) + roteador automático por estado do lead
- Serpro integrado com restrição de procuração obrigatória (camadas 1 e 2)
- 22+ ferramentas implementadas
- ✅ Gap 1 resolvido: `POST /api/bot/context-update` — frontend injeta contexto via Redis
- ✅ Gap 2 resolvido: Diferenciação atendimento vs reunião em `COMERCIAL_RULES`
- ✅ 2026-04-26: Camada 2 Serpro completa — 5 tools, CPF auto-resolution via CCMEI_DADOS
- ✅ 2026-04-26: Jornada comercial corrigida — Opção B in-chat, sem formulário externo, reunião proativa
- ✅ 2026-04-26: Duplicate tools (`update_user`, `interpreter`) removidos de `workflow-comercial.ts`

---

## Integra Contador — Status Real (auditado 2026-04-21)

⚠️ **Todos os arquivos do MÓDULO 4 são `??` no git (nunca commitados).** TSC passa, mas fluxo ponta-a-ponta não foi validado.

| Componente | Código | Commitado | Validado |
|---|---|---|---|
| Migration SQL `integra_*` | ✅ | ❓ | ❓ |
| CRUD empresas (`/routes/integra/empresas.ts`) | ✅ | ❓ bot-submodule | ❓ |
| Workers BullMQ (PGMEI, CND, Caixa Postal) | ✅ | ❓ bot-submodule | ❓ |
| Cron scheduler `integra_robos` | ✅ | ❓ bot-submodule | ❓ |
| Páginas frontend `/integra/*` (6 páginas) | ✅ | ❌ untracked | ❌ |
| `actions.ts` BFF proxy | ✅ | ❌ untracked | ❌ |
| Billing Tracker `/integra/billing` | ✅ | ❌ untracked | ❌ |
| Download PDF R2 | ✅ | ❌ untracked | ❌ |

**Outros arquivos não commitados (M ou ??):** configuracoes, dashboard, lista, reuniao, serpro pages + chat components + AdminSidebar.

---

## Integrações Ativas

- **Serpro Integra Contador** — PGMEI, PGFN, CND, Caixa Postal (via certificado .pfx mTLS)
- **Evolution API** — WhatsApp webhook, envio de mensagens/mídia
- **PostgreSQL** — leads, leads_processo, leads_recurso, chat_history, leads_serpro_consulta, integra_*
- **Redis** — cache, locks distribuídos, debounce Lua scripts, routing override, bot context, chat history
- **BullMQ** — message queue, follow-up queue, debounce queue, integra jobs (pgmei, cnd, caixa-postal)
- **Socket.io** — real-time updates frontend (`haylander-bot-events`)

---

## Estrutura de Diretórios

```
haylanderform/
├── src/                        ← Frontend Next.js
│   ├── app/(admin)/            ← Páginas admin (Auth + Layout)
│   │   ├── dashboard/
│   │   ├── atendimento/        ← Chat WhatsApp
│   │   ├── lista/              ← LeadList
│   │   ├── reuniao/            ← Agenda de reuniões
│   │   ├── serpro/             ← Consultas Serpro
│   │   └── integra/            ← Integra Contador (MÓDULO 4)
│   ├── components/             ← UI components
│   └── lib/                    ← backend-proxy, auth helpers
├── bot-backend/src/            ← Node.js Backend
│   ├── ai/agents/              ← Apolo, Vendedor, Atendente + shared-agent
│   ├── routes/                 ← Express routes
│   ├── queues/                 ← BullMQ workers
│   ├── lib/                    ← serpro, evolution, redis, db, socket-server
│   └── cron/                   ← node-cron jobs
└── knowledge-base/wiki/        ← Esta wiki
```

---

Última atualização: 2026-04-26
Ver [log.md](log.md) para histórico completo de operações.
