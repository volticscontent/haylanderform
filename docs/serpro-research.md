# Relatório Avançado: Ecossistema Integra Contador (Serpro)

> **Status**: Pesquisa Profunda Concluída
> **Total de Serviços Identificados**: ~84 Funcionalidades
> **Cobertura Atual do Projeto**: ~15% (Foco em MEI Básico)

Este documento mapeia o potencial completo da API Integra Contador, indo além do catálogo básico e revelando os IDs técnicos e fluxos de autenticação necessários para implementação.

---

## 1. O "Mapa do Tesouro": IDs e Serviços

A API Integra Contador é dividida em 5 grandes verbos/endpoints: `Consultar`, `Emitir`, `Declarar`, `Monitorar` e `Apoiar`.

### A. Módulo Simples Nacional (PGDAS-D) - *Prioridade Alta*
Essencial para empresas que não são MEI. Permite calcular impostos e gerar guias DAS.

| Operação | ID Sistema (Fixo?) | ID Serviço (Exemplo) | Descrição Técnica |
| :--- | :--- | :--- | :--- |
| **Consultar Declarações** | `PGDASD` | `CONSDECLARACAO13` | Lista declarações transmitidas por ano. |
| **Gerar DAS** | `PGDASD` | `GERARDAS12` | Gera a guia de pagamento (PDF) para um período. |
| **Consultar Última** | `PGDASD` | `CONSULTIMADECREC14` | Pega a última declaração/recibo transmitido. |
| **Consultar Recibo** | `PGDASD` | `CONSDECREC15` | Busca recibo específico pelo número da declaração. |
| **Consultar Extrato** | `PGDASD` | `CONSEXTRATO16` | Extrato de pagamentos e débitos. |
| **DAS Avulso** | `PGDASD` | *Novo (2025)* | Preenchimento manual de valores. |

### B. Módulo Parcelamentos (Simples & MEI) - *Oportunidade Crítica*
Permite regularizar dívidas. É dividido em 8 modalidades distintas.

| Modalidade | ID Sistema | Serviços Disponíveis (Padrão para todos) |
| :--- | :--- | :--- |
| **PARCSN** | `PARCSN` | 1. Consultar Pedidos de Parcelamento<br>2. Consultar Situação do Parcelamento<br>3. Emitir Guia de Parcela<br>4. Detalhar Pagamentos |
| **PARCMEI** | `PARCMEI` | *Idem acima* (Focado em MEI) |
| **PERT-SN** | `PERTSN` | Programa Especial de Regularização (Refis) |
| **PERT-MEI** | `PERTMEI` | Refis para MEI |
| **RELP-SN** | `RELPSN` | Reescalonamento de Débitos (Simples) |
| **RELP-MEI** | `RELPMEI` | Reescalonamento de Débitos (MEI) |
| **Especiais** | `PARCSNESP` | Parcelamentos Especiais (Ex: Enchentes/Calamidade) |

### C. Módulo DCTFWeb & MIT (Novo Padrão)
Substitui a antiga DCTF e integra com o eSocial/Reinf.

| Operação | ID Sistema | ID Serviço | Notas |
| :--- | :--- | :--- | :--- |
| **Consultar Recibo** | `DCTFWEB` | `CONSRECIBO32` | Recibo de entrega. |
| **Declaração Completa** | `DCTFWEB` | `CONSDECCOMPLETA33` | XML/PDF da declaração. |
| **Encerrar Apuração** | `MIT` | *Novo* | Encerra o período no Módulo de Inclusão de Tributos. |
| **Gerar DARF** | `MIT` | *Novo* | Gera guia para declaração em andamento. |

### D. Módulo Monitoramento & Apoio
Para escritórios contábeis que gerenciam múltiplos clientes.

| Serviço | ID Sistema | Descrição |
| :--- | :--- | :--- |
| **Caixa Postal** | `CAIXAPOSTAL` | Ler mensagens oficiais da RFB (Intimações, Avisos). |
| **Procurações** | `PROCURACAO` | Verificar se o escritório tem poder para agir pelo CNPJ. |
| **E-Processo** | `EPROCESSO` | `CONSPROCPORINTER271`: Consultar processos administrativos. |
| **DTE** | `DTE` | Verificar adesão ao Domicílio Tributário Eletrônico. |

---

## 2. Autenticação e "Pulo do Gato"

A autenticação para escritórios (Software House ou Contador) tem um fluxo específico que não implementamos totalmente:

1.  **Autenticação Básica**: `Consumer Key` + `Secret` + `Certificado (A1)` -> Gera `Bearer Token` + `JWT Token`.
2.  **Autenticação Procurador**: Se você é um escritório agindo em nome de um cliente:
    *   É necessário passar um Header extra `autenticar_procurador_token` ou assinar o payload XML com o certificado do procurador (em alguns endpoints antigos).
    *   A API moderna (JSON) simplificou isso, exigindo que o `autorPedidoDados` (no Body) seja o CNPJ do escritório (Procurador) e o `contribuinte` seja o Cliente.

---

## 3. Gap Analysis (Onde estamos vs. Onde podemos ir)

| Área | Status Atual | Potencial | Ação Recomendada |
| :--- | :--- | :--- | :--- |
| **MEI (Simei)** | ⭐⭐⭐⭐⭐ (Completo) | Manutenção | Monitorar mudanças na API. |
| **Simples Nacional** | ⭐☆☆☆☆ (Básico) | Crítico | Implementar **PGDAS-D** (Cálculo e DAS). |
| **Dívidas** | ⭐⭐☆☆☆ (Parcial) | Alto | Implementar **Parcelamentos** (Emitir guias de atrasados). |
| **Compliance** | ⭐☆☆☆☆ (SITFIS apenas) | Médio | Implementar **Caixa Postal** e **DCTFWeb**. |
| **Processos** | ☆☆☆☆☆ (Inexistente) | Baixo | Implementar E-Processo apenas se demandado. |

## 4. Próximo Passo Técnico (Atualizado 2026-02-12)

**Status do Teste PGDAS-D**: ✅ **SUCESSO**
O serviço `PGDASD` foi testado e os IDs padronizados foram confirmados.

- **ID Sistema**: `PGDASD`
- **ID Serviço**: `CONSDECLARACAO13`
- **Payload Testado**: Consulta de declarações por ano (retornou dados de 2025 com status de DAS).

**Atenção Crítica - Certificado Digital**:
Foi identificado que o certificado PFX atual utiliza criptografia legada (provavelmente RC2/3DES). Para que a conexão funcione em Node.js v17+, é **obrigatório** utilizar a flag `--openssl-legacy-provider` ou re-exportar o certificado com criptografia moderna (AES-256).

```bash
# Exemplo de execução com suporte legado
NODE_OPTIONS=--openssl-legacy-provider npm start
```

Isso explica os relatos de falha na CND ("cnd parece não funcionar"), pois a aplicação em produção provavelmente está rodando sem essa flag e falhando silenciosamente na negociação TLS.

```typescript
// Configuração Confirmada para PGDAS-D
PGDASD: {
  env_sistema: 'INTEGRA_PGDASD_ID_SISTEMA', // Default: 'PGDASD'
  env_servico: 'INTEGRA_PGDASD_ID_SERVICO', // Default: 'CONSDECLARACAO13'
  tipo: 'Consultar',
  versao: '1.0'
}
```
