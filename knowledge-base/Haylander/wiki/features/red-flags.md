---
name: Sistema de Red-Flags
description: Mecanismo de escalação automática para o Haylander quando lead apresenta sinal crítico
type: feature
updated: 2026-04-29
---

# Sistema de Red-Flags

## Propósito

Quando um lead apresenta comportamento de alto risco ou bloqueio crítico, o bot:
1. Marca `situacao = 'red_flag'` no banco
2. Registra o tipo em `motivo_qualificacao`
3. Dispara `callAttendant` automaticamente — notificação urgente ao Haylander

## Tipos de Red-Flag

| Tipo | Trigger |
|---|---|
| `PROCURACAO_RECUSADA` | Cliente recusou explicitamente após explicação completa |
| `SEM_RESPOSTA_POS_TUTORIAL` | Sumiu após receber passo a passo do e-CAC |
| `PRECO_RECUSADO` | Rejeitou preço sem abertura para negociação |

## Implementação

Em `shared-agent.ts`, `update_user` tem um side-effect automático:

```typescript
if (args.situacao === 'red_flag') {
    await callAttendant(
        phone,
        `🚨 RED FLAG — ${phone}\nTipo: ${args.motivo_qualificacao}\n${args.observacoes || ''}`
    );
}
```

O `callAttendant` é chamado em paralelo com o `updateUser` — sem aguardar resposta do Haylander para continuar.

## Fluxo no Bot

```
Lead recusa procuração
  → Bot explica motivo com empatia (1x)
  → Oferece simulação de valores
  → Se recusa simulação também:
      → update_user(situacao='red_flag', motivo='PROCURACAO_RECUSADA')
      → callAttendant automático
      → Bot encerra conversa com educação
```

## Visibilidade no Painel Admin

Leads com `situacao = 'red_flag'` aparecem destacados no painel de leads com badge vermelho, permitindo ao Haylander intervir manualmente se julgar oportuno.

## Decisão Arquitetural

Ver [ADR-003: Red-Flags e Notificação](../decisions/ADR-003-red-flags.md).
