---
name: ADR-003 — Red-Flags e Notificação Imediata
description: Decisão de implementar escalação automática para o Haylander em situações críticas
type: decision
date: 2026-04-29
status: accepted
---

# ADR-003: Red-Flags e Notificação Imediata

## Contexto

Alguns leads apresentam comportamentos que indicam bloqueio crítico: recusa de procuração, desaparecimento após tutorial, rejeição de preço. Antes, esses casos se perdiam no fluxo sem visibilidade para o Haylander.

## Decisão

Red-flag é um estado especial em `leads.situacao` que:
1. Pausa o fluxo automatizado normal
2. Notifica o Haylander **imediatamente** via `callAttendant`
3. Registra o tipo exato em `motivo_qualificacao` para contexto

O side-effect de `callAttendant` está embutido no `update_user` em `shared-agent.ts` — o LLM não precisa saber chamar explicitamente `callAttendant` para red-flags.

## Tipos Definidos

- `PROCURACAO_RECUSADA`: recusa explícita após explicação completa
- `SEM_RESPOSTA_POS_TUTORIAL`: sumiu após receber o passo a passo
- `PRECO_RECUSADO`: rejeitou preço sem abertura para negociação

## Por que Side-Effect no `update_user`

Alternativa considerada: o LLM chama `callAttendant` manualmente após marcar red-flag.

Rejeitado porque: o LLM pode esquecer, pode marcar red-flag sem notificar, ou pode notificar sem marcar. O side-effect garante atomicidade — qualquer marcação de red-flag **sempre** dispara a notificação.

## Consequências

O Haylander pode intervir manualmente em leads red-flag, convertendo leads que o bot não conseguiria. Isso é intencional — alguns casos precisam do toque humano.

Nutrição automatizada para leads com TAG `NUTRICAO` é escopo futuro (BullMQ campaign).
