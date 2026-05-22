# Haylander Form — CLAUDE.md

> **Padrão atual:** Tzolkin Karpathy v2.0.
> **KB canônica:** `knowledge-base/`.
> **Contexto preservado:** o vault histórico `Haylander/` permanece intacto e foi copiado para `knowledge-base/`. Nenhum conteúdo foi removido.
> **Operação:** usar `.claude/commands/` e `.claude/skills/memory/SKILL.md`.
> **Nota:** abaixo permanece o contexto operacional histórico do monorepo.

---
# Setup e Contexto Global

O **Haylander Form** Ã© um CRM/ERP + AutomaÃ§Ã£o de WhatsApp focado na contabilidade de MEIs.

Temos um Monorepo informal composto por:
1. **Frontend Admin:** Em Next.js App Router (pasta principal atual).
2. **Bot Backend:** Contido em `/bot-backend` (Node.js, Express, Baileys/Evolution API, BullMQ).
3. **Knowledge Base:** Baseado no mÃ©todo Karpathy em `knowledge-base/` (wiki + memory management).

---

## ðŸ§  NOVO: Knowledge Base Management (MÃ©todo Karpathy)

**Local:** `D:\CÃ³digos\Haylander\haylanderform\knowledge-base/`

Este Ã© seu **persistent knowledge base** que cresce conforme o desenvolvimento avanÃ§a. VocÃª (Claude Code) mantÃ©m, evolui e atualiza automaticamente.

### PropÃ³sito

Documentar de forma viva:
- Arquitetura de sistema (frontend, backend, integraÃ§Ãµes)
- DecisÃµes de design e trade-offs
- Fluxos de negÃ³cio (Contabilidade, MEI, Serpro, Integra Contador)
- AutomaÃ§Ãµes (WhatsApp, BullMQ, Agente Apolo)
- SeguranÃ§a (Serpro, Certificados, OAuth)
- IntegraÃ§Ãµes (Serpro, Caixa Postal, Calima)

### Estrutura

```
knowledge-base/
â”œâ”€â”€ CLAUDE.md              â† (este arquivo expandido)
â”œâ”€â”€ raw/                   â† DocumentaÃ§Ã£o bruta (imutÃ¡vel)
â”‚   â”œâ”€â”€ docs/             â† ReferÃªncias (plan.master.*.md, etc)
â”‚   â””â”€â”€ assets/
â”œâ”€â”€ git/                   â† Config GitHub (automÃ¡tico)
â”‚   â””â”€â”€ config.json
â””â”€â”€ wiki/                  â† Knowledge base vivo
    â”œâ”€â”€ index.md           â† Ãndice master
    â”œâ”€â”€ log.md             â† Append-only operational log
    â”œâ”€â”€ overview.md        â† SÃ­ntese viva da arquitetura
    â”œâ”€â”€ migrations/        â† RelatÃ³rios temporais (semanais)
    â”œâ”€â”€ architecture/      â† DecisÃµes e designs
    â”œâ”€â”€ features/          â† Features documentadas
    â”œâ”€â”€ integrations/      â† IntegraÃ§Ãµes (Serpro, Caixa, etc)
    â”œâ”€â”€ security/          â† SeguranÃ§a, certificados, OAuth
    â”œâ”€â”€ workflows/         â† Fluxos de negÃ³cio
    â””â”€â”€ decisions/         â† ADRs (Architecture Decision Records)
```

### Como Funciona

**VocÃª (Claude Code) executa:**
1. **Ao mexer em cÃ³digo:** `/memory-ingest [arquivo ou documento]` â†’ Documenta mudanÃ§as
2. **Ao completar feature:** `/memory-ingest feature-xyz.md` â†’ Registra aprendizado
3. **Semanalmente (segunda 9h):** `/memory-consolidate` â†’ Auditoria + sÃ­ntese (automÃ¡tico com task)
4. **Ao precisar context:** `/memory-query [pergunta]` â†’ Busca viva na wiki

**VocÃª controla:**
- Estrutura (pode reorganizar `wiki/` conforme arquitetura evolui)
- Tipos de pÃ¡gina (concept, feature, decision, integration, etc)
- CadÃªncia de ingests e consolidaÃ§Ãµes

---

## ðŸ“‹ ACOMPANHAMENTO VIA TASKS

Use `/memory-ingest` para cada grande mudanÃ§a:

```markdown
Quando terminar uma task de cÃ³digo, dispare:
/memory-ingest feature-xyz-completed.md

Isto:
âœ… Documenta o que foi feito
âœ… Extrai decisÃµes e learnings
âœ… Atualiza wiki automaticamente
âœ… Registra em log.md (rastreabilidade)
```

**ConsolidaÃ§Ã£o AutomÃ¡tica:** Toda segunda-feira Ã s 9h
```
/memory-consolidate
â†’ Correlaciona cÃ³digo (GitHub) + wiki
â†’ Detecta gaps
â†’ Gera relatÃ³rio tipo "Prisma migrations"
```

---

## DIRETRIZES DE EXECUÃ‡ÃƒO

VocÃª deve atuar como **Engenheiro AutÃ´nomo** para executar os MÃ³dulos de desenvolvimento do projeto. Ao iniciar qualquer trabalho, **leia rigorosamente** o documento `.md` associado antes de mexer em cÃ³digo.

Conforme vocÃª for completando as tarefas dos documentos, use seus comandos para "ticar" os checkboxes (`[x]`) nos arquivos dos planos refletindo seu progresso.

### â­ NOVO: Acompanhamento via Knowledge Base

**Ao INICIAR uma task de desenvolvimento:**
1. Leia o `plan.master.*.md` relevante
2. Entenda o contexto (arquitetura, decisÃµes prÃ©vias)
3. Documente PRÃ‰-REQUISITOS em `knowledge-base/wiki/decisions/`

**Enquanto TRABALHA:**
1. FaÃ§a mudanÃ§as incrementais
2. ApÃ³s mudanÃ§as significativas: `/memory-ingest seu-arquivo.md`
3. Isso documenta aprendizados em tempo real

**Ao TERMINAR:**
1. Marque `[x]` no plan.master.md
2. Rode `/memory-ingest feature-xyz-summary.md`
3. Wiki automaticamente sincronizado

**Toda SEGUNDA 9h:**
1. `/memory-consolidate` (automÃ¡tico)
2. RelatÃ³rio em `wiki/migrations/YYYY-MM-DD.md`
3. VocÃª revisa gaps e aprende com timeline

---

## ðŸŽ¯ As 4 OperaÃ§Ãµes da Knowledge Base

VocÃª tem acesso a estas operaÃ§Ãµes via skill `/memory-*`:

### 1. Ingest â€” Documentar MudanÃ§as
```
/memory-ingest feature-oauth-serpro.md

Fluxo:
  1. LÃª o documento
  2. Extrai decisÃµes, learnings, trade-offs
  3. Cria pÃ¡gina em wiki/decisions/ ou wiki/features/
  4. Atualiza index.md
  5. Apend log.md com timestamp
```

**Use quando:**
- Termina feature (documentar o aprendizado)
- Toma decisÃ£o arquitetural importante
- Descobre padrÃ£o ou problema

### 2. Query â€” Buscar Conhecimento
```
/memory-query Como funciona a integraÃ§Ã£o Serpro?

Fluxo:
  1. Busca em wiki/integrations/serpro.md
  2. Busca em wiki/security/ (certificados, OAuth)
  3. Sintetiza resposta com contexto
  4. Oferece arquivar em wiki/outputs/
```

**Use quando:**
- Precisa relembrar arquitetura
- Quer entender decisÃ£o passada
- EstÃ¡ perdido em novo mÃ³dulo

### 3. Lint â€” Auditar SaÃºde da Wiki
```
/memory-lint

Verifica:
  âŒ Links quebrados
  âŒ PÃ¡ginas Ã³rfÃ£s
  âŒ DocumentaÃ§Ã£o desatualizada
  âŒ Gaps em cobertura
```

**Use quando:**
- CÃ³digo evoluiu e wiki ficou pra trÃ¡s
- Quer garantir consistÃªncia

### 4. Consolidate â€” Auditoria Temporal Semanal
```
/memory-consolidate

(Executado automaticamente toda segunda 9h via task)

Fluxo:
  1. LÃª git log (GitHub commits)
  2. Correlaciona com wiki/log.md
  3. Detecta conflitos (cÃ³digo â‰  documentaÃ§Ã£o)
  4. Gera relatÃ³rio tipo "Prisma migrations"
  5. Atualiza overview.md (sÃ­ntese)

Output:
  ðŸ“„ wiki/migrations/YYYY-MM-DD.md (relatÃ³rio)
  ðŸ“Š wiki/overview.md (reescrito)
  ðŸ”— Todos os links da semana correlacionados
```

---

## ðŸ“‹ Fluxo PrÃ¡tico â€” Exemplo Real

**Segunda-feira 10h:**
```
VocÃª inicia MÃ“DULO 4: Integra Contador

1. LÃª docs/plan.master.integra.md
2. Consulta /memory-query "Qual Ã© o contexto Serpro?"
   â†’ Wiki responde com histÃ³rico de decisÃµes
3. ComeÃ§a a codificar
```

**Quarta-feira 14h (apÃ³s implementar multi-empresa):**
```
VocÃª termina feature de GestÃ£o Multi-Empresa

1. Escreve wiki/features/multi-empresa.md
2. Roda /memory-ingest wiki/features/multi-empresa.md
   â†’ Wiki atualizada automaticamente
3. Marca [x] no plan.master.integra.md
4. PrÃ³xima task
```

**Sexta-feira 16h (apÃ³s bugs encontrados):**
```
VocÃª descobre que Certificado SSL vence e causou erro

1. Documenta em wiki/security/certificados.md
2. Roda /memory-ingest wiki/security/certificados.md
   â†’ Registra decision + learnings
3. Marca [x] em plan.master.md
```

**Segunda-feira 9h (AUTOMÃTICO):**
```
/memory-consolidate (executa automaticamente)

Resultado:
  ðŸ“„ wiki/migrations/2026-04-27.md

ContÃ©m:
  Timeline:
    - 2026-04-22: Feature multi-empresa implementada
    - 2026-04-24: Bug certificado descoberto
    - 2026-04-25: Security docs atualizados
    - 2026-04-26: GitHub commits revisados
  
  CorrelaÃ§Ãµes:
    âœ… CÃ³digo + documentaÃ§Ã£o sincronizados
    âš ï¸ Timeout do Serpro nÃ£o documentado
  
  SugestÃµes:
    - [ ] Documentar timeout strategy
    - [ ] Adicionar alertas de certificado vencendo
```

---

## âœ… MÃ“DULO 1: Arquitetura Frontend e API â€” CONCLUÃDO
**Documento Guia:** `docs/plan.master.frontend.md` (Status: ConcluÃ­do âœ…)

O frontend Next.js foi transformado em cliente leve (BFF pattern). Toda lÃ³gica pesada foi movida para o `bot-backend`. Libs legadas (`pg`, `ioredis`, `node-forge`) foram removidas do `package.json` principal. As rotas `src/app/api/` agora sÃ£o proxies HTTP para o backend Express.

---

## âœ… MÃ“DULO 2: Fluxo do Bot e Auditoria Base â€” CONCLUÃDO
**Documento Guia:** `docs/plan.master.bot.md` (Status: ConcluÃ­do âœ…)

O Agente Apolo foi modularizado em `bot-backend/src/ai/agents/apolo/` (prompt.ts + 3 workflows). O catÃ¡logo de serviÃ§os foi substituÃ­do pelo `{{DYNAMIC_CONTEXT}}` do Knowledge Base (Redis/DB). A tool `consultar_pgmei_serpro` foi criada como Camada 1 restrita (PGMEI + PGFN). O fluxo de Senha GOV foi refinado para nÃ£o ser cobrado no primeiro atendimento.

---

## âœ… MÃ“DULO 3: SeguranÃ§a Serpro e Pacote DART â€” CONCLUÃDO
**Documento Guia:** `docs/plan.master.serpro.md` (Status: ConcluÃ­do âœ…)

Payload Serpro ajustado (v2.4). Consultas restritas a pÃ³s-ProcuraÃ§Ã£o confirmada. Pacote Dart baseline inspecionado. DiretÃ³rio `/dart-packages/serpro_integra_contador/` inicializado.

---

## ðŸš€ MÃ“DULO 4: Plataforma Integra Contador (Fase Atual)
**Documento Guia:** `docs/plan.master.integra.md`
**Documento de Pesquisa:** `integra.md`

### Contexto
O bot jÃ¡ consome a API Serpro de forma pontual (single-tenant, invocaÃ§Ã£o manual via tools do Apolo). O objetivo agora Ã© transformar essa integraÃ§Ã£o num **mÃ³dulo de plataforma completo**, inspirado no Calima ERP, que permita gerenciar mÃºltiplos clientes, automatizar processos via robÃ´s agendados e dar visibilidade total ao contador no painel Admin.

### Resumo das AÃ§Ãµes a serem tomadas:
1. **GestÃ£o Multi-Empresa:** Criar as tabelas `integra_empresas` e `integra_config` no banco. Construir CRUD no `bot-backend` (`/routes/integra/`) e as telas no Admin.
2. **RobÃ´s (Jobs BullMQ):** Criar workers agendados para PGMEI, PGDAS, CND e Caixa Postal. ConfiguraÃ§Ã£o de dia/hora por robÃ´ no painel Admin.
3. **Dashboard Integra Contador:** Cards de resumo + grÃ¡ficos de status de guias + alertas de certificados a vencer.
4. **Armazenamento de Resultados:** Persistir guias (DAS, DARF) como PDF no R2, histÃ³rico de declaraÃ§Ãµes e mensagens da Caixa Postal.
5. Leia o documento guia e siga as Fases estipuladas. Marque os `[x]` ao terminar.

---

## ðŸ”§ Inicializar Knowledge Base (Primeira Vez)

Se ainda nÃ£o tiver criado `knowledge-base/`, execute:

```bash
cd D:\CÃ³digos\Haylander\haylanderform

# Crie estrutura
mkdir knowledge-base\raw knowledge-base\wiki knowledge-base\git
mkdir knowledge-base\wiki\{architecture,features,integrations,security,workflows,decisions,outputs,migrations}

# Copie CLAUDE.md customizado (veja abaixo)
# Crie index.md, log.md, overview.md iniciais
```

**OU dispare:**
```
/memory-ingest docs/plan.master.frontend.md

Isto vai:
  âœ… Criar knowledge-base/ automaticamente
  âœ… Inicializar estrutura
  âœ… Registrar plan.master.frontend.md como primeira fonte
```

---

## ðŸ“– CLAUDE.md Customizado para Knowledge-Base

Salve em `knowledge-base/CLAUDE.md`:

```markdown
# Haylanderform â€” Knowledge Base Schema

**Projeto:** Haylanderform (CRM/ERP + WhatsApp para MEIs)  
**ManutenÃ§Ã£o:** Claude Code (autonomously)  
**SincronizaÃ§Ã£o:** GitHub + Weekly Consolidation

## Role

VocÃª (Claude Code) mantÃ©m esta wiki viva. Conforme vocÃª desenvolve:
1. Documenta features em wiki/features/
2. Documenta decisÃµes em wiki/decisions/
3. Documenta integraÃ§Ãµes em wiki/integrations/
4. Ingest semanal via /memory-ingest
5. Consolidate semanal (segunda 9h) automÃ¡tico

## Estrutura

wiki/
â”œâ”€â”€ index.md              â† Master catalog
â”œâ”€â”€ log.md                â† Append-only operational log
â”œâ”€â”€ overview.md           â† Living architecture synopsis
â”œâ”€â”€ architecture/         â† System design, patterns
â”œâ”€â”€ features/             â† Features implemented
â”œâ”€â”€ integrations/         â† Serpro, Caixa, Calima, etc
â”œâ”€â”€ security/             â† Certificates, OAuth, secrets
â”œâ”€â”€ workflows/            â† Business flows (Bot, Contador)
â”œâ”€â”€ decisions/            â† ADRs and trade-offs
â”œâ”€â”€ migrations/           â† Weekly consolidation reports
â””â”€â”€ outputs/              â† Query archives

## Types of Pages

- `architecture`: System designs, C4 diagrams
- `feature`: Implemented feature + decisions
- `decision`: ADR (Architecture Decision Record)
- `integration`: Third-party integration details
- `security`: Certificates, OAuth, API keys handling
- `workflow`: Business process flows
- `migration`: Weekly consolidation report

## Rules

âœ… Use relative links: [Title](architecture/frontend.md)
âœ… Frontmatter YAML on every page
âœ… Update index.md + log.md on every operation
âœ… Never edit raw/ (read-only)
âœ… Flag contradictions explicitly
âœ… Sync with GitHub weekly (consolidate)
```

---

## ðŸŽ¯ Regras de SobrevivÃªncia no CÃ³digo
- **Nunca apague o .pfx ou Pkcs12 antigo sem que os Secrets estejam operacionais e devidamente mapeados.**
- Como vocÃª (`claude`) tem a habilidade de abrir arquivos no terminal e alterÃ¡-los em lote, tome extremo cuidado na hora de mover os arquivos `/src/app/api/` que vocÃª precisarÃ¡ refatorar.
- A comunicaÃ§Ã£o real-time (Sockets) jÃ¡ existe e conecta o bot-backend ao admin board. Tente nÃ£o quebrar.

### Best Practices de Engenharia (Inspiradas no Claude Code Leak)
Para evitar geraÃ§Ã£o de "spaghetti code" e se proteger de limitaÃ§Ãµes de contexto da IA, siga estritamente estas diretrizes operacionais:
1. **VerificaÃ§Ã£o rigorosa pÃ³s-ediÃ§Ã£o:** ApÃ³s modificar cÃ³digo, SEMPRE rode as validaÃ§Ãµes do projeto (`tsc`, lints, testes) para confirmar que a ediÃ§Ã£o nÃ£o quebrou nada. NÃ£o assuma sucesso sem validar.
2. **Releitura antes da ediÃ§Ã£o:** Nunca edite um cÃ³digo apenas confiando no cache/memÃ³ria do contexto longo. SEMPRE obtenha e leia (via `view_file` ou equivalente) a versÃ£o mais recente do arquivo antes de aplicar refatoraÃ§Ãµes.
3. **Arquivos e FunÃ§Ãµes Grandiosas:** Leituras excedendo 2.000 linhas sofrem truncamento. Para cÃ³digo extenso, leia em "chunks". Mais importante: nÃ£o crie funÃ§Ãµes gigantes. Aplicar refactoring contÃ­nuo para quebrar qualquer funÃ§Ã£o que ultrapasse 50 linhas em mÃ³dulos menores. Evitar ao mÃ¡ximo mÃºltiplos nÃ­veis de aninhamento (nesting).
4. **PrevenÃ§Ã£o de Truncamento:** Outputs e retornos de console muito extensos (>50 mil caracteres) sÃ£o cortados silenciosamente. NÃ£o rode cat ou processos cujo stdout seja caÃ³tico e extenso.
5. **Vibe Coding Disciplinado:** Execute em incrementos minÃºsculos e seguros. Teste a cada passo. O planejamento (`plan.master.md`) serve para quebrar tarefas imensas. NÃ£o tome atalhos arquiteturais; priorize a legibilidade e a baixa complexidade ciclomÃ¡tica.

---

## ðŸ“š Knowledge Base Best Practices

1. **ApÃ³s cada feature completada:** Dispare `/memory-ingest feature-summary.md`
2. **ApÃ³s decisÃ£o importante:** Crie `wiki/decisions/ADR-NNNN.md` e ingest
3. **Quando descobre bug/problema:** Documente em `wiki/workflows/` ou `wiki/security/`
4. **Semanalmente (segunda 9h):** `/memory-consolidate` roda automaticamente
5. **Se perder em contexto:** `/memory-query [sua pergunta]` busca na wiki

---

## ðŸ“‹ Checklist â€” Setup Inicial

- [ ] Crie pasta `knowledge-base/` em `D:\CÃ³digos\Haylander\haylanderform/`
- [ ] Crie subdirs: `raw/`, `wiki/`, `git/`
- [ ] Crie `wiki/` subdirs: `architecture/`, `features/`, `integrations/`, `security/`, `workflows/`, `decisions/`, `migrations/`, `outputs/`
- [ ] Copie este CLAUDE.md para `knowledge-base/CLAUDE.md`
- [ ] Crie `wiki/index.md` (vazio ou com Ã­ndice inicial)
- [ ] Crie `wiki/log.md` (inÃ­cio vazio)
- [ ] Crie `wiki/overview.md` (sÃ­ntese inicial)
- [ ] Abra em Obsidian: `knowledge-base/wiki/`
- [ ] Configure agendamento: `/schedule consolidate-weekly` (segunda 9h)
- [ ] Primeiro ingest: `/memory-ingest docs/plan.master.frontend.md`

---

## ðŸš€ PrÃ³ximos Passos

1. **Agora:** Crie a pasta `knowledge-base/` com estrutura
2. **Hoje:** Ingest do `plan.master.frontend.md` (modulo 1 jÃ¡ concluÃ­do)
3. **Esta semana:** Continue ingests conforme trabalha em MÃ“DULO 4
4. **PrÃ³xima segunda 9h:** Primeira consolidaÃ§Ã£o automÃ¡tica
5. **ObservaÃ§Ã£o:** Wiki cresce com o projeto. Reavalie structure conforme necessÃ¡rio.

---

## ðŸ“ž Resumo

VocÃª agora tem:
âœ… Knowledge base automÃ¡tica (mÃ©todo Karpathy)
âœ… Acompanhamento via wiki/log.md (rastreabilidade)
âœ… ConsolidaÃ§Ã£o semanal (GitHub + wiki correlacionado)
âœ… System para documentar decisÃµes (wiki/decisions/)
âœ… Context buffer (quando perder, `/memory-query`)

Isto permite que vocÃª desenvolva com **documentaÃ§Ã£o viva**, nÃ£o documentaÃ§Ã£o que fica desatualizada.

