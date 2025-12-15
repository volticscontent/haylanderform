
export const forms = {
    title: 'Formulários do Sistema',
    content: `
      ## Visão Geral
      O sistema possui três principais formulários de entrada de dados voltados para o público externo, além de interfaces administrativas para gestão.

      ## 1. Formulário de Qualificação de Lead (LeadForm)
      Este é o formulário principal do sistema, utilizado para qualificar contatos e coletar informações financeiras detalhadas.

      - **Localização no Código**: \`src/components/LeadForm.tsx\`
      - **Rotas de Acesso**:
      1. \`/\` (Página inicial)
      2. \`/[phone]\` (Pré-preenchido com telefone)
      3. \`/[phone]/[observacao]\` (Pré-preenchido com telefone e observação)
      - **Objetivo**: Qualificar o lead para serviços de contabilidade, focando especialmente em identificar dívidas e o perfil tributário.
      
      ## Fluxo de Dados LeadForm

      \`\`\`mermaid
      sequenceDiagram
          participant U as Usuário
          participant F as "LeadForm (Frontend)"
          participant API as "API (/api/user/[phone])"
          participant DB as "Tabela (haylander)"
          participant W as WhatsApp

          U->>F: Acessa formulário (com/sem telefone)
          
          opt Telefone na URL
              F->>API: GET /api/user/[phone]
              API->>DB: SELECT * WHERE telefone = ?
              DB-->>API: Dados existentes
              API-->>F: Preenche campos automaticamente
          end

          U->>F: Preenche/Atualiza dados
          Note right of U: Email, Senha Gov, Dívidas, Faturamento

          F->>F: Validação de Campos
          F->>F: Cálculo de Parcelamento (Estimativa)

          F->>API: PUT /api/user/[phone]
          Note right of F: Payload inclui: <br/>- Dados Pessoais<br/>- Dados Dívida<br/>- Status 'a1'<br/>- Agendamento +24h

          API->>DB: UPDATE haylander
          DB-->>API: Confirmação
          API-->>F: Sucesso

          F->>W: Redireciona para WhatsApp
          Note right of W: Inicia conversa com Atendente/Bot
      \`\`\`

      1. **Carregamento**: Se um telefone é fornecido na URL, o sistema busca os dados existentes na tabela \`haylander\` via API (\`GET /api/user/[phone]\`) para pré-preencher o formulário.
      2. **Preenchimento**: O usuário informa ou confirma dados como Email, Senha Gov, CNPJ, Tipo de Negócio, Faturamento e detalha suas dívidas (Municipal, Estadual, Federal, Ativa).
      3. **Cálculo Dinâmico**: O formulário calcula automaticamente opções de parcelamento baseadas no valor total das dívidas informadas.
      4. **Submissão**: Os dados são enviados via \`PUT\` para \`/api/user/[phone]\`.
      5. **Pós-Processamento**:
      - O status de envio (\`envio_disparo\`) é atualizado para 'a1'.
      - A data de controle (\`data_controle_24h\`) é agendada para 24h no futuro.
      - O usuário é redirecionado para o WhatsApp para continuar o atendimento.

      ## 2. Formulário de Abertura de MEI (MEIForm)
      Formulário específico para coleta de dados necessários para a formalização de um Microempreendedor Individual.

      - **Localização no Código**: \`src/components/MEIForm.tsx\`
      - **Rota de Acesso**: \`/abrir-mei\`
      - **Objetivo**: Coletar todos os dados cadastrais exigidos pelo governo para abertura de um CNPJ MEI.
      
      ## Fluxo de Dados MEIForm

      \`\`\`mermaid
      graph TD
          A["Início: Acesso /abrir-mei"] --> B{"Formulário Preenchido?"}
          B -- Não --> C["Exibe Campos: <br/>- Pessoais (CPF, Mãe, etc)<br/>- Contato (Email, Senha Gov)<br/>- Endereço<br/>- Atividade (CNAE)"]
          B -- Sim --> D["Validar Dados"]
          
          D --> E{"Dados Válidos?"}
          E -- Não --> C
          E -- Sim --> F["POST /api/mei/submit"]
          
          F --> G[("Tabela mei_applications")]
          G --> H["Vincular ao User ID (haylander)"]
          
          H --> I["Gerar Resumo Formatado"]
          I --> J["Redirecionar WhatsApp"]
          J --> K["Atendente Recebe Dados Prontos"]
      \`\`\`

      1. **Validação**: O formulário possui validações de campos obrigatórios, formato de CPF, E-mail e CEP.
      2. **Submissão**: Os dados são enviados via \`POST\` para \`/api/mei/submit\`.
      3. **Armazenamento**: Os dados são salvos em uma tabela dedicada (\`mei_applications\`), vinculada ao usuário principal através do telefone/ID.
      4. **Integração**: Após o envio, o sistema gera um resumo dos dados formatado e redireciona o usuário para o WhatsApp, facilitando a conferência pelo atendente.

      ## 3. Formulário de Cadastro e-CAC (ECACForm)
      Formulário para cadastro de usuários com foco em acesso e-CAC.

      - **Localização no Código**: \`src/components/ECACForm.tsx\`
      - **Rota de Acesso**: \`/cadastro\`
      - **Objetivo**: Coletar credenciais de acesso Gov.br para serviços e-CAC.
      
      ## Fluxo de Dados ECACForm

      \`\`\`mermaid
      sequenceDiagram
          participant U as Usuário
          participant F as ECACForm
          participant API as "API (/api/ecac/submit)"
          participant DB as "Tabela (haylander)"

          U->>F: Informa Nome, Telefone, Email, Senha Gov
          F->>API: Envia dados (POST)
          API->>DB: UPSERT (Inserir ou Atualizar)
          Note over DB: Chave única: Telefone
          DB-->>API: Confirmação
          API-->>F: Sucesso
          F->>U: Exibe Mensagem de Confirmação
      \`\`\`

      1. **Coleta**: Solicita Nome, Telefone, Email e Senha Gov.
      2. **Submissão**: Envia para \`/api/ecac/submit\`.
      3. **Armazenamento**: Cria ou atualiza registro na tabela \`haylander\`.

      ## 4. Formulários Administrativos
      Além dos formulários públicos, o sistema conta com interfaces internas:

      - **Login Administrativo** (\`src/app/admin/login\`): Utiliza Server Actions para autenticação segura baseada em sessão (cookie \`admin_session\`).
      - **Configurador de Disparos** (\`src/app/admin/disparo\`): Uma interface complexa que permite filtrar a base de leads por múltiplos critérios (status, valores, etc.), compor mensagens com variáveis dinâmicas (ex: \`{{nome_completo}}\`) e agendar disparos. Diferente dos outros, este formulário salva as configurações no \`localStorage\` do navegador para serem processadas pela ferramenta de automação.

      ## Resumo Técnico - LeadForm
      - **Renderização**: Client Component (\`use client\`)
      - **Método HTTP**: \`PUT\` (Atualização)
      - **Tabela Banco**: \`haylander\`
      - **Automação**: Atualiza agendamento (24h)
      - **Validação**: Condicional (Dívidas)

      ## Resumo Técnico - MEIForm
      - **Renderização**: Client Component (\`use client\`)
      - **Método HTTP**: \`POST\` (Criação)
      - **Tabela Banco**: \`mei_applications\`
      - **Automação**: Gera resumo p/ WhatsApp
      - **Validação**: Estrutural (CPF, CEP, Campos)
    `
}
