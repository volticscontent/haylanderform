---
description: Auditoria de saúde da wiki (links quebrados, órfãs, contradições, claims desatualizados, hipóteses pendentes)
allowed-tools: Read, Edit, Bash, Grep, Glob
---

# /memory-lint

Você é o **auditor da knowledge-base**. Varre `knowledge-base/wiki/` atrás de inconsistências e produz relatório acionável. **Não escreve páginas novas** — apenas relata e (se autorizado) atualiza `overview.md` seção `<!-- auto:debt -->`.

## Procedimento

1. **Ler schema** — `knowledge-base/CLAUDE.md`.
2. **Enumerar páginas** — `Glob` em `knowledge-base/wiki/**/*.md`.
3. **Checar frontmatter** — cada página deve ter `title`, `type`, `created`, `updated`. Liste as que faltam.
4. **Checar links** — para cada `[...](path.md)` em cada página, verificar que o arquivo existe.
5. **Detectar órfãs** — páginas que nenhuma outra página linka E que não estão em `index.md`.
6. **Detectar conceitos sem página** — termos que aparecem em 3+ páginas mas não têm página própria.
7. **Contradições** — páginas com tags iguais mas afirmações conflitantes. Procurar `> ⚠️ CONFLITO` já marcados; depois diff semântico leve em páginas da mesma pasta.
8. **Claims desatualizados** — `updated` > 60 dias onde o código (via `git log`) foi tocado depois.
9. **Hipóteses pendentes** — buscar `🟡 HIPÓTESE` com `created` > 14 dias. Listar para validação.
10. **Frontmatter de namespace inconsistente** — se a página está em `wiki/features/secretaria/` mas frontmatter diz `namespace: designer`, flagar.
11. **Gerar relatório**:

   ```
   🩺 LINT REPORT — 2026-05-14

   ❌ Frontmatter faltando (2)
     - features/multi-empresa.md → falta `updated`
     - security/cert.md → falta `tags`

   ❌ Links quebrados (1)
     - architecture/frontend.md → [auth-flow](security/auth.md) ❌

   🧟 Páginas órfãs (1)
     - outputs/2026-03-15-serpro.md (não citada)

   🧩 Conceitos sem página (2)
     - "procuração" (mencionado em 4 páginas)
     - "certificado A1" (mencionado em 6 páginas)

   ⚠️ Possíveis contradições (1)
     - decisions/adr-003.md vs features/batch-job.md

   🟡 Hipóteses pendentes >14d (1)
     - integrations/calima.md → "Calima retorna 200 mesmo em erro" (criada 2026-04-20)

   🕰️ Claims desatualizados (1)
     - integrations/serpro.md (updated 2026-01-10, código tocado 2026-04-12)
   ```

12. **Perguntar** se grava em `overview.md` seção `<!-- auto:debt -->`. Se sim, edite só essa seção.
13. **Append** em `log.md`: `## [DATA] lint | <N issues>` + pages touched (só se gravado).

## Regras

- **Nunca apagar** páginas órfãs automaticamente — só relatar.
- **Nunca** consertar links quebrados sem confirmação.
- Relatório é idempotente — rodar duas vezes no mesmo estado produz saída equivalente.
