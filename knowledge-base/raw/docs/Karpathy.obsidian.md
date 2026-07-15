# 🧠 Karpathy + Obsidian — Memory Management Skill

**Skill Independente para Claude Code**  
**Padrão:** LLM Wiki (Karpathy)  
**IDE:** Obsidian  
**Status:** ✅ Pronto para Ativar  

---

## 📋 O que é Esta Skill

Esta é uma **skill autossuficiente** para gerenciar uma persistent knowledge base conforme você desenvolve. Não depende do `CLAUDE.md` principal — funciona em paralelo com total independência.

**Você vai:**
- ✅ Manter documentação viva que cresce com o código
- ✅ Nunca perder contexto (wiki busca automática)
- ✅ Consolidar aprendizados semanalmente (temporal audit)
- ✅ Sincronizar com GitHub (detect conflitos)

---

## 🚀 Ativar Esta Skill no Claude Code

### Passo 1: Verificar Estrutura

```bash
cd /haylanderform/knowledge-base/
ls -la
# Deve ter:
# - CLAUDE.md (schema da wiki)
# - wiki/
#   - index.md
#   - log.md
#   - overview.md
#   - architecture/
#   - features/
#   - integrations/
#   - security/
#   - workflows/
#   - decisions/
#   - migrations/
#   - outputs/
```

### Passo 2: Dizer ao Claude Code para Usar Esta Skill

No `claude.toml` da sua conta (ou `.claude/config.json`):

```toml
[memory]
enabled = true
type = "karpathy-obsidian"
location = "knowledge-base"
schema = "knowledge-base/CLAUDE.md"
```

**Ou via CLI:**
```bash
claude config set memory.enabled true
claude config set memory.type karpathy-obsidian
claude config set memory.location knowledge-base
```

### Passo 3: Começar a Usar

Todas as 4 operações agora estão disponíveis:

```bash
# Ingerir documento
claude memory ingest docs/plan.master.integra.md

# Buscar contexto
claude memory query "Como funciona Serpro?"

# Auditar saúde
claude memory lint

# Consolidar (semanal)
claude memory consolidate
```

---

## 🎯 As 4 Operações

### 1. `/memory-ingest [arquivo]`
Processa documento → cria resumo → atualiza wiki

```bash
claude memory ingest feature-oauth.md
```

**O que acontece:**
1. Lê arquivo completamente
2. Extrai decisões + learnings
3. Cria página em `wiki/features/` ou `wiki/decisions/`
4. Atualiza `wiki/index.md`
5. Apend `wiki/log.md`

**Use quando:**
- Termina feature importante
- Toma decisão arquitetural
- Descobre padrão/problema

### 2. `/memory-query [pergunta]`
Busca viva na wiki → sintetiza resposta

```bash
claude memory query "Qual é o contexto Serpro atual?"
```

**O que acontece:**
1. Lê `wiki/index.md` para encontrar páginas relevantes
2. Lê essas páginas
3. Sintetiza com contexto
4. Oferece arquivar resposta como nova página

**Use quando:**
- Precisa relembrar arquitetura
- Quer entender decisão passada
- Está perdido em novo módulo

### 3. `/memory-lint`
Auditoria de saúde da wiki

```bash
claude memory lint
```

**Verifica:**
- ❌ Links quebrados
- ❌ Páginas órfãs
- ❌ Contradições entre páginas
- ❌ Conceitos mencionados sem página própria
- ❌ Claims desatualizados

**Use quando:**
- Código evoluiu, wiki ficou desatualizada
- Quer garantir consistência

### 4. `/memory-consolidate`
Auditoria temporal + GitHub correlation

```bash
claude memory consolidate
```

**O que faz:**
1. Lê `git log` (últimos commits)
2. Correlaciona com `wiki/log.md`
3. Detecta conflitos (código ≠ docs)
4. Gera relatório tipo "Prisma migrations"
5. Atualiza `wiki/overview.md`

**Output:**
- `wiki/migrations/YYYY-MM-DD.md` - relatório completo
- Mostra timeline de mudanças
- Identifica gaps

**Use:**
- Automático: segunda-feira 9h (via `/schedule`)
- Manual: quando precisa audit temporal

---

## 📖 Schema da Wiki (`knowledge-base/CLAUDE.md`)

```markdown
# Haylanderform — Knowledge Base Schema

Você (Claude Code) mantém esta wiki viva.

## Estrutura

wiki/
├── index.md              ← Catálogo master
├── log.md                ← Append-only log (Timeline Linear)
├── tracking.canvas       ← Visual Canvas (Timeline Interativa)
├── overview.md           ← Síntese dinâmica
├── architecture/         ← System designs
├── features/             ← Features implementadas
├── integrations/         ← Serpro, Caixa, Calima
├── security/             ← Certificados, OAuth
├── workflows/            ← Fluxos de negócio
├── decisions/            ← ADRs
├── migrations/           ← Relatórios semanais
└── outputs/              ← Queries arquivadas

## Types of Pages

- `architecture`: C4, padrões de design
- `feature`: Feature + decisões
- `decision`: ADR (Architecture Decision Record)
- `integration`: Integração com third-party
- `security`: Certs, API keys, OAuth
- `workflow`: Fluxo de negócio
- `migration`: Consolidação semanal

## Rules

✅ Use relative links: [Title](architecture/frontend.md)
✅ Nas referências do Node Canvas (`type: "file"`), use obrigatoriamente caminhos exatos pela raiz do Vault (ex: `wiki/features/empresa-bot.md`)
✅ Frontmatter YAML on every page
✅ Update index.md, log.md e tracking.canvas on every operation
✅ Never edit raw/ (read-only)
✅ Flag contradictions explicitly
✅ Sync with GitHub weekly

## 🎨 Visual Tracking (Obsidian Canvas)

O arquivo `wiki/tracking.canvas` é responsável por renderizar sua documentação como um mapa de Nós interagíveis. Sempre que adicionar documentações ou fechar "Epics", adicione os blocos nativos na API json do canvas:
1. Nós textuais atrelados às DATES (`type: "text"`)
2. Nós de arquitetura e arquivos (`type: "file"`, `file: "wiki/..."`) puxando setas (`edges`) correspondentes a essa evolução cronológica.
3. Não crie nós de arquivos cujos `file:` não possuam o prefixo `wiki/` (se o Vault raiz estiver anexado na pasta acima).
```

---

## 🔄 Fluxo Prático — Exemplo Real

**Segunda-feira 10h:**
```
Você inicia novo módulo
1. Lê docs/plan.master.integra.md
2. Consulta: /memory-query "Contexto Serpro?"
   → Wiki responde com histórico
3. Começa a codificar
```

**Quarta-feira 14h (após implementar feature):**
```
Você termina feature
1. Escreve wiki/features/multi-empresa.md
2. Roda: /memory-ingest wiki/features/multi-empresa.md
   → Wiki atualizada automaticamente
3. Marca [x] no plan.master.md
```

**Sexta-feira 16h (após descobrir bug):**
```
Você descobre problema
1. Documenta em wiki/security/certificado-expiracao.md
2. Roda: /memory-ingest wiki/security/certificado-expiracao.md
   → Registra learnings
```

**Segunda-feira 9h (automático):**
```
/memory-consolidate roda sozinho

Resultado: wiki/migrations/2026-04-27.md

Contém:
- Timeline: O que foi implementado + quando
- GitHub correlação: Commits vs wiki updates
- Conflitos: Código ≠ documentação
- Gaps: O que falta documentar
- Sugestões: Próximas melhorias
```

---

## 🗂️ Fontes Que Podem Ser Ingeridas

Procure por documentos históricos/soltos:

```
/haylanderform/
├── docs/              ← plan.master.*.md
├── research/          ← Pesquisa de integrações
├── notes/             ← Notas de desenvolvimento
├── proposals/         ← Propostas não-implementadas
├── archive/           ← Docs antigas
├── bot-backend/docs/  ← Docs de submódulos
└── integrations/      ← Docs de integrações
```

**Para cada arquivo:**
1. Leia completamente
2. Determine se é relevante AGORA
3. Se sim: ingest com `/memory-ingest`
4. Se não: marque como deprecated
5. Registre em log

---

## 📄 Template de Página Wiki

Toda página deve ter:

```yaml
---
title: Seu Título
type: feature | decision | integration | security | workflow | architecture
tags: [tag1, tag2]
sources: [docs/arquivo.md]
created: 2026-04-20
updated: 2026-04-20
---

# Seu Título

## Resumo
2-4 frases descrevendo o que esta página cobre.

## Detalhes
Conteúdo estruturado aqui.

## Decisões Tomadas
Quais foram os trade-offs?

## Learnings
O que você aprendeu?

## Relacionados
[Link](../other/page.md) — descrição
```

---

## 🔗 GitHub Integration

Se seu projeto está no GitHub, `/memory-consolidate` correlaciona:

```
Antes:
- wiki/log.md: "2026-04-20: Feature X implementada"
- GitHub: commit "feat: implement X" em 2026-04-19

Depois (consolidate):
✅ Timeline alinhada
✅ Conflitos detectados (docs vs código)
✅ Relatório: wiki/migrations/2026-04-20.md
```

**Setup (primeira vez):**
```bash
claude memory consolidate
# LLM pergunta: "Qual é o GitHub deste projeto?"
# Você responde: https://github.com/seu-user/seu-repo

# Salva em: knowledge-base/git/config.json
# Próximas consolidações: automáticas!
```

---

## 📊 Exemplo de Relatório de Consolidação

**`wiki/migrations/2026-04-27.md`:**

```markdown
---
title: Weekly Consolidation
type: migration
created: 2026-04-27
---

# Consolidation Report — 2026-04-27

## Timeline

| Data | Evento | Tipo | Status |
|------|--------|------|--------|
| 2026-04-22 | Feature multi-empresa | impl | ✅ |
| 2026-04-24 | Bug certificado | fix | ✅ |
| 2026-04-25 | Security docs | doc | ✅ |
| 2026-04-26 | GitHub commits | corr | ✅ |

## Correlação Código ↔ Wiki

✅ Código + documentação sincronizados
⚠️ Timeout do Serpro não documentado
✅ Procuração flow implementado conforme ADR

## Gaps Identificados

- [ ] Documentar timeout strategy
- [ ] Adicionar alertas de certificado
- [ ] Criar ADR para nova integração

## Sugestões para Próxima Semana

1. Documentar rate-limiting do Serpro
2. Adicionar testes de fallback
3. Revisar fluxo de regularização
```

---

## ✅ Checklist — Ativar Agora

- [ ] Criar pasta `/haylanderform/knowledge-base/`
- [ ] Copiar `CLAUDE.md` customizado
- [ ] Criar `wiki/` com subdirs
- [ ] Criar `wiki/index.md`, `log.md`, `overview.md` iniciais
- [ ] Abrir em Obsidian: `knowledge-base/wiki/`
- [ ] Configurar Claude Code para usar esta skill
- [ ] Primeiro ingest: `docs/plan.master.frontend.md`
- [ ] Agendar consolidação: segunda-feira 9h (via `/schedule`)

---

## 🎓 Benefícios

✅ **Context Buffer:** Quando perder o fio, `/memory-query` tem resposta  
✅ **Documentação Viva:** Cresce com código, nunca desatualizada  
✅ **Rastreabilidade:** Log append-only + migrations semanais  
✅ **Decisões Registradas:** ADRs em wiki/decisions/  
✅ **Aprendizados:** Bugs, patterns, learnings persistem  
✅ **GitHub Sync:** Semanal, detecta conflitos  
✅ **Autonomia:** Claude Code gerencia tudo  

---

## 🚀 Próximas Ações

1. **Agora:** Ativar skill no Claude Code (passo 1-2 acima)
2. **Hoje:** Criar estrutura de pastas
3. **Esta semana:** Primeiro ingest
4. **Próxima segunda 9h:** Primeira consolidação automática

---

**Data:** 2026-04-20  
**Versão:** 1.0 - Karpathy + Obsidian  
**Status:** ✅ Pronto para ativar  
