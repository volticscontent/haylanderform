# Last Changes — Haylander MEI System

> Registro cronológico das últimas alterações significativas no projeto.
> **Atualizado em**: 2026-04-13

---

## 2026-04-16 — Testes de Integração Serpro (Resultados Reais)

### 🧪 Validação de Serviços
Testes executados com CNPJ real de ex-MEI (sem procuração ativa):

- **SIT_FISCAL_SOLICITAR + SIT_FISCAL_RELATORIO** ✅ — Fluxo de 2 etapas funcionando. PDF retornou em base64 e foi salvo corretamente no disco.
- **CCMEI_DADOS** ⚠️ — Endpoint correto, mas CNPJ de teste retornou "não é mais MEI". Sem emissão de PDF por bloqueio de dados, não de código.
- **PGDASD** ❌ — Falha por `numeroDas` inválido no payload. Ajuste de parâmetros pendente.
- **PGMEI** ✅ — Retornou consulta de débitos (status/mensagens). Modo consulta, sem PDF nesse cenário.
- **PGFN_CONSULTAR** ✅ — Retornou situação de dívida ativa. Modo consulta, sem PDF nesse cenário.

Quadro completo registrado em `docs/stack.now.md` → seção "Resultados de Teste Real".

---

## 2026-04-13 — Limpeza Estrutural + Documentação da Stack

### 📄 Documentação
- **Criado** `docs/stack.now.md` — Documentação completa do estado atual da stack:
  - 3 microserviços mapeados (Frontend, Bot Backend, Socket Server)
  - 7 integrações externas documentadas (PostgreSQL, Redis, R2, Serpro, Evolution, n8n, OpenAI)
  - 25 endpoints Serpro catalogados com IDs e versões
  - Schema do banco (8 tabelas) com relacionamentos
  - Infraestrutura de deploy (Vercel + Easypanel + Cloudflare)
  - Custos operacionais estimados (~$80-185/mês)
  - Débitos técnicos classificados (🔴 críticos / 🟡 importantes / 🟢 planejados)

### 🧹 Limpeza de Projeto
Remoção de ~80 arquivos de teste, debug e scripts temporários espalhados pelo projeto:

- **Raiz**: 17 arquivos (dumps JSON, test-*.ts, SQLs one-shot, logs)
- **src/**: 3 arquivos (test scripts avulsos, proxy de debug)
- **bot-backend/**: 34 arquivos (test-*, tmp_*, query*, monitor, tunnel.log)
- **bot-backend/scripts/**: 4 arquivos (test-trigger, check-webhook)
- **scripts/**: 15 arquivos (debug, test, migrations avulsas)
- **src/scripts/**: 9 arquivos (check-*, add-*, test-*)
- **tmp/**: 3 arquivos + diretório removido

---

## 2026-04-07 — Serpro Integra Contador v2.4

### 🔧 Correções
- **Fix HTTP 400 (MSG_23030)** — Atualizado `versaoSistema` de `1.0` para `2.4` nos serviços PGMEI e DIVIDAATIVA
- **Fix de payload** — Corrigido mapeamento do campo `anoCalendario` para consultas de débitos MEI
- **serpro-config.ts** — Versões atualizadas no catálogo de serviços para PGMEI, DIVIDA_ATIVA e PGFN_CONSULTAR

### 🤖 Agente Apollo (IA)
- **Detecção de MEI Excluído** — Apollo agora identifica `situacaoCadastral: BAIXADA/EXCLUIDA` nas respostas Serpro
- **Steering de vendas** — Oferece proativamente 3 opções: regularização, abertura de novo MEI, ou migração ME
- **Dashboard** — Badges visuais de status cadastral no componente `DataViewer`

---

## 2026-04-06 — Bot Backend: Fix Prisma → pg direto

### 🔧 Correções
- Removido Prisma Client que causava erros de módulo
- Migrado para `pg` (Pool) com queries diretas
- Corrigido erro de coluna inexistente no `leads_atendimento`

---

## 2026-04-07 — UTMify Multi-Hub (projeto paralelo)

### 🚀 Deploy
- Deploy do webhook router Digistore24 → UTMify no Easypanel
- Fix de `moduleResolution` no tsconfig para build com Nixpacks
- Frontend com gerador de UTMs TikTok Ads

---

## 2026-04-08 — North Mind Store (projeto paralelo)

### 💳 Checkout
- Integração de pagamento custom "northmind" no Stripe Elements
- Countdown de oferta limitada no checkout
- Layout unificado de collection pages

---

## Template para novas entradas

```markdown
## AAAA-MM-DD — [Título da Mudança]

### [Emoji] [Categoria]
- **O que mudou** — Descrição breve
- **Arquivo(s)**: `caminho/para/arquivo.ts`
- **Motivo**: Por que foi feito
```

Categorias sugeridas:
- 🔧 Correções (bug fixes)
- 🚀 Deploy (infraestrutura)
- 🤖 IA/Agentes (prompt engineering, tools)
- 📄 Documentação
- 🧹 Limpeza/Refactor
- ✨ Feature nova
- ⚡ Performance
