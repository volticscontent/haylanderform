---
description: Ingere um documento bruto na knowledge-base (cria página + atualiza index/log/canvas)
argument-hint: <caminho/ao/arquivo>
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# /memory-ingest

Você é o **mantenedor da knowledge-base** deste vault. O schema vive em `knowledge-base/CLAUDE.md` — leia-o PRIMEIRO se ainda não leu nesta sessão.

## Entrada

Arquivo a ingerir: `$ARGUMENTS`

Se `$ARGUMENTS` estiver vazio, pergunte ao usuário qual arquivo ingerir.

## Procedimento (execute em ordem)

1. **Ler o schema** — `knowledge-base/CLAUDE.md` (se ainda não foi lido nesta sessão).
2. **Ler o arquivo-fonte** — `$ARGUMENTS` completo. Se for diretório, liste `.md` dentro e pergunte qual.
3. **Classificar** — determine o `type`:
   - "decidimos / em vez de / trade-off" → `decision`
   - feature pronta → `feature`
   - API/SDK externo → `integration`
   - cert/OAuth/auth/key → `security`
   - fluxo ponta-a-ponta → `workflow`
   - diagrama/padrão/C4 → `architecture`
   - pessoa/empresa → `stakeholder`
4. **Decidir namespace** (se projeto for multi-produto) — qual sub-produto a fonte cobre. Vai virar subpasta: `wiki/<tipo>/<namespace>/<slug>.md`.
5. **Extrair** blocos do template:
   - **Resumo** (2–4 frases, suas palavras — não copiar prosa do fonte).
   - **Detalhes** estruturados (headings + listas).
   - **Decisões Tomadas** (trade-offs explícitos).
   - **Learnings** (bugs, pegadinhas, dívidas).
   - **Relacionados** (use `Grep` no `wiki/` para achar páginas com tags em comum).
6. **Escolher slug** — kebab-case, curto, descritivo. Ex: `multi-empresa`, `serpro-timeout`.
7. **Escrever página** em `knowledge-base/wiki/<tipo>/[namespace/]<slug>.md` com frontmatter obrigatório:

   ```yaml
   ---
   title: ...
   type: <type>
   namespace: <namespace>      # se aplicável
   tags: [...]
   sources: [<caminho/ao/arquivo>]
   created: <hoje ISO>
   updated: <hoje ISO>
   ---
   ```

8. **Atualizar `index.md`** — adicionar `- [Título](pasta/slug.md) — resumo em 1 frase` na seção correta.
9. **Append `log.md`**:

   ```
   ## [<YYYY-MM-DD>] ingest | <título>
   Resumo em 1-2 frases.
   Pages touched: <pasta>/<slug>.md, index.md
   Canvas: ingest-<YYYY-MM-DD>-N, file_<slug>
   ```

10. **Atualizar `tracking.canvas`**:
    - Se não existir nó `save-date-<hoje>`, criar nó cinza.
    - Adicionar nó **roxo** (`color: "6"`) com `📥 <YYYY-MM-DD> — Ingest #N`.
    - Adicionar file-node `type: "file"`, `file: "wiki/<pasta>/<slug>.md"` abaixo do nó ingest.
    - Edges: save-date → ingest (label `em`), ingest → file-node (label `documenta`).
11. **Relatar** ao usuário: caminho da página, seção do index atualizada, link clicável.

## Regras (inegociáveis)

- Nunca reescrever `log.md`, apenas append.
- Nunca sobrescrever página existente sem confirmar — se slug já existe, proponha `<slug>-v2` ou sugerir merge.
- Links dentro da wiki são sempre **relativos**.
- Se detectar contradição com página existente, adicionar `> ⚠️ CONFLITO: ver [outra-pagina.md](...)` na página antiga e relatar ao usuário.
- File-node no canvas usa caminhos **a partir da raiz do vault** (`knowledge-base/`), ou seja `wiki/...` sem prefixo.

## Saída esperada

```
✅ Ingerido: feature-x.md → knowledge-base/wiki/features/x.md
📚 Index atualizado (seção Features)
📜 Log: 2026-05-14
🎨 Canvas: ingest-2026-05-14-1 + file_x

Próximo passo sugerido: /memory-query "..."
```
