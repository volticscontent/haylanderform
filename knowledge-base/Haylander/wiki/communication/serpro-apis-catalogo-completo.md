---
title: Catálogo Serpro — APIs Relevantes para Contabilidade MEI
type: communication
audience: haylander
tags: [serpro, pgfn, pgmei, apis, contratação, preços]
created: 2026-05-09
status: current
---

# APIs Serpro — O que existe, o que usamos e o que ainda não temos

> **Para:** Haylander  
> **Contexto:** O sistema atual usa o **Integra Contador** do Serpro. Mas o Integra Contador é apenas **um** dos 24 produtos disponíveis na plataforma Serpro. Este documento mapeia todos os produtos relevantes, explica o que cada um faz, e esclarece uma confusão importante que encontramos no código: **PGFN e PGMEI são coisas completamente diferentes.**

---

## A Confusão que Encontramos

O sistema tinha um serviço chamado `PGFN_CONSULTAR` que, na prática, **consultava o PGMEI** — não o PGFN. Isso significa que, ao verificar "dívida ativa" de um cliente, o sistema estava vendo apenas guias DAS em aberto na Receita Federal, e **não** as dívidas efetivamente inscritas na Procuradoria-Geral da Fazenda Nacional.

Um cliente poderia ter dívida inscrita na PGFN e o sistema diria "sem débitos". Falso negativo crítico.

---

## PGMEI vs PGFN — Entenda de Uma Vez

Imagine a jornada de uma dívida tributária do MEI:

```
MEI não paga o DAS de janeiro
        ↓
Receita Federal cobra internamente (PGMEI)
        ↓  [se não pagar por meses/anos]
Dívida é inscrita na Dívida Ativa da União
        ↓
PGFN assume — pode entrar com execução fiscal
```

---

### PGMEI — Receita Federal

| | |
|---|---|
| **Órgão** | Receita Federal do Brasil |
| **O que trata** | Guias DAS em aberto, apuração mensal do MEI |
| **Fase da dívida** | Administrativa — ainda dentro da Receita Federal |
| **Gravidade** | Débito corrente. Parcelável pelo portal MEI |
| **Regularização** | Portal MEI / Parcelamento PGMEI |
| **No Integra Contador?** | ✅ Sim — `idSistema: PGMEI` |

---

### PGFN — Procuradoria-Geral da Fazenda Nacional

| | |
|---|---|
| **Órgão** | Ministério da Fazenda — Procuradoria |
| **O que trata** | Dívidas inscritas na Dívida Ativa da União |
| **Fase da dívida** | Pós-administrativa — já virou execução fiscal |
| **Gravidade** | Grave. Bloqueia CND, consta no CADIN, risco de penhora |
| **Regularização** | Portal Regularize / Negociação com a Procuradoria |
| **No Integra Contador?** | ❌ Não — produto separado |

---

> **Regra prática:** se o cliente deve DAS de alguns meses → PGMEI.  
> Se a dívida já foi para a Procuradoria → PGFN. São bases de dados diferentes, órgãos diferentes, APIs diferentes.

---

## O que está dentro do Integra Contador

O Integra Contador cobre **exclusivamente** serviços da Receita Federal. Catálogo completo confirmado na documentação oficial:

| Módulo | Sistemas disponíveis | Para que serve |
|---|---|---|
| **Integra-MEI** | PGMEI, CCMEI, DASNSIMEI | Guias DAS, dados do MEI, declaração anual |
| **Integra-SN** | PGDASD, DEFIS, REGIMEAPURACAO | Simples Nacional — declarações e apuração |
| **Integra-DCTFWeb** | DCTFWEB, MIT | Declaração DCTFWeb e DARF |
| **Integra-Parcelamento** | PARCSN, PARCMEI, PERTSN, PERTMEI | Parcelamentos MEI e Simples Nacional |
| **Integra-Sitfis** | SITFIS | Situação fiscal completa (relatório PDF) |
| **Integra-Procurações** | PROCURACOES | Verifica se há procuração e-CAC ativa |
| **Integra-Sicalc** | SICALC | Cálculo e emissão de DARF por código de receita |
| **Integra-CaixaPostal** | CAIXAPOSTAL, DTE | Mensagens da Receita Federal para o contribuinte |
| **Integra-Pagamento** | PGTOWEB | Comprovantes de arrecadação |
| **Integra-Redesim** | PNRCONTADOR | Relação contador ↔ empresa (Redesim) |
| **Integra-eProcesso** | EPROCESSO | Processos administrativos digitais |
| **Integra-Gerenciador** | AUTENTICAPROCURADOR | Autenticação de procurador, atualizações de eventos |

**PGFN não aparece em nenhum lugar desta lista.** Confirmado na documentação oficial do Serpro.

---

## Os Outros Produtos Serpro — Fora do Integra Contador

O catálogo completo do Serpro tem 24 APIs. Abaixo, todas as relevantes para contabilidade e gestão de MEI — cada uma é um produto separado, com contratação independente:

---

### 1. Consulta Dívida Ativa (PGFN)
**O que é:** Consulta direta à base SIDA (Sistema Integrado de Administração da Dívida) da Procuradoria-Geral da Fazenda Nacional.

**O que retorna:**
- Lista de inscrições em dívida ativa por CNPJ ou CPF
- Número da inscrição, situação (`ATIVA`, `EXTINTA`, `PARCELADA`...)
- Valor total consolidado por inscrição
- Dados do devedor

**Quando usar:**
- Antes de fechar contrato com um cliente — verificar se tem dívida inscrita na PGFN
- Durante o processo de regularização — confirmar se a dívida saiu da Receita e foi para a Procuradoria
- Due diligence societária

**Não confundir com:** PGMEI `DIVIDAATIVA24` — que consulta guias DAS em aberto, não inscrições na PGFN.

**Links:**
- Documentação: [apicenter.estaleiro.serpro.gov.br/documentacao/consulta-divida-ativa](http://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-divida-ativa/)
- Contratar: [loja.serpro.gov.br/consulta-divida-ativa](https://www.loja.serpro.gov.br/consulta-divida-ativa)
- Portal do contribuinte: [regularize.pgfn.gov.br](https://www.regularize.pgfn.gov.br/)

---

### 2. Consulta CNPJ
**O que é:** Dados cadastrais completos de pessoa jurídica, diretamente da base da Receita Federal.

**O que retorna (3 tipos de consulta):**
- **Básica:** situação cadastral, endereço, CNAE, natureza jurídica, telefone
- **QSA:** básica + quadro societário (sócios e administradores)
- **Completa:** básica + QSA com CPF/CNPJ dos sócios

**Quando usar:**
- Enriquecimento de cadastro de clientes (automaticamente ao receber CNPJ novo)
- Validação de razão social e situação perante a Receita
- Consulta de sócios para due diligence

**Diferencial:** Dados oficiais da Receita Federal — mais confiáveis que BrasilAPI ou outros agregadores.

**Links:**
- Documentação: [apicenter.estaleiro.serpro.gov.br/documentacao/consulta-cnpj](https://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-cnpj/)
- Contratar: [loja.serpro.gov.br/consulta-cnpj](https://www.loja.serpro.gov.br/consulta-cnpj/product/consultacnpj)

---

### 3. Consulta CPF
**O que é:** Dados cadastrais de pessoa física na base da Receita Federal.

**O que retorna:**
- Nome, situação do CPF, data de nascimento, filiação
- Dados de identificação oficiais

**Quando usar:**
- Validar CPF do empresário MEI no cadastro
- Verificar situação cadastral antes de emitir certidões CPF-based (SITFIS, CND)

**Links:**
- Documentação: [apicenter.estaleiro.serpro.gov.br/documentacao/consulta-cpf](https://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-cpf/)
- Contratar: [loja.serpro.gov.br/consulta-cpf](https://www.loja.serpro.gov.br/consulta-cpf/product/consultacpf)

---

### 4. Consulta Faturamento ⚠️ Requer Consentimento
**O que é:** Consulta o faturamento declarado da empresa nas bases da Receita Federal (PGDAS, SIMEI).

**Como funciona — Compartilha RFB:**  
O contribuinte acessa o e-CAC e autoriza o compartilhamento dos dados com um terceiro específico (ex: o escritório). Só então o escritório consegue consultar via API. O contribuinte pode revogar a qualquer momento.

**O que retorna:**
- Faturamento declarado por período
- Dados do PGDAS-D ou SIMEI por competência

**Quando usar:**
- Análise financeira do cliente com dados oficiais
- Comprovação de faturamento para linhas de crédito, BNDES, licitações

**Limitação importante:** Não é consulta direta — depende de consentimento ativo do contribuinte no e-CAC.

**Links:**
- Documentação: [apicenter.estaleiro.serpro.gov.br/documentacao/api-consulta-faturamento](http://apicenter.estaleiro.serpro.gov.br/documentacao/api-consulta-faturamento/)
- Contratar: [loja.serpro.gov.br/consultafaturamento](https://loja.serpro.gov.br/consultafaturamento)

---

### 5. Consulta Renda ⚠️ Requer Consentimento
**O que é:** Renda declarada na DIRPF (Declaração de Imposto de Renda Pessoa Física) do empresário ou sócio.

**Como funciona:** Mesmo modelo do Compartilha RFB — contribuinte autoriza no e-CAC.

**O que retorna:**
- Renda bruta anual declarada
- Dados da última DIRPF entregue

**Quando usar:**
- Análise de capacidade financeira do sócio/empresário
- Comprovação de renda para crédito

**Links:**
- Contratar: [loja.serpro.gov.br/consultarenda](https://loja.serpro.gov.br/consultarenda)

---

### 6. Consulta Restituição ⚠️ Requer Consentimento
**O que é:** Verifica se o contribuinte tem restituição de IR a receber e o status do pagamento.

**Quando usar:** Clientes que aguardam restituição — útil para planejamento financeiro.

---

### 7. Datavalid — Validação de Identidade
**O que é:** Valida se os dados informados por uma pessoa (nome, CPF, foto, biometria) batem com as bases oficiais da Receita Federal e DETRAN.

**Dois tipos de validação:**
- **Biográfica:** confirma nome, CPF, data de nascimento, filiação, situação cadastral — retorna índice de similaridade
- **Biométrica:** compara foto facial com base da CNH, liveness check — acurácia de **99,9%**

**Quando usar:**
- Onboarding de novos clientes — confirmar que o CPF pertence à pessoa que está se cadastrando
- Prevenção de fraude e abertura de conta com identidade de terceiros
- Compliance KYC (Know Your Customer)

**Links:**
- Documentação: [apicenter.estaleiro.serpro.gov.br/documentacao/datavalid](https://apicenter.estaleiro.serpro.gov.br/documentacao/datavalid/)
- Contratar: [loja.serpro.gov.br/product/datavalid](https://loja.serpro.gov.br/product/datavalid)

---

## Resumo Visual — O que Temos vs O que Falta

```
INTEGRA CONTADOR (já contratado)
├── ✅ PGMEI — guias DAS em aberto
├── ✅ CCMEI — dados cadastrais MEI
├── ✅ DASNSIMEI — declaração anual MEI
├── ✅ PGDASD — extrato PGDAS-D
├── ✅ DCTFWEB — declaração e DARF
├── ✅ SITFIS — situação fiscal (CPF-based, 2 etapas)
├── ✅ CND — certidão negativa (via SITFIS)
├── ✅ PROCURACAO — verifica e-CAC ativa
├── ✅ CAIXAPOSTAL — mensagens da Receita
├── ✅ PARCSN / PARCMEI — parcelamentos
└── ✅ SICALC — DARF por código de receita

PRODUTOS SEPARADOS (não contratados)
├── ❌ Consulta Dívida Ativa — dívida inscrita na PGFN ⭐ prioritário
├── ❌ Consulta CNPJ — dados PJ da Receita (mais completo que BrasilAPI)
├── ❌ Consulta CPF — dados PF da Receita
├── ❌ Consulta Faturamento — faturamento real (requer consentimento e-CAC)
├── ❌ Consulta Renda — renda DIRPF (requer consentimento e-CAC)
└── ❌ Datavalid — validação de identidade / biometria
```

---

## Preços — O que Sabemos

### Integra Contador (modelo de referência)
| Tipo de operação | Custo unitário (Faixa 1) |
|---|---|
| Declaração (ex: PGDAS-D) | ~R$ 0,40 |
| Emissão de guia (ex: DAS, DARF) | ~R$ 0,32 |
| Consulta de dados | ~R$ 0,24 |
| **Custo total por empresa/mês (SN — 6 chamadas)** | **~R$ 0,96** |

| Volume do escritório | Custo/mês | Custo por empresa |
|---|---|---|
| ~50 empresas | ~R$ 96 | ~R$ 1,92 |
| ~200 empresas | ~R$ 334 | ~R$ 1,67 |

> Modelo pós-pago. Quanto maior o volume, menor o custo unitário. Ajustado pelo IPCA anual (+4,62% em jun/2024).

### Outros produtos
Os demais produtos (Consulta CNPJ, CPF, Dívida Ativa, Datavalid) têm tabelas de preços publicadas **somente na Área do Cliente** da Loja Serpro — não estão disponíveis publicamente. É necessário criar conta e acessar para ver os valores por faixa.

---

## Como Contratar Qualquer Produto Serpro

1. Acesse [loja.serpro.gov.br](https://loja.serpro.gov.br)
2. Localize o produto desejado
3. Clique em **"Quero contratar"**
4. Crie ou acesse sua conta com CNPJ + e-mail
5. Para produtos com mTLS: upload do certificado digital e-CNPJ A1
6. Credenciais (Consumer Key + Secret) disponíveis em até 10 minutos
7. Cancelamento: a qualquer momento pela Central de Suporte

---

## Links Rápidos — Referência Completa

| Produto | Documentação | Loja |
|---|---|---|
| Integra Contador | [apicenter → integra-contador](https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/) | [loja → integracontador](https://loja.serpro.gov.br/integracontador) |
| Consulta Dívida Ativa | [apicenter → consulta-divida-ativa](http://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-divida-ativa/) | [loja → consulta-divida-ativa](https://www.loja.serpro.gov.br/consulta-divida-ativa) |
| Consulta CNPJ | [apicenter → consulta-cnpj](https://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-cnpj/) | [loja → consulta-cnpj](https://www.loja.serpro.gov.br/consulta-cnpj/product/consultacnpj) |
| Consulta CPF | [apicenter → consulta-cpf](https://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-cpf/) | [loja → consulta-cpf](https://www.loja.serpro.gov.br/consulta-cpf/product/consultacpf) |
| Consulta Faturamento | [apicenter → consulta-faturamento](http://apicenter.estaleiro.serpro.gov.br/documentacao/api-consulta-faturamento/) | [loja → consultafaturamento](https://loja.serpro.gov.br/consultafaturamento) |
| Consulta Renda | — | [loja → consultarenda](https://loja.serpro.gov.br/consultarenda) |
| Datavalid | [apicenter → datavalid](https://apicenter.estaleiro.serpro.gov.br/documentacao/datavalid/) | [loja → datavalid](https://loja.serpro.gov.br/product/datavalid) |
| Portal PGFN (contribuinte) | [regularize.pgfn.gov.br](https://www.regularize.pgfn.gov.br/) | — |
| Catálogo completo Serpro | [apicenter.estaleiro.serpro.gov.br/documentacao](https://apicenter.estaleiro.serpro.gov.br/documentacao/) | — |
| Preços dos serviços | [serpro.gov.br → contratos-e-valores](https://www.serpro.gov.br/menu/suporte/escritorio-de-atendimento-ao-mercado/contratos-e-valores) | — |

---

*Documento gerado em 09/05/2026 com base na documentação oficial do Serpro.*  
*Tabela de preços completa por faixa: disponível apenas com login na Área do Cliente Serpro.*  
*O catálogo de serviços do Integra Contador é atualizado periodicamente — verificar [apicenter](https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/integra_contador/) antes de tomar decisões de contratação.*
