export const listApi = {
    title: 'API de Gestão de Lista',
    content: `
      ## Visão Geral
      Conjunto de endpoints para manipulação de leads (clientes) em massa ou individualmente. Permite segmentação avançada para atualizações em lote e manutenção da base de dados.

      ---

      ## Endpoints em Massa (Bulk)

      ### 1. Atualização em Massa
      **POST** \`/api/leads/bulk-update\`

      Atualiza um conjunto de registros que correspondam a um critério de filtro específico.

      **Payload de Exemplo:**
      \`\`\`json
      {
        "where": {
          "column": "situacao",
          "operator": "in", // ou 'not_in', 'is_empty', 'is_not_empty'
          "values": ["pendente", "novo"]
        },
        "update": {
          "column": "envio_disparo",
          "action": "set_value", // ou 'set_empty', 'toggle_boolean'
          "value": "processando"
        }
      }
      \`\`\`

      ### 2. Deleção em Massa
      **POST** \`/api/leads/bulk-delete\`

      Remove permanentemente registros que correspondam aos critérios fornecidos.

      **Payload de Exemplo:**
      \`\`\`json
      {
        "column": "qualificacao",
        "operator": "in",
        "values": ["Desqualificado", "Sem Interesse"]
      }
      \`\`\`

      ---

      ## Endpoints Individuais (CRUD)

      ### 3. Buscar Usuário
      **GET** \`/api/user/[phone]\`

      Retorna os dados completos de um lead específico buscando pelo telefone (chave primária efetiva).

      **Resposta:**
      \`\`\`json
      {
        "id": 123,
        "nome_completo": "João da Silva",
        "telefone": "5511999999999",
        "cnpj": "12.345.678/0001-90",
        "situacao": "ativo",
        "data_ultima_consulta": "2023-10-25T10:00:00.000Z",
        "data_controle_24h": "2023-10-25T15:30:00.000Z",
        "envio_disparo": "a1"
        // ... outros campos
      }
      \`\`\`

      ### 4. Atualizar Usuário
      **PUT** \`/api/user/[phone]\`

      Atualiza os dados de um lead específico. Apenas os campos enviados no JSON serão alterados (PATCH behavior).

      **Payload:**
      \`\`\`json
      {
        "email": "joao.novo@email.com",
        "faturamento_mensal": "5000.00",
        "possui_socio": "Sim", // String 'Sim'/'Não' convertida para boolean
        "observacoes": "Cliente solicitou contato tarde."
      }
      \`\`\`

      ---

      ## Estrutura de Filtros (Where)

      A lógica de filtragem é compartilhada entre os endpoints de *bulk*.

      | Operador | Descrição | Exemplo de Uso |
      | :--- | :--- | :--- |
      | \`in\` | Valor da coluna está na lista fornecida | \`status IN ('A', 'B')\` |
      | \`not_in\` | Valor NÃO está na lista | \`status NOT IN ('X')\` |
      | \`is_empty\` | Coluna é NULL ou vazia | \`email IS NULL\` |
      | \`is_not_empty\` | Coluna tem valor preenchido | \`telefone IS NOT NULL\` |

      **Colunas Permitidas:**
      - Dados Cadastrais: \`nome_completo\`, \`cnpj\`, \`email\`, \`telefone\`
      - Status: \`situacao\`, \`qualificacao\`, \`envio_disparo\`
      - Atendimento: \`data_controle_24h\`, \`observacoes\`
      - Financeiro: \`valor_divida_ativa\`, \`faturamento_mensal\`
      - Metadados: \`data_cadastro\`, \`atualizado_em\`

      ---

      ## Resumo Técnico - List API
      - **Segurança**: Validação de parâmetros via Zod.
      - **Performance**: Operações de \`UPDATE WHERE ... IN (...)\` otimizadas.
      - **Integridade**: Transações atômicas para evitar atualizações parciais.
      - **Limites**: Paginação implícita para grandes volumes (Chunking no cliente).
    `
}
