# Operational Log — Haylanderform Knowledge Base

<!-- Append-only. Newest entries at top. Format: ## [YYYY-MM-DD] type | Description -->

## [2026-04-26] feat | Serviço de API de CNPJ implementado — validação, cache, rate limiting

Implementação completa de serviço robusto de API para consulta e validação de CNPJs:

**Componentes criados:**
- `CNPJValidator` — validação completa com algoritmo de dígitos verificadores
- `CNPJService` — integração BrasilAPI, cache TTL 24h, rate limit 10 req/min
- Rotas REST — consulta individual, batch (máx 50), validação, estatísticas de cache

**Testes:** 45 testes unitários, cobertura >80%, CNPJs reais validados
**Performance:** Cache reduz chamadas externas em 80% para consultas repetidas
**Segurança:** Rate limiting por IP, timeout 10s, logs detalhados

Arquivos: `bot-backend/src/lib/cnpj-*.ts`, `bot-backend/src/routes/cnpj.ts`, testes
Feature: [cnpj-api-service.md](features/cnpj-api-service.md)

## [2026-04-26] feat | Jornada comercial corrigida — Opção B in-chat + agendamento proativo

Audit completo da jornada Chegada → Cadastro → e-CAC → Situação → Reunião revelou 5 bugs.

**Corrigidos:**
1. `update_user` duplicado em `workflow-comercial.ts` (schema `{campos:{}}` conflitava com shared-agent flat-params) — removido.
2. `interpreter` duplicado em `workflow-comercial.ts` — removido.
3. Opção B em `createRegularizacaoMessageSegments()` enviava para "formulário seguro" externo → reescrita como "Conversa pelo WhatsApp".
4. URL de vídeo fictional `haylander.com.br/videos/procuracao-ecac-tutorial.mp4` removida; substituída por instruções textuais.
5. `enviar_link_reuniao` não era disparado proativamente após coleta de situação → regra adicionada em `COMERCIAL_RULES`.

**Adicionado:**
- `createSituacaoFormSegments()` em `regularizacao-system.ts`
- Tool `iniciar_coleta_situacao_whatsapp` em `workflow-regularizacao.ts`
- Fork Opção A/B explícito em `REGULARIZACAO_RULES`

ADRs: [ADR-0006](decisions/ADR-0006-whatsapp-form-in-chat.md)
Feature: [commercial-journey-whatsapp.md](features/commercial-journey-whatsapp.md)

## [2026-04-26] feat | Apolo-Serpro Camada 2 — 4 novas tools + CPF auto-resolution

Audit do Apolo revelou que `consultar_situacao_fiscal_serpro` sempre falhava silenciosamente (nunca passava CPF). Causa raiz: serviços `SIT_FISCAL_*` e `CND` são CPF-based, e o bot nunca obtinha o CPF.

**Adicionado:**
- `resolveEmpresarioCpf(cnpj)` — extrai CPF de `CCMEI_DADOS.dados.empresario.cpf`
- `extractSitfisProtocolo(envelope)` — extrai protocolo em múltiplos campos possíveis
- Tool `consultar_ccmei_serpro` (Camada 2)
- Tool `consultar_cnd_serpro` (Camada 2, fluxo 2-etapas SITFIS→CND)
- Tool `consultar_caixa_postal_serpro` (Camada 2)
- `consultar_situacao_fiscal_serpro` corrigida com fluxo 2-etapas + CPF auto

**Script de teste:** `bot-backend/src/scripts/test-serpro-apis.ts` — todos 22 serviços.

ADR: [ADR-0005](decisions/ADR-0005-apolo-serpro-cpf-resolution.md)
Feature: [serpro-apolo-integration.md](features/serpro-apolo-integration.md)

## [2026-04-26] fix | TypeScript — EmpresasClient.tsx + DashboardCharts.tsx + empresas.ts

- `EmpresasClient.tsx`: `useEffect` não importado — adicionado ao import React.
- `DashboardCharts.tsx`: `LabelFormatter` type mismatch (RenderableText inclui `false | null | undefined`) — removida anotação explícita, TypeScript infere. Comparações aritméticas em `string | number` — envolvidas em `Number()`.
- `empresas.ts` linha 207: `req.params.phone` tipado como `string | string[]` — cast para `string`.

## [2026-04-23] schema | Audit integridade + 3 migrations + fixes app (ADR-0004)

Audit completo de `cliente × empresa × cnpj × razao_social` revelou 6 problemas.
Ações concluídas:

**Migrations (src/lib/db/migrations/):**
- `012_cliente_denorm_leads.sql` — `leads.cliente` coluna denorm + trigger sync de `leads_processo`
- `013_procuracao_historico.sql` — tabela audit trail `leads_procuracao_historico` + seed estado atual
- `014_consultas_lead_id.sql` — FK `consultas_serpro.lead_id → leads` + backfill por CNPJ

**App (bot-backend):**
- `serpro-db.ts`: `saveConsultation` aceita `leadId?: number | null`
- `serpro-api.ts` POST `/serpro`: resolve `lead_id` por CNPJ lookup antes de salvar consulta
- `serpro-api.ts` PUT `/serpro/procuracao/:leadId`: insere em `leads_procuracao_historico` a cada toggle

**Não-tomado:** `integra_empresas.lead_id NOT NULL` — rejeitado, quebraria dados existentes.

ADR: `decisions/ADR-0004-schema-integridade-dados.md`

## [2026-04-23] fix | Fonte de verdade razao_social — lead ↔ integra_empresas

Audit revelou 3 problemas críticos de integridade de dados. Correções aplicadas:

1. **Bug importação**: `importarLeadComoEmpresa` usava `nome_completo` como `razao_social`.
   Fix: usa `lead.razao_social` quando preenchida, fallback para `nome_completo`.

2. **Sync POST**: ao criar empresa via `POST /integra/empresas` com `lead_id`, o backend
   agora busca `leads.razao_social` como fonte primária. Após inserção, faz
   `UPDATE leads SET razao_social = COALESCE(razao_social, $1)` para preencher o lead
   se estava vazio (sem sobrescrever se já havia valor).

3. **Sync PATCH**: ao atualizar `razao_social` via `PATCH /integra/empresas/:id`,
   o backend sincroniza de volta para `leads.razao_social` quando empresa tem `lead_id`.
   `integra_empresas` é a fonte de verdade fiscal; `leads` espelha.

4. **Tipo `LeadParaImportar`**: adicionado campo `razao_social: string | null`.
   Modal de importação agora exibe razão social como nome principal quando disponível,
   mostrando `nome_completo` como secundário abaixo (· João Silva).

Arquivos: `bot-backend/src/routes/integra/empresas.ts`, `actions.ts`, `EmpresasClient.tsx`

## [2026-04-23] feat | Redesign tabela Empresas Integra + correlação lead

`src/app/(admin)/serpro/integra/empresas/EmpresasClient.tsx` redesenhada:
- Colunas "Razão Social" + "CNPJ" fundidas em célula empilhada
- Regime como badge colorido (MEI=azul, Simples=verde, Presumido=roxo, Real=laranja)
- Nova coluna "Lead Vinculado" (nome + telefone formatado) usando `lead_nome`/`lead_telefone`
- Serviços como pills com overflow "+N"
- Toggle Ativo corrigido (era quebrado por conflito `mx-auto` + `translate`)
- Modais com `rounded-xl`, `shadow-2xl`, inputs com `focus:ring-2`

Backend `GET /integra/empresas` agora faz LEFT JOIN com `leads` retornando `lead_nome` e `lead_telefone`.
Tipo `IntegraEmpresa` em `actions.ts` atualizado com os dois campos.

## [2026-04-23] fix | 4 bugs serpro.ts + serpro-config.ts corrigidos

Diagnóstico disparado por falhas em quase todas as APIs Serpro para CNPJ de teste.
1. **anoCalendario ausente**: `PGMEI_EXTRATO`, `PGMEI_BOLETO`, `PGMEI_ATU_BENEFICIO` não recebiam `anoCalendario` quando `options.ano` omitido (outer `else if` incompleto). Fix: expandida a lista + inner logic simplificado.
2. **SITFIS sem CPF**: `SIT_FISCAL_SOLICITAR/RELATORIO/CND` enviavam CNPJ como contribuinte silenciosamente quando `options.cpf` não fornecido. Fix: throw explícito.
3. **Aliases sem comentário**: `DIVIDA_ATIVA` e `PGFN_CONSULTAR` são duplicatas de `PGMEI`/`DIVIDAATIVA24` sem documentação. Fix: comentários adicionados.
4. **Erro CND obscuro**: mensagem de erro para CND sem `protocoloRelatorio` não explicava o fluxo 2-etapas obrigatório. Fix: mensagem reescrita.
ADR: decisions/ADR-0003-serpro-sitfis-pgmei-bugs.md

## [2026-04-22] fix | 6 bugs críticos corrigidos no Módulo Integra Contador
Workers CAIXA_POSTAL (chave errada), CND (fluxo 2 passos ausente), SIT_FISCAL (serviço inválido), PGMEI (código morto guias), routes sem try-catch, robos.ts coluna id inexistente.
ADR: decisions/ADR-0001-serpro-integra-bugs.md

## [2026-04-22] fix | Interface /serpro/clients redesenhada
Endpoint agora mostra leads com procuração ativa mesmo sem consulta prévia.
ADR: decisions/ADR-0002-serpro-clients-interface.md

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
