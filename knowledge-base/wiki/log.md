---
name: Log Operacional
description: Registro append-only de operações, decisões e mudanças significativas
type: log
---

# Log Operacional

## [2026-05-29 13:45] [INGEST] Auditoria Serpro de 23 APIs + tabela de mensagens DASN-SIMEI.
- Files affected: [[serpro-audit-2026-05-29]], [[serpro]], [[index]]
- Sources: `raw/docs/relatorio_serpro_2026_05_29.md`, apicenter → integra-mei/dasnsimei/mensagens
- Context: Script de auditoria sobre CNPJ 23950473000155 confirmou que **apenas `DASN_SIMEI` (HTTP 403) está fora do pacote**. Demais HTTP 400 vêm de payload incompleto do Admin (mês ausente, CPF ausente, numeroDas ausente, statusLeitura ausente). Adicionada Armadilha #9 em `serpro.md` e ingerida tabela completa de mensagens DASN-SIMEI (avisos, entradas incorretas, erros) para uso futuro caso a API seja contratada.
- Canvas: ingest-2026-05-29-1, file_serpro_audit_20260529, save-date-2026-05-29

## [2026-05-15 12:33] [FIX] Frontend Serpro usa apenas PGFN_API para Dívida Ativa.
- Files affected: [[serpro]]
- Context: Removidos aliases visuais `DIVIDA_ATIVA`/`PGFN_CONSULTAR`, rota admin passa a chamar API PGFN avulsa e payloads básicos de Caixa Postal/DCTFWeb foram ajustados após auditoria de 3 CNPJs.

## [2026-05-15 09:53] [FIX] PGFN separada do Integra Contador com token próprio.
- Files affected: [[serpro]]
- Context: Criado cliente `bot-backend/src/lib/pgfn.ts`, adicionadas variáveis `PGFN_*` no `.env` e fluxo do Apolo passa a consultar Dívida Ativa pela API avulsa da Serpro.

## [2026-05-13 10:57] [TASK] Documentado decisão arquitetural sobre uso da Brasil API
- Files affected: [[brasil-api]]
- Context: Explicitação da Brasil API como motor oficial para consultas públicas simples, reservando Serpro para dados fiscais sensíveis autenticados (redução de custos e rate limits).

## [2026-05-09 20:26] [TASK] Estudo técnico da PGFN consolidado na integração Serpro.
- Files affected: [[serpro]], [[log]]
- Context: Documentado diagnóstico de PGFN (fluxo Camada 1/2, alias operacional, riscos multi-empresa e recomendações de hardening) com foco em operação real do bot e painel admin.

## 2026-05-09 — Implementação P0/P1 + BUG-4 + Fix Serpro Timeout

**P0 bugs corrigidos (workflow-regularizacao.ts):**
- BUG-1: `consultar_divida_ativa_serpro` agora passa envelope por `parseSerproData()` — PDFs de DIVIDA_ATIVA via Camada 2 detectados corretamente
- BUG-2: `verificar_serpro_pos_ecac` usa `SELECT cnpj_ativo, cnpj FROM leads WHERE id = $1` — elimina risco multi-empresa
- BUG-3: Truncamento `detectarDebitosNoPdf` aumentado 800→2500 chars
- BUG-5: `ADMIN_PHONES` sem fallback hardcoded com números reais

**Fix serpro.ts:**
- `req.on('timeout', ...)` adicionado — destrói socket com `req.destroy()`, rejeitando a Promise corretamente. Antes o socket ficava pendurado silenciosamente após 30s.

**Fix carteira/page.tsx:**
- `fetchCarteira` tem catch + banner de erro visível na UI
- `toggleProcuracao` mostra alert em vez de apenas logar no console

**P1 gaps de comportamento (prompts):**
- GAP-1: `update_user` obrigatório após resultado Serpro — adicionado em REGULARIZACAO_RULES
- GAP-2: Seção COLETA MANDATÓRIA adicionada em COMERCIAL_RULES
- GAP-3: Gate `is_mei` antes de Camada 1 — adicionado em REGULARIZACAO_RULES
- GAP-4: Seção "Cliente Retornante" adicionada em BASE_PROMPT
- GAP-5: Template WhatsApp para resultado Serpro (COM_DEBITO / SEM_DEBITO / INCONCLUSIVO) adicionado em REGULARIZACAO_RULES

**BUG-4 implementado (cron/index.ts):**
- Cron job #8 (a cada hora): detecta leads com tutorial e-CAC enviado há >24h sem procuração confirmada → marca `red_flag` + notifica Haylander. Redis TTL 7d evita notificações duplicadas.

---

## 2026-05-09 — Auditoria Completa Agente Apolo (ADR-014)

Auditoria de comportamento, gaps Serpro, formatação, vendas, pipelines e alinhamento canvas.

**Bugs críticos identificados:**
- BUG-1: `consultar_divida_ativa_serpro` (Camada 2) não usa `parseSerproData` — falso negativo ainda possível via Camada 2
- BUG-2: `verificar_serpro_pos_ecac` usa `p.cnpj` do contexto em vez de `cnpj_ativo` do banco — multi-empresa errado
- BUG-3: `detectarDebitosNoPdf` trunca em 800 chars — débitos depois desse ponto invisíveis
- BUG-4: Red flag 24h silêncio sem automação — agente não detecta ausência de mensagem

**Gaps de comportamento:**
- update_user não instruído após resultado Serpro (DB não atualizado)
- coleta_mand ausente em COMERCIAL_RULES (só existe em REGULARIZACAO_RULES)
- sem validação `is_mei` antes de Camada 1
- sem template explícito de formatação de resultado Serpro no WhatsApp

**KB enriquecida:**
- ADR-014 criado em `decisions/`
- `wiki/metrics/apolo-benchmarks.md` criado (KPIs, benchmarks, padrões)
- `integrations/serpro.md` atualizado com 2 novos gaps e armadilhas 7 e 8
- `index.md` atualizado com seção Métricas e ADR-014

---

## 2026-05-06 — Fix: Falso Negativo de Dívidas no PGMEI/PGFN

### Problema identificado (produção)
CNPJ 23950473000155 reportado pelo cliente Haylander: bot informava "sem dívidas" mesmo com dívida ativa na PGFN e guias em aberto no PGMEI.

**Root cause:** O serviço DIVIDAATIVA24 (v2.4) da Serpro pode retornar o campo `dados` como PDF em base64 em vez de JSON estruturado. A tool `consultar_pgmei_serpro` devolvia o envelope bruto para a IA — que via `dados: "<base64>"` (string opaca) e `documentos: []` e concluía erroneamente "sem dívidas".

### Correções aplicadas
- `workflow-regularizacao.ts`: nova função async `parseSerproData()` que tenta `JSON.parse(dados)` e, em caso de falha, passa o base64 pelo `pdf-parse` para extrair texto legível
- `extractPdfText()`: decodifica base64 → Buffer → pdf-parse → texto
- `detectarDebitosNoPdf()`: lista de palavras-chave PT-BR para PGMEI/PGFN (DEVEDOR, GUIA EM ABERTO, DÍVIDA ATIVA, etc.)
- Cobre também PDFs em `env.documentos[].conteudo`
- Prompt `REGULARIZACAO_RULES` reforçado: IA só pode dizer "sem dívidas" com `tem_debitos_detectado === false` explícito em PGMEI e PGFN

### Decisões tomadas
- `pdf-parse` já estava instalado no projeto — nenhuma dependência nova
- Regra conservadora: se inconclusivo (`null`) → IA diz "não foi possível confirmar", nunca "sem dívidas"
- `texto_pdf` limitado a 800 chars para não estourar contexto da IA

---

## 2026-04-29 — Auditoria e Reforma do Agente Apolo

### Problemas identificados
- Prompt monolítico (~300 linhas) causando obediência parcial às regras
- `chamar_atendente` duplicado em `getSharedTools` e `getSuporteTools`
- `select_User` e `consultar_dados_cliente` duplicados — bot não sabia qual usar
- Descrições de tools sem triggers explícitos — escolha aleatória pelo LLM
- `l.observacoes` referenciado em query SQL mas coluna inexiste na tabela `leads`
- Fluxo de regularização com duplo disparo (tool envia mensagem + LLM também responde)
- Handoff Apolo→Ícaro sem contexto BANT estruturado
- Serviços no banco eram seeds genéricos com valor zero

### Correções aplicadas
- **Bug SQL**: removido `l.observacoes` da query em `getClientDataWithFreshness`
- **Duplicatas removidas**: `chamar_atendente` de `workflow-suporte.ts`, `select_User` de `shared-agent.ts`
- **Serviços**: seed real com 7 serviços (Basic R$150, Premium R$450, Diamond R$1.797 + avulsos)
- **PDF apresentação**: upload para R2 em `docs/apresentacao-atualizada.pdf`
- **`services.md`**: documentação completa na raiz do projeto
- **Vídeo tutorial**: URL Instagram salva em `system_settings.video_ecac`; `sendCommercialPresentation` agora detecta URLs sociais e envia como texto, não arquivo
- **`createAutonomoMessageSegments`**: inclui link Instagram + passo a passo completo com CNPJ do escritório
- **Contexto e-CAC no prompt**: CNPJ 51.564.549/0001-40, portal, vídeo, passo a passo resumido
- **Red-flags**: `situacao=red_flag` + tipos enum + `callAttendant` automático ao marcar
- **`update_user`**: descrição reescrita com TAGs obrigatórias (RESGATE_URGENTE | PARCEIRO_DE_CRESCIMENTO | NUTRICAO)
- **`consultarCnpjPublico`**: auto-popula ficha do lead via BrasilAPI (razão social, endereço, CNAE, email), detecta MEI via `natureza_juridica` código 213-5
- **`workflow-comercial.ts`**: reescrito — abertura com apresentação comercial (sem menu), procuração como requisito, tools `enviar_apresentacao_comercial` e `agendar_reuniao_fechamento`
- **`vendedor.ts`**: adicionado `agendar_reuniao_fechamento` com notificação urgente ao Haylander
- **Cron pós-reunião**: job `0 12,15,18,21 * * *` notifica Haylander sobre reuniões pendentes de confirmação

### Decisões tomadas
- Procuração e-CAC é **obrigatória** para prestar o serviço — não é opção
- Dois tipos de reunião distintos: `reuniao_pendente` (MQL) vs `reuniao_fechamento` (SQL)
- Red-flags disparam notificação imediata ao Haylander via `callAttendant`
- Auto-preenchimento da ficha via BrasilAPI é silencioso (sem precisar que o bot chame `update_user` manualmente)
- Nutrição automatizada de leads desqualificados é escopo futuro (BullMQ campaign)

## [2026-05-15 12:08] [TASK] Padronização v2.0 aplicada sem perda de contexto.
- Files affected: [[CLAUDE]], [[index]], [[tracking]]
- Context: Vault histórico Haylander/ copiado para knowledge-base/, commands e skill memory instalados; vault original preservado intacto.

## [2026-06-01 12:42] [FIX] Correção de parsing da Serpro e tratamento de erros PGFN/DASN
- Files affected: [[serpro-apolo-integration]], [[serpro-audit-2026-05-29]]
- Context: O bot estava retornando "inconclusivo" para PGFN e DASN-SIMEI. Corrigido o parsing de espaços duplos no PGMEI (`ENVIADO A  PFN`), adicionado tratamento para erro 403 da PGFN (Receita Federal fora do ar) e erro 403 da DASN-SIMEI (falta de assinatura no portal). O LLM agora recebe o JSON estruturado corretamente.

