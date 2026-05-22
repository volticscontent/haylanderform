# Haylander Form â€” Knowledge Base Schema (Karpathy v2.0)

> **Contrato** que Claude (Code ou Cowork) lÃª ao operar esta wiki.
> PadrÃ£o: **Karpathy LLM-Wiki + Obsidian Vault + GitHub feedback loop**.
> Status: wiki viva Â· log append-only Â· consolidaÃ§Ã£o semanal Â· canvas timeline.

---

## ðŸ“ Estrutura

```
knowledge-base/
â”œâ”€â”€ CLAUDE.md              â† este arquivo (schema + regras)
â”œâ”€â”€ git/
â”‚   â””â”€â”€ config.json        â† repo remoto para consolidate (1Âº uso preenche)
â””â”€â”€ wiki/
    â”œâ”€â”€ index.md           â† catÃ¡logo master (TOC de todas as pÃ¡ginas)
    â”œâ”€â”€ log.md             â† append-only timeline (data + aÃ§Ã£o + link)
    â”œâ”€â”€ overview.md        â† sÃ­ntese dinÃ¢mica do estado atual
    â”œâ”€â”€ tracking.canvas    â† Obsidian Canvas (timeline visual)
    â”œâ”€â”€ architecture/      â† C4, padrÃµes, system design
    â”œâ”€â”€ features/          â† features/produtos implementados
    â”œâ”€â”€ integrations/      â† third-parties (APIs, serviÃ§os externos)
    â”œâ”€â”€ security/          â† LGPD, certs, OAuth, keys, auth flows
    â”œâ”€â”€ workflows/         â† fluxos de negÃ³cio ponta-a-ponta
    â”œâ”€â”€ decisions/         â† ADRs (Architecture Decision Records)
    â”œâ”€â”€ stakeholders/      â† pessoas e organizaÃ§Ãµes (perfil, papel, dores)
    â”œâ”€â”€ migrations/        â† relatÃ³rios semanais (gerado por /memory-consolidate)
    â””â”€â”€ outputs/           â† queries arquivadas (gerado por /memory-query)
```

### Namespaces para projetos multi-produto

Se o projeto cobre **vÃ¡rios sub-produtos** (ex.: Assinatura cobre Secretaria AI + Designer + Marcelle), use subpastas dentro de cada tipo:

```
wiki/features/
â”œâ”€â”€ secretaria/
â”‚   â””â”€â”€ bot-gabi.md
â”œâ”€â”€ designer/
â”‚   â””â”€â”€ fabrica-v2.md
â””â”€â”€ marcelle/
    â””â”€â”€ automacao-notificacao.md
```

Mesma regra para `architecture/`, `integrations/`, `workflows/`. PÃ¡ginas de `stakeholders/` e `decisions/` ficam **planas** (decisÃµes cross-cutting sÃ£o frequentes).

---

## ðŸ·ï¸ Tipos de PÃ¡gina

| Type           | Pasta           | Quando criar                                              |
| -------------- | --------------- | --------------------------------------------------------- |
| `architecture` | `architecture/` | PadrÃ£o de design, C4, diagrama de sistema                 |
| `feature`      | `features/`     | Feature/produto implementado com suas decisÃµes            |
| `decision`     | `decisions/`    | ADR â€” por que foi escolhido X em vez de Y                 |
| `integration`  | `integrations/` | Contrato com serviÃ§o externo (API, webhook, third-party)  |
| `security`     | `security/`     | Certs, API keys, OAuth, LGPD, superfÃ­cies de ataque       |
| `workflow`     | `workflows/`    | Fluxo ponta-a-ponta (usuÃ¡rio â†’ backend â†’ saÃ­da)           |
| `migration`    | `migrations/`   | RelatÃ³rio de consolidaÃ§Ã£o semanal (gerado, nÃ£o editar)    |
| `output`       | `outputs/`      | Resposta arquivada de `/memory-query`                     |
| `stakeholder`  | `stakeholders/` | Pessoa ou organizaÃ§Ã£o â€” perfil, papel, dores, contexto    |

---

## ðŸ“„ Template de PÃ¡gina

Toda pÃ¡gina nova DEVE comeÃ§ar com este frontmatter:

```yaml
---
title: TÃ­tulo humano da pÃ¡gina
type: feature | decision | integration | security | workflow | architecture | migration | output | stakeholder
tags: [tag1, tag2]
namespace: secretaria | designer | marcelle    # OPCIONAL â€” sÃ³ se houver sub-produtos
sources: [caminho/ao/arquivo-origem.md, commit-sha, url]
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: draft | active | deprecated             # OPCIONAL
---

# TÃ­tulo humano da pÃ¡gina

## Resumo
2â€“4 frases. O que esta pÃ¡gina cobre e por que existe.

## Detalhes
ConteÃºdo estruturado. SeÃ§Ãµes livres conforme o tipo.

## DecisÃµes Tomadas
Trade-offs explÃ­citos. O que foi rejeitado e por quÃª.

## Learnings
Bugs, patterns, pegadinhas, dÃ­vidas tÃ©cnicas descobertas.

## Relacionados
- [Outro TÃ­tulo](../pasta/outra-pagina.md) â€” relaÃ§Ã£o
```

---

## ðŸ“œ Rules (inviolÃ¡veis)

1. âœ… **Links relativos sempre** â€” `[Title](architecture/x.md)`, nunca URL absoluta do vault.
2. âœ… **Frontmatter YAML obrigatÃ³rio** em toda pÃ¡gina `.md` dentro de `wiki/`.
3. âœ… **Atualizar `index.md` + `log.md` + `tracking.canvas`** a cada operaÃ§Ã£o que cria/altera pÃ¡gina.
4. âœ… **Nunca editar `migrations/`** manualmente â€” Ã© output gerado por `/memory-consolidate`.
5. âœ… **Flag contradiÃ§Ãµes explicitamente** â€” se duas pÃ¡ginas discordam, criar bloco `> âš ï¸ CONFLITO: ...` na mais antiga.
6. âœ… **`log.md` Ã© append-only** â€” nunca reescrever linhas passadas, apenas adicionar novas.
7. âœ… **Canvas refs** â€” `vault root = knowledge-base/`. File-nodes usam `wiki/.../arquivo.md` (sem prefixar `knowledge-base/`).
8. âœ… **Nunca editar `raw/`** â€” read-only, fontes originais preservadas.
9. âœ… **Sync com GitHub semanal** via `/memory-consolidate`.
10. âœ… **HipÃ³teses nÃ£o-validadas marcadas com `ðŸŸ¡ HIPÃ“TESE`** â€” ainda nÃ£o confirmadas com o cliente/realidade.
11. âœ… **PÃ¡ginas de migrations/ nÃ£o vÃ£o para `index.md`** â€” sÃ³ ficam visÃ­veis via canvas e `overview.md`.

---

## ðŸ› ï¸ As 5 OperaÃ§Ãµes

OperaÃ§Ãµes sÃ£o **slash commands** em `.claude/commands/` (Claude Code) e **skill** em `.claude/skills/memory/SKILL.md` (Cowork).

### 1. `/memory-ingest <arquivo>`

LÃª arquivo bruto â†’ cria pÃ¡gina na pasta correta de `wiki/` â†’ atualiza `index.md` + `log.md` + `tracking.canvas`.

**Fluxo:**
1. LÃª o arquivo-fonte em `raw/` (ou path absoluto)
2. Classifica o tipo (feature, decision, integration, etc.)
3. Cria/atualiza pÃ¡gina em `wiki/<tipo>/<slug>.md` com frontmatter
4. Atualiza `wiki/index.md` (adiciona link na seÃ§Ã£o correta)
5. Append em `wiki/log.md` (`## [DATE] ingest | <tÃ­tulo>`)
6. Adiciona nÃ³ **roxo** (ðŸ“¥) no `tracking.canvas` conectado ao save-date do dia
7. Sinaliza contradiÃ§Ãµes com pÃ¡ginas existentes

### 2. `/memory-query <pergunta>`

LÃª `index.md` â†’ seleciona pÃ¡ginas relevantes â†’ sintetiza resposta â†’ oferece arquivar em `outputs/`.

**Fluxo:**
1. LÃª `wiki/index.md` e identifica pÃ¡ginas candidatas
2. LÃª as pÃ¡ginas selecionadas
3. Sintetiza resposta com citaÃ§Ãµes para pÃ¡ginas da wiki (nÃ£o para `raw/`)
4. Oferece arquivar respostas substanciais como `wiki/outputs/<slug>-YYYY-MM-DD.md`
5. Se arquivado: append em `log.md` + nÃ³ no canvas

### 3. `/memory-lint`

Auditoria de saÃºde da KB.

**Verifica e reporta:**
- Links internos quebrados ou ausentes
- PÃ¡ginas Ã³rfÃ£s (sem links de entrada)
- ContradiÃ§Ãµes entre pÃ¡ginas
- Conceitos mencionados em mÃºltiplas pÃ¡ginas mas sem pÃ¡gina prÃ³pria
- Claims desatualizados superados por fontes mais recentes
- HipÃ³teses pendentes de validaÃ§Ã£o (`ðŸŸ¡ HIPÃ“TESE` com idade > 14d)
- ReferÃªncias cruzadas ausentes entre pÃ¡ginas relacionadas
- Frontmatter invÃ¡lido (campos faltando)

Reporta achados e pergunta quais corrigir antes de fazer mudanÃ§as.

### 4. `/memory-consolidate`

Correlaciona `git log` com `log.md` â†’ gera `migrations/YYYY-MM-DD.md` â†’ atualiza `overview.md`.

**Fluxo:**
1. LÃª `git log --since="last consolidate"` no repo apontado por `git/config.json`
2. LÃª `wiki/log.md` da mesma janela
3. Para cada commit: identifica se afetou alguma pÃ¡gina da wiki (via paths ou keywords)
4. Para cada feature/ADR no cÃ³digo: checa se hÃ¡ pÃ¡gina na wiki (caso contrÃ¡rio: flag)
5. Cria `migrations/YYYY-MM-DD.md` com: commits, pÃ¡ginas afetadas, gaps, stale
6. Atualiza `wiki/overview.md` (estado atual + mÃ©tricas)
7. Adiciona nÃ³ **ciano** (ðŸ“Š) no canvas para a janela consolidada

### 5. `/commit [tipo: descriÃ§Ã£o]`

**Ingest automÃ¡tico + git commit + push + canvas atualizado num Ãºnico fluxo.**

**Fluxo:**
1. LÃª `git status` / `git diff` no path do `git/config.json`
2. Classifica em commit convencional (`feat`, `fix`, `docs`, `refactor`, `chore`, `security`, `perf`)
3. Atualiza pÃ¡ginas afetadas (bump `updated`, append em Detalhes/Learnings); se conceito novo â†’ cria pÃ¡gina
4. Mostra mensagem proposta + pÃ¡ginas afetadas + nÃ³s de canvas a criar/promover, e **pede confirmaÃ§Ã£o**
5. Faz `git add` + `git commit` + `git push` (sem `--no-verify`)
6. Append em `log.md` com SHA curto
7. Adiciona nÃ³ **verde** (âœ…) no canvas com `âœ… commit <sha7>` + msg + link GitHub + N arquivos
8. Promove TODOs vermelhos relacionados (`color: "1"` â†’ `"4"` com prepend `âœ…`)
9. Se diff introduzir `TODO:`/`FIXME:` ou flag `--todo "<texto>"` for passada, adiciona nÃ³s **vermelhos** novos

---

## ðŸŽ¨ Obsidian Canvas (`wiki/tracking.canvas`)

Formato JSON nativo do Obsidian. **Vault root = `knowledge-base/`**, entÃ£o `"file"` em nÃ³s usa `wiki/.../arquivo.md`.

### Layout padrÃ£o (estilo `haylanderform`)

```
                  â†‘ y diminui
e_2026-04-22 â”€â”€ e_2026-04-23 â”€â”€ e_2026-04-26 â”€â”€ e_2026-04-29 â”€â”€ e_TODOs
     â”‚              â”‚               â”‚               â”‚
     â–¼              â–¼               â–¼               â–¼
file_feature_X   file_adr_Y      file_refac_Z   file_security_W
     â”‚
     â–¼
file_arch_X
```

- **Linha horizontal de save-dates** no topo (`y â‰ˆ -60`), conectados sequencialmente da esquerda para direita
- **File-nodes verticais abaixo** de cada save-date (`y â‰ˆ 420`, height variÃ¡vel)
- **Cross-references entre file-nodes** (edges sem origem em save-date) indicam dependÃªncias cruzadas
- **NÃ³ de TODOs/PrÃ³ximos Passos** sempre Ã  direita do save-date mais recente, cor vermelha

### Paleta oficial

| Tipo                  | Cor Obsidian | CÃ³digo  | ConteÃºdo                                                          |
| --------------------- | ------------ | ------- | ----------------------------------------------------------------- |
| **Save-date**         | Cinza        | _none_  | `## ðŸ“… YYYY-MM-DD` + tÃ­tulo + bullets do que aconteceu            |
| **Commit**            | Verde        | `"4"`   | `âœ… commit <sha7>` + `<tipo>(<escopo>): <msg>` + link GitHub      |
| **DecisÃ£o/Fix**       | Laranja      | `"2"`   | Texto descrevendo a decisÃ£o tomada ou fix aplicado                |
| **TODO/Red-flag**     | Vermelho     | `"1"`   | `â³ TODO: <descriÃ§Ã£o>` + `criado: <data>` + `contexto: <origem>` |
| **Ingest**            | Roxo         | `"6"`   | `ðŸ“¥ YYYY-MM-DD â€” Ingest #N` + fontes + escopo                     |
| **ConsolidaÃ§Ã£o**      | Ciano        | `"5"`   | `ðŸ“Š YYYY-MM-DD â€” ConsolidaÃ§Ã£o #N` + janela + commits + gaps      |
| **Marco/PrÃ³ximos**    | Amarelo      | `"3"`   | `ðŸŽ¯ PrÃ³ximos Passos` ou marco estratÃ©gico                          |
| **PÃ¡gina de wiki**    | _file node_  | â€”       | `type: "file"`, `file: "wiki/.../arquivo.md"`                     |

> **Save-date sem cor** = cinza (omitir campo `color` no JSON do nÃ³). Os outros tipos exigem o cÃ³digo de cor explÃ­cito.

### IDs convencionais

- `e_YYYYMMDD` ou `save-date-YYYY-MM-DD` â€” save-dates
- `commit-<sha7>` â€” nÃ³s de commit
- `todo-<slug>` â€” TODOs
- `ingest-YYYY-MM-DD-N` â€” ingests
- `consolidate-YYYY-MM-DD-N` â€” consolidaÃ§Ãµes
- `file_<slug>` â€” file-nodes apontando para `wiki/.../<slug>.md`

### Regras de transiÃ§Ã£o

- **TODO resolvido por commit** â†’ cor `"1"` muda para `"4"`, prepend `âœ…` antes do `â³` no texto, adicionar edge `"resolve"` saindo do commit verde atÃ© o TODO promovido. **NÃ£o deletar** â€” preservar histÃ³rico.
- **Save-date** sÃ³ Ã© criado se nÃ£o existir nÃ³ `save-date-<hoje>`. Todo commit/TODO/ingest/consolidaÃ§Ã£o do dia **deve** se conectar ao save-date via edge `"em"`.
- **PÃ¡gina nova** gerada por `/memory-ingest` ou `/commit` vira file-node prÃ³ximo ao nÃ³-pai (ingest ou commit) com edge `"documenta"`.

### Edge labels canÃ´nicos

`em` Â· `documenta` Â· `gera` Â· `resolve` Â· `contrato` Â· `catÃ¡logo` Â· `timeline` Â· `sÃ­ntese` Â· `relatÃ³rio` Â· `gaps â†’ ingest` Â· `feature` Â· `architecture` Â· `integration` Â· `stakeholder` Â· `usa` Â· `valida`

---

## ðŸ”— GitHub Correlation

`knowledge-base/git/config.json` guarda o remote alvo:

```json
{
  "remote": "https://github.com/<user>/<repo>",
  "branch": "main",
  "path": "."
}
```

Campo `path` opcional â€” usar quando o repo Git **nÃ£o estÃ¡ na raiz** do projeto (ex.: backend mora em `Bot_Gabi/Assinatura/` e a KB cobre vÃ¡rios sub-produtos).

Gerado na primeira execuÃ§Ã£o de `/memory-consolidate`. O comando pergunta se o arquivo nÃ£o existir.

---

## ðŸ“š Index.md â€” Formato

```markdown
# Wiki Index â€” Haylander Form

> CatÃ¡logo master. Toda pÃ¡gina da wiki estÃ¡ listada aqui.

## Overview
- [Estado atual](overview.md)

## Stakeholders
- [Cliente A](stakeholders/cliente-a.md) â€” papel e contexto

## DecisÃµes (ADRs)
- [ADR-001: TÃ­tulo](decisions/adr-001-titulo.md) â€” status, data

## Architecture
- [Componente X](architecture/x.md) â€” descriÃ§Ã£o

## Features
- [Feature Y](features/y.md) â€” descriÃ§Ã£o

## IntegraÃ§Ãµes
- [ServiÃ§o Z](integrations/z.md) â€” versÃ£o, status

## Security
- [Item W](security/w.md) â€” escopo

## Workflows
- [Fluxo K](workflows/k.md) â€” domÃ­nio

## Outputs (Queries arquivadas)
- [Resposta L](outputs/l-2026-05-14.md) â€” data

## Migrations (gerado, read-only)
<!-- nÃ£o listar â€” sÃ³ visÃ­vel via canvas e overview.md -->
```

---

## ðŸ“œ Log.md â€” Formato

Append-only. Cada entrada usa este formato (grep-parseable):

```
## [YYYY-MM-DD] <operaÃ§Ã£o> | <tÃ­tulo>
Uma ou duas frases resumindo o que foi feito.
Pages touched: pagina1.md, pagina2.md
Canvas: <ids dos nÃ³s adicionados/promovidos>
```

OperaÃ§Ãµes: `init` Â· `ingest` Â· `query` Â· `lint` Â· `consolidate` Â· `commit`

---

## âœ… Fluxo tÃ­pico (exemplo)

```
Segunda 10h â€” /memory-query "Estado da integraÃ§Ã£o X?"
Quarta 14h â€” termina feature Y â†’ /memory-ingest docs/feature-y.md
Sexta 16h â€” bug descoberto â†’ cria security/cert-w.md â†’ /memory-ingest <arquivo>
Sexta 17h â€” /commit "feat(y): integraÃ§Ã£o concluÃ­da"
Segunda 9h (auto) â€” /memory-consolidate â†’ migrations/2026-04-27.md
```

### ðŸŒ± Auto-sustentÃ¡vel

O ciclo se mantÃ©m sozinho:
- `/commit` adiciona commits verdes e TODOs vermelhos.
- O prÃ³ximo `/commit` que resolver um TODO promove vermelho â†’ verde.
- `/memory-consolidate` semanal lÃª o canvas + git log e fecha a janela com nÃ³ ciano.
- `/memory-lint` aponta tudo que ficou desatualizado (incluindo hipÃ³teses nÃ£o-validadas), e cada item vira candidato ao prÃ³ximo `/commit`.

---

**VersÃ£o:** 2.0
**Data:** 2026-05-14
**Base:** Karpathy LLM-Wiki + Obsidian Vault + GitHub feedback loop
**Mantenedor:** Tzolkin (Gustavo + Lucas) + Claude (Code + Cowork)
**ReferÃªncia:** `D:/CÃ³digos/Tzolkin/.tzolkin/karpathy/`

