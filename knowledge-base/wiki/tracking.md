---
title: Canvas de Acompanhamento (Tracking)
type: tracking
tags: [kanban, roadmap, status]
updated: 2026-04-26
---

# Canvas de Acompanhamento (Tracking)

Este documento atua como o nosso "Kanban" e mapa principal das documentações, atualizações e validações pendentes para termos dimensão visual do progresso da plataforma e do que precisa ser auditado e documentado na Knowledge Base.

---

## 🛑 TO DO (A Fazer / Não Documentado)

- [ ] **Auditoria Completa do Frontend:** Documentar alterações recentes de UI e modais modulares, remoção da coluna `status_envio` no LeadList e vinculação dos links do Serpro na listagem.
- [ ] **Deploy e DevOps:** Documentação do ambiente de produção, Vercel, rotinas .env limpas, Cloudflare Wrangler.
- [ ] **Gravar vídeo tutorial e-CAC:** `createAutonomoMessageSegments()` tem placeholder textual desde 2026-04-26. Quando gravar, adicionar como segmento `type: 'media'` com `mediaType: 'video'`.
- [ ] **Limpeza de Arquivos Legados:** Verificar se `LeadSheet.tsx` e seus sub-componentes ainda têm uso além do chat antes de remover.

---

## 🚧 DOING (Em Andamento / Sendo Integrado)

- [ ] **Cadastro Automático de Empresas:** Finalizar implementação das *queries sequenciais* e do processo *Context Retrieval (RAG)* mapeado em `empresa-bot-registration.md` para automação via dashboard.
- [ ] **Validação E2E (End-to-End) Integra Contador:** Teste ponta a ponta não foi realizado (Frontend → API → BullMQ → Serpro → DB). Commitar arquivos `??` do git status e validar cron schedule.

---

## ✅ DONE (Documentado Recentemente)

- [x] **Serpro Camada 2 — Apolo (2026-04-26):** 4 novas tools (`consultar_ccmei_serpro`, `consultar_cnd_serpro`, `consultar_caixa_postal_serpro`, `consultar_situacao_fiscal_serpro` corrigida). CPF auto-resolution via `resolveEmpresarioCpf()`. ADR-0005.
- [x] **Jornada Comercial Corrigida (2026-04-26):** Opção B reescrita como coleta in-chat (sem formulário externo). `iniciar_coleta_situacao_whatsapp` adicionado. Reunião disparada proativamente após coleta. Duplicate tools removidas. ADR-0006.
- [x] **Integridade de Dados & Serpro Bugs (2026-04-23):** 3 migrations SQL, fix 4 bugs críticos serpro.ts, redesign tabela Empresas Integra. ADR-0003b, ADR-0004b.
- [x] **Estruturação do Bot (Engine):** `COMERCIAL_RULES`, roteador, queue workers, `LeadDetailsSidebar` — documentados em `architecture/bot.md` e `features/apolo-audit.md`.
- [x] **Documentação do Fluxo de Banco de Dados:** Tabelas `leads`, `leads_processo`, `integra_empresas` mapeadas em `architecture/bot.md`, `integrations/serpro.md` e ADR-0004b.
- [x] **Consistência de Dados de Leads:** Refatoração SQL + ficha unificada `LeadDetailsSidebar.tsx`. ADR-0004.
- [x] **Correção de Clientes Fantasmas (Serpro):** Rota `/api/serpro/clients` refatorada. ADR-0002.
- [x] **Arquitetura de Filas:** BullMQ documentado em `architecture/queues.md`.
- [x] **Priorização de Procuração:** Fluxo Opção A/B explícito em `REGULARIZACAO_RULES` — procuração sempre antes de consulta Serpro. ADR-0006.

---
*Para ver a **referência de tempo linear**, consulte o arquivo [[log]] (`log.md`) que guarda o histórico diário das operações.*

## 📌 PRÓXIMOS PASSOS (Sessão Seguinte)
1. **Commitar todos os arquivos `??`** do git status (frontend integra, bot-backend fixes, migrations).
2. **Gravar vídeo tutorial e-CAC** e substituir placeholder textual em `createAutonomoMessageSegments()`.
3. **Validação E2E Integra Contador**: executar cron, verificar se BullMQ dispara jobs, confirmar DB preenchido.
4. **RAG + Context Retrieval**: implementar cadastro automático de empresas via análise de histórico de chat.
