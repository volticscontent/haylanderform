---
title: Integra Contador — Módulo 4
type: feature
tags: [integra, serpro, bullmq, robos, guias, caixa-postal]
created: 2026-04-20
updated: 2026-04-20
status: current
---

# Integra Contador — MÓDULO 4

Plataforma de gestão fiscal para contadores. Gerencia múltiplos clientes MEI/Simples via Serpro com robôs BullMQ agendados.

## Tabelas DB

| Tabela | Função |
|---|---|
| `integra_empresas` | Empresas clientes habilitadas (CNPJ, regime, serviços, certificado) |
| `integra_robos` | Configuração de cada robô (dia, hora, ativo) |
| `integra_execucoes` | Histórico de execuções (status, sucesso, falhas, duração) |
| `integra_execucao_itens` | Resultado individual por empresa por execução |
| `integra_guias` | DAS MEI, DARF gerados (valor, vencimento, status pagamento) |
| `integra_caixa_postal` | Mensagens da Receita Federal por empresa |

## Workers BullMQ

- `job-pgmei.ts` — PGMEI para empresas MEI ativas com `PGMEI` em `servicos_habilitados`
- `job-cnd.ts` — CND para empresas com `CND` habilitado
- `job-caixa-postal.ts` — Caixa Postal para todas com `CAIXAPOSTAL` habilitado

Todos usam: concorrência 3 empresas/lote, delay 1500ms entre lotes, retry exponential 5s x3.

## Agendamento

Cron `0 * * * *` — a cada hora no `:00`, verifica `integra_robos` filtrando por `dia_execucao = hoje` e `hora_execucao = hora_atual`. Dispara workers via BullMQ com `execucaoId` rastreável.

## Rotas Backend

| Rota | Descrição |
|---|---|
| `GET /api/integra/empresas` | Lista empresas |
| `POST /api/integra/empresas` | Cria empresa (preset automático de serviços por regime) |
| `PATCH /api/integra/empresas/:id` | Atualiza empresa |
| `GET /api/integra/robos` | Lista robôs com última execução |
| `PATCH /api/integra/robos/:tipo` | Ativa/desativa, altera dia/hora |
| `POST /api/integra/robos/:tipo/executar` | Trigger manual |
| `GET /api/integra/dashboard/summary` | Agregado: empresas + guias + robôs + alertas |
| `GET /api/integra/guias` | Lista guias com filtros |
| `GET /api/integra/caixa-postal` | Lista mensagens com filtros |
| `PATCH /api/integra/caixa-postal/:id/lida` | Marca como lida |
| `POST /api/integra/caixa-postal/sincronizar` | Trigger manual da Caixa Postal |

## Páginas Frontend

| Rota Admin | Descrição |
|---|---|
| `/serpro/integra/empresas` | CRUD empresas com toggle ativo |
| `/serpro/integra/dashboard` | Cards resumo + alertas certificados + status robôs |
| `/serpro/integra/robos` | Toggle ativo, edição dia/hora, botão executar |
| `/serpro/integra/guias` | Tabela DAS/DARF por empresa |
| `/serpro/integra/caixa-postal` | Mensagens Receita Federal, marcar lida, sincronizar |
| `/serpro/integra/billing` | Tabela mensal de serviços tarifados |

> **Nota de UI:** No menu lateral (`AdminSidebar.tsx`), todos os recursos do Integra Contador estão agrupados sob uma única aba unificada de dropdown chamada **Serpro / Integra**, juntamente com as consultas diretas do Serpro.

## Fase 4 — Billing Tracker ✅

- `integra_precos` — seed automático com preços padrão por robô
- `GET /integra/billing?mes=YYYY-MM` — agrega consultas × preço por empresa e serviço
- `PATCH /integra/billing/precos/:tipo_robo` — editar preço unitário
- `/integra/billing` — frontend com navegação mensal, tabela por empresa, editor de preços embutido
- `GET /integra/guias/:id/download` — URL pré-assinada R2 (15min)
- `POST /integra/guias/gerar` — geração manual por empresa

## Status Real (auditado 2026-04-21)

⚠️ Código escrito e TSC limpo, mas **nenhum arquivo frontend foi commitado** (todos `??` no git).
O bot-backend submodule tem mudanças locais não commitadas.
A migration pode não ter sido executada no banco de produção.
Validação ponta-a-ponta (cron → worker → Serpro → DB → frontend) ainda não realizada.
