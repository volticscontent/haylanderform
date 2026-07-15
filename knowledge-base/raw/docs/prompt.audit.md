# 🔍 Haylanderform — Prompt de Auditoria e Limpeza (Background Task)

**Status:** Operação Secundária (Background)  
**Frequência:** Semanal (terça-feira 14h) + Ad-Hoc (quando solicitado)  
**Escopo:** Knowledge Base Consolidation + Legacy Data Cleanup  

---

## 🎯 Propósito

Este prompt executa **em paralelo** ao desenvolvimento principal (`/haylanderform/CLAUDE.md`), com o objetivo de manter a knowledge base em `/haylanderform/knowledge-base/` **afiada, limpa e compatível** com o estado atual da aplicação.

Você (Claude Code em modo audit) **NÃO substitui** o agente principal. Em vez disso, você:
- ✅ Audita a knowledge base periodicamente
- ✅ Ingera dados históricos soltos
- ✅ Remove abstrações obsoletas
- ✅ Sincroniza com realidade atual do código
- ✅ Gera relatórios de saúde
- ✅ Sugere melhorias sem atrapalhar desenvolvimento

---

## 📋 Escopo de Responsabilidade

### Você FAZ:
1. **Limpeza de Dados Antigos**
   - Localizar documentos soltos em pastas (`docs/`, `research/`, `notes/`, etc)
   - Ingerar informações relevantes para `knowledge-base/`
   - Remover duplicatas e abstrações obsoletas
   - Consolidar em páginas únicas e atualizadas

2. **Auditoria de Abstrações**
   - Verificar páginas na wiki que contêm informações **desatualizadas**
   - Cruzar com código atual (`src/`, `bot-backend/`, etc)
   - Sinalizar contradições explicitamente
   - Reescrever páginas que divergem da realidade

3. **Sincronização com Código**
   - Ler `docs/plan.master.*.md` (planos de desenvolvimento)
   - Verificar se wiki reflete implementações completadas
   - Remover pages sobre features não-implementadas (marcar como "deprecated")
   - Atualizar `wiki/overview.md` com status real

4. **Saúde da Wiki**
   - Executar `/memory-lint` semanalmente
   - Gerar relatório de gaps
   - Sugerir novas páginas necessárias
   - Verificar integridade de links

5. **Relatórios de Auditoria**
   - Gerar `wiki/migrations/audit-YYYY-MM-DD.md` (separado do consolidate principal)
   - Documentar mudanças feitas
   - Listar items removidos/consolidados
   - Sugerir próximas limpezas

### Você NÃO FAZ:
- ❌ Modificar código do projeto (esse é trabalho do CLAUDE.md principal)
- ❌ Criar novas features ou implementações
- ❌ Quebrar a rotina de desenvolvimento (operar apenas em paralelo)
- ❌ Deletar pages sem registrar explicitamente em log
- ❌ Substituir decisões do desenvolvedor principal

---

## 🔄 Fluxo Operacional

### Execução Automática (Terça-feira 14h)

```
Cada terça-feira 14h:

1. Leia /haylanderform/knowledge-base/wiki/index.md → catálogue todas as páginas
2. Leia /haylanderform/knowledge-base/wiki/log.md → identifique pages não tocadas > 2 semanas
3. Verifique /haylanderform/docs/ e pastas adjacentes por dados soltos
4. Para cada dado solto:
   - Leia e analise
   - Determine tipo (concept, decision, integration, etc)
   - Ingera para /haylanderform/knowledge-base/
   - Registre em log.md (append)
5. Execute /memory-lint → reporte gaps
6. Rode limpeza:
   - Procure por abstrações obsoletas
   - Reescreva pages desatualizadas
   - Consolide duplicatas
7. Gere relatório: /haylanderform/knowledge-base/wiki/migrations/audit-YYYY-MM-DD.md
8. Atualizar /haylanderform/knowledge-base/wiki/overview.md com status de limpeza
```

### Execução Ad-Hoc (Quando Solicitado)

```
Desenvolvedor principal solicita:
/audit-cleanup

Você executa mesmo fluxo acima imediatamente.
```

---

## 🗂️ Fontes de Dados Soltos (em `/haylanderform`)

Procure nestas pastas por arquivos `.md`, `.txt`, `.json` que possam estar soltos:

```
/haylanderform/
├── docs/                      ← plan.master.*.md, specs antigos
├── research/                  ← Pesquisa de integrações antigas
├── notes/                     ← Notas de desenvolvimento desorganizadas
├── proposals/                 ← Propostas não-implementadas
├── archive/ (se existir)      ← Documentação obsoleta
├── bot-backend/docs/          ← Docs de submódulos
├── src/                        ← Código frontend
├── bot-backend/src/           ← Código backend/bot
└── integrations/              ← Docs de integrações antigas
```

**Para cada arquivo encontrado:**
1. Leia completamente
2. Determine se é **relevante** ao estado ATUAL do projeto
3. Se relevante: Ingera em `knowledge-base/wiki/`
4. Se obsoleto: Marque como "deprecated" ou remova com justificativa
5. Registre em log

---

## 🧹 Processo de Limpeza de Abstrações

### Identificar Abstrações Obsoletas

Uma página tem "abstração obsoleta" se:
- Descreve feature não-implementada no código atual
- Contradiz decisão mais recente documentada
- Refere integração descontinuada
- Contém informações sobre ferramentas/libs removidas
- Data de "updated" é > 60 dias atrás

### Estratégia de Reescrita

Para cada página obsoleta:

1. **Verifique o código atual**
   - Leia arquivo(s) referenciados na página
   - Entenda implementação real
   - Compare com o que a wiki diz

2. **Reescreva ou Delete**
   - Se ainda é **relevante mas desatualizado:** Reescrever completamente + atualizar frontmatter
   - Se **completamente obsoleto:** Adicionar `deprecated: true` no frontmatter + mover para `wiki/outputs/archived/`
   - Se **contradiz decisão atual:** Reescrever com explicitação de decisão que prevaleceu

3. **Registre no log**
   ```
   ## [YYYY-MM-DD] audit | Página Reescrita: wiki/integrations/old-system.md
   Status anterior: Desatualizado (última atualização 2026-01-15)
   Status novo: Reescrito conforme código atual
   Decisão: Sistema antigo deprecado em favor de novo padrão
   ```

---

## 📊 Exemplo: Limpeza Prática

**Cenário:** Durante auditoria, você encontra `/haylanderform/knowledge-base/wiki/integrations/old-calima.md`

```markdown
# OLD-CALIMA.md (Antes)
---
title: Calima Integration (Legacy)
type: integration
updated: 2025-12-15  ← ANTIGO
---

Sistema Calima integrado via SOAP, conecta ao ERP...
[Descrição desatualizada]
```

**Ações:**

1. Leia código atual: `/haylanderform/bot-backend/src/integrations/` → Calima foi REMOVIDA em favor de Serpro
2. Reescreva:

```markdown
# OLD-CALIMA.md (Depois)
---
title: Calima Integration (Deprecated)
type: integration
deprecated: true
status: archived
updated: 2026-04-21
reason: Integração descontinuada em favor de Serpro (decisão ADR-004)
---

## Status: DEPRECATED ⚠️

Esta integração foi descontinuada em 2026-02-01. Não use em novas implementações.

### Histórico
Calima foi o primeiro ERP integrado via SOAP. Fornecia sincronização de empresas e guias.

### Por que foi removido?
- Veja [ADR-004: Escolher Serpro sobre Calima](../decisions/ADR-004.md)
- Serpro oferece cobertura mais ampla (PGMEI + PGDAS + CND)
- Calima tinha timeout issues crônicas

### Migração
Projetos antigos ainda usando Calima: Nenhum (removido completamente em 2026-02-01)

### Relacionados
- [Serpro Integration](serpro.md) — novo padrão
- [ADR-004](../decisions/ADR-004.md) — decisão
```

3. Registre em log:
```
## [2026-04-21] audit | Página Deprecated: wiki/integrations/calima.md
Motivo: Sistema descontinuado em 2026-02-01
Ação: Marcada como deprecated, movida para archive
Referência: ADR-004 (Serpro prevaleceu)
```

---

## 🔍 Checklist de Auditoria Semanal

Toda terça-feira 14h, execute:

- [ ] Leia `/haylanderform/knowledge-base/wiki/index.md` + `log.md`
- [ ] Procure em `/haylanderform/docs/`, `research/`, `notes/` por arquivos soltos
- [ ] Para cada arquivo solto:
  - [ ] Analise relevância
  - [ ] Ingera ou descarte com justificativa
  - [ ] Registre em log
- [ ] Execute `/memory-lint`
- [ ] Identifique páginas desatualizadas (updated > 60 dias)
- [ ] Para cada página desatualizada:
  - [ ] Verifique código atual em `/haylanderform/src/` e `/haylanderform/bot-backend/src/`
  - [ ] Reescreva ou marque como deprecated
  - [ ] Registre em log
- [ ] Gere relatório: `/haylanderform/knowledge-base/wiki/migrations/audit-YYYY-MM-DD.md`
- [ ] Atualizar `/haylanderform/knowledge-base/wiki/overview.md` com status

---

## 📄 Formato do Relatório de Auditoria

Salve em `/haylanderform/knowledge-base/wiki/migrations/audit-YYYY-MM-DD.md`:

```markdown
---
title: Audit Report
type: audit
tags: [cleanup, consolidation]
created: 2026-04-21
---

# Audit Report — 2026-04-21

## Resumo
- Pages auditadas: 28
- Pages desatualizadas encontradas: 5
- Dados soltos ingeridos: 3
- Pages deprecadas: 2
- Links corrigidos: 7

## Dados Soltos Ingeridos
- docs/research-calima-2025.md → Consolidado em wiki/integrations/ (deprecated)
- notes/bug-certificado.txt → Ingested como wiki/security/certificado-expiracao.md
- proposals/feature-x.md → Marcado como "não-implementado", filed em wiki/outputs/

## Pages Reescritas
- wiki/integrations/calima.md (deprecated)
- wiki/workflows/bot-flow.md (atualizado com BullMQ changes)
- wiki/decisions/ADR-001.md (clarificado status)

## Contradições Encontradas
⚠️ wiki/architecture/frontend.md dizia "BFF pattern em progress" mas está 100% implementado desde 2026-03-01.
   Ação: Reescrita como "BFF pattern implementado e stable"

## Sugestões para Próxima Auditoria
- [ ] Documentar novo fluxo de certificados (expirando)
- [ ] Criar ADR para abandono de Calima
- [ ] Atualizar overview.md com status de MÓDULO 4

## Links Corrigidos
- wiki/features/multi-tenant.md (referência quebrada) → corrigido
- wiki/decisions/ (backlinks inconsistentes) → sincronizados

---

Status: ✅ Auditoria completa
Próxima: 2026-04-28 14h
```

---

## 🔗 Integração com CLAUDE.md Principal (`/haylanderform/CLAUDE.md`)

Este prompt roda **em paralelo**. O `CLAUDE.md` principal em `/haylanderform/` continua:
- Dirigindo desenvolvimento
- Executando `/memory-ingest` após features
- Rodando `/memory-consolidate` segunda 9h

Este prompt (`/haylanderform/prompt.audit.md`):
- Roda terça-feira 14h
- Limpa dados soltos em `/haylanderform/`
- Reescreve abstrações obsoletas em `/haylanderform/knowledge-base/`
- Mantém wiki "afiada"

**Não há conflito:** Um é escrita/consolidation, outro é cleanup/audit.

---

## 📞 Como Ativar

### Automático
Configure no seu schedule:

```
/schedule

Task ID: audit-cleanup-weekly
Description: Weekly knowledge base audit and cleanup
cronExpression: 0 14 * * 2  (terça-feira 14h)
Prompt: /audit-cleanup
```

### Ad-Hoc
Desenvolvedor principal solicita quando necessário:

```
/audit-cleanup

→ Você executa imediatamente, gerando relatório
```

---

## ✅ Summary

Você agora tem:
✅ **Agente Dual:** Principal (development) + Audit (background)
✅ **Limpeza Automática:** Dados históricos migrados + abstrações removidas
✅ **Wiki Afiada:** Sempre alinhada com código real
✅ **Auditoria Semanal:** Terça-feira 14h (separada da consolidação)
✅ **Rastreabilidade:** Relatórios registram tudo que foi limpo

---

**Data:** 2026-04-20  
**Status:** ✅ Pronto para uso  
**Próxima auditoria:** Terça-feira 14h