# Audit Serpro/PGFN — APIs expostas no frontend

**Data:** 23/06/2026, 20:39:47  
**CNPJs testados:** 23950473000155, 14511139000104, 45723564000190  
**Total de chamadas planejadas:** 69  
**Resumo:** ✅ OK: 41 — ⚠️ AVISO: 0 — ❌ ERRO: 16 — ⏭️ SKIP: 12

## Escopo

Foram testados os serviços disponibilizados na tela Admin Serpro: Dados cadastrais, PGMEI, SITFIS/CND, Dívida Ativa/PGFN, Parcelamentos, Declarações, Caixa Postal, Processos e Pagamento.

Serviços que exigem dados complementares específicos (CPF do empresário, protocolo SITFIS, número DAS/recibo) foram marcados como SKIP quando não era seguro inferir esses dados automaticamente.

## CNPJ 23950473000155

| Grupo | Serviço | Status | Tempo | Resumo |
|---|---|---:|---:|---|
| Dados Cadastrais & Enquadramento | CCMEI_DADOS | ✅ OK | 1648ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | SIMEI | ✅ OK | 949ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | PROCURACAO | ✅ OK | 797ms | [[Sucesso-PROCURACOES]] Requisição efetuada com sucesso. / [[Aviso-PROCURACOES-20001]] Uma ou mais procurações foram retornadas com sucesso. |
| Guias e Débitos (PGMEI) | PGMEI | ✅ OK | 773ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Guias e Débitos (PGMEI) | PGMEI_EXTRATO | ✅ OK | 1091ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_BOLETO | ✅ OK | 1114ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_ATU_BENEFICIO | ❌ ERRO | 716ms | Operação de escrita "PGMEI_ATU_BENEFICIO" bloqueada: requer autorização explícita (permitirEscrita). Não disponível para atendimento automatizado. |
| Situação Fiscal & Certidões | SIT_FISCAL_SOLICITAR | ⏭️ SKIP | - | Requer CPF do empresário; frontend tem campo opcional, mas teste em lote por CNPJ não deve inventar CPF. |
| Situação Fiscal & Certidões | SIT_FISCAL_RELATORIO | ⏭️ SKIP | - | Requer protocolo de solicitação SITFIS válido. |
| Situação Fiscal & Certidões | CND | ⏭️ SKIP | - | Depende de CPF/protocolo SITFIS ou fluxo específico. |
| Dívida Ativa (PGFN) | PGFN_API | ✅ OK | 1214ms | PGFN: 2 inscrição(ões) encontrada(s), total consolidado R$ 4.796,62. Situações: ATIVA NAO AJUIZAVEL NEGOCIADA NO SISPAR; ATIVA EM COBRANCA. |
| Dívida Ativa (PGFN) | DIVIDA_ATIVA | ✅ OK | 777ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Dívida Ativa (PGFN) | PGFN_CONSULTAR | ✅ OK | 764ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Parcelamentos | PARCELAMENTO_MEI_CONSULTAR | ✅ OK | 911ms | [[Sucesso-PARCMEI]] Requisição efetuada com sucesso. |
| Parcelamentos | PARCELAMENTO_SN_CONSULTAR | ✅ OK | 898ms | [[Aviso-PARCSN-ER_C001]] Não existe pedido de parcelamento para esse CNPJ. |
| Parcelamentos | PARCELAMENTO_MEI_EMITIR | ✅ OK | 1401ms | [[Sucesso-PARCMEI]] Requisição efetuada com sucesso. |
| Parcelamentos | PARCELAMENTO_SN_EMITIR | ✅ OK | 783ms | [[Aviso-PARCSN-ER_E001]] Não há parcelamento ativo para o contribuinte. |
| Declarações | DASN_SIMEI | ❌ ERRO | 753ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-044]] Acesso negado. O serviço requisitado ainda não foi autorizado para ser acionado em produção. |
| Declarações | PGDASD | ⏭️ SKIP | - | Requer número DAS/recibo específico; frontend deixa manual. |
| Declarações | DCTFWEB | ✅ OK | 830ms | [[Sucesso-DCTFWEB]] Requisição efetuada com sucesso. / [[Aviso-DCTFWEB-MSGIC01]] Houve erro de negócio. Favor verificar as demais mensagens. / [[Aviso-DCTFWEB-MG08]] Não foi encontrada Declaração com os dados informados. |
| Mensagens e Processos | CAIXA_POSTAL | ✅ OK | 857ms | [Erro-CAIXAPOSTAL-02] Contribuinte não possui mensagem para filtro fornecido. |
| Mensagens e Processos | PROCESSOS | ✅ OK | 1010ms | [[Sucesso-EPROCESSO-SC_002]] Nenhum dado encontrado.  |
| Mensagens e Processos | PAGAMENTO | ❌ ERRO | 704ms | HTTP 400: Parâmetros de entrada inválidos. Informe número do documento de arrecadação. |

## CNPJ 14511139000104

| Grupo | Serviço | Status | Tempo | Resumo |
|---|---|---:|---:|---|
| Dados Cadastrais & Enquadramento | CCMEI_DADOS | ✅ OK | 1155ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | SIMEI | ✅ OK | 887ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | PROCURACAO | ✅ OK | 832ms | [[Aviso-PROCURACOES-40400]] Não possui procuração ativa. |
| Guias e Débitos (PGMEI) | PGMEI | ✅ OK | 777ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Guias e Débitos (PGMEI) | PGMEI_EXTRATO | ✅ OK | 1117ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_BOLETO | ✅ OK | 1045ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_ATU_BENEFICIO | ❌ ERRO | 708ms | Operação de escrita "PGMEI_ATU_BENEFICIO" bloqueada: requer autorização explícita (permitirEscrita). Não disponível para atendimento automatizado. |
| Situação Fiscal & Certidões | SIT_FISCAL_SOLICITAR | ⏭️ SKIP | - | Requer CPF do empresário; frontend tem campo opcional, mas teste em lote por CNPJ não deve inventar CPF. |
| Situação Fiscal & Certidões | SIT_FISCAL_RELATORIO | ⏭️ SKIP | - | Requer protocolo de solicitação SITFIS válido. |
| Situação Fiscal & Certidões | CND | ⏭️ SKIP | - | Depende de CPF/protocolo SITFIS ou fluxo específico. |
| Dívida Ativa (PGFN) | PGFN_API | ✅ OK | 1049ms | PGFN: 2 inscrição(ões) encontrada(s), total consolidado R$ 7.789,05. Situações: ATIVA NAO AJUIZAVEL NEGOCIADA NO SISPAR. |
| Dívida Ativa (PGFN) | DIVIDA_ATIVA | ✅ OK | 762ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Dívida Ativa (PGFN) | PGFN_CONSULTAR | ✅ OK | 759ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Parcelamentos | PARCELAMENTO_MEI_CONSULTAR | ❌ ERRO | 782ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Parcelamentos | PARCELAMENTO_SN_CONSULTAR | ❌ ERRO | 801ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Parcelamentos | PARCELAMENTO_MEI_EMITIR | ❌ ERRO | 766ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Parcelamentos | PARCELAMENTO_SN_EMITIR | ❌ ERRO | 763ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Declarações | DASN_SIMEI | ❌ ERRO | 741ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-044]] Acesso negado. O serviço requisitado ainda não foi autorizado para ser acionado em produção. |
| Declarações | PGDASD | ⏭️ SKIP | - | Requer número DAS/recibo específico; frontend deixa manual. |
| Declarações | DCTFWEB | ❌ ERRO | 781ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Mensagens e Processos | CAIXA_POSTAL | ❌ ERRO | 780ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Mensagens e Processos | PROCESSOS | ❌ ERRO | 789ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-022]] Acesso negado. O autor do pedido de dados de número:51564549000140 não tem procuração autorizada no Portal eCAC para o Contribuinte de número 14511139000104. |
| Mensagens e Processos | PAGAMENTO | ❌ ERRO | 708ms | HTTP 400: Parâmetros de entrada inválidos. Informe número do documento de arrecadação. |

## CNPJ 45723564000190

| Grupo | Serviço | Status | Tempo | Resumo |
|---|---|---:|---:|---|
| Dados Cadastrais & Enquadramento | CCMEI_DADOS | ✅ OK | 912ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | SIMEI | ✅ OK | 869ms | [[Aviso-CCMEI-BSN-0020]] Este CNPJ não possui mais a condição de MEI. |
| Dados Cadastrais & Enquadramento | PROCURACAO | ✅ OK | 773ms | [[Sucesso-PROCURACOES]] Requisição efetuada com sucesso. / [[Aviso-PROCURACOES-20001]] Uma ou mais procurações foram retornadas com sucesso. |
| Guias e Débitos (PGMEI) | PGMEI | ✅ OK | 768ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Guias e Débitos (PGMEI) | PGMEI_EXTRATO | ✅ OK | 1027ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_BOLETO | ✅ OK | 1087ms | [[EntradaIncorreta-PGMEI-23008]] Contribuinte não optante pelo SIMEI. |
| Guias e Débitos (PGMEI) | PGMEI_ATU_BENEFICIO | ❌ ERRO | 712ms | Operação de escrita "PGMEI_ATU_BENEFICIO" bloqueada: requer autorização explícita (permitirEscrita). Não disponível para atendimento automatizado. |
| Situação Fiscal & Certidões | SIT_FISCAL_SOLICITAR | ⏭️ SKIP | - | Requer CPF do empresário; frontend tem campo opcional, mas teste em lote por CNPJ não deve inventar CPF. |
| Situação Fiscal & Certidões | SIT_FISCAL_RELATORIO | ⏭️ SKIP | - | Requer protocolo de solicitação SITFIS válido. |
| Situação Fiscal & Certidões | CND | ⏭️ SKIP | - | Depende de CPF/protocolo SITFIS ou fluxo específico. |
| Dívida Ativa (PGFN) | PGFN_API | ✅ OK | 1043ms | PGFN: 1 inscrição(ões) encontrada(s), total consolidado R$ 1.660,53. Situações: ATIVA A SER AJUIZADA. |
| Dívida Ativa (PGFN) | DIVIDA_ATIVA | ✅ OK | 754ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Dívida Ativa (PGFN) | PGFN_CONSULTAR | ✅ OK | 754ms | [[Aviso-PGMEI-25001]] Não há débitos em dívida ativa. |
| Parcelamentos | PARCELAMENTO_MEI_CONSULTAR | ✅ OK | 909ms | [[Sucesso-PARCMEI]] Requisição efetuada com sucesso. |
| Parcelamentos | PARCELAMENTO_SN_CONSULTAR | ✅ OK | 2113ms | [[Aviso-PARCSN-ER_C001]] Não existe pedido de parcelamento para esse CNPJ. |
| Parcelamentos | PARCELAMENTO_MEI_EMITIR | ✅ OK | 798ms | [[Aviso-PARCMEI-ER_E001]] Não há parcelamento ativo para o contribuinte. |
| Parcelamentos | PARCELAMENTO_SN_EMITIR | ✅ OK | 784ms | [[Aviso-PARCSN-ER_E001]] Não há parcelamento ativo para o contribuinte. |
| Declarações | DASN_SIMEI | ❌ ERRO | 750ms | HTTP 403: [[AcessoNegado-ICGERENCIADOR-044]] Acesso negado. O serviço requisitado ainda não foi autorizado para ser acionado em produção. |
| Declarações | PGDASD | ⏭️ SKIP | - | Requer número DAS/recibo específico; frontend deixa manual. |
| Declarações | DCTFWEB | ✅ OK | 812ms | [[Sucesso-DCTFWEB]] Requisição efetuada com sucesso. / [[Aviso-DCTFWEB-MSGIC01]] Houve erro de negócio. Favor verificar as demais mensagens. / [[Aviso-DCTFWEB-MG08]] Não foi encontrada Declaração com os dados informados. |
| Mensagens e Processos | CAIXA_POSTAL | ✅ OK | 846ms | [Erro-CAIXAPOSTAL-02] Contribuinte não possui mensagem para filtro fornecido. |
| Mensagens e Processos | PROCESSOS | ✅ OK | 1014ms | [[Sucesso-EPROCESSO-SC_002]] Nenhum dado encontrado.  |
| Mensagens e Processos | PAGAMENTO | ❌ ERRO | 714ms | HTTP 400: Parâmetros de entrada inválidos. Informe número do documento de arrecadação. |

## Observações

- A PGFN oficial foi testada via API avulsa (PGFN_API) com token próprio.
- DIVIDA_ATIVA e PGFN_CONSULTAR permanecem no frontend como serviços legados do Integra Contador e podem cair no endpoint DIVIDAATIVA24.
- Resultados de erro por ausência de dados/procuração são classificados como AVISO quando representam condição operacional esperada.
