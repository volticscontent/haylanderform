---
name: ADR-002 — Reunião de Fechamento vs Atendimento
description: Diferenciação entre dois tipos de reunião com comportamentos distintos no bot e no cron
type: decision
date: 2026-04-29
status: accepted
---

# ADR-002: Reunião de Fechamento vs Atendimento

## Contexto

Havia um único tipo de reunião no sistema. O Haylander recebia notificações sem contexto sobre a urgência ou o estágio do lead, tornando difícil priorizar sua preparação.

## Decisão

Dois tipos de reunião com comportamentos distintos:

| | `reuniao_pendente` | `reuniao_fechamento` |
|---|---|---|
| **Qualificação** | MQL — interesse sem urgência | SQL — BANT confirmado |
| **Tool** | `enviar_link_reuniao` | `agendar_reuniao_fechamento` |
| **Notificação** | Nenhuma | Urgente para Haylander |
| **Mensagem** | Link simples | Link + resumo BANT completo |
| **Cron** | 📅 Atendimento | 🔴 Fechamento |

## Por que Dois Tipos

O Haylander entra na reunião de fechamento **preparado para fechar** — já sabe o problema, urgência e faturamento do lead. Isso aumenta taxa de conversão e valoriza o tempo do consultor.

A reunião de atendimento é exploratória — o lead ainda não está maduro o suficiente para proposta.

## Implementação

`workflow-comercial.ts`: ambas as tools com `status_atendimento` diferente
`vendedor.ts`: mesma tool `agendar_reuniao_fechamento` disponível para o agente Vendedor/Ícaro
`cron/index.ts` Job 7: distingue tipos no relatório com emoji diferente

## Consequências

O cron pós-reunião usa `status_atendimento` para diferenciar visualmente, permitindo ao Haylander saber de relance quais reuniões eram de fechamento (alta prioridade) vs atendimento (descoberta).
