---
title: Apolo Bot — Auditoria Completa
type: feature
tags: [bot, apolo, audit, whatsapp, qualificacao]
created: 2026-04-20
updated: 2026-04-20
status: current
source: audit.apolo.md
---

# Apolo Bot — Auditoria Completa (2026-04-20)

**Resultado geral: 95% operacional.** 2 gaps críticos a implementar.

---

## Status por Dimensão

| Dimensão | Status | Ação |
|---|---|---|
| Bot funcionando | ✅ SIM | Apenas validar |
| Comunicação backend | ✅ SIM | Apenas validar |
| Dados do frontend → bot | ⚠️ PARCIAL | Implementar endpoint |
| Comunicação DB | ✅ SIM | Apenas validar |
| Comunicação Serpro | ✅ SIM (com restrições) | Apenas validar |
| 3 cérebros + roteador | ✅ SIM | Apenas validar |
| Modelo LLM | ✅ gpt-4o-mini | Considerar A/B test |
| Prompts claros | ✅ SIM | Apenas validar |
| Ciente de qualificação | ✅ SIM | Apenas validar |
| Alimenta tabelas DB | ✅ SIM | Apenas validar |
| Sabe que é qualificação (não venda) | ✅ SIM | Apenas validar |
| Ferramentas (20+) | ✅ SIM | Apenas validar |
| Diferencia atendimento/reunião | ⚠️ PARCIAL | Adicionar regra prompt |
| Consegue rotear | ✅ SIM | Apenas validar |

---

## Arquitetura: 3 Cérebros + Roteador

```
Estado do Usuário    → Agente
─────────────────────────────────────
lead (novo)          → APOLO (SDR)
qualified (MQL/SQL)  → VENDEDOR (Icaró)
customer             → ATENDENTE (Apolo Customer)
attendant (humano)   → Sem agente (humano direto)
```

O roteador (`message-debounce.ts`) usa `AGENT_MAP` com `resolveUserState()`.
Suporta override manual via Redis (`setAgentRouting(phone, agent)`).

**Transição automática:**
`lead` → Apolo qualifica → `update_user(qualificacao="MQL")` → próxima msg usa Vendedor → cliente=true → Atendente.

---

## Fluxo Serpro (Camadas)

- **Camada 1 (padrão):** `consultar_pgmei_serpro` — PGMEI + PGFN
- **Camada 2 (avançado):** `consultar_divida_ativa_serpro` — dívida completa

**Restrição crítica:** Nenhuma consulta sem procuração e-CAC confirmada.

Fluxo: menciona dívida → `iniciar_fluxo_regularizacao` → Opção A (Procuração) → `enviar_processo_autonomo` → cliente faz e-CAC → `verificar_serpro_pos_ecac` → `marcar_procuracao_concluida` → `consultar_pgmei_serpro`.

---

## Regras de Qualificação

Precedência (ordem de avaliação):
1. **[CRÍTICA]** faturamento ≤ 5k E sem dívida → DESQUALIFICADO
2. faturamento > 10k → MQL
3. tem dívida → MQL
4. quer abrir empresa → MQL (exceto se Regra 1)
5. nenhum → DESQUALIFICADO

---

## Tabelas Alimentadas pelo Bot

| Tabela | Tool responsável |
|---|---|
| `leads` | `update_user` |
| `leads_processo` | `update_user` |
| `leads_recurso` | `trackResourceDelivery` |
| `chat_history` | `addToHistory` (automático) |
| `leads_serpro_consulta` | `saveConsultation` |

---

## Gaps Críticos (a implementar)

### 1. Frontend → Bot Context Update
**Problema:** Frontend não pode injetar contexto proativamente no bot.
**Solução:** Endpoint `POST /api/bot/context-update` → Redis `bot_context:{phone}` → carregado em `prepareAgentContext()`.

### 2. Diferenciação Atendimento vs Reunião
**Problema:** Sem regra explícita de quando oferecer reunião vs atendimento por chat.
**Solução:** Adicionar ao `COMERCIAL_RULES`:
- Lead novo → chat (sem reunião)
- MQL/SQL qualificado → "consultor entrará em contato para agendar"
- Cliente pede reunião explicitamente → `enviar_link_reuniao()`

---

## Otimizações Futuras

- A/B test: `gpt-4o-mini` vs `gpt-4o` (mini: $0.15/K, 4o: $3/K — 20x mais caro)
- Hybrid routing: mini por padrão, 4o só para `qualified` leads
- Métricas: latência, taxa qualificação, fallback humano %
