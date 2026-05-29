---
title: Auditoria Serpro — 2026-05-29
type: integration
tags: [serpro, integra-contador, dasn-simei, audit, mensagens]
sources: [raw/docs/relatorio_serpro_2026_05_29.md, https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/solucoes/integra-mei/dasnsimei/mensagens/]
created: 2026-05-29
updated: 2026-05-29
status: active
---

# Auditoria Serpro — 2026-05-29

## Resumo

Teste automatizado disparou todas as integrações do catálogo do painel Admin contra o CNPJ `23950473000155` (procuração e-CAC ativa). Resultado: das 23 integrações testadas, **apenas `DASN_SIMEI` não está assinada/contratada** na loja Serpro. As demais respondem — algumas com HTTP 200 imediato, outras com HTTP 400 que indica **payload incompleto do frontend, não falta de contratação**.

A auditoria invalida a suspeita anterior de que múltiplas APIs estariam fora do pacote: o sintoma "erro no painel" estava sendo lido como "API não assinada", quando na verdade era contrato de payload divergente do exigido pela Serpro.

## Resultado consolidado

### ✅ Funcionam direto (HTTP 200)

| Serviço | Tempo | Observação |
|---|---|---|
| `CCMEI_DADOS` | 1639ms | Dados cadastrais |
| `PGMEI` | 831ms | Débitos/guias |
| `SIMEI` | 604ms | Enquadramento |
| `DIVIDA_ATIVA` | 956ms | PGFN |
| `PARCELAMENTO_SN_CONSULTAR` | 474ms | — |
| `PARCELAMENTO_MEI_CONSULTAR` | 1342ms | — |
| `PROCURACAO` | 482ms | e-CAC |
| `PGFN_CONSULTAR` | 556ms | — |
| `DCTFWEB` | 507ms | — |
| `PROCESSOS` | 725ms | — |
| `PARCELAMENTO_SN_EMITIR` | 412ms | Comunicação OK |
| `PARCELAMENTO_MEI_EMITIR` | 16864ms | Comunicação OK (lento) |

### ⚠️ Ativas mas falham por payload (HTTP 400)

São APIs **assinadas e operacionais**. A falha vem do frontend do Admin, que não envia todos os campos exigidos.

| Serviço | Tempo | Campo faltando |
|---|---|---|
| `PGMEI_EXTRATO` | 57ms | `mes`/período (não basta `ano`) |
| `PGMEI_BOLETO` | 130ms | `mes`/período |
| `PGMEI_ATU_BENEFICIO` | 142ms | Payload estruturado de benefício |
| `SIT_FISCAL_SOLICITAR` | 3ms | CPF do empresário (falha local intencional) |
| `SIT_FISCAL_RELATORIO` | 1ms | CPF do empresário (falha local intencional) |
| `CND` | 1ms | CPF do empresário (falha local intencional) |
| `PGDASD` | 344ms | `numeroDas` no payload |
| `CAIXA_POSTAL` | 88ms | `statusLeitura` |
| `PAGAMENTO` | 205ms | Campo extra além do `ano` |

### ❌ Não assinada (HTTP 403)

| Serviço | Status | Mensagem |
|---|---|---|
| `DASN_SIMEI` | 403 / 160ms | "Acesso negado. Serviço não autorizado/contratado na loja Serpro." |

## Conclusão e ação

- Flag `nao_assinada` no sistema deve ficar **apenas em `DASN_SIMEI`**. Demais serviços retornam para `ativo`.
- Implementado no commit [`167d888`](../../../bot-backend) — `fix(serpro): corrige status das apis serpro - apenas dasn-simei não está assinada`.
- Pendente: ajustar formulários do Admin para coletar os campos que hoje causam HTTP 400 (mês, CPF do empresário, número do DAS, `statusLeitura`).

## Decisões tomadas

- **HTTP 400 ≠ não assinada.** Nunca marcar API como `nao_assinada` apenas por código de erro. Só HTTP 403 com mensagem de "não autorizado/contratado" caracteriza serviço fora do pacote.
- **Validação por CNPJ com procuração ativa.** O teste exige um CNPJ real com e-CAC outorgada, senão SITFIS/CND/etc. retornam 400 antes de chegar ao Serpro.

## Catálogo de mensagens — DASN-SIMEI

> Referência oficial: [apicenter → integra-mei/dasnsimei/mensagens](https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/solucoes/integra-mei/dasnsimei/mensagens/).
> Útil quando a API for contratada — para tratar respostas estruturadas em vez de strings genéricas.

Identificador segue o formato `[Tipo-Sistema-Código]`, com Sistema sempre `DASNSIMEI`. Tipos: `EntradaIncorreta`, `Sucesso`, `Erro`, `Aviso`. Marcadores `{N}` em itálico contêm valores variáveis preenchidos em runtime.

### Avisos (HTTP 200)

| Código | Descrição |
|---|---|
| `Aviso-DASNSIMEI-10001` | CNPJ inválido (informa o `cnpjCompleto`) |
| `Aviso-DASNSIMEI-10002` | Ano-calendário no período de decadência |
| `Aviso-DASNSIMEI-10003` | Contribuinte baixado no ano-calendário |
| `Aviso-DASNSIMEI-10004` | Contribuinte não optante pelo SIMEI no ano-calendário |
| `Aviso-DASNSIMEI-10005` | Apuração anterior com alíquota de INSS divergente da ocupação — exige nova apuração no PGMEI |
| `Aviso-DASNSIMEI-10006` | Não foi gerado DAS para o ano-calendário; regularizar via PGMEI |
| `Aviso-DASNSIMEI-10007` | Não foi gerado DAS para os períodos listados; regularizar via PGMEI |
| `Aviso-DASNSIMEI-10008` | Receita bruta total ultrapassou o limite SIMEI; transmissão bloqueada e desenquadramento obrigatório no Portal SN |
| `Aviso-DASNSIMEI-23006` | Contribuinte não encontrado no Cadastro CNPJ |
| `Aviso-DASNSIMEI-33001` | Contribuinte não optante pelo SIMEI |
| `Aviso-DASNSIMEI-33101` | Última declaração do ano-calendário não tem excesso de receita ≤ 20% para emitir DAS de excesso |

### Entrada incorreta (HTTP 400)

| Código | Descrição |
|---|---|
| `EntradaIncorreta-DASNSIMEI-10000` | Dados de entrada inválidos |

### Erros (HTTP 500)

| Código | Descrição |
|---|---|
| `Erro-DASNSIMEI-23007` | Base CNPJ indisponível |
| `Erro-DASNSIMEI-33002` | Sistema SIMEI indisponível |
| `Erro-DASNSIMEI-33005` | Sistema Sidat indisponível |
| `Erro-DASNSIMEI-33006` | Sistema Numerador indisponível |
| `Erro-DASNSIMEI-33007` | Sistema Taco indisponível |
| `Erro-DASNSIMEI-33008` | Taxa Selic ainda não cadastrada — tentar no próximo dia útil |
| `Erro-DASNSIMEI-33011` | Sem Auditor disponível no sistema Chancela para assinar a notificação MAED |
| `Erro-DASNSIMEI-33012` | Sistema indisponível — falha no sistema Chancela |
| `Erro-DASNSIMEI-33013` | Base de dados DASN-SIMEI indisponível |
| `Erro-DASNSIMEI-33014` | Falha do sistema SENDA na emissão do documento de arrecadação |
| `Erro-DASNSIMEI-33015` | Erro de validação dos dados de entrada via SENDA |
| `Erro-DASNSIMEI-33016` | Falha no acionamento ao sistema SENDA |
| `Erro-DASNSIMEI-50000` | Falha no acesso ao sistema FISCEL |
| `Erro-DASNSIMEI-40999` | Ocorreu uma falha na execução do serviço |

## Learnings

- **Diferenciar 400 de 403 no diagnóstico** — o painel Admin precisa exibir mensagem clara: payload incompleto vs serviço não contratado.
- **Auditoria automatizada vale a pena.** O script revelou que ~40% dos serviços marcados como problemáticos no Admin estavam apenas mal-formados na requisição.
- **DASN-SIMEI é único candidato a contratação adicional** — decidir se vale assinar (custo de declaração anual MEI) ou se basta orientar cliente a usar o portal SIMEI direto.

## Relacionados

- [[serpro]] — integração principal (ver Armadilha #9)
- [[serpro-apis-catalogo-completo]] — catálogo completo de APIs Serpro
- [[ADR-014-apolo-agent-audit-2026-05]]
