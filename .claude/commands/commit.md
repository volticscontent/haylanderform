---
description: Ingest automático + git commit + push + canvas em 1 passo
argument-hint: [tipo: descrição] ou [--todo "<descrição>"]
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# /commit

Você é o **operador do feedback loop GitHub ↔ Wiki**. Este comando faz ingest automático, gera mensagem de commit convencional, faz `git add/commit/push`, e atualiza canvas com nó verde + promove TODOs vermelhos relacionados.

## Entrada

- Sem args: classifica o diff e propõe mensagem.
- Com args `[tipo: descrição]`: usa o tipo e descrição fornecidos.
- Com flag `--todo "<descrição>"`: adiciona nó vermelho de TODO **sem** fazer commit.

## Pré-requisito

`knowledge-base/git/config.json` existe. Senão, abortar e dizer pra rodar `/memory-consolidate` primeiro.

## Procedimento

1. **Ler schema** — `knowledge-base/CLAUDE.md`.
2. **Ler config** — `knowledge-base/git/config.json`. Obter `path`.
3. **`git status`** + **`git diff`** + **`git diff --cached`** na pasta `<path>`.
4. **Classificar commit** se tipo não foi dado:
   - Arquivo novo em `src/features/` ou similar → `feat`
   - Arquivo em `tests/` → `test`
   - Fix de bug (commits anteriores recentes com `fix:`, código tocado em catch/error path) → `fix`
   - Docs (`.md`, `README`, `wiki/`) → `docs`
   - Refactor (sem mudança de comportamento aparente) → `refactor`
   - Chore (lockfile, build config) → `chore`
   - Security (keys, tokens, auth) → `security`
   - Performance → `perf`
5. **Extrair escopo** — pasta principal afetada (ex.: `serpro`, `auth`).
6. **Atualizar páginas afetadas**:
   - Para cada arquivo no diff que tem página na wiki, bump `updated` e append em "Detalhes" ou "Learnings" se relevante.
   - Se há conceito novo (feature/integration nunca documentada), **criar página** via lógica do `/memory-ingest`.
7. **Detectar TODOs**:
   - `Grep` no diff por `TODO:`, `FIXME:`, `XXX:` → cada um vira nó vermelho proposto.
   - Se flag `--todo "..."` passada, adicionar manualmente.
8. **Propor mensagem + plano**:

   ```
   📝 Commit proposto: feat(serpro): adiciona PGFN_CONSULTAR multi-empresa

   Páginas afetadas:
   - integrations/serpro.md (bump updated)
   - features/multi-empresa.md (NOVA)

   Canvas:
   - Novo nó verde: commit-<sha7>
   - Novo nó vermelho: todo-validar-pgfn-em-prod (de TODO: no diff)
   - Resolver TODO existente: todo-multi-empresa-schema (color 1 → 4)

   Confirmar? (s/n)
   ```

9. **Aguardar confirmação**. Se não, abortar limpa.
10. **Se confirmado**:
    - `git add` dos arquivos relevantes (incluindo wiki).
    - `git commit -m "<mensagem>"` (sem `--no-verify`).
    - `git push` para `<branch>` configurada.
    - Capturar `sha7` do commit.
11. **Append `log.md`**:

    ```
    ## [DATA] commit | <mensagem>
    SHA: <sha7>
    Pages touched: <lista>
    Canvas: commit-<sha7>, [todo-<slug>...]
    ```

12. **Atualizar `tracking.canvas`**:
    - Adicionar nó **verde** (`color: "4"`) com `✅ commit <sha7>\n<tipo>(<escopo>): <msg>\n[GitHub](<url>)\nN arquivos`.
    - Para cada TODO resolvido: mudar `color: "1"` → `"4"`, prepend `✅` no texto, adicionar edge `resolve` do commit para o TODO.
    - Para cada TODO novo: adicionar nó vermelho `color: "1"` com `⏳ TODO: <desc>\ncriado: <data>\ncontexto: <origem>`.
    - Conectar nó verde ao `save-date-<hoje>` via edge `em` (criar save-date se não existir).
13. **Relatar** ao usuário: SHA, link do commit no GitHub, páginas afetadas, TODOs promovidos.

## Regras

- **Nunca** `--no-verify`.
- **Nunca** comitar sem confirmação humana.
- Mensagem convencional: `<tipo>(<escopo>): <descrição>` ou `<tipo>: <descrição>` (sem escopo).
- TODOs detectados no diff que **já estão** como nós vermelhos no canvas: não duplicar.
- Push falhou? Reportar erro e NÃO atualizar wiki/canvas (rollback do bump de `updated`).

## Variante: só TODO (sem commit)

`/commit --todo "Validar fluxo PGFN em produção"`

Pula passos 3–11, vai direto para 12 adicionando só o nó vermelho. Útil quando o usuário lembra de algo pendente sem ter código no diff.
