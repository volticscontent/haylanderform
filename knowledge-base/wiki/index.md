---
name: Índice Master — Haylanderform Knowledge Base
description: Catálogo central de toda a documentação viva do projeto
type: index
updated: 2026-04-29
---

# Haylanderform — Knowledge Base

Projeto: CRM/ERP + Automação WhatsApp para contabilidade de MEIs.
Stack: Next.js (frontend admin) + Node.js/Express (bot-backend) + Evolution API + BullMQ + PostgreSQL + Cloudflare R2.

## Arquitetura
- [Visão Geral](overview.md)
- [Bot Backend](architecture/bot-backend.md)

## Agente Apolo
- [Fluxo Comercial e Qualificação](workflows/apolo-comercial.md)
- [Fluxo de Regularização](workflows/apolo-regularizacao.md)
- [Sistema de Red-Flags](features/red-flags.md)
- [Cron Pós-Reunião](features/cron-pos-reuniao.md)

## Serviços
- [Catálogo de Serviços](features/servicos.md)

## Integrações
- [Serpro](integrations/serpro.md)
- [BrasilAPI / CNPJ](integrations/brasil-api.md)

## Segurança
- [Procuração e-CAC](security/procuracao-ecac.md)

## Decisões Arquiteturais
- [ADR-001: Procuração Obrigatória](decisions/ADR-001-procuracao-obrigatoria.md)
- [ADR-002: Reunião de Fechamento vs Atendimento](decisions/ADR-002-reuniao-fechamento.md)
- [ADR-003: Red-Flags e Notificação](decisions/ADR-003-red-flags.md)

## Log Operacional
- [log.md](log.md)
