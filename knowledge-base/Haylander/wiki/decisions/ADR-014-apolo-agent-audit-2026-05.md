---
name: ADR-014 — Auditoria Completa do Agente Apolo (Mai/2026)
description: Auditoria de comportamento, gaps Serpro, formatação, vendas, pipelines e alinhamento com o canvas de workflow
type: decision
tags: [apolo, serpro, audit, comportamento, formatacao, vendas, gaps]
date: 2026-05-09
status: accepted
---

# ADR-014 — Auditoria do Agente Apolo (Mai/2026)

## Contexto

Auditoria solicitada após identificação de falha crítica de falso negativo PGMEI/PGFN (fix em 2026-05-06). Escopo: comportamento geral do agente, gaps Serpro não corrigidos em todos os workflows, formatação de respostas, fluxo de vendas, alinhamento com canvas `apolo-flow.canvas`, pipelines e listas do sistema, e métricas de desenvolvimento.

---

## BUGS CRÍTICOS — Produção em risco

### BUG-1 — `consultar_divida_ativa_serpro` não usa `parseSerproData`
**Arquivo:** `workflow-regularizacao.ts` — tool `consultar_divida_ativa_serpro`

O fix do falso negativo (PDF base64 da DIVIDAATIVA24 v2.4) foi aplicado **apenas em `consultar_pgmei_serpro`** via `parseSerproData()`. A tool de Camada 2 `consultar_divida_ativa_serpro` chama `checkCnpjSerpro(gate.cnpj, 'DIVIDA_ATIVA', ...)` e devolve o raw direto para a IA. Se Serpro retornar PDF em vez de JSON nessa Camada 2, a IA recebe base64 opaco e pode concluir "sem dívidas" — falso negativo não corrigido.

**Fix necessário:** Envolver o retorno de `consultar_divida_ativa_serpro` em `parseSerproData()` e retornar o envelope estruturado (igual ao padrão da Camada 1).

### BUG-2 — `verificar_serpro_pos_ecac` usa CNPJ errado para multi-empresa
**Arquivo:** `workflow-regularizacao.ts:548`

```ts
let cnpj = p.cnpj as string | undefined;   // ← usa contexto da sessão
if (!cnpj && p.id) {
    const res = await pool.query('SELECT cnpj FROM leads WHERE id = $1 ...);
```

Problema: não consulta `cnpj_ativo`. `resolveUserCnpjAndProcuracaoStatus` (usada em todas as outras tools) consulta `cnpj_ativo || cnpj` do banco — ignorando o contexto da sessão para segurança. `verificar_serpro_pos_ecac` **não** faz isso. Para clientes com múltiplos CNPJs, verificaria a procuração da empresa errada.

**Fix necessário:** Substituir por `SELECT cnpj_ativo, cnpj FROM leads WHERE id = $1` e usar `cnpj_ativo || cnpj`, igual a `resolveUserCnpjAndProcuracaoStatus`.

### BUG-3 — `detectarDebitosNoPdf` escaneia apenas primeiros 800 chars
**Arquivo:** `workflow-regularizacao.ts:287`

```ts
const resumo_pdf = texto.slice(0, 800).replace(/\s+/g, ' ').trim();
```

A detecção de dívidas via keywords é feita em `texto.toUpperCase()` (certo), mas o `resumo_pdf` retornado para a IA é cortado nos primeiros 800 caracteres. PDFs do Serpro têm headers e metadados antes do conteúdo relevante — as informações de débito podem aparecer depois dos 800 chars. A IA recebe contexto truncado e pode não identificar o valor ou o período.

**Fix necessário:** Aumentar para 2000–3000 chars ou implementar extração seletiva dos blocos relevantes.

### BUG-4 — Red flag 24h para silêncio: sem automação
**Prompt:** BASE_PROMPT — "sumir sem resposta por mais de 24h após receber o tutorial = red_flag"

O agente só executa quando recebe mensagem. Se o cliente simplesmente parar de responder, nenhuma mensagem chega, o agente nunca é invocado, e o red_flag nunca é marcado. O polling de 24h do canvas (`poll_24h` node) é um estado **passivo** — só funciona se o cliente mandar algo.

**Fix necessário:** Cron job que, após `trackResourceDelivery(leadId, 'link-ecac', ...)`, agenda verificação em 24h via BullMQ (`follow-up` queue). Se `procuracao_ativa = false` após 24h, marca `red_flag` e notifica atendente.

---

## GAPS DE COMPORTAMENTO DO AGENTE

### GAP-1 — Serpro results não são salvos no banco automaticamente
Após `consultar_pgmei_serpro` retornar `COM_DEBITO`, o prompt instrui o agente a "informar ao cliente os anos com pendências". Mas não instrui a chamar `update_user(tem_divida=true, anos_com_debito=[...])`. O Vendedor (Icaró) que recebe o lead `qualified` não tem os dados Serpro estruturados no DB — depende de a IA ter incluído isso em `observacoes`.

**Fix necessário:** Adicionar instrução explícita em `REGULARIZACAO_RULES`:
```
Após receber resultado de consultar_pgmei_serpro:
- Se COM_DEBITO: chame update_user(tem_divida=true, observacoes="PGMEI: débitos em [anos]. PGFN: [status]")
- Se SEM_DEBITO: chame update_user(tem_divida=false)
- Se INCONCLUSIVO: chame update_user(observacoes="Resultado inconclusivo PGMEI/PGFN — verificação necessária")
```

### GAP-2 — Coleta mandatória (CNPJ, regime, certificado) ausente em COMERCIAL_RULES
O canvas mostra `coleta_mand` como processo **paralelo e não-bloqueante** desde a primeira mensagem: "Sempre coletar ao longo da conversa: CNPJ + Razão Social, Regime, Certificado Digital A1?". Isso aparece em `REGULARIZACAO_RULES` mas **não em `COMERCIAL_RULES`**.

Clientes que entram pelo fluxo comercial (abertura de empresa, contabilidade digital) — sem mencionar dívida — nunca passam pelo fluxo de regularização e portanto nunca triggeram essa coleta. O Integra Contador não recebe os dados para cadastrar a empresa.

**Fix necessário:** Adicionar seção em `COMERCIAL_RULES`:
```
### Coleta Mandatória (paralela, não-bloqueante)
Ao longo de TODA conversa comercial, colete gradualmente:
- CNPJ (consultar_cnpj_publico imediatamente ao receber)
- Regime tributário (MEI ou Simples Nacional?)
- Possui Certificado Digital A1?
Não pergunte tudo de uma vez. Intercale naturalmente na conversa.
```

### GAP-3 — Validação de regime antes de Camada 1
`consultar_pgmei_serpro` é exclusiva para MEI (PGMEI = Programa Gerador do MEI). Para clientes Simples Nacional, essa tool retorna erro ou dados incorretos. O prompt não instrui a verificar `is_mei` antes de chamar a Camada 1.

**Fix necessário:** Adicionar validação no prompt ou na tool: se `is_mei = false` no userData, não usar `consultar_pgmei_serpro` e orientar para SITFIS/PGDASD.

### GAP-4 — "Retornante" não tratado explicitamente no prompt
Canvas: "Roteador → Retornante → retoma contexto anterior". O código carrega histórico (15 mensagens) mas o prompt não instrui o agente a reconhecer explicitamente que é um retorno. O agente pode tratar um cliente retornante como novo, perguntar o CNPJ de novo, etc.

**Fix necessário:** Adicionar em `BASE_PROMPT`:
```
### Cliente Retornante
Se {{USER_DATA}} já tiver nome/cnpj preenchidos E houver histórico de conversa:
- Reconheça o contexto: "Oi [nome], bem-vindo de volta!"
- Retome de onde parou: "Vi que você estava [procuração/regularizando/aguardando]..."
- Não repita perguntas já respondidas
```

### GAP-5 — Formatação de resultados Serpro sem template
O prompt diz "use resumo_executivo como base, adaptando para linguagem simples". Sem template, cada invocação formata diferente. No WhatsApp, isso resulta em inconsistência:
- Às vezes retorna bullet points, às vezes parágrafo
- Às vezes usa emojis, às vezes não
- `|||` separador nem sempre usado para resultados multi-linha

**Fix necessário:** Template explícito em `REGULARIZACAO_RULES`:
```
### Template de apresentação de resultado Serpro (WhatsApp)
Use SEMPRE este formato:
"Consultei o CNPJ [XX.XXX.XXX/0001-XX] agora. Aqui está o resultado: |||
📊 *PGMEI (Guias DAS):* [COM_DEBITO: débitos em ANOS / SEM_DEBITO: situação regular ✅ / INCONCLUSIVO: não consegui confirmar ⚠️] |||
📊 *PGFN (Dívida Ativa):* [idem] |||
[Se COM_DEBITO]: Vamos regularizar isso? Posso te mostrar as opções agora."
```

### GAP-6 — `enviar_formulario` adicionado como "tool perdida" sem documentação
No `index.ts`:
```ts
// Adicionando a tool perdida do apolo
{ name: 'enviar_formulario', ... }
```
Esta tool não está em nenhum workflow file e o comentário sugere que foi esquecida. Não há documentação de quando usar, o que envia, nem qual é o formulário referenciado.

**Ação necessária:** Documentar em `COMERCIAL_RULES` quando usar `enviar_formulario` vs `enviar_link_reuniao` vs `iniciar_coleta_situacao_whatsapp`.

---

## GAPS DE VENDAS (COMERCIAL E ICARÓ)

### VENDAS-1 — Nenhuma estratégia baseada no tamanho da dívida
`COMERCIAL_RULES` tem anchoring genérico: "Cada mês de DAS acumula multa de 0,33%...". Mas não diferencia estratégia por tamanho:
- R$500–R$2k de dívida: urgência menor, foco em praticidade
- R$5k–R$20k: risco real de cobrança/execução, urgência alta
- +R$20k: situação grave, pode ter inscrição em dívida ativa, urgência crítica

**Fix necessário:** Adicionar em `COMERCIAL_RULES` um bloco de anchoring escalonado.

### VENDAS-2 — Trial close muito genérico para contexto brasileiro de MEI
As escolhas binárias propostas ("essa semana ou na próxima?") funcionam para leads já quentes. Para MEIs brasileiros que costumam procrastinar por medo de custo e processo burocrático, faltam:
- Âncoras de comparação (custo do serviço vs multa acumulada)
- Linguagem mais próxima ("Deixa eu te mostrar quanto já saiu de juros desde que o DAS venceu")
- Pergunta específica pós-Serpro: "Você sabia que esse valor pode ser parcelado em até 60x?"

### VENDAS-3 — Icaró (Vendedor) é ponto cego total na KB
O roteador envia leads `qualified` (MQL/SQL) para `runVendedorAgent`. Não existe nenhuma documentação na KB sobre:
- Qual é o prompt do Icaró
- Quais tools ele tem
- Qual é a lógica de fechamento
- Quais são os critérios de sucesso

Isso é um risco operacional: se o Icaró estiver mal configurado, todos os leads qualificados caem em buraco negro.

**Ação necessária:** Ler e documentar `bot-backend/src/ai/agents/icaro/` (ou equivalente) em `features/icaro-vendedor.md`.

### VENDAS-4 — Nenhum follow-up automatizado para leads frios
Leads que param de responder no meio do fluxo (após BANT mas antes de qualificar) ficam presos em estado `lead` para sempre. A fila `follow-up` existe no BullMQ mas não há documentação de quando é disparada para leads semi-qualificados.

---

## PIPELINES E LISTAS DO SISTEMA

### PIPELINE-1 — `ADMIN_PHONES` hardcoded com número real
**Arquivo:** `workflow-regularizacao.ts:17`
```ts
const ADMIN_PHONES = (process.env.ADMIN_PHONES || '31982354127,3193442672')
```
O default inclui números reais de telefone. Se `ADMIN_PHONES` não estiver no `.env` de produção, qualquer consulta Serpro de um desses números bypassa a verificação de procuração. Isso é um gap de segurança/configuração.

**Fix:** Remover o default com números reais. Falhar explicitamente se `ADMIN_PHONES` não estiver no `.env`.

### PIPELINE-2 — Inconsistência nos PRESETS por regime
Três fontes diferentes listam presets diferentes:

| Fonte | `simples` preset |
|---|---|
| `plan.master.integra.md` | `['PGDASD', 'DEFIS', 'PARCELAMENTO_SN_CONSULTAR', 'CND', 'CAIXAPOSTAL']` |
| `knowledge-base/integrations/serpro.md` | `['PGDASD', 'DEFIS', 'CND', 'CAIXAPOSTAL']` |
| Código real (verificar) | desconhecido até inspeção |

Além disso: `CAIXAPOSTAL` (sem underscore, usado em preset) vs `CAIXA_POSTAL` (com underscore, key correta no SERVICE_CONFIG — correção do ADR-004).

**Fix:** Verificar código fonte real em `bot-backend/src/routes/integra/empresas.ts` e sincronizar as três fontes.

### PIPELINE-3 — `follow-up` queue não documentada
A fila BullMQ `follow-up` existe mas não há docs sobre:
- Quando jobs são adicionados
- Quais delays são usados (5min? 24h?)
- O que o worker faz (envia mensagem? muda status?)
- Integração com red_flag

---

## GAPS NA KB — MÉTRICAS E PADRÕES

### KB-1 — Zero métricas de desempenho documentadas
A KB não tem nenhuma página sobre métricas. Não sabemos:
- Taxa de qualificação (% leads → MQL/SQL)
- Taxa de conversão Serpro (% consultas com sucesso)
- Taxa de fallback humano (% conversas → chamar_atendente)
- Tempo médio de resposta do bot
- Taxa de red_flag

Para este tipo de solução (WhatsApp SDR + Serpro), benchmarks esperados:
- Qualificação: 15–30% de leads que respondem
- Serpro sucesso: >90% com procuração ativa
- Fallback humano: <20% (acima = prompt ou fluxo quebrado)
- Red flag: <10% (acima = problema no argumento ou público errado)

### KB-2 — Padrões de desenvolvimento não documentados
Padrões que emergiram no desenvolvimento mas não estão na KB:
- Tool functions sempre retornam `JSON.stringify({status, ...})` — nunca string raw
- Todos os gates Serpro usam `resolveUserCnpjAndProcuracaoStatus` — nunca acessam CNPJ do contexto
- Delay de 4000ms antes de `SIT_FISCAL_RELATORIO` é obrigatório (Serpro processa assincronamente)
- `processMessageSegments` com delay sequencial para não saturar Evolution API

### KB-3 — Canvas `apolo-flow.canvas` não tem ADR associado
O canvas é a fonte de verdade visual do fluxo mas não está referenciado no `index.md` nem tem uma página de features/workflow que o documente em texto. Discrepâncias entre canvas e código não têm onde ser rastreadas.

---

## ALINHAMENTO CANVAS vs CÓDIGO — DELTA

| Nó do Canvas | Código | Alinhado? | Observação |
|---|---|---|---|
| `entry` — cliente envia mensagem | `webhook/whatsapp` | ✅ | |
| `router` — novo/retornante | `AGENT_MAP` por estado | ⚠️ | Retornante não tratado explicitamente no prompt |
| `coleta_mand` — paralela desde 1ª msg | `REGULARIZACAO_RULES` apenas | ❌ | Ausente em `COMERCIAL_RULES` |
| `first_msg` — `enviar_apresentacao_comercial` | Tool existe | ✅ | |
| `intent` — identifica intenção | Implícito via LLM | ✅ | Não é tool explícita |
| `cnpj_check` — `consultar_cnpj_publico` | Tool existe | ✅ | |
| `cnpj_data` — confirma dados | LLM + update_user | ✅ | |
| `cadastro_empresa` — `update_user` | Tool existe | ✅ | |
| `proc_check` — verifica via Serpro antes de pedir | `resolveUserCnpjAndProcuracaoStatus` | ⚠️ | Check passivo, não explícito no prompt |
| `solicitar_proc` — `enviar_processo_autonomo` | Tool existe | ✅ | |
| `recusa_proc` — Red Flag | update_user(red_flag) | ✅ | |
| `poll_24h` — polling até 24h | Nenhum cron automático | ❌ | **BUG-4** — sem automação |
| `dificuldade_ecac` — notifica + encerra | Parcial via chamar_atendente | ⚠️ | Sem tool dedicada |
| `cache_check` — `consultar_dados_cliente` | REGULARIZACAO_RULES menciona | ⚠️ | Tool existe? Verificar |
| `pgmei` — Camada 1 | `consultar_pgmei_serpro` | ✅ | |
| `camada2` — se necessário | Tools C2 existem | ✅ | BUG-1 em divida_ativa |
| `resultado` — apresenta ao cliente | LLM com resumo_executivo | ⚠️ | **GAP-5** sem template |
| `bant` — conversacional, nunca lista | `COMERCIAL_RULES` | ✅ | |
| `classificacao` — SQL/MQL/DESQ/RED | COMERCIAL_RULES | ✅ | |
| `bant_abertura` — BANT para MEI novo | COMERCIAL_RULES | ✅ | |
| `sql_exit` — `agendar_reuniao_fechamento` | Tool existe | ✅ | |
| `link_mql` — `enviar_link_reuniao` | Tool existe | ✅ | |
| `icaro` — fase de fechamento | `runVendedorAgent` | ❌ | **VENDAS-3** não documentado |
| `red_flag` — update_user + notifica | update_user + chamar_atendente | ⚠️ | Notificação não automática |
| `encerra` — desqualificado + feedback | update_user(desqualificado) | ✅ | Feedback não implementado |

---

## AÇÕES RECOMENDADAS (prioridade)

### P0 — Bugs ativos:
- [ ] Corrigir `consultar_divida_ativa_serpro` para usar `parseSerproData` (BUG-1)
- [ ] Corrigir `verificar_serpro_pos_ecac` para usar `cnpj_ativo` do banco (BUG-2)
- [ ] Aumentar scan de PDF de 800 para 2500 chars em `detectarDebitosNoPdf` (BUG-3)
- [ ] Remover default de `ADMIN_PHONES` hardcoded (PIPELINE-1)

### P1 — Gaps de comportamento que afetam qualidade:
- [ ] Adicionar instrução `update_user` após resultado Serpro (GAP-1)
- [ ] Adicionar `coleta_mand` em COMERCIAL_RULES (GAP-2)
- [ ] Adicionar validação `is_mei` antes de Camada 1 (GAP-3)
- [ ] Adicionar template de formatação de resultado Serpro (GAP-5)
- [ ] Implementar cron de red_flag para 24h silêncio (BUG-4)

### P2 — Documentação e KB:
- [ ] Ler e documentar agente Icaró/Vendedor (VENDAS-3)
- [ ] Verificar e sincronizar PRESETS por regime (PIPELINE-2)
- [ ] Criar página `wiki/metrics/apolo-benchmarks.md`
- [ ] Criar página `wiki/features/icaro-vendedor.md`
- [ ] Referenciar `apolo-flow.canvas` no `index.md`
- [ ] Documentar `follow-up` queue no `architecture/queues.md`
- [ ] Documentar `enviar_formulario` em COMERCIAL_RULES (GAP-6)
- [ ] Adicionar tratamento de "retornante" no prompt (GAP-4)

---

## How to Apply

Ao trabalhar no bot:
1. Qualquer tool Serpro nova deve usar `parseSerproData()` antes de retornar dados para a IA
2. Qualquer gate de CNPJ deve usar `resolveUserCnpjAndProcuracaoStatus` — nunca `p.cnpj` direto
3. Toda instrução de "fazer X" no prompt deve ter instrução explícita de "depois salvar com update_user"
4. PGMEI só para MEI — verificar `is_mei` antes de recomendar Camada 1
