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

- [x] **Consistência de Dados de Leads:** Refatoração da query SQL no endpoint `/atendimento/lead/:phone` para incluir todos os campos de qualificação, financeiros e joins com `leads_processo`.
- [x] **Ficha de Cliente Unificada:** Extração da ficha da lista para um componente compartilhado (`LeadDetailsSidebar.tsx`). O atendimento agora possui acesso inline à ficha completa e editável sem redirecionamentos.
- [x] **Correção de Clientes Fantasmas (Serpro):** Migração da rota `/api/serpro/clients` para proxy do backend, permitindo filtragem correta por `source=test` (CNPJs sem lead associado).
- [x] **Arquitetura de Filas:** BullMQ documentado em `architecture/queues.md`.
- [x] **Correções Críticas Serpro:** Tratado bug no frontend de `clients` e correções no Integra documentadas em ADRs.

---
*Para ver a **referência de tempo linear**, consulte o arquivo [[log]] (`log.md`) que guarda o histórico diário das operações.*

## 📌 PRÓXIMOS PASSOS (Sessão Seguinte)
1. **Limpeza de Arquivos Legados:** Excluir fisicamente o arquivo `LeadSheet.tsx` e seus sub-componentes (AddressSection, ProfessionalSection etc.) se não houver uso em outros lugares além do chat.
2. **Contexto Operacional Apollo:** Iniciar a implementação da lógica inteligente de solicitação de senha GOV baseada no tipo de serviço (Task 5 do fluxo de regularização).
3. **Priorização de Procuração:** Ajustar o fluxo para que o bot priorize a solicitação de procuração antes de dados sensíveis (Task 6).
