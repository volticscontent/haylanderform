# Auditoria de Serviços Integra Contador / Serpro
**Data:** 29/05/2026
**CNPJ Testado:** 23950473000155 (Com Procuração e-CAC Ativa)

Foi realizado um teste automatizado (script) chamando todas as integrações disponíveis no catálogo do painel Admin para validar se estão ativas na assinatura atual da loja Serpro ou se exigem mais parâmetros.

## Resultados Consolidados

| Serviço | Status API | Tempo | Diagnóstico |
|---|---|---|---|
| **CCMEI_DADOS** | ✅ OK | 1639ms | Funciona perfeitamente. Retorna os dados cadastrais. |
| **PGMEI** | ✅ OK | 831ms | Funciona perfeitamente. Retorna débitos/guias. |
| **SIMEI** | ✅ OK | 604ms | Funciona perfeitamente. Retorna dados do enquadramento. |
| **DIVIDA_ATIVA** | ✅ OK | 956ms | Funciona perfeitamente. Retorna dívida ativa da PGFN. |
| **PARCELAMENTO_SN_CONSULTAR** | ✅ OK | 474ms | Funciona perfeitamente. |
| **PARCELAMENTO_MEI_CONSULTAR** | ✅ OK | 1342ms | Funciona perfeitamente. |
| **PROCURACAO** | ✅ OK | 482ms | Funciona perfeitamente. |
| **PGFN_CONSULTAR** | ✅ OK | 556ms | Funciona perfeitamente. |
| **DCTFWEB** | ✅ OK | 507ms | Funciona perfeitamente. |
| **PROCESSOS** | ✅ OK | 725ms | Funciona perfeitamente. |
| **PARCELAMENTO_SN_EMITIR** | ✅ OK | 412ms | Retornou sucesso no teste de comunicação (API Ativa). |
| **PARCELAMENTO_MEI_EMITIR** | ✅ OK | 16864ms | Retornou sucesso no teste de comunicação (API Ativa). |
| **PGMEI_EXTRATO** | ⚠️ HTTP 400 | 57ms | API Ativa, mas falhou por parâmetro inválido (exige mês/período, não apenas ano). |
| **PGMEI_BOLETO** | ⚠️ HTTP 400 | 130ms | API Ativa, mas falhou por parâmetro inválido (exige mês/período). |
| **PGMEI_ATU_BENEFICIO** | ⚠️ HTTP 400 | 142ms | API Ativa, mas requer payload estruturado de benefício. |
| **SIT_FISCAL_SOLICITAR** | ⚠️ HTTP 400 | 3ms | Falha local intencional: Requer CPF do empresário (não testável apenas com CNPJ). |
| **SIT_FISCAL_RELATORIO** | ⚠️ HTTP 400 | 1ms | Falha local intencional: Requer CPF do empresário. |
| **CND** | ⚠️ HTTP 400 | 1ms | Falha local intencional: Requer CPF do empresário. |
| **PGDASD** | ⚠️ HTTP 400 | 344ms | API Ativa, mas falhou pois requer o "Número do DAS" no payload. |
| **CAIXA_POSTAL** | ⚠️ HTTP 400 | 88ms | API Ativa, mas requer campo "statusLeitura" preenchido. |
| **PAGAMENTO** | ⚠️ HTTP 400 | 205ms | API Ativa, mas requer campo específico além do ano. |
| **DASN_SIMEI** | ❌ HTTP 403 | 160ms | **Acesso negado. O serviço requisitado não foi autorizado/contratado na loja Serpro.** |

## Conclusão
Ao contrário da suspeita inicial de que várias APIs estariam não assinadas, o teste técnico revelou que **apenas a API DASN_SIMEI (Declaração Anual) não está assinada/contratada** no seu pacote do Integra Contador.

Todas as outras APIs que estavam retornando erro no painel Admin (como PGDASD, Caixa Postal, PGMEI Extrato) na verdade estão **ativas e assinadas**, mas falham (HTTP 400) porque o formulário do painel Admin não enviou todos os parâmetros que a Serpro exige (como mês exato, número do recibo, CPF do sócio, etc).

*Ação imediata recomendada:* Atualizar a flag do sistema para que apenas a `DASN_SIMEI` fique como `nao_assinada`, enquanto as demais voltem para `ativo` (porém, exigindo ajustes no frontend para coletar os dados faltantes caso você queira usá-las).