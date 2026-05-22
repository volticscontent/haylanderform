# Relatório Técnico — Serpro: PGFN vs PGMEI
**Preparado por:** Tzolkin / Claude Code  
**Data:** 09/05/2026  
**Destinatário:** Haylander  
**Assunto:** Diferença entre PGFN e PGMEI no contexto da API Serpro, APIs disponíveis e custos de contratação

---

## 1. O Equívoco que Identificamos no Código

Até hoje, o sistema Haylander tinha um serviço chamado `PGFN_CONSULTAR` no catálogo de integrações que, na prática, **chamava o mesmo endpoint do PGMEI**:

```
PGFN_CONSULTAR → idSistema: 'PGMEI' / idServico: 'DIVIDAATIVA24'
```

**Isso está conceitualmente errado.** PGFN e PGMEI são sistemas de órgãos diferentes, com bases de dados diferentes, cobrando dívidas em estágios completamente diferentes.

---

## 2. PGMEI vs PGFN — A Diferença Fundamental

### PGMEI — Programa de Geração de Benefícios ao Microempreendedor Individual
**Órgão:** Receita Federal do Brasil (RFB)  
**O que é:** Sistema que gerencia as guias DAS (Documento de Arrecadação do Simples Nacional) do MEI. Controla apuração mensal, geração de boletos, benefícios previdenciários e parcelamentos dentro do Simples Nacional.

**Tipo de dívida tratada:**
- Guias DAS em aberto (mensais)
- Débitos de INSS e ISS/ICMS mensais do MEI
- Dívidas que **ainda estão dentro da Receita Federal**
- Possível regularização via portal MEI ou parcelamento PGMEI

**Status do contribuinte:** O MEI ainda está na fase administrativa. A Receita Federal ainda é responsável.

---

### PGFN — Procuradoria-Geral da Fazenda Nacional
**Órgão:** Ministério da Fazenda — Procuradoria-Geral da Fazenda Nacional  
**O que é:** A Procuradoria da União. Quando uma dívida tributária não é paga e esgotam-se as tentativas de cobrança administrativa pela Receita Federal, ela é **inscrita na Dívida Ativa da União** e transferida à PGFN.

**Tipo de dívida tratada:**
- Dívidas **inscritas na Dívida Ativa da União**
- Já passaram pelo processo administrativo completo na Receita Federal
- Sujeitas a **execução fiscal** (processo judicial)
- Constam no CADIN (Cadastro Informativo de Créditos não Quitados do Setor Público Federal)
- Regularização via **Regularize** (portal PGFN) ou negociação com a Procuradoria

**Status do contribuinte:** Situação grave. A cobrança já saiu da Receita Federal e foi para a Procuradoria.

---

### Tabela Comparativa

| Critério | PGMEI (Receita Federal) | PGFN (Procuradoria) |
|---|---|---|
| **Órgão responsável** | Receita Federal do Brasil | Procuradoria-Geral da Fazenda Nacional |
| **Fase da dívida** | Administrativa (cobrança interna) | Inscrita em Dívida Ativa da União |
| **Gravidade** | Débito corrente / em atraso | Dívida ativa — risco de execução fiscal |
| **Regularização** | Portal MEI / Parcelamento PGMEI | Portal Regularize / Negociação PGFN |
| **CND bloqueada?** | Depende do valor | Sim, salvo CPEN ou parcelamento ativo |
| **Sistema Serpro** | `PGMEI` / `DIVIDAATIVA24` | API separada — base SIDA da PGFN |
| **Incluso no Integra Contador?** | ✅ Sim | ❌ Não |

> **Resumo prático:** Se o MEI não pagou o DAS de março → PGMEI. Se esse DAS virou dívida ativa inscrita na Procuradoria → PGFN. São sistemas diferentes, bases diferentes, APIs diferentes.

---

## 3. As Duas APIs Serpro — Produtos Separados

### 3.1 API Integra Contador (Receita Federal)
**O que cobre:** Todos os serviços da Receita Federal — PGMEI, PGDAS-D, DCTFWeb, SITFIS, CND, Caixa Postal, Procurações e-CAC, Parcelamentos Simples Nacional/MEI.

**PGFN dentro do Integra Contador:** ❌ **Não existe.** Confirmado na documentação oficial — o catálogo completo de sistemas disponíveis é:

| Solução | Sistemas (idSistema) |
|---|---|
| Integra-MEI | PGMEI, CCMEI, DASNSIMEI |
| Integra-SN | PGDASD, DEFIS, REGIMEAPURACAO |
| Integra-DCTFWeb | DCTFWEB, MIT |
| Integra-Parcelamento | PARCSN, PARCMEI, PERTSN, PERTMEI, RELPSN, RELPMEI |
| Integra-Procurações | PROCURACOES |
| Integra-Sicalc | SICALC |
| Integra-CaixaPostal | CAIXAPOSTAL, DTE |
| Integra-Pagamento | PGTOWEB |
| Integra-Sitfis | SITFIS |
| Integra-Redesim | PNRCONTADOR |
| Integra-eProcesso | EPROCESSO |
| Integra-Gerenciador | AUTENTICAPROCURADOR, EVENTOSATUALIZACAO |

**Nenhum sistema PGFN está listado.**

---

### 3.2 API Consulta Dívida Ativa (PGFN)
**O que cobre:** Consulta direta à base **SIDA** (Sistema Integrado de Administração da Dívida) da PGFN. Retorna dívidas efetivamente inscritas na Dívida Ativa da União — pessoas físicas e jurídicas.

**Casos de uso:**
- Verificar se um MEI/empresa tem dívida inscrita na Procuradoria antes de assinar contrato
- Análise de crédito por bancos e financeiras
- Due diligence em aquisições ou societário
- Compliance e gestão de risco

**Características técnicas:**
- HTTP REST
- Dados atualizados com atraso máximo de **1 dia**
- Consulta por CPF, CNPJ ou número de inscrição da dívida
- Retorna: dados do devedor, valor inscrito, situação da inscrição

**Produto independente:** Não faz parte do Integra Contador. Contratação separada na Loja Serpro.

---

## 4. Contratação e Preços

### 4.1 Integra Contador

| Item | Detalhe |
|---|---|
| **Onde contratar** | [loja.serpro.gov.br/integracontador](https://loja.serpro.gov.br/integracontador) |
| **Pré-requisito** | Certificado Digital e-CNPJ (A1 ou A3) |
| **Modelo de cobrança** | Pós-pago — cobrado por chamada realizada |
| **Cobrança** | Diretamente pelo Serpro ao escritório contábil |
| **Volume mínimo** | Não há — paga somente o que usa |
| **Escalabilidade** | Quanto maior o volume, menor o custo unitário |
| **Ajuste de preços** | IPCA anual (último ajuste: +4,62% em jun/2024) |

**Estrutura de preços (3 categorias × 8 faixas):**

| Categoria | O que cobre | Exemplos de chamadas |
|---|---|---|
| **Consulta** | Leitura de dados — sem emissão de documento | PGMEI, CCMEI, PROCURACAO, SITFIS, CAIXAPOSTAL |
| **Emissão** | Geração de guia ou certidão com PDF | DAS, DARF DCTFWeb, CND, DAS Parcelamento |
| **Declaração** | Transmissão de obrigação acessória | PGDAS-D, DCTFWeb, DEFIS |

**Valores de referência por empresa/mês (Simples Nacional — 6 chamadas):**

| Volume (escritório) | Custo total/mês | Custo por empresa |
|---|---|---|
| Até ~50 empresas | ~R$ 96,00 | ~R$ 1,92 |
| ~200 empresas | ~R$ 334,00 | ~R$ 1,67 |

**Exemplo de custo por operação completa (Faixa 1 — até 100 emissões/mês):**

| Operação | Valor |
|---|---|
| Declaração (ex: PGDAS-D) | R$ 0,40 |
| Emissão de guia (ex: DAS) | R$ 0,32 |
| Consulta de extrato | R$ 0,24 |
| **Total por empresa/mês** | **R$ 0,96** |

> ⚠️ Os valores acima são de referência. A tabela completa com todas as faixas está na [Loja Serpro](https://loja.serpro.gov.br/integra-contador/product/integracontador). O Serpro não publica a tabela integralmente em páginas públicas — é necessário acessar com login na Área do Cliente.

---

### 4.2 API Consulta Dívida Ativa (PGFN)

| Item | Detalhe |
|---|---|
| **Onde contratar** | [loja.serpro.gov.br/consulta-divida-ativa](https://www.loja.serpro.gov.br/consulta-divida-ativa) |
| **Pré-requisito** | e-CNPJ (com certificado) ou contato via formulário |
| **Modelo de cobrança** | Por volume de consultas — faixas progressivas |
| **Acesso** | Credenciais disponíveis em até 10 minutos após contratação |
| **Cancelamento** | A qualquer momento pela Central de Suporte |
| **Quem pode contratar** | Empresas de qualquer porte, bancos, financeiras, entidades, órgãos públicos |
| **Grupos econômicos** | Contrato global com CNPJs vinculados |

> ⚠️ A tabela de preços da Consulta Dívida Ativa **não é publicada em páginas abertas**. É necessário acessar a Loja Serpro com conta cadastrada para visualizar os valores por faixa.

---

## 5. Impacto no Sistema Haylander

### O que estava errado
O serviço `PGFN_CONSULTAR` no código consultava `PGMEI/DIVIDAATIVA24` — ou seja, consultava guias DAS em aberto do PGMEI, **não dívidas inscritas na PGFN**. O resultado poderia indicar "sem dívida ativa" mesmo que o cliente tivesse uma inscrição real na Procuradoria.

### O que foi corrigido hoje
1. `PGFN_CONSULTAR` agora loga aviso explícito quando opera como fallback do PGMEI, deixando claro que não está acessando a base real da PGFN.
2. A documentação interna (`src/lib/docs/serpro-api.ts`) foi atualizada para refletir essa distinção.

### O que ainda está pendente
Para consultar dívida real inscrita na PGFN, é necessário:
1. Contratar separadamente a **API Consulta Dívida Ativa** na Loja Serpro
2. Integrar um novo serviço no catálogo do sistema usando as credenciais dessa API (que são independentes do Integra Contador)
3. Renomear/remover `PGFN_CONSULTAR` do catálogo para evitar confusão operacional

---

## 6. Links de Referência

### Integra Contador
| Recurso | Link |
|---|---|
| Loja Serpro — Contratar | [loja.serpro.gov.br/integracontador](https://loja.serpro.gov.br/integracontador) |
| Documentação técnica | [apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/](https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/) |
| Visão geral de soluções | [apicenter.estaleiro.serpro.gov.br/.../solucoes/](https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/solucoes/) |
| Catálogo de serviços | [apicenter.estaleiro.serpro.gov.br/.../integra_contador/](https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/integra_contador/) |
| Como contratar (Calima/guia) | [ajuda.calimaerp.com — Como Contratar](https://ajuda.calimaerp.com/pt/article/como-contratar-o-integra-contador-na-loja-serpro-6m0iim/) |
| Como funciona a cobrança (Calima/guia) | [ajuda.calimaerp.com — Cobrança Serpro](https://ajuda.calimaerp.com/pt/article/como-funciona-a-cobranca-do-serpro-pelo-integra-contador-wgj834/) |
| Preços dos serviços (Serpro) | [serpro.gov.br/menu/suporte/contratos-e-valores](https://www.serpro.gov.br/menu/suporte/escritorio-de-atendimento-ao-mercado/contratos-e-valores) |
| Análise de custos (SCI Sistemas) | [blog.sci.com.br — Análise de Custos](https://www.blog.sci.com.br/post/an%C3%A1lise-de-custos-do-integra-contador-o-que-toda-empresa-cont%C3%A1bil-deve-saber) |

### API Consulta Dívida Ativa (PGFN)
| Recurso | Link |
|---|---|
| Loja Serpro — Contratar | [loja.serpro.gov.br/consulta-divida-ativa](https://www.loja.serpro.gov.br/consulta-divida-ativa) |
| Documentação técnica | [apicenter.estaleiro.serpro.gov.br/documentacao/consulta-divida-ativa/](http://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-divida-ativa/) |
| Como contratar | [apicenter.estaleiro.serpro.gov.br/.../como_contratar/](https://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-divida-ativa/pt/como_contratar/) |
| Catálogo gov.br | [gov.br/conecta/catalogo/apis/consulta-divida-ativa](https://www.gov.br/conecta/catalogo/apis/consulta-divida-ativa-da-uniao) |
| Notícia lançamento | [serpro.gov.br — API Dívida Ativa disponível](https://www.serpro.gov.br/menu/noticias/noticias-2018/api-consulta-divida-ativa-esta-disponivel-para-contratacao) |

### PGFN — Portais do Contribuinte
| Recurso | Link |
|---|---|
| Regularize (negociação de dívidas) | [regularize.pgfn.gov.br](https://www.regularize.pgfn.gov.br/) |
| PGFN no Serpro (parceria tecnológica) | [serpro.gov.br — PGFN](https://www.serpro.gov.br/clientes/procuradoria-geral-da-fazenda-nacional) |

---

## 7. Recomendação para o Haylander

| Necessidade | Solução | Produto |
|---|---|---|
| Verificar guias DAS em aberto do MEI | `PGMEI` / `DIVIDAATIVA24` | Integra Contador (já contratado) |
| Verificar parcelamentos MEI/SN ativos | `PARCMEI` / `PARCSN` | Integra Contador (já contratado) |
| Emitir situação fiscal completa | `SITFIS` (2 etapas) | Integra Contador (já contratado) |
| **Verificar inscrição real na Dívida Ativa da União** | **API Consulta Dívida Ativa** | **Produto separado — ainda não contratado** |

A contratação da **API Consulta Dívida Ativa** é recomendada para clientes em processo de regularização mais grave, onde precisamos confirmar se a dívida já foi inscrita na PGFN — informação que o Integra Contador simplesmente não fornece.

---

*Documento gerado com base na documentação oficial do Serpro, verificada em 09/05/2026.*  
*Links testados na data de geração. O Serpro atualiza sua plataforma periodicamente — verificar atualidade antes de contratar.*
