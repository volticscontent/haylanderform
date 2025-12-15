export const serproApi = {
    title: 'Integração Serpro (Integra Contador)',
    content: `
      ## Visão Geral
      O módulo **Serpro Integration** conecta a aplicação ao gateway **Integra Contador** do Serpro. Ele permite realizar consultas oficiais em tempo real sobre a situação fiscal de empresas (MEI), emitir CNDs e verificar dívidas ativas.

      A comunicação é protegida via **mTLS (Mutual TLS)**, exigindo um Certificado Digital A1 válido configurado no servidor.

      ---

      ## Fluxo de Autenticação e Consulta
      O diagrama abaixo ilustra como o sistema gerencia credenciais e realiza chamadas seguras.

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
          Gateway-->>App: Dados da Consulta (JSON)
          
          alt Erro na Resposta
              Gateway-->>App: Erro 4xx/5xx + Mensagem Detalhada
              App->>App: Tratar Erro (Log + Formatação)
          end
      \`\`\`

      ---

      ## Configuração de Ambiente
      Para que a integração funcione, as seguintes variáveis de ambiente devem estar configuradas no \`.env.local\`:

      ### Credenciais de Acesso
      - \`SERPRO_CLIENT_ID\`: Client ID da aplicação no Serpro.
      - \`SERPRO_CLIENT_SECRET\`: Secret key da aplicação.
      - \`SERPRO_CERT_PEM\`: Conteúdo do certificado público (PEM).
      - \`SERPRO_CERT_KEY\`: Conteúdo da chave privada (PEM).
      - \`SERPRO_ROLE_TYPE\`: Tipo de papel (padrão: \`TERCEIROS\`).

      ### IDs de Sistema e Serviço
      Cada consulta requer um par de IDs específicos fornecidos pelo Serpro.

      | Serviço | Variável de Sistema | Variável de Serviço |
      |---------|---------------------|---------------------|
      | **CCMEI** | \`INTEGRA_CCMEI_ID_SISTEMA\` | \`INTEGRA_CCMEI_DADOS_ID_SERVICO\` |
      | **PGMEI** | \`INTEGRA_PGMEI_ID_SISTEMA\` | \`INTEGRA_PGMEI_ID_SERVICO\` |
      | **SIMEI** | \`INTEGRA_SIMEI_ID_SISTEMA\` | \`INTEGRA_SIMEI_ID_SERVICO\` |
      | **Situação Fiscal** | \`INTEGRA_SIT_FISCAL_ID_SISTEMA\` | \`INTEGRA_SIT_FISCAL_ID_SERVICO\` |
      | **Dívida Ativa** | \`INTEGRA_DIVIDA_ATIVA_ID_SISTEMA\` | \`INTEGRA_DIVIDA_ATIVA_ID_SERVICO\` |
      | **CND** | \`INTEGRA_CND_ID_SISTEMA\` | \`INTEGRA_CND_ID_SERVICO\` |
      | **DASN** | \`INTEGRA_DASN_SIMEI_ID_SISTEMA\` | \`INTEGRA_DASN_SIMEI_ID_SERVICO\` |

      ---

      ## Endpoints da API Interna

      ### 1. Consultar Serviço
      **POST** \`/api/serpro\`
      
      Proxy para a função \`consultarServico\`. Salva automaticamente o registro de consulta no banco de dados.

      **Body:**
      \`\`\`json
      {
        "cnpj": "12345678000199",
        "service": "CCMEI_DADOS",
        "options": {
            "ano": "2024",       // Opcional (Para PGMEI, DASN, Dívida Ativa)
            "mes": "10"          // Opcional (Para geração de DAS no PGMEI)
        }
      }
      \`\`\`

      **Serviços Disponíveis (\`service\`):**
      - \`CCMEI_DADOS\`: Dados cadastrais completos (Padrão).
      - \`PGMEI\`: Extrato de apuração e geração de DAS.
      - \`SIMEI\`: Situação de enquadramento no SIMEI.
      - \`SIT_FISCAL\`: Situação fiscal geral.
      - \`DIVIDA_ATIVA\`: Consulta de débitos inscritos em dívida ativa.
      - \`CND\`: Certidão Negativa de Débitos.
      - \`DASN_SIMEI\`: Declaração Anual.
      - \`PARCELAMENTO\`: Situação de parcelamentos.
      - \`PROCESSOS\`: Consulta de processos administrativos.

      ### 2. Listar Clientes Consultados
      **GET** \`/api/serpro/clients\`
      
      Retorna os últimos 10 clientes que tiveram consultas realizadas com sucesso.
      
      **Resposta:**
      \`\`\`json
      {
        "clients": [
          {
            "id": 1,
            "nome": "Fulano de Tal",
            "cnpj": "...",
            "data_ultima_consulta": "2023-10-25T..."
          }
        ]
      }
      \`\`\`

      ---

      ## Resumo Técnico - Serpro Integration
      - **Protocolo**: HTTPS com mTLS (Mutual Authentication).
      - **Autenticação**: OAuth 2.0 (Client Credentials Flow).
      - **Certificado**: A1 (PKCS#12 convertido para PEM/KEY).
      - **Biblioteca HTTP**: \`https\` (Node.js nativo) com \`Agent\` customizado.
      - **Cache**: Variável global em memória para tokens (evita overhead de reautenticação).
      - **Tratamento de Erros**: Fallback inteligente para mensagens do gateway.

      ### Detalhes de Implementação
      A lógica central reside em \`src/lib/serpro.ts\`. A função \`consultarServico\` encapsula toda a complexidade de autenticação, renovação de token e formatação de headers.
    `
}
