---
title: Knowledge Base Index — Haylanderform
type: index
updated: 2026-04-20
---

# Knowledge Base — Índice Master

Ver [overview.md](overview.md) para visão geral da arquitetura.
Ver [log.md](log.md) para histórico de operações (Nossa referência de tempo linear).
Ver [tracking.canvas](tracking.canvas) para o Canvas visual de acompanhamento do que precisa ser documentado/construído.

---

## Architecture

| Página | Descrição |
|---|---|
| [bot.md](architecture/bot.md) | 3 agentes + roteador automático, crons, debounce |
| [frontend.md](architecture/frontend.md) | BFF pattern, rotas Next.js, auth, Socket.io |
| [queues.md](architecture/queues.md) | BullMQ queues, workers, Redis keys, disparos, cron jobs |

## Features

| Página | Descrição | Status |
|---|---|---|
| [apolo-audit.md](features/apolo-audit.md) | Auditoria completa do Bot Apolo (14 dimensões) | current |
| [integra-contador.md](features/integra-contador.md) | Módulo 4 — Integra Contador (robôs, guias, caixa postal) | current |
| [lead-management.md](features/lead-management.md) | Gestão de leads e ficha técnica unificada | current |
| [empresa-bot-registration.md](features/empresa-bot-registration.md) | Cadastro e Orquestração de Bot para Empresas (RAG, Automação) | planned |

## Integrations

| Página | Descrição |
|---|---|
| [serpro.md](integrations/serpro.md) | mTLS + OAuth, serviços, workers BullMQ, agendamento |
| [evolution-api.md](integrations/evolution-api.md) | WhatsApp webhook, LID, keep-alive, envio |
| [redis.md](integrations/redis.md) | Padrões de keys, debounce, bot context, locks |

## Security

| Página | Descrição |
|---|---|
| [serpro-certificates.md](security/serpro-certificates.md) | Certificado .pfx, OAuth, rotação, API secret |

## Workflows

| Página | Descrição |
|---|---|
| [lead-qualification.md](workflows/lead-qualification.md) | Regras MQL/desqualificado, tabelas alimentadas, atendimento vs reunião |

## Decisions (ADRs)

| Página | Decisão |
|---|---|
| [ADR-001-bff-pattern.md](decisions/ADR-001-bff-pattern.md) | Frontend como cliente leve (BFF) |
| [ADR-002-gpt4o-mini.md](decisions/ADR-002-gpt4o-mini.md) | gpt-4o-mini como modelo padrão |
| [ADR-0001-serpro-integra-bugs.md](decisions/ADR-0001-serpro-integra-bugs.md) | 6 bugs críticos Integra Contador (2026-04-22) |
| [ADR-0002-serpro-clients-interface.md](decisions/ADR-0002-serpro-clients-interface.md) | Redesign /serpro/clients para incluir leads com procuração (2026-04-22) |
| [ADR-0003-apolo-state-machine.md](decisions/ADR-0003-apolo-state-machine.md) | Refatoração Máquina de Estados (Apolo) para lazy verification |
| [ADR-0003-serpro-sitfis-pgmei-bugs.md](decisions/ADR-0003-serpro-sitfis-pgmei-bugs.md) | 4 bugs serpro.ts: anoCalendario, SITFIS sem CPF, aliases não documentados, erro CND obscuro (2026-04-23) |
| [ADR-0004-lead-sheet-unification.md](decisions/ADR-0004-lead-sheet-unification.md) | Unificação da Ficha de Lead e Arquitetura de Componentes Compartilhados |
| [ADR-0004-schema-integridade-dados.md](decisions/ADR-0004-schema-integridade-dados.md) | Audit + 3 migrations: cliente denorm, procuração historico, consultas lead_id; fix razao_social (2026-04-23) |

## Migrations (Audit Reports)

_Relatórios semanais aparecerão aqui conforme o consolidate automático rodar._
