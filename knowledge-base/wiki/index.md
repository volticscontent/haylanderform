---
name: Índice Master — Haylanderform Knowledge Base
description: Catálogo central de toda a documentação viva do projeto
type: index
updated: 2026-07-15
---

# Haylanderform — Knowledge Base

Projeto: CRM/ERP + Automação WhatsApp para contabilidade de MEIs.
Stack: Next.js (frontend admin) + Node.js/Express (bot-backend) + Evolution API + BullMQ + PostgreSQL + Cloudflare R2.

---

## Visão Geral

- [Síntese da Arquitetura](overview.md)
- [Canvas de Acompanhamento (Kanban)](tracking.md)
- [Log Operacional](log.md)

---

## Arquitetura

- [Frontend Admin (BFF Pattern)](architecture/frontend.md)
- [Bot Backend (Agente Apolo + Workers)](architecture/bot.md)
- [Filas BullMQ](architecture/queues.md)

---

## Agente Apolo

- [Auditoria e Estrutura do Agente](features/apolo-audit.md)
- [Fluxo Comercial (SDR → Closer)](workflows/apolo-comercial.md)
- [Fluxo de Qualificação de Leads](workflows/lead-qualification.md)
- [Jornada Comercial WhatsApp](features/commercial-journey-whatsapp.md)
- [Sistema de Red-Flags](features/red-flags.md)
- [Cron Pós-Reunião](features/cron-pos-reuniao.md)

---

## Módulo Integra Contador

- [Integra Contador (Plataforma)](features/integra-contador.md)
- [Cadastro Automático de Empresas (RAG)](features/empresa-bot-registration.md)

---

## Serviços e Leads

- [Catálogo de Serviços](features/servicos.md)
- [Gestão de Leads](features/lead-management.md)
- [Serviço CNPJ API](features/cnpj-api-service.md)

---

## Integrações

- [Serpro (Integra Contador)](integrations/serpro.md)
- [Auditoria Serpro 2026-05-29](integrations/serpro-audit-2026-05-29.md) — status real das 23 APIs + mensagens DASN-SIMEI
- [Evolution API (WhatsApp)](integrations/evolution-api.md)
- [BrasilAPI / CNPJ Público](integrations/brasil-api.md)
- [Redis (Cache + Sessão)](integrations/redis.md)

---

## Segurança

- [Certificados Serpro (.pfx)](security/serpro-certificates.md)
- [Procuração e-CAC](security/procuracao-ecac.md)

---

## Integração Serpro no Apolo

- [Apolo + Serpro (Camadas 1 e 2)](features/serpro-apolo-integration.md)

---

## Métricas

- [Benchmarks do Agente Apolo](metrics/apolo-benchmarks.md)

---

## Comunicação / Relatórios para Stakeholders

- [Catálogo APIs Serpro — O que usamos vs o que existe](communication/serpro-apis-catalogo-completo.md)

---

## Decisões Arquiteturais (ADRs)

> Série única sequencial. ADR-001 = mais antigo, ADR-014 = mais recente.

| # | Título | Data | Status |
|---|---|---|---|
| [ADR-001](decisions/ADR-001-bff-pattern.md) | BFF Pattern — Frontend como cliente leve | 2026-04-20 | accepted |
| [ADR-002](decisions/ADR-002-gpt4o-mini.md) | Modelo LLM — gpt-4o-mini como padrão | 2026-04-20 | accepted |
| [ADR-003](decisions/ADR-003-apolo-state-machine.md) | Refatoração Máquina de Estados (Apolo) | 2026-04-22 | accepted |
| [ADR-004](decisions/ADR-004-serpro-integra-bugs.md) | Bugs Críticos no Módulo Integra Contador | 2026-04-22 | implemented |
| [ADR-005](decisions/ADR-005-serpro-clients-interface.md) | Redesign de /serpro/clients | 2026-04-22 | implemented |
| [ADR-006](decisions/ADR-006-lead-sheet-unification.md) | Unificação da Ficha de Lead (LeadDetailsSidebar) | 2026-04-22 | accepted |
| [ADR-007](decisions/ADR-007-serpro-sitfis-pgmei-bugs.md) | Bugs serpro.ts/serpro-config.ts | 2026-04-23 | resolved |
| [ADR-008](decisions/ADR-008-schema-integridade-dados.md) | Auditoria de Integridade de Schema | 2026-04-23 | accepted |
| [ADR-009](decisions/ADR-009-apolo-cpf-resolution.md) | CPF Auto-Resolution para Serviços Serpro | 2026-04-26 | accepted |
| [ADR-010](decisions/ADR-010-whatsapp-form-in-chat.md) | Coleta In-Chat vs Formulário Externo (Opção B) | 2026-04-26 | accepted |
| [ADR-011](decisions/ADR-011-procuracao-obrigatoria.md) | Procuração e-CAC é Obrigatória | 2026-04-29 | accepted |
| [ADR-012](decisions/ADR-012-reuniao-fechamento.md) | Reunião de Fechamento vs Atendimento | 2026-04-29 | accepted |
| [ADR-013](decisions/ADR-013-red-flags.md) | Red-Flags e Notificação Imediata | 2026-04-29 | accepted |
| [ADR-014](decisions/ADR-014-apolo-agent-audit-2026-05.md) | Auditoria Completa Agente Apolo (Mai/2026) | 2026-05-09 | accepted |
| [ADR-015](decisions/ADR-015-multi-empresa-pgfn-array-fix.md) | Multi-Empresa Relacional + Fix Parser PGFN | 2026-05-09 | accepted |
| [ADR-016](decisions/ADR-016-monorepo-cleanup.md) | Limpeza Estrutural do Repositório | 2026-07-15 | accepted |
