---
title: "ADR-002: Modelo LLM — gpt-4o-mini como padrão"
type: decision
tags: [llm, openai, custo, performance]
created: 2026-04-20
status: accepted
---

# ADR-002: Modelo LLM

## Decisão

`gpt-4o-mini` como padrão via `process.env.OPENAI_MODEL || 'gpt-4o-mini'`.

## Motivação

- Qualificação de leads é binária (MQL/desqualificado) — não requer raciocínio complexo.
- Latência baixa é prioridade para WhatsApp (usuário espera resposta).
- Custo: mini ~$0.15/1K tokens vs 4o ~$3/1K (20x mais caro).
- Function calling funciona corretamente com mini.

## Quando Considerar gpt-4o

- Taxa de fallback humano > 30% (bot travando em casos complexos)
- Reclamações de respostas robóticas no estágio de vendas (Vendedor Icaró)
- Implementar: `model = userState === 'qualified' ? 'gpt-4o' : 'gpt-4o-mini'`

## Status

Manter mini até métricas mostrarem necessidade real de upgrade.
