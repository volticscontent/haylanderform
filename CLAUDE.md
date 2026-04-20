# Setup e Contexto Global
O Haylander Form é um CRM/ERP + Automação de WhatsApp focado na contabilidade de MEIs.
Temos um Monorepo informal composto por:
1. **Frontend Admin:** Em Next.js App Router (pasta principal atual).
2. **Bot Backend:** Contido em `/bot-backend` (Node.js, Express, Baileys/Evolution API, BullMQ).

## DIRETRIZES DE EXECUÇÃO
Você deve atuar como Engenheiro Autônomo para executar os Módulos de desenvolvimento do projeto. Ao iniciar qualquer trabalho, **leia rigorosamente** o documento `.md` associado antes de mexer em código.
Conforme você for completando as tarefas dos documentos, use seus comandos para "ticar" os checkboxes (`[x]`) nos arquivos dos planos refletindo seu progresso.

---

## ✅ MÓDULO 1: Arquitetura Frontend e API — CONCLUÍDO
**Documento Guia:** `docs/plan.master.frontend.md` (Status: Concluído ✅)

O frontend Next.js foi transformado em cliente leve (BFF pattern). Toda lógica pesada foi movida para o `bot-backend`. Libs legadas (`pg`, `ioredis`, `node-forge`) foram removidas do `package.json` principal. As rotas `src/app/api/` agora são proxies HTTP para o backend Express.

---

## ✅ MÓDULO 2: Fluxo do Bot e Auditoria Base — CONCLUÍDO
**Documento Guia:** `docs/plan.master.bot.md` (Status: Concluído ✅)

O Agente Apolo foi modularizado em `bot-backend/src/ai/agents/apolo/` (prompt.ts + 3 workflows). O catálogo de serviços foi substituído pelo `{{DYNAMIC_CONTEXT}}` do Knowledge Base (Redis/DB). A tool `consultar_pgmei_serpro` foi criada como Camada 1 restrita (PGMEI + PGFN). O fluxo de Senha GOV foi refinado para não ser cobrado no primeiro atendimento.

---

## ✅ MÓDULO 3: Segurança Serpro e Pacote DART — CONCLUÍDO
**Documento Guia:** `docs/plan.master.serpro.md` (Status: Concluído ✅)

Payload Serpro ajustado (v2.4). Consultas restritas a pós-Procuração confirmada. Pacote Dart baseline inspecionado. Diretório `/dart-packages/serpro_integra_contador/` inicializado.

---

## 🚀 MÓDULO 4: Plataforma Integra Contador (Fase Atual)
**Documento Guia:** `docs/plan.master.integra.md`
**Documento de Pesquisa:** `integra.md`

### Contexto
O bot já consome a API Serpro de forma pontual (single-tenant, invocação manual via tools do Apolo). O objetivo agora é transformar essa integração num **módulo de plataforma completo**, inspirado no Calima ERP, que permita gerenciar múltiplos clientes, automatizar processos via robôs agendados e dar visibilidade total ao contador no painel Admin.

### Resumo das Ações a serem tomadas:
1. **Gestão Multi-Empresa:** Criar as tabelas `integra_empresas` e `integra_config` no banco. Construir CRUD no `bot-backend` (`/routes/integra/`) e as telas no Admin.
2. **Robôs (Jobs BullMQ):** Criar workers agendados para PGMEI, PGDAS, CND e Caixa Postal. Configuração de dia/hora por robô no painel Admin.
3. **Dashboard Integra Contador:** Cards de resumo + gráficos de status de guias + alertas de certificados a vencer.
4. **Armazenamento de Resultados:** Persistir guias (DAS, DARF) como PDF no R2, histórico de declarações e mensagens da Caixa Postal.
5. Leia o documento guia e siga as Fases estipuladas. Marque os `[x]` ao terminar.

---

## Regras de Sobrevivência no Código
- **Nunca apague o .pfx ou Pkcs12 antigo sem que os Secrets estejam operacionais e devidamente mapeados.**
- Como você (`claude`) tem a habilidade de abrir arquivos no terminal e alterá-los em lote, tome extremo cuidado na hora de mover os arquivos `/src/app/api/` que você precisará refatorar.
- A comunicação real-time (Sockets) já existe e conecta o bot-backend ao admin board. Tente não quebrar.

### Best Practices de Engenharia (Inspiradas no Claude Code Leak)
Para evitar geração de "spaghetti code" e se proteger de limitações de contexto da IA, siga estritamente estas diretrizes operacionais:
1. **Verificação rigorosa pós-edição:** Após modificar código, SEMPRE rode as validações do projeto (`tsc`, lints, testes) para confirmar que a edição não quebrou nada. Não assuma sucesso sem validar.
2. **Releitura antes da edição:** Nunca edite um código apenas confiando no cache/memória do contexto longo. SEMPRE obtenha e leia (via `view_file` ou equivalente) a versão mais recente do arquivo antes de aplicar refatorações.
3. **Arquivos e Funções Grandiosas:** Leituras excedendo 2.000 linhas sofrem truncamento. Para código extenso, leia em "chunks". Mais importante: não crie funções gigantes. Aplicar refactoring contínuo para quebrar qualquer função que ultrapasse 50 linhas em módulos menores. Evitar ao máximo múltiplos níveis de aninhamento (nesting).
4. **Prevenção de Truncamento:** Outputs e retornos de console muito extensos (>50 mil caracteres) são cortados silenciosamente. Não rode cat ou processos cujo stdout seja caótico e extenso.
5. **Vibe Coding Disciplinado:** Execute em incrementos minúsculos e seguros. Teste a cada passo. O planejamento (`plan.master.md`) serve para quebrar tarefas imensas. Não tome atalhos arquiteturais; priorize a legibilidade e a baixa complexidade ciclomática.
