# Auditoria Serpro Integra Contador — 2026-04-19

## Escopo

Auditoria completa do módulo de integração com a API Serpro Integra Contador no `bot-backend`. Cobriu validação de IDs contra o catálogo oficial, testes de todos os 20 serviços mapeados e correção de bugs encontrados.

---

## 1. Limpeza de Ambiente

### Problema
~60 variáveis `INTEGRA_*` duplicadas nos arquivos `.env` (raiz e `bot-backend`). Os mesmos valores já existiam como `default_sistema`/`default_servico` em `serpro-config.ts`, tornando as variáveis mortas.

### Solução
Removidas todas as variáveis `INTEGRA_*` de ambos os `.env`. Os IDs agora vivem exclusivamente em `bot-backend/src/lib/serpro-config.ts`. Para sobrescrever um ID específico em produção sem deploy, basta definir a variável no `.env` — o fallback `process.env[...] || config.default_*` garante compatibilidade.

---

## 2. Validação de IDs contra o Catálogo Oficial

Catálogo consultado: `apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador`

### IDs confirmados corretos
| Serviço | idSistema | idServico |
|---|---|---|
| CCMEI_DADOS / SIMEI | CCMEI | DADOSCCMEI122 |
| PGMEI / DIVIDA_ATIVA / PGFN | PGMEI | DIVIDAATIVA24 |
| PGMEI_EXTRATO | PGMEI | GERARDASPDF21 |
| PGMEI_BOLETO | PGMEI | GERARDASCODBARRA22 |
| PGMEI_ATU_BENEFICIO | PGMEI | ATUBENEFICIO23 |
| PGDASD | PGDASD | CONSEXTRATO16 |
| DASN_SIMEI | DASNSIMEI | CONSULTIMADECREC152 |
| DCTFWEB | DCTFWEB | CONSDECCOMPLETA33 |
| SIT_FISCAL_SOLICITAR | SITFIS | SOLICITARPROTOCOLO91 |
| SIT_FISCAL_RELATORIO / CND | SITFIS | RELATORIOSITFIS92 |
| PARCELAMENTO_SN_CONSULTAR | PARCSN | PEDIDOSPARC163 |
| PARCELAMENTO_SN_EMITIR | PARCSN | GERARDAS161 |
| PARCELAMENTO_MEI_CONSULTAR | PARCMEI | PEDIDOSPARC203 |
| PARCELAMENTO_MEI_EMITIR | PARCMEI | GERARDAS201 |
| PROCESSOS | EPROCESSO | CONSPROCPORINTER271 |
| CAIXA_POSTAL | CAIXAPOSTAL | MSGCONTRIBUINTE61 |
| PAGAMENTO | PAGTOWEB | COMPARRECADACAO72 |
| PROCURACAO | PROCURACOES | OBTERPROCURACAO41 |

### IDs removidos
| Serviço | Motivo |
|---|---|
| PGFN_PAEX (`PARC-PAEX`) | Sistema em prospecção no catálogo — IDs não publicados. PAEX encerrou adesões em 2006. |
| PGFN_SIPADE (`PARC-SIPADE`) | Mesmo motivo. Irrelevante para perfil MEI. |

---

## 3. Bugs Corrigidos

### `serpro-config.ts`

| # | Campo | Antes | Depois | Impacto |
|---|---|---|---|---|
| 1 | `PAGAMENTO.tipo` | `'Consultar'` | `'Emitir'` | Rota errada — chamava `/Consultar` em vez de `/Emitir` |
| 2 | `PROCESSOS.versaoSistema` | ausente (default `1.0`) | `'2.0'` | Serpro rejeitava com "Versão Inexistente: 1.0" |
| 3 | `PROCURACAO.versaoSistema` | ausente (default `1.0`) | `'1'` | Versão exigida pelo catálogo é `"1"`, não `"1.0"` |
| 4 | Comentários SITFIS | "IDs v9.x podem estar descontinuados" | Removidos | Falso — ambos confirmados no catálogo oficial |

### `serpro.ts`

| # | Local | Problema | Correção |
|---|---|---|---|
| 5 | `isParcelamentoConsulta` | `dados: '{}'` para PARCSN/PARCMEI consulta | `dados: ''` — Serpro rejeita qualquer conteúdo em dados para essas chamadas |
| 6 | `PROCURACAO` sem `dados` | Enviava `dados: '{}'` sem `outorgante`/`outorgado` | Construído `dados` com `outorgante=CNPJ_cliente`, `outorgado=CNPJ_contador` |
| 7 | `periodoApuracao` | Formato `MMYYYY` (ex: `"042026"`) | Formato `YYYYMM` (ex: `"202604"`) — padrão Serpro |
| 8 | `parcelaParaEmitir` | Enviava `"01"` ou `options.mes` bruto | Gera `YYYYMM` automaticamente (ex: `"202604"`) |
| 9 | HTTP 304 | Tratado como erro — lançava exceção | Tratado como sucesso — retorna `null` (protocolo cacheado) |
| 10 | Retry sem log | Body do erro Serpro perdido nos retries | Erro logado antes de cada retry via `serproLogger.warn` |

---

## 4. Resultado dos Testes — CNPJ `45723564000190`

### Serviços funcionando (200 OK)

| Serviço | Resposta de negócio |
|---|---|
| `CCMEI_DADOS` | "Este CNPJ não possui mais a condição de MEI" |
| `PGMEI` | "Não há débitos em dívida ativa" |
| `DIVIDA_ATIVA` | "Não há débitos em dívida ativa" |
| `SIMEI` | OK |
| `PGFN_CONSULTAR` | OK |
| `PROCURACAO` | **Procuração ativa até 2026-11-14**, sistemas: TODOS |
| `PARCELAMENTO_SN_CONSULTAR` | "Não existe pedido de parcelamento" |
| `PARCELAMENTO_SN_EMITIR` | "Não há parcelamento ativo" |
| `PARCELAMENTO_MEI_CONSULTAR` | **Parcelamento real encontrado** (situação: primeira parcela não paga) |
| `PARCELAMENTO_MEI_EMITIR` | "Não há parcelamento ativo" |
| `PROCESSOS` | "Nenhum dado encontrado" |
| `DCTFWEB` | OK (requer `mes`+`ano`) |
| `PGMEI_EXTRATO` | "Contribuinte não optante pelo SIMEI" (CNPJ desenquadrado) |
| `PGMEI_BOLETO` | "Contribuinte não optante pelo SIMEI" (CNPJ desenquadrado) |
| `SIT_FISCAL_SOLICITAR` | 304 — protocolo cacheado (comportamento normal) |

### Serviços que precisam de parâmetros específicos

| Serviço | Parâmetro obrigatório |
|---|---|
| `PGDASD` (`CONSEXTRATO16`) | `numeroDas` — número do DAS específico |
| `PGMEI_EXTRATO` | `mes` + `ano` (periodoApuracao YYYYMM) |
| `PGMEI_BOLETO` | `mes` + `ano` (periodoApuracao YYYYMM) |
| `SIT_FISCAL_RELATORIO` / `CND` | `protocoloRelatorio` — retornado pelo `SIT_FISCAL_SOLICITAR` |
| `PGMEI_ATU_BENEFICIO` | `infoBeneficio[]` — array com dados do benefício |

### Serviços bloqueados por razões externas

| Serviço | Motivo | Ação necessária |
|---|---|---|
| `CAIXA_POSTAL` | Exige procuração eletrônica **código 00006** ativa no e-CAC | Cada cliente deve outorgar para CNPJ `51564549000140` em `gov.br/ecac` |
| `DASN_SIMEI` | Serviço não autorizado no contrato Serpro | Habilitar na Loja Serpro (`loja.serpro.gov.br`) |
| `PAGAMENTO` | `COMPARRECADACAO72` exige parâmetros específicos do documento | Identificar campos obrigatórios na doc do PAGTOWEB |

---

## 5. Versões por Sistema

| idSistema | versaoSistema | Observação |
|---|---|---|
| PGMEI | `2.4` | Obrigatório — versão `1.0` rejeitada |
| SITFIS | `2.0` | Obrigatório |
| EPROCESSO | `2.0` | Obrigatório — versão `1.0` rejeitada |
| PROCURACOES | `1` | Sem ponto — `"1"` não `"1.0"` |
| Demais | `1.0` | Default |

---

## 6. Pendências

1. **CAIXA_POSTAL** — Orientar clientes a outorgarem procuração código `00006` no e-CAC.
2. **DASN_SIMEI** — Contratar serviço na Loja Serpro.
3. **PGMEI_ATU_BENEFICIO** — Mapear estrutura de `infoBeneficio[]` e implementar no `consultarServico`.
4. **PAGAMENTO** — Mapear parâmetros obrigatórios do `COMPARRECADACAO72` na documentação PAGTOWEB.
5. **SIT_FISCAL_RELATORIO** — Implementar fluxo completo: chamar `SIT_FISCAL_SOLICITAR` → extrair `protocoloRelatorio` da resposta → chamar `SIT_FISCAL_RELATORIO`.

---

## 7. Arquivos Alterados

```
bot-backend/src/lib/serpro-config.ts   — IDs, versões, tipo corrigidos; PAEX/SIPADE removidos
bot-backend/src/lib/serpro.ts          — 6 bugs de payload corrigidos; logging melhorado
bot-backend/.env                       — INTEGRA_* removidas
.env                                   — INTEGRA_* removidas
```
