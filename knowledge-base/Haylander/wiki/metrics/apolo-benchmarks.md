---
name: Métricas e Benchmarks — Agente Apolo
description: KPIs esperados, thresholds de alerta e padrões de desenvolvimento para o bot WhatsApp Apolo
type: reference
tags: [metrics, kpis, benchmarks, apolo, qualidade]
created: 2026-05-09
status: baseline
---

# Métricas e Benchmarks — Agente Apolo

Referência para avaliar saúde do bot. Benchmarks baseados em padrões de SDR bots de contabilidade + WhatsApp conversacional. Nenhuma dessas métricas está sendo coletada ainda — isso é o baseline alvo.

---

## KPIs do Funil Conversacional

| Métrica | Baseline Esperado | Alerta Vermelho | O que significa se ruim |
|---|---|---|---|
| Taxa de resposta (leads que respondem ao menos 1x) | 40–60% | <25% | Qualidade do lead ou timing ruim |
| Taxa de qualificação (lead → MQL/SQL) | 15–30% | <10% | Prompt de coleta BANT falho ou público errado |
| Taxa Serpro sucesso (consultas com `status: success`) | >90% | <70% | Procuração, certificado ou config |
| Taxa de fallback humano (`chamar_atendente`) | 5–15% | >25% | Fluxo quebrado ou prompt inadequado |
| Taxa de red_flag | 3–8% | >15% | Público inadequado ou argumento fraco |
| Conversão MQL → Reunião agendada | 20–40% | <10% | Icaró/vendedor com problema |

---

## KPIs de Performance Técnica

| Métrica | Alvo | Alerta |
|---|---|---|
| Tempo resposta bot (webhook → primeira msg) | <4s | >8s |
| Taxa de erro BullMQ (jobs falhando) | <2% | >5% |
| Taxa de deduplicação (msg duplicada processada) | 0% | >0.5% |
| PGMEI anos com resultado `INCONCLUSIVO` | <10% dos anos | >25% |

---

## Qualidade de Respostas (avaliação manual periódica)

Avaliar por amostragem (10 conversas/semana):

| Critério | Ruim | Bom | Ótimo |
|---|---|---|---|
| Uso de `|||` para quebrar mensagens longas | Parágrafos monolíticos | Às vezes divide | Sempre divide em WhatsApp-sized |
| BANT nunca em lista numerada | Usa lista | Às vezes lista | Sempre conversacional |
| Não repete conteúdo de tools | Repete links/PDF | Às vezes | Nunca duplica |
| Apresentação resultado Serpro | JSON bruto | Texto claro | Template padrão + emojis |
| Update_user após resultado Serpro | Nunca | Às vezes | Sempre |
| Trial close após cada resposta | Sem gancho | Às vezes | Toda resposta termina com ação |

---

## Padrões de Desenvolvimento (regras emergidas em produção)

### Tools Serpro
- Toda tool Serpro nova **deve** usar `parseSerproData()` antes de retornar dados para a IA
- Qualquer gate de CNPJ deve usar `resolveUserCnpjAndProcuracaoStatus` — nunca `p.cnpj` direto do contexto
- Tool functions sempre retornam `JSON.stringify({status: 'success'|'error'|'aviso', ...})`
- Nunca retornar string raw — IA pode confundir com instrução

### Prompts
- Toda instrução "faça X" deve ter instrução complementar "depois salve com update_user(campo=valor)"
- Respostas para cliente **sempre** via `|||` para mensagens >2 linhas
- Camada 1 (`consultar_pgmei_serpro`) só para `is_mei = true`
- INCONCLUSIVO nunca vira "sem dívidas" — sempre "não consegui confirmar"

### Infraestrutura
- Delay 4000ms obrigatório entre `SIT_FISCAL_SOLICITAR` e `SIT_FISCAL_RELATORIO` (Serpro async)
- `processMessageSegments` com delay sequencial para não saturar Evolution API rate limit
- `ADMIN_PHONES` deve vir do `.env` — sem defaults hardcoded com números reais

---

## Como Coletar (quando implementar)

Campos sugeridos para tabela `bot_metrics`:
```sql
CREATE TABLE bot_metrics (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  evento VARCHAR(50),    -- 'qualificou', 'serpro_sucesso', 'red_flag', 'fallback_humano'
  agente VARCHAR(20),    -- 'apolo', 'icaro', 'atendente'
  duracao_ms INTEGER,
  metadados JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Eventos a logar:
- `lead_primeira_resposta` — lead respondeu pela primeira vez
- `qualificou_mql` / `qualificou_sql` / `desqualificou`
- `serpro_chamado` / `serpro_sucesso` / `serpro_erro` / `serpro_inconclusivo`
- `procuracao_solicitada` / `procuracao_concluida` / `procuracao_recusada`
- `reuniao_agendada` / `fallback_humano` / `red_flag`
