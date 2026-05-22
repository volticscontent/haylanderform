export const serproApi = {
    title: 'Integração Serpro (Integra Contador)',
    content: `
      ## Visão Geral
      O módulo **Serpro Integration** conecta a aplicação ao gateway **Integra Contador** do Serpro. Ele permite realizar consultas oficiais em tempo real sobre a situação fiscal de empresas (MEI), emitir CNDs e verificar dívidas ativas.

      A comunicação é protegida via **mTLS (Mutual TLS)**, exigindo um Certificado Digital A1 válido configurado no servidor.

      A lógica central reside em \`bot-backend/src/lib/serpro.ts\` (função \`consultarServico\`) e o catálogo de serviços em \`bot-backend/src/lib/serpro-config.ts\`.

      ---

      ## Fluxo de Autenticação e Consulta
      \`\`\`mermaid
      sequenceDiagram
          participant App as "Aplicação"
          participant Cache as "Cache de Tokens"
          participant SerproAuth as "Serpro Auth (OAuth)"
          participant Gateway as "Serpro Gateway"

          Note over App, Gateway: Autenticação (Renovação Automática)

          App->>Cache: Verificar Token Válido?
          alt Token Expirado ou Inexistente
              App->>SerproAuth: POST /authenticate (Client ID + Secret + Certificado A1)
              SerproAuth-->>App: Access Token + JWT Token
              App->>Cache: Armazenar Tokens
          else Token Válido
              Cache-->>App: Retornar Tokens em Memória
          end

          Note over App, Gateway: Execução da Consulta

          App->>Gateway: POST /Consultar (Payload JSON + Headers Auth)
          Gateway-->>App: Dados da Consulta (JSON / PDF base64)

          alt Erro na Resposta
              Gateway-->>App: Erro 4xx/5xx + Mensagem Detalhada
              App->>App: Tratar Erro (Log + Formatação)
          end
      \`\`\`

      ---

      ## Configuração de Ambiente

      ### Credenciais de Acesso
      - \`SERPRO_CLIENT_ID\`: Client ID da aplicação no Serpro.
      - \`SERPRO_CLIENT_SECRET\`: Secret key da aplicação.
      - \`SERPRO_CERT_PEM\` / \`SERPRO_CERT_PEM_PATH\`: Certificado público (PEM ou caminho).
      - \`SERPRO_CERT_KEY\` / \`SERPRO_CERT_KEY_PATH\`: Chave privada (PEM ou caminho).
      - \`CERTIFICADO_BASE64\` / \`SERPRO_CERT_PFX_PATH\`: Alternativa PKCS#12 (PFX).
      - \`CERTIFICADO_SENHA\`: Senha do PFX (se aplicável).
      - \`SERPRO_ROLE_TYPE\`: Tipo de papel (padrão: \`TERCEIROS\`).

      ### IDs de Sistema e Serviço
      Cada consulta requer um par de IDs específicos. Se as variáveis de ambiente não forem configuradas, os valores default do catálogo são usados (com aviso em log para PGFN_CONSULTAR e DIVIDA_ATIVA).

      | Serviço | Env Sistema | Env Serviço | Default Sistema | Default Serviço |
      |---------|-------------|-------------|-----------------|-----------------|
      | **CCMEI_DADOS** | \`INTEGRA_CCMEI_ID_SISTEMA\` | \`INTEGRA_CCMEI_DADOS_ID_SERVICO\` | CCMEI | DADOSCCMEI122 |
      | **PGMEI** | \`INTEGRA_PGMEI_ID_SISTEMA\` | \`INTEGRA_PGMEI_ID_SERVICO\` | PGMEI | DIVIDAATIVA24 |
      | **PGMEI_EXTRATO** | \`INTEGRA_PGMEI_ID_SISTEMA\` | \`INTEGRA_PGMEI_GERARDASPDF_ID_SERVICO\` | PGMEI | GERARDASPDF21 |
      | **PGMEI_BOLETO** | \`INTEGRA_PGMEI_ID_SISTEMA\` | \`INTEGRA_PGMEI_GERARDASCODBARRA_ID_SERVICO\` | PGMEI | GERARDASCODBARRA22 |
      | **SIMEI** | \`INTEGRA_SIMEI_ID_SISTEMA\` | \`INTEGRA_SIMEI_ID_SERVICO\` | CCMEI | DADOSCCMEI122 |
      | **SIT_FISCAL_SOLICITAR** | \`INTEGRA_SITFIS_ID_SISTEMA\` | \`INTEGRA_SITFIS_PROTOCOLO_ID_SERVICO\` | SITFIS | SOLICITARPROTOCOLO91 |
      | **SIT_FISCAL_RELATORIO** | \`INTEGRA_SITFIS_ID_SISTEMA\` | \`INTEGRA_SITFIS_RELATORIO_ID_SERVICO\` | SITFIS | RELATORIOSITFIS92 |
      | **CND** | \`INTEGRA_CND_ID_SISTEMA\` | \`INTEGRA_CND_ID_SERVICO\` | SITFIS | RELATORIOSITFIS92 |
      | **DIVIDA_ATIVA** | \`INTEGRA_DIVIDA_ATIVA_ID_SISTEMA\` | \`INTEGRA_DIVIDA_ATIVA_ID_SERVICO\` | PGMEI | DIVIDAATIVA24 |
      | **PGFN_CONSULTAR** | \`INTEGRA_PGFN_ID_SISTEMA\` | \`INTEGRA_PGFN_CONSULTA_ID_SERVICO\` | PGMEI | DIVIDAATIVA24 |
      | **DASN_SIMEI** | \`INTEGRA_DASNSIMEI_ID_SISTEMA\` | \`INTEGRA_DASNSIMEI_ID_SERVICO\` | DASNSIMEI | CONSULTIMADECREC152 |
      | **PGDASD** | \`INTEGRA_PGDASD_ID_SISTEMA\` | \`INTEGRA_PGDASD_ID_SERVICO\` | PGDASD | CONSEXTRATO16 |
      | **DCTFWEB** | \`INTEGRA_DCTFWEB_ID_SISTEMA\` | \`INTEGRA_DCTFWEB_ID_SERVICO\` | DCTFWEB | CONSDECCOMPLETA33 |
      | **CAIXA_POSTAL** | \`INTEGRA_CAIXA_POSTAL_ID_SISTEMA\` | \`INTEGRA_CAIXA_POSTAL_ID_SERVICO\` | CAIXAPOSTAL | MSGCONTRIBUINTE61 |
      | **PROCESSOS** | \`INTEGRA_PROCESSOS_ID_SISTEMA\` | \`INTEGRA_PROCESSOS_ID_SERVICO\` | EPROCESSO | CONSPROCPORINTER271 |
      | **PROCURACAO** | \`INTEGRA_PROCURACAO_ID_SISTEMA\` | \`INTEGRA_PROCURACAO_ID_SERVICO\` | PROCURACOES | OBTERPROCURACAO41 |
      | **PARCELAMENTO_SN_CONSULTAR** | \`INTEGRA_PARCSN_SISTEMA\` | \`INTEGRA_PARCSN_CONSULTAR_SERVICO\` | PARCSN | PEDIDOSPARC163 |
      | **PARCELAMENTO_MEI_CONSULTAR** | \`INTEGRA_PARCMEI_SISTEMA\` | \`INTEGRA_PARCMEI_CONSULTAR_SERVICO\` | PARCMEI | PEDIDOSPARC203 |

      ---

      ## Endpoints da API Interna

      ### 1. Consultar Serviço
      **POST** \`/api/serpro\`

      **Body:**
      \`\`\`json
      {
        "cnpj": "12345678000199",
        "service": "CCMEI_DADOS",
        "ano": "2025",
        "mes": "05",
        "cpf": "12345678901"
      }
      \`\`\`

      **Serviços disponíveis (\`service\`) — grupos:**

      **Dados Cadastrais & Enquadramento:**
      - \`CCMEI_DADOS\`: Dados cadastrais completos do MEI.
      - \`SIMEI\`: Situação de enquadramento no SIMEI (via CCMEI).
      - \`PROCURACAO\`: Consulta de procurações eletrônicas no e-CAC.

      **Guias e Débitos (PGMEI):**
      - \`PGMEI\`: Dívida ativa via PGMEI (padrão: DIVIDAATIVA24 — retorna PDF).
      - \`PGMEI_EXTRATO\`: Geração de PDF do DAS.
      - \`PGMEI_BOLETO\`: Geração de código de barras/linha digitável do DAS.
      - \`PGMEI_ATU_BENEFICIO\`: Atualização de benefícios previdenciários.

      **Situação Fiscal & Certidões (fluxo 2 etapas — CPF obrigatório):**
      - \`SIT_FISCAL_SOLICITAR\`: Etapa 1 — solicita protocolo (campo \`dados\` = vazio, usa Apoiar).
      - \`SIT_FISCAL_RELATORIO\`: Etapa 2 — retorna relatório completo com o protocolo obtido na Etapa 1 (campo \`protocoloRelatorio\` obrigatório).
      - \`CND\`: Emissão de Certidão via relatório SITFIS (requer \`protocoloRelatorio\`).

      **Declarações:**
      - \`DASN_SIMEI\`: Declaração Anual do MEI.
      - \`PGDASD\`: Extrato PGDAS-D.
      - \`DCTFWEB\`: Declaração DCTFWeb.

      **Dívida Ativa (PGFN):**
      - \`DIVIDA_ATIVA\`: Alias de PGMEI com env vars separadas (INTEGRA_DIVIDA_ATIVA_*). Loga aviso se env vars não configuradas.
      - \`PGFN_CONSULTAR\`: Alias dedicado para PGFN com env vars (INTEGRA_PGFN_*). Loga aviso se env vars não configuradas. Ambos usam DIVIDAATIVA24 por padrão (retorna PDF).

      **Mensagens e Processos:**
      - \`CAIXA_POSTAL\`: Mensagens da Receita Federal (DTE).
      - \`PROCESSOS\`: Processos administrativos.
      - \`PAGAMENTO\`: Comprovante de arrecadação.

      ---

      ## Resumo Técnico
      - **Protocolo**: HTTPS com mTLS (Mutual Authentication).
      - **Autenticação**: OAuth 2.0 (Client Credentials Flow). Tokens cacheados em memória até meia-noite BRT.
      - **Certificado**: A1 (PKCS#12 via node-forge ou PEM direto).
      - **Retry**: 2 tentativas automáticas em erros 5xx com backoff exponencial.
      - **Timeout**: 30s por requisição.
      - **Procuração**: Sync automático em \`leads_processo\` + \`lead_empresa\` após consulta bem-sucedida.
    `
}
