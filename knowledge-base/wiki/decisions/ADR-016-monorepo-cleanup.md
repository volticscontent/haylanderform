---
title: "ADR-016: Limpeza Estrutural do Repositório — Monorepo, Submodule e Segurança"
type: decision
tags: [monorepo, git, seguranca, devops]
created: 2026-07-15
status: accepted
sources: [
  "CLAUDE.md",
  "pnpm-workspace.yaml",
  ".gitmodules",
  "README.md"
]
---

# ADR-016: Limpeza Estrutural do Repositório

## Decisão

Aplicar uma limpeza estrutural completa no repositório `haylanderform` para:

1. Corrigir o submodule `bot-backend` que estava registrado como gitlink sem `.gitmodules`.
2. Remover do histórico git arquivos sensíveis e artefatos versionados indevidamente (`" - Copia.env"` e `socket-server/node_modules/`).
3. Configurar o repositório como monorepo com `pnpm-workspace.yaml`.
4. Padronizar `.gitignore` em todos os pacotes.
5. Criar `README.md` na raiz e consolidar a documentação.

## Motivação

- O `bot-backend` era tratado como submodule, mas `.gitmodules` não existia. Clones novos falhavam silenciosamente.
- `socket-server/node_modules/` (1.102 arquivos) estava versionado, inchando o repositório.
- `" - Copia.env"` estava commitado, expondo potencialmente variáveis de ambiente.
- Não havia configuração de monorepo: três `package.json` independentes, dependências duplicadas (`pg`, `openai`, `pdf-parse`) e nenhum script cross-project.
- `bot-backend/.gitignore` era uma cópia do `.gitignore` do Next.js, sem sentido para um backend Node/Express.
- Não existia `README.md` na raiz.

## Ações executadas

| # | Ação | Resultado |
|---|------|-----------|
| 1 | Criar `.gitmodules` e sincronizar `bot-backend` | `git submodule status` funciona corretamente |
| 2 | Reescrever histórico com `git-filter-repo` | `" - Copia.env"` e `socket-server/node_modules/` removidos de todas as branches |
| 3 | Criar `pnpm-workspace.yaml` | Monorepo configurado com frontend, bot-backend e socket-server |
| 4 | Adicionar scripts no `package.json` raiz | `dev:bot`, `dev:socket`, `build:bot`, `test:bot`, `lint:bot` |
| 5 | Reescrever `.gitignore` raiz | Regras globais para `.env*`, builds, `.vercel` |
| 6 | Reescrever `bot-backend/.gitignore` | Adequado para Node/Express |
| 7 | Criar `socket-server/.gitignore` | Ignora `node_modules/`, `.env*`, builds |
| 8 | Criar `README.md` | Setup, estrutura e scripts documentados |
| 9 | Atualizar `CLAUDE.md` raiz | Aponta `knowledge-base/CLAUDE.md` como schema canônico |
| 10 | Commit + push no submodule `backendhay` | `.gitignore` do backend corrigido no repositório próprio |
| 11 | Force-push de `main`, `fix/serpro-atubeneficio-dasn` e `natan` | Histórico remoto limpo em todas as branches |

## Branches reescritas

| Branch | Hash anterior | Hash novo |
|--------|---------------|-----------|
| `main` | `25d176d` | `7e7e45b` |
| `fix/serpro-atubeneficio-dasn` | `22097cf` | `1a7c435` |
| `natan` | `dbefdc5` | `a2d6f12` |

## Consequências

✅ Repositório remoto sem arquivos sensíveis ou `node_modules` no histórico.  
✅ Submodule funcional em clones novos.  
✅ Base para scripts cross-project e CI/CD unificada.  
✅ Documentação de entrada clara para novos desenvolvedores.  

⚠️ **Reescrita de histórico exigiu force-push.** Todos os colaboradores devem clonar novamente ou fazer rebase das branches locais sobre o histórico remoto.  
⚠️ `pnpm` ainda precisa ser instalado no ambiente para rodar `pnpm install` e usar os novos scripts.  
⚠️ Arquivos `.env` locais continuam no disco, mas estão ignorados. Recomenda-se auditar e rotacionar segredos se `" - Copia.env"` continha valores reais.

## Próximos passos

1. Instalar `pnpm` e rodar `pnpm install` na raiz.
2. Migrar os três `package-lock.json` para `pnpm-lock.yaml` (opcional).
3. Adicionar pipeline de CI/CD (GitHub Actions) aproveitando a estrutura de monorepo.
4. Continuar o hardening de segurança apontado no benchmarking: autenticação global no backend, validação de inputs, CORS restrito, rate limiting.
