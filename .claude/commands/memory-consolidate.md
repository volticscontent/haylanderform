---
description: Consolidação semanal — correlaciona git log com wiki/log.md e gera relatório em migrations/
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# /memory-consolidate

Você é o **historiador da knowledge-base**. Compara a realidade do código (git log) com o que a wiki afirma (`log.md`, páginas) e produz relatório semanal em `knowledge-base/wiki/migrations/YYYY-MM-DD.md`.

## Pré-requisito: remote configurado

Ler `knowledge-base/git/config.json`. Se **não existir**:

1. Perguntar: "Qual é o repositório GitHub deste projeto? (url)".
2. Perguntar: "Qual branch? (default: main)".
3. Perguntar: "Em qual subpasta o `.git` vive? (`.` se for raiz)".
4. Criar `knowledge-base/git/config.json`:
   ```json
   { "remote": "<url>", "branch": "<branch>", "path": "<subpasta>" }
   ```

## Procedimento

1. **Ler schema** — `knowledge-base/CLAUDE.md`.
2. **Carregar config** — `knowledge-base/git/config.json`.
3. **Determinar janela** — última consolidação = `migrations/*.md` mais recente. Se não houver, últimos 7 dias.
4. **`git log`** na pasta `<path>` com `--since=<inicio> --until=<fim> --pretty=format:"%h | %ad | %s" --date=short`.
5. **Ler `wiki/log.md`** e extrair eventos na mesma janela.
6. **Correlacionar**:
   - Commit menciona página (por slug ou título) → ✅ sincronizado.
   - Commit sem página correspondente → ⚠️ gap de documentação.
   - Página atualizada sem commit relacionado → ⚠️ doc sem código (OK em mudança só de docs).
7. **Detectar conflitos** — páginas com `updated` na janela cujo conteúdo diverge do diff do commit relacionado.
8. **Escrever `migrations/<hoje>.md`**:

   ```markdown
   ---
   title: Weekly Consolidation — <hoje>
   type: migration
   tags: [migration, consolidation]
   sources: [git log, wiki/log.md]
   created: <hoje>
   updated: <hoje>
   ---

   # Consolidation Report — <hoje>

   **Janela:** <inicio> → <fim>
   **Commits analisados:** N
   **Eventos de wiki:** M

   ## Timeline

   | Data | Evento | Tipo | Status |
   | ---- | ------ | ---- | ------ |
   | …    | …      | impl | ✅      |

   ## Correlação Código ↔ Wiki

   ✅ Sincronizados: N
   ⚠️ Gaps de doc: M
   ⚠️ Doc sem código: K

   ## Gaps Identificados

   - [ ] Documentar <coisa>
   - [ ] ADR sobre <decisão>

   ## Conflitos

   (listar pares commit ↔ página com divergência)

   ## Sugestões

   1. …
   ```

9. **Atualizar `overview.md`** — regenerar seções `<!-- auto:* -->`:
   - `auto:pillars` ← páginas em `architecture/`
   - `auto:features` ← todas em `features/`
   - `auto:integrations` ← todas em `integrations/`
   - `auto:decisions` ← últimas 5 por `updated` desc
   - Use `Edit` — preservar conteúdo livre (fora dos marcadores).
10. **Append `log.md`**: `## [DATA] consolidate | janela X→Y, N commits, M gaps`.
11. **Atualizar `tracking.canvas`**:
    - Adicionar nó **ciano** (`color: "5"`) com `📊 <DATA> — Consolidação #N`.
    - Adicionar file-node apontando para `wiki/migrations/<hoje>.md`.
    - Edges: save-date → consolidate, consolidate → file-node (label `relatório`).
12. **NÃO** atualizar `index.md` para migrations — elas só aparecem via canvas e overview.
13. **Relatar** em prosa: N commits, M gaps, caminho do relatório.

## Regras

- **Nunca** reescrever migrations antigos — são história.
- Se repo git inacessível, abortar: "Rode no ambiente onde o `.git` está disponível" — NÃO criar relatório vazio.
- Mesma data sobrescreve apenas com confirmação.
- Seções livres de `overview.md` (fora `<!-- auto:* -->`) são preservadas.

## Execução

Manual ou via `/schedule` — procedimento idêntico.
