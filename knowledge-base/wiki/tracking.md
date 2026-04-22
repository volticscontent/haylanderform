---
title: Canvas de Acompanhamento (Tracking)
type: tracking
tags: [kanban, roadmap, status]
updated: 2026-04-22
---

# Canvas de Acompanhamento (Tracking)

Este documento atua como o nosso "Kanban" e mapa principal das documentações, atualizações e validações pendentes para termos dimensão visual do progresso da plataforma e do que precisa ser auditado e documentado na Knowledge Base.

---

## 🛑 TO DO (A Fazer / Não Documentado)

- [ ] **Auditoria Completa do Frontend:** Documentar alterações recentes de UI e modais modulares, remoção da coluna `status_envio` no LeadList e vinculação dos links do Serpro na listagem.
- [ ] **Documentação do Fluxo de Banco de Dados:** Mapear fisicamente toda a branch do Prisma/Supabase (`leads`, `leads_processo`, `integra_empresas`, etc.) incluindo as atualizações não documentadas que removeram envios automáticos e substituíram por procurações.
- [ ] **Deploy e DevOps:** Documentação do ambiente de produção, Vercel, rotinas .env limpas, Cloudflare Wrangler etc., que ocorreram (ex. clone para `file-to-web-magic-58` e deployment errors).
- [ ] **Estruturação do Bot (Engine):** Documentar todo o fluxo final de Tasks, `COMERCIAL_RULES`, roteador atualizado, queue workers (`message-debounce`, `job-pgmei`) e as alterações no `LeadDetailsSidebar`.

---

## 🚧 DOING (Em Andamento / Sendo Integrado)

- [ ] **Cadastro Automático de Empresas:** Finalizar implementação das *querys sequenciais* e do processo *Context Retrieval (RAG)* mapeado em `empresa-bot-registration.md` para automação via dashboard. 
- [ ] **Validação E2E (End-to-End) Integra Contador:** Teste ponta a ponta não foi documentado (Frontend → API → BullMQ → Serpro). As filas dependem de start seguro. Verificação se a Cron Schedule está operando o banco de dados conforme as chaves ativas da empresa.

---

## ✅ DONE (Documentado Recentemente)

- [x] **Arquitetura de Filas:** BullMQ documentado em `architecture/queues.md`.
- [x] **Cadastro e Orquestração B2B:** Documentado `empresa-bot-registration.md` explicando o papel futuro do bot e do supervisor humano com a IA para recuperar formulários do histórico de mensagens.
- [x] **Correções Críticas Serpro:** Tratado bug no frontend de `clients` e 6 correções no Integra documentadas nos arquivos `decisions/ADR-0001` e `ADR-0002`.

---
*Para ver a **referência de tempo linear**, consulte o arquivo [[log]] (`log.md`) que guarda o histórico diário das operações.*
