---
title: ADR-0002 — Redesign do Endpoint /serpro/clients para Incluir Leads com Procuração
type: decision
date: 2026-04-22
status: implemented
---

# ADR-0002 — Redesign de /serpro/clients

## Problema

O endpoint `GET /serpro/clients` (aba "Minhas Consultas" no admin) só mostrava CNPJs que tinham entrada na tabela `consultas_serpro`. Leads com `procuracao_ativa = true` mas sem consulta prévia ficavam invisíveis — o administrador não conseguia ver seus próprios clientes ativos até fazer a primeira consulta.

## Impacto

- Admin não conseguia ver leads com procuração ativa antes da primeira consulta
- O CNPJ do próprio administrador (com procuração MEI) não aparecia na ferramenta
- Fluxo: admin marcava procuração como ativa → ia para "Minhas Consultas" → CNPJ ausente → confusão

## Solução Implementada

Redesenhado o endpoint para usar `leads` como tabela primária (ao invés de `consultas_serpro`).

### Lógica anterior
```sql
-- Partia de consultas_serpro
WITH LatestConsultations AS (SELECT cnpj, MAX(created_at) FROM consultas_serpro WHERE source='admin')
...LEFT JOIN leads l ON cnpj match
WHERE l.id IS NOT NULL  -- só aparece se lead existir E tiver sido consultado
```

### Nova lógica (source=admin/default)
```sql
-- Parte de leads com procuração ativa
SELECT ... FROM leads l
LEFT JOIN leads_processo lp ON l.id = lp.lead_id
LEFT JOIN consultas_serpro c ON cnpj match AND source filter
WHERE (procuracao_ativa OR procuracao OR c.id IS NOT NULL)
GROUP BY ... ORDER BY MAX(c.created_at) DESC NULLS LAST
```

### Comportamento resultante
- **Leads com procuração ativa, sem consulta:** aparecem no topo (data_ultima_consulta=null)
- **Leads com procuração ativa + consultas:** aparecem ordenados por data da última consulta
- **Leads sem procuração mas consultados:** também aparecem (comportamento mantido)
- **source=test:** comportamento original preservado (CNPJs consultados sem lead correspondente)

### Limite aumentado
De 20 para 50 registros para acomodar a carteira maior.

## Alternativas Consideradas

1. **Novo endpoint `/serpro/procuracao-leads`**: Rejeitado — exigiria mudança no frontend
2. **UNION approach**: Considerado, mas a abordagem lead-first é mais limpa e evita duplicatas
3. **Mudança só de UI**: Rejeitado — o bug estava na query do backend

## Referências
- `src/routes/serpro-api.ts` — endpoint modificado
- `src/app/(admin)/serpro/page.tsx` — UI "Minhas Consultas" (não alterada)
- `src/app/(admin)/serpro/carteira/page.tsx` — alternativa que JÁ mostrava todos os leads com CNPJ
