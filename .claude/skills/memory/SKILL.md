---
name: memory
description: Memory management skill no padrão Karpathy LLM-Wiki + Obsidian (Tzolkin v2.0). Use para ingerir documentos, consultar, auditar, consolidar ou comitar mudanças na knowledge-base do vault (pasta `knowledge-base/`). Triggers — qualquer pedido envolvendo "memory-ingest", "memory-query", "memory-lint", "memory-consolidate", "commit", "wiki", "knowledge base", "atualizar docs do projeto", "consolidar semana", "registrar decisão (ADR)", ou quando o usuário pedir para lembrar/documentar algo persistentemente entre sessões.
---

# Memory — Karpathy LLM-Wiki + Obsidian (Tzolkin v2.0)

Esta skill te torna o **mantenedor vivo** de uma knowledge-base em padrão Karpathy LLM-Wiki, persistida como Obsidian vault dentro da pasta `knowledge-base/` deste workspace.

## Contrato

O arquivo **`knowledge-base/CLAUDE.md`** é o contrato autoritativo: schema de pastas, tipos de página, frontmatter obrigatório, regras invioláveis, paleta de cores do canvas. **Sempre leia-o antes de operar** (uma vez por sessão é suficiente).

## Cinco operações

Quando o usuário pedir qualquer uma delas, siga o procedimento do comando equivalente em `.claude/commands/`:

### 1. Ingest — "adicionar isto na wiki"

Input: caminho de um arquivo (ou conteúdo direto).

1. Ler `knowledge-base/CLAUDE.md` se ainda não leu.
2. Ler o fonte.
3. Classificar o `type` (architecture / feature / decision / integration / security / workflow / stakeholder).
4. Decidir namespace (se projeto multi-produto).
5. Extrair Resumo, Detalhes, Decisões, Learnings, Relacionados (com links relativos via Grep).
6. Escrever página em `knowledge-base/wiki/<tipo>/[namespace/]<slug>.md` com frontmatter YAML.
7. Atualizar `index.md`, append em `log.md`, adicionar nó ingest roxo + file-node em `tracking.canvas`.

### 2. Query — "o que a wiki sabe sobre X?"

1. Ler `wiki/index.md`.
2. Ler 2–5 páginas plausíveis, `Grep` para termos-chave.
3. Sintetizar com citações por link relativo.
4. Se nada encontrado: **"wiki não cobre isso ainda"** + sugerir ingest.
5. Oferecer arquivar em `outputs/<slug>-<hoje>.md`.

### 3. Lint — "a wiki está saudável?"

Auditoria somente-leitura (exceto seção `auto:debt` de `overview.md`):
- frontmatter faltando
- links quebrados
- páginas órfãs
- conceitos recorrentes sem página
- contradições (`> ⚠️ CONFLITO` ou semânticas)
- claims com `updated` > 60 dias sobre código tocado depois
- hipóteses `🟡 HIPÓTESE` com > 14 dias sem validação

Relatório em prosa. Não apaga nada. Pergunta antes de gravar em `overview.md`.

### 4. Consolidate — "fecha a semana"

1. Checar/criar `knowledge-base/git/config.json` (remote + branch + path).
2. Janela = desde último `migrations/*.md` até hoje.
3. `git log` na janela + eventos de `wiki/log.md`.
4. Correlacionar commit ↔ página. ✅ sync / ⚠️ gap / ⚠️ doc-sem-código / conflitos.
5. Escrever `wiki/migrations/<hoje>.md` com timeline + gaps + sugestões.
6. Regerar seções `<!-- auto:* -->` de `overview.md`.
7. Append `log.md`, adicionar nó ciano + file-node no `tracking.canvas`.

### 5. Commit — "comita e atualiza wiki num passo"

1. Ler config + `git status`/`git diff`.
2. Classificar tipo convencional (feat/fix/docs/refactor/chore/security/perf).
3. Atualizar páginas afetadas (bump `updated`, append em Detalhes/Learnings); criar nova se conceito novo.
4. Detectar `TODO:`/`FIXME:` no diff → propor nós vermelhos.
5. Mostrar plano (msg + páginas + nós canvas) e pedir confirmação.
6. `git add` + `git commit` + `git push`.
7. Adicionar nó verde com SHA + link GitHub; promover TODOs vermelhos relacionados a verde.
8. Append `log.md` + edge save-date → commit.

## Regras invioláveis

- **Links relativos** sempre dentro da wiki.
- **Frontmatter YAML obrigatório** em toda página.
- **`log.md` é append-only.**
- **Nunca editar `migrations/`** à mão.
- **Nunca sobrescrever** página existente sem confirmar.
- **Flag contradições** com `> ⚠️ CONFLITO: ...`.
- **Hipóteses não validadas** com `🟡 HIPÓTESE`.
- **Canvas refs** usam `"file": "wiki/..."` (vault root = `knowledge-base/`).
- **Nunca inventar** — se wiki não cobre, diga.

## Obsidian Canvas (`wiki/tracking.canvas`)

JSON nativo. Layout: **timeline horizontal de save-dates** no topo, **file-nodes verticais abaixo**.

Paleta oficial:
- Cinza (sem cor) — save-date `## 📅 YYYY-MM-DD`
- Verde (`"4"`) — commit `✅`
- Laranja (`"2"`) — decisão/fix
- Vermelho (`"1"`) — TODO `⏳`
- Roxo (`"6"`) — ingest `📥`
- Ciano (`"5"`) — consolidação `📊`
- Amarelo (`"3"`) — próximos passos `🎯`

Edge labels: `em`, `documenta`, `gera`, `resolve`, `valida`, `usa`, `relatório`.

## Referência cruzada

Para Claude Code, as mesmas 5 operações estão como slash commands:

- `/memory-ingest <arquivo>` → `.claude/commands/memory-ingest.md`
- `/memory-query <pergunta>` → `.claude/commands/memory-query.md`
- `/memory-lint` → `.claude/commands/memory-lint.md`
- `/memory-consolidate` → `.claude/commands/memory-consolidate.md`
- `/commit [tipo: msg]` → `.claude/commands/commit.md`

Se o usuário estiver no Claude Code, sugira o comando em vez da skill.

## Quando NÃO usar

- Edição direta de arquivo fora de `knowledge-base/` (use Edit/Write).
- Resumo one-shot que o usuário não quer persistir (responda no chat).
- Pergunta factual geral (não consulte wiki à toa).

## Primeiro passo em qualquer sessão

```
Read knowledge-base/CLAUDE.md       ← contrato
Read knowledge-base/wiki/index.md   ← catálogo
Read knowledge-base/wiki/log.md     ← últimas 5 entradas
```

Depois disso, proceda conforme a operação pedida.

---

**Versão:** 2.0
**Base:** Tzolkin Karpathy Template (`D:/Códigos/Tzolkin/.tzolkin/karpathy/`)
