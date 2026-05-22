# Audit Serpro/PGFN — APIs expostas no frontend

**Data:** 15/05/2026, 12:28:22  
**CNPJs testados:** 23950473000155, 14511139000104, 45723564000190  
**Total de chamadas planejadas:** 69  
**Resumo:** ✅ OK: 36 — ⚠️ AVISO: 0 — ❌ ERRO: 21 — ⏭️ SKIP: 12

## Escopo

Foram testados os serviços disponibilizados na tela Admin Serpro: Dados cadastrais, PGMEI, SITFIS/CND, Dívida Ativa/PGFN, Parcelamentos, Declarações, Caixa Postal, Processos e Pagamento.

Serviços que exigem dados complementares específicos (CPF do empresário, protocolo SITFIS, número DAS/recibo) foram marcados como SKIP quando não era seguro inferir esses dados automaticamente.

## CNPJ 23950473000155

| Grupo | Serviço | Status | Tempo | Resumo |
|---|---|---:|---:|---|
| Dados Cadastrais & Enquadramento | CCMEI_DADOS | ✅ OK | 1386ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | SIMEI | ✅ OK | 909ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | PROCURACAO | ✅ OK | 773ms | [[Sucesso-PROCURACOES]] Requisição efetuada com sucesso. / [[Aviso-PROCURACOES-20001]] Uma ou mais procurações foram retornadas com sucesso. |
| Guias e Débitos (PGMEI) | PGMEI | ✅ OK | 761ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Guias e Débitos (PGMEI) | PGMEI_EXTRATO | ✅ OK | 1286ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_BOLETO | ✅ OK | 1963ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_ATU_BENEFICIO | ❌ ERRO | 789ms | HTTP 400: [[EntradaIncorreta-PGMEI-MSG_23030]] Parâmetro de entrada inválido.  |
| Situação Fiscal & Certidões | SIT_FISCAL_SOLICITAR | ⏭️ SKIP | - | Requer CPF do empresário; frontend tem campo opcional, mas teste em lote por CNPJ não deve inventar CPF. |
| Situação Fiscal & Certidões | SIT_FISCAL_RELATORIO | ⏭️ SKIP | - | Requer protocolo de solicitação SITFIS válido. |
| Situação Fiscal & Certidões | CND | ⏭️ SKIP | - | Depende de CPF/protocolo SITFIS ou fluxo específico. |
| Dívida Ativa (PGFN) | PGFN_API | ✅ OK | 992ms | PGFN: 2 inscrição(ões) encontrada(s), total consolidado R$ 4.766,53. Situações: ATIVA NAO AJUIZAVEL NEGOCIADA NO SISPAR; ATIVA A SER COBRADA. |
| Dívida Ativa (PGFN) | DIVIDA_ATIVA | ✅ OK | 838ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Dívida Ativa (PGFN) | PGFN_CONSULTAR | ✅ OK | 753ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Parcelamentos | PARCELAMENTO_MEI_CONSULTAR | ✅ OK | 943ms | [[Sucesso-PARCMEI]] Requisição efetuada com sucesso. |
| Parcelamentos | PARCELAMENTO_SN_CONSULTAR | ✅ OK | 899ms | [[Aviso-PARCSN-ER_C001]] Não existe pedido de parcelamento para esse CNPJ. |
| Parcelamentos | PARCELAMENTO_MEI_EMITIR | ❌ ERRO | 3297ms | HTTP 400: [[EntradaIncorreta-PARCMEI-ER_N015]] O Integra Contador Parcelamento possui o limite de {0} parcelas e este parcelamento possui {1} parcelas. Utilize o sistema na WEB para obter a guia. |
| Parcelamentos | PARCELAMENTO_SN_EMITIR | ✅ OK | 939ms | [[Aviso-PARCSN-ER_E001]] Não há parcelamento ativo para o contribuinte. |
| Declarações | DASN_SIMEI | ❌ ERRO | 754ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-044]] Acesso negado. O serviço requisitado ainda não foi autorizado para ser acionado em produção. |
| Declarações | PGDASD | ⏭️ SKIP | - | Requer número DAS/recibo específico; frontend deixa manual. |
| Declarações | DCTFWEB | ❌ ERRO | 795ms | HTTP 400: [[EntradaIncorreta-DCTFWEB-MG07]] Dados de requisição inválidos. Mes PA só deve ser informado para categorias diferentes de [PF_13o_SALARIO/51] e [GERAL_13o_SALARIO/41] / [[Aviso-DCTFWEB-MG02]] Encaminhamento não autorizado. |
| Mensagens e Processos | CAIXA_POSTAL | ❌ ERRO | 838ms | HTTP 400: [EntradaIncorreta-CAIXAPOSTAL-0C] Erro de validação. / O campo indicadorPagina deve conter somente dígitos e ter tamanho igual a 1 / O campo indicadorPagina deve ser informado. / O campo statusLeitura deve ser informado. / O campo statusLeitura deve  |
| Mensagens e Processos | PROCESSOS | ✅ OK | 1062ms | [[Sucesso-EPROCESSO-SC_002]] Nenhum dado encontrado.  |
| Mensagens e Processos | PAGAMENTO | ❌ ERRO | 7005ms | Max retries reached for https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Emitir |

## CNPJ 14511139000104

| Grupo | Serviço | Status | Tempo | Resumo |
|---|---|---:|---:|---|
| Dados Cadastrais & Enquadramento | CCMEI_DADOS | ✅ OK | 965ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | SIMEI | ✅ OK | 936ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | PROCURACAO | ✅ OK | 781ms | [[Aviso-PROCURACOES-40400]] Não possui procuração ativa. |
| Guias e Débitos (PGMEI) | PGMEI | ✅ OK | 764ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Guias e Débitos (PGMEI) | PGMEI_EXTRATO | ✅ OK | 1512ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_BOLETO | ✅ OK | 1348ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_ATU_BENEFICIO | ❌ ERRO | 751ms | HTTP 400: [[EntradaIncorreta-PGMEI-MSG_23030]] Parâmetro de entrada inválido.  |
| Situação Fiscal & Certidões | SIT_FISCAL_SOLICITAR | ⏭️ SKIP | - | Requer CPF do empresário; frontend tem campo opcional, mas teste em lote por CNPJ não deve inventar CPF. |
| Situação Fiscal & Certidões | SIT_FISCAL_RELATORIO | ⏭️ SKIP | - | Requer protocolo de solicitação SITFIS válido. |
| Situação Fiscal & Certidões | CND | ⏭️ SKIP | - | Depende de CPF/protocolo SITFIS ou fluxo específico. |
| Dívida Ativa (PGFN) | PGFN_API | ✅ OK | 953ms | PGFN: 2 inscrição(ões) encontrada(s), total consolidado R$ 7.745,60. Situações: ATIVA NAO AJUIZAVEL NEGOCIADA NO SISPAR. |
| Dívida Ativa (PGFN) | DIVIDA_ATIVA | ✅ OK | 815ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Dívida Ativa (PGFN) | PGFN_CONSULTAR | ✅ OK | 759ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Parcelamentos | PARCELAMENTO_MEI_CONSULTAR | ❌ ERRO | 783ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Parcelamentos | PARCELAMENTO_SN_CONSULTAR | ❌ ERRO | 778ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Parcelamentos | PARCELAMENTO_MEI_EMITIR | ❌ ERRO | 774ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Parcelamentos | PARCELAMENTO_SN_EMITIR | ❌ ERRO | 769ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Declarações | DASN_SIMEI | ❌ ERRO | 758ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-044]] Acesso negado. O serviço requisitado ainda não foi autorizado para ser acionado em produção. |
| Declarações | PGDASD | ⏭️ SKIP | - | Requer número DAS/recibo específico; frontend deixa manual. |
| Declarações | DCTFWEB | ❌ ERRO | 780ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Mensagens e Processos | CAIXA_POSTAL | ❌ ERRO | 773ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Mensagens e Processos | PROCESSOS | ❌ ERRO | 776ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Mensagens e Processos | PAGAMENTO | ❌ ERRO | 771ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |

## CNPJ 45723564000190

| Grupo | Serviço | Status | Tempo | Resumo |
|---|---|---:|---:|---|
| Dados Cadastrais & Enquadramento | CCMEI_DADOS | ✅ OK | 926ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | SIMEI | ✅ OK | 865ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | PROCURACAO | ✅ OK | 783ms | [[Sucesso-PROCURACOES]] Requisição efetuada com sucesso. / [[Aviso-PROCURACOES-20001]] Uma ou mais procurações foram retornadas com sucesso. |
| Guias e Débitos (PGMEI) | PGMEI | ✅ OK | 753ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Guias e Débitos (PGMEI) | PGMEI_EXTRATO | ✅ OK | 1964ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_BOLETO | ✅ OK | 1524ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_ATU_BENEFICIO | ❌ ERRO | 767ms | HTTP 400: [[EntradaIncorreta-PGMEI-MSG_23030]] Parâmetro de entrada inválido.  |
| Situação Fiscal & Certidões | SIT_FISCAL_SOLICITAR | ⏭️ SKIP | - | Requer CPF do empresário; frontend tem campo opcional, mas teste em lote por CNPJ não deve inventar CPF. |
| Situação Fiscal & Certidões | SIT_FISCAL_RELATORIO | ⏭️ SKIP | - | Requer protocolo de solicitação SITFIS válido. |
| Situação Fiscal & Certidões | CND | ⏭️ SKIP | - | Depende de CPF/protocolo SITFIS ou fluxo específico. |
| Dívida Ativa (PGFN) | PGFN_API | ✅ OK | 892ms | PGFN: 1 inscrição(ões) encontrada(s), total consolidado R$ 1.649,45. Situações: ATIVA A SER AJUIZADA. |
| Dívida Ativa (PGFN) | DIVIDA_ATIVA | ✅ OK | 829ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Dívida Ativa (PGFN) | PGFN_CONSULTAR | ✅ OK | 769ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Parcelamentos | PARCELAMENTO_MEI_CONSULTAR | ✅ OK | 906ms | [[Sucesso-PARCMEI]] Requisição efetuada com sucesso. |
| Parcelamentos | PARCELAMENTO_SN_CONSULTAR | ✅ OK | 863ms | [[Aviso-PARCSN-ER_C001]] Não existe pedido de parcelamento para esse CNPJ. |
| Parcelamentos | PARCELAMENTO_MEI_EMITIR | ✅ OK | 777ms | [[Aviso-PARCMEI-ER_E001]] Não há parcelamento ativo para o contribuinte. |
| Parcelamentos | PARCELAMENTO_SN_EMITIR | ✅ OK | 784ms | [[Aviso-PARCSN-ER_E001]] Não há parcelamento ativo para o contribuinte. |
| Declarações | DASN_SIMEI | ❌ ERRO | 746ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-044]] Acesso negado. O serviço requisitado ainda não foi autorizado para ser acionado em produção. |
| Declarações | PGDASD | ⏭️ SKIP | - | Requer número DAS/recibo específico; frontend deixa manual. |
| Declarações | DCTFWEB | ❌ ERRO | 834ms | HTTP 400: [[EntradaIncorreta-DCTFWEB-MG07]] Dados de requisição inválidos. Mes PA só deve ser informado para categorias diferentes de [PF_13o_SALARIO/51] e [GERAL_13o_SALARIO/41] / [[Aviso-DCTFWEB-MG02]] Encaminhamento não autorizado. |
| Mensagens e Processos | CAIXA_POSTAL | ❌ ERRO | 878ms | HTTP 400: [EntradaIncorreta-CAIXAPOSTAL-0C] Erro de validação. / O campo statusLeitura deve ser informado. / O campo indicadorPagina deve ser informado. / O campo indicadorPagina deve conter somente dígitos e ter tamanho igual a 1 / O campo statusLeitura deve  |
| Mensagens e Processos | PROCESSOS | ✅ OK | 940ms | [[Sucesso-EPROCESSO-SC_002]] Nenhum dado encontrado.  |
| Mensagens e Processos | PAGAMENTO | ❌ ERRO | 7055ms | Max retries reached for https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Emitir |

## Observações

- A PGFN oficial foi testada via API avulsa (PGFN_API) com token próprio.
- DIVIDA_ATIVA e PGFN_CONSULTAR permanecem no frontend como serviços legados do Integra Contador e podem cair no endpoint DIVIDAATIVA24.
- Resultados de erro por ausência de dados/procuração são classificados como AVISO quando representam condição operacional esperada.
