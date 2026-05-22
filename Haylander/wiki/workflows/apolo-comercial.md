---
name: Fluxo Comercial e Qualificação — Apolo (SDR)
description: Fluxo completo de triagem, qualificação BANT e agendamento do agente Apolo no modo SDR
type: workflow
updated: 2026-04-29
---

# Fluxo Comercial — Apolo SDR

## Visão Geral

O Apolo opera em dois modos comportamentais distintos roteados pelo campo `qualificacao` via Redis:
- **Sem qualificação definida** → modo SDR (arquivo `workflow-comercial.ts`)
- **Qualificação definida** → roteado para Vendedor/Ícaro (arquivo `workflow-vendedor.ts`)

## Sequência de Abertura

1. **Primeira mensagem**: saudação calorosa → `enviar_apresentacao_comercial` (PDF no R2) → pergunta aberta
2. Sem menu numerado — conversa natural
3. Lead fornece CNPJ → `consultar_cnpj_publico` IMEDIATO

## Fluxo CNPJ / BrasilAPI

Quando o cliente informa CNPJ:
1. `consultar_cnpj_publico(cnpj, userPhone)` — busca BrasilAPI e **auto-preenche a ficha** silenciosamente
2. Bot confirma: "Vi que sua empresa é [razao_social], MEI em [cidade/UF]. Correto?"
3. Verifica `is_mei` → se não MEI, explica serviço é especializado em MEI
4. Verifica `situacao_cadastral` → BAIXADA/INAPTA/SUSPENSA → abertura de regularização
5. Verifica procuração e-CAC → ATIVA: vai para Serpro | AUSENTE: orienta processo (obrigatório)

## Qualificação BANT

Coleta **conversacionalmente**, nunca em lista:
- **Necessidade**: dívidas, notas, organização, abertura
- **Urgência**: notificação Receita, DAS atrasado, multa, prazo
- **Capacidade**: faturamento mensal aproximado

### Classificação do Lead

| Classificação | Critério | Ação |
|---|---|---|
| **SQL** | Dor + urgência + faturamento ≥ R$5k | `agendar_reuniao_fechamento` |
| **MQL** | Interesse sem urgência ou orçamento | `enviar_link_reuniao` |
| **DESQUALIFICADO** | Faturamento ≤ R$5k E sem dívida E sem plano | `update_user(situacao=desqualificado)` |

Ao qualificar: `update_user` com:
- `qualificacao` = SQL | MQL | DESQUALIFICADO
- `motivo_qualificacao` = TAG: `RESGATE_URGENTE` | `PARCEIRO_DE_CRESCIMENTO` | `NUTRICAO`
- `observacoes` = resumo BANT completo para o Haylander

## Dois Tipos de Reunião

| Tool | Quando | Status | Notificação |
|---|---|---|---|
| `enviar_link_reuniao` | Lead MQL, sem urgência | `reuniao_pendente` | Não |
| `agendar_reuniao_fechamento` | Lead SQL, urgência confirmada | `reuniao_fechamento` | Sim — notifica Haylander com urgência |

## Procuração e-CAC

Requisito obrigatório para prestar o serviço. Ver [Procuração e-CAC](../security/procuracao-ecac.md).

Se cliente recusar:
1. Explica motivo com empatia
2. Oferece simulação de valores (meses de DAS em aberto)
3. Se aceitar simulação + intenção de contratar → `agendar_reuniao_fechamento`
4. Se recusar procuração E simulação → `red_flag(PROCURACAO_RECUSADA)`

## Red Flags

Ver [Sistema de Red-Flags](../features/red-flags.md).

Triggers no fluxo comercial:
- `PROCURACAO_RECUSADA`: recusa explícita após explicação completa
- `SEM_RESPOSTA_POS_TUTORIAL`: sumiu após receber o passo a passo do e-CAC
- `PRECO_RECUSADO`: rejeitou o preço sem abertura para negociação
