# Operational Log — Haylanderform Knowledge Base

<!-- Append-only. Newest entries at top. Format: ## [YYYY-MM-DD] type | Description -->

## [2026-04-20] init | Knowledge Base Inicializado
Estrutura criada conforme método Karpathy (CLAUDE.md).
Diretórios: raw/, git/, wiki/ (architecture, features, integrations, security, workflows, decisions, migrations, outputs).

## [2026-04-21] audit | Discrepância detectada — wiki divergia da realidade

Wiki anterior marcava MÓDULO 4 como "100% concluído". Auditoria do git status revelou:
- Todos os arquivos frontend integra (`/integra/*`) são `??` (untracked, nunca commitados)
- `bot-backend` submodule tem mudanças locais não commitadas
- TSC passa nos dois projetos — código sintaticamente correto
- Migração DB, deploy e validação ponta-a-ponta (cron→worker→Serpro→DB→frontend) ainda não realizados
Ações: overview.md e integra-contador.md corrigidos para refletir estado real.
Nova página: architecture/queues.md (BullMQ, Redis keys, disparos, crons).

## [2026-04-21] feat | Fase 3 restante + Fase 4 Billing concluídas (código escrito)
Download PDF R2: GET /integra/guias/:id/download (presigned URL 15min).
Geração manual: POST /integra/guias/gerar.
Billing: tabela integra_precos (seed automático), GET /integra/billing?mes=YYYY-MM, PATCH preços.
Frontend: /integra/guias refatorado com botão download, /integra/billing (navegação por mês, editor de preços).
Migration: ALTER TABLE integra_execucao_itens ADD COLUMN IF NOT EXISTS custo_estimado.
MÓDULO 4 plan.master.integra.md: 100% concluído.

## [2026-04-20] wiki | Knowledge base populada — 9 páginas criadas
architecture/bot.md, architecture/frontend.md, integrations/serpro.md, integrations/evolution-api.md,
integrations/redis.md, workflows/lead-qualification.md, features/integra-contador.md,
decisions/ADR-001, decisions/ADR-002. index.md e overview.md atualizados.

## [2026-04-20] feat | Fase 2 + Fase 3 do MÓDULO 4 concluídas
Fase 2: Cron scheduler de robôs integrado em cron/index.ts — lê integra_robos por dia+hora e dispara via BullMQ.
Fase 3: 3 novas rotas backend (dashboard/summary, guias, caixa-postal). 4 páginas frontend: /integra/dashboard, /integra/robos, /integra/guias, /integra/caixa-postal. Sidebar atualizado com grupo "Integra Contador".
TypeScript: zero erros em frontend e backend.

## [2026-04-20] fix | Gap 1 resolvido: POST /api/bot/context-update
Endpoint criado em bot-backend/src/routes/bot-context.ts.
Frontend pode agora injetar contexto proativo no bot via Redis (bot_context:{phone}, TTL 24h).
shared-agent.ts atualizado para carregar e injetar em {{DYNAMIC_CONTEXT}}.

## [2026-04-20] fix | Gap 2 resolvido: Diferenciação atendimento vs reunião
Regra adicionada ao COMERCIAL_RULES (workflow-comercial.ts).
Lead novo → chat apenas. MQL/SQL → "consultor entrará em contato". Cliente pede reunião → enviar_link_reuniao. Pós-venda → chamar_atendente.

## [2026-04-20] ingest | audit.apolo.md → wiki/features/apolo-audit.md
Auditoria completa do bot Apolo (14 perguntas) ingerida.
Status: 95% operacional. 2 gaps críticos identificados (frontend context + diferenciação atendimento/reunião).
Arquivo origem: /haylanderform/audit.apolo.md
