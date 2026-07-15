---
name: Cron Pós-Reunião
description: Job automático que notifica o Haylander sobre reuniões pendentes de confirmação
type: feature
updated: 2026-04-29
---

# Cron Pós-Reunião

## Propósito

Após uma reunião de fechamento ou atendimento, o status do lead deve ser atualizado manualmente pelo Haylander no painel admin (cliente fechou ou não). Esse cron garante que nenhuma reunião seja esquecida.

## Schedule

`0 12,15,18,21 * * *` — roda 4x por dia (12h, 15h, 18h, 21h) no horário de São Paulo.

## Lógica

1. Busca reuniões com `data_reuniao` nas últimas 12 horas
2. Filtra apenas leads com `status_atendimento IN ('reuniao_fechamento', 'reuniao_pendente', 'reuniao')`
3. Exclui leads já marcados como `cliente` ou `desqualificado`
4. Monta mensagem resumida por lead: nome, horário, tipo (🔴 Fechamento / 📅 Atendimento)
5. Envia para `ATTENDANT_PHONE` via `enqueueMessages`

## Mensagem Enviada

```
📋 *Confirmação de Reuniões — 15:00*

1. *João Silva* — 14:00 (🔴 Fechamento)
2. *Maria Souza* — 15:30 (📅 Atendimento)

Acesse o painel para atualizar o status de cada lead:
• *Cliente fechou* → marque como "cliente"
• *Não apareceu / não fechou* → marque situação e adicione observação

_Este lembrete é enviado automaticamente 4x ao dia enquanto houver reuniões pendentes._
```

## Configuração

Variável de ambiente: `ATTENDANT_PHONE` — número do Haylander para receber as notificações.
Se não configurada, o job loga um warning e não envia.

## Localização no Código

`bot-backend/src/cron/index.ts` — Job 7 (último job registrado, `0 12,15,18,21 * * *`).

## Decisão Arquitetural

Ver [ADR-002: Reunião de Fechamento vs Atendimento](../decisions/ADR-002-reuniao-fechamento.md).
