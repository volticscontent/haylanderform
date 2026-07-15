---
title: Fluxo de Qualificação de Leads
type: workflow
tags: [leads, qualificacao, mql, sql, apolo]
updated: 2026-04-20
status: current
---

# Fluxo de Qualificação de Leads

## Regras de Precedência (COMERCIAL_RULES)

```
1. [CRÍTICA] Faturamento ≤ 5k E SEM dívida → DESQUALIFICADO (para aqui)
2. Faturamento > 10k → MQL
3. tem_divida = true → MQL
4. Quer abrir empresa → MQL (só se NÃO cair na Regra 1)
5. Nenhum dos acima → DESQUALIFICADO
```

## Estados do Lead

```
nao_respondido → (Apolo qualifica) → qualificado/desqualificado
qualificado    → (Vendedor Icaró fecha venda) → cliente
cliente        → (Atendente suporta)
atendimento_humano → sem agente (humano direto)
```

## Tabelas Alimentadas pelo Bot

| Tabela | Campos | Tool |
|---|---|---|
| `leads` | nome, telefone, cnpj, faturamento_mensal, tem_divida, qualificacao, situacao | `update_user` |
| `leads_processo` | servico, status_atendimento, observacoes, procuracao, data_reuniao | `update_user` |
| `leads_recurso` | tipo (link-ecac, video-tutorial), url | `trackResourceDelivery` |
| `chat_history` | role, content, timestamp | `addToHistory` (automático) |
| `leads_serpro_consulta` | cnpj, tipo, resultado_json | `saveConsultation` |

## Diferenciação Atendimento vs Reunião

Regra adicionada ao `COMERCIAL_RULES` em 2026-04-20:

- **Lead novo** → chat apenas, sem oferta de reunião
- **Qualificado (MQL/SQL)** → "Um consultor entrará em contato" (sem `enviar_link_reuniao`)
- **Cliente pede reunião explicitamente** → `enviar_link_reuniao()` + `update_user(status_atendimento: "reuniao")`
- **Pós-venda** → `chamar_atendente(reason: "reuniao_cliente")`

## Chain of Thought Obrigatório

1. Fazer 1-2 perguntas (faturamento, dívida)
2. Classificar conforme regras de precedência
3. Se qualificado → `update_user(qualificacao: "MQL")` → `setAgentRouting(phone, 'vendedor')`
4. Avisar: "Consultor entrará em contato"
5. Se desqualificado → `update_user(situacao: "desqualificado")`
