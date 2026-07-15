---
name: Catálogo de Serviços
description: Serviços oferecidos pela Haylander Martins Contabilidade com preços e ICP
type: feature
updated: 2026-04-29
---

# Catálogo de Serviços

## ICP — Cliente Ideal

MEI com CNPJ ativo, faturamento mensal ≥ R$5.000, que:
- Tem dívidas de DAS, DARF ou PGFN em aberto
- Quer crescer e formalizar o negócio (MEI→ME eventual)
- Está com CNPJ irregular (BAIXADO, INAPTO, SUSPENSO)
- Quer delegar toda a burocracia fiscal para um contador

**Desqualificado**: faturamento ≤ R$5k/mês E sem dívida E sem plano de crescimento.

## Planos Mensais (Recorrentes)

| Plano | Preço | Inclui |
|---|---|---|
| **Basic** | R$ 150/mês | DAS mensal, DASN anual, suporte básico |
| **Premium** | R$ 450/mês | Tudo do Basic + DARF, certidões, regularização incluída |
| **Diamond** | R$ 1.797/mês | Tudo do Premium + gestão ativa, relatórios, acesso prioritário |

## Serviços Avulsos

| Serviço | Preço |
|---|---|
| Regularização de CNPJ | R$ 0 na consulta (cobra só o serviço) |
| Abertura de MEI | Sob consulta |
| DASN-SIMEI Avulso | Sob consulta |
| Transformação MEI → ME | Sob consulta |

## Como o Bot Usa esses Dados

O bot acessa o catálogo via `{{DYNAMIC_CONTEXT}}` injetado no prompt, que puxa da tabela `services` no PostgreSQL.

Seed em `bot-backend/src/scripts/seed-services.ts` — rodar uma vez via `ts-node` para popular a tabela.

## Apresentação Comercial

PDF completo armazenado no Cloudflare R2:
- Key: `docs/apresentacao-atualizada.pdf`
- Enviado via `enviar_apresentacao_comercial` (tool do workflow-comercial)
- `sendCommercialPresentation('apc')` detecta URL social (Instagram/YouTube) e envia como texto; senão envia como arquivo

## Diferencial Competitivo

- Acesso direto ao Serpro via API (sem robôs manuais)
- Procuração e-CAC: trabalha sem precisar da senha do cliente
- WhatsApp com IA: atendimento 24/7 no canal preferido do MEI
- Regularização incluída nos planos Premium e Diamond
