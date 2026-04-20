# plan.master.bot.md — Executor Task 3 & Auditoria do Bot

> **Status**: Concluído ✅

---

## 🎯 Objetivo Direto
Refatorar o agente principal (Apollo) separando seu código monolítico em pequenos módulos funcionais e otimizando o fluxo de solicitação de dados do cliente (Task 3).

---

## 🏗️ 1. Desmembramento do Apollo (Arquitetura)
Sair do arquivo único `apolo.ts` para um sistema de sub-módulos.

- **Criar Pasta:** `bot-backend/src/ai/agents/apolo/`
- **Isolar Identidade:** `prompt.ts` (Apenas tom de voz, regras base e persona).
- **Criar "Workflows" (Cérebros):**
  1. `workflow-comercial.ts` (Atendimento geral, oferta de serviços)
  2. `workflow-regularizacao.ts` (Análise de MEI, dívidas e procuração)
  3. `workflow-suporte.ts` (Direcionamento humano, agendamentos)
- **Contexto Dinâmico:** Remover lista de serviços fixa. Inserir tag dinâmica `{{DYNAMIC_CONTEXT}}` carregada via `knowledge-base.ts` (Redis).

---

## 🚦 2. Fluxo Otimizado (Task 3 - Regularização)
O bot precisa ser menos invasivo no primeiro contato.

- **Não exigir Senha GOV de imediato:** O fluxo inicial focará em oferecer a **Procuração e-CAC** (via envio de vídeo instrutivo). A senha gov continua existindo no sistema, mas em *standby* para casos de suporte humanizado.
- **Consultas Leves:** Pós-procuração confirmada, o Apollo rodará a tool `consultar_pgmei_serpro` limitada à varredura de **PGMEI** e **PGFN** (Dívida Ativa) como primeira camada exploratória, sem varrer bases municipais/estaduais detalhadas prematuramente.

---

## 📋 3. Tarefas de Execução
- [x] Criar a pasta `apolo/` e separar o `prompt.ts` e os 3 workflows.
- [x] Substituir o catálogo fixo no bot pelo `{{DYNAMIC_CONTEXT}}` do Knowledge Base.
- [x] Implementar e expor a tool `consultar_pgmei_serpro` restrita.
- [x] Refinar o fluxo de vendas para adiar a cobrança de Senha Gov.
