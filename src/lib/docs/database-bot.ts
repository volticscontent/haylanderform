
export const databaseBot = {
  title: 'Banco de Dados e Bot Apolo',
  content: `
    ## Visão Geral
    Esta seção documenta a estrutura de dados central do sistema e a lógica de operação do **Bot Apolo**, o agente SDR (Sales Development Representative) automatizado da Haylander Contabilidade.

    ---

    ## Estrutura do Banco de Dados (PostgreSQL)

    O sistema utiliza uma arquitetura modular com tabelas especializadas vinculadas à tabela central \`leads\`.

    ### 1. Tabela \`leads\` (Core)
    Armazena a identidade principal do contato.

    | Coluna | Tipo | Descrição |
    | :--- | :--- | :--- |
    | \`id\` | SERIAL | Chave Primária |
    | \`telefone\` | String | **Chave de Busca** (Indexada). Formato: 5511999999999 |
    | \`nome_completo\` | String | Nome do lead |
    | \`email\` | String | E-mail de contato principal |
    | \`data_cadastro\` | Timestamp | Data de entrada no sistema |
    | \`atualizado_em\` | Timestamp | Última modificação |

    ### 2. Tabelas Satélites (Módulos)
    
    - **\`leads_empresarial\`**: Dados jurídicos (CNPJ, Razão Social, Faturamento, Dados Serpro).
    - **\`leads_qualificacao\`**: Status do funil (MQL/SQL), Situação, Interesse.
    - **\`leads_financeiro\`**: Dívidas (Ativa, Federal, etc.), Parcelamentos.
    - **\`leads_atendimento\`**: Controle de fluxo (envio_disparo, data_controle_24h, observações).
    - **\`leads_vendas\`**: Dados comerciais (reunião agendada, serviço negociado, procuração).

    ### 4. Tabela \`interpreter_memories\` (Memória Compartilhada)
    Armazena insights e contextos compartilhados entre os agentes (Apolo, Atendente, Vendedor).

    | Coluna | Tipo | Descrição |
    | :--- | :--- | :--- |
    | \`id\` | SERIAL | Chave Primária |
    | \`phone\` | String | Chave de Busca (Indexada). Telefone do cliente |
    | \`content\` | Text | Conteúdo da memória ou insight |
    | \`category\` | String | Categoria (qualificacao, vendas, atendimento) |
    | \`embedding\` | Vector(1536) | Vetor de embedding (OpenAI text-embedding-3-small) |
    | \`created_at\` | Timestamp | Data de criação |

    ---Todas as tabelas satélites possuem uma FK \`lead_id\` apontando para \`leads.id\`.

    ---

    ## Bot Apolo (SDR Automatizado) e Ecossistema de Agentes

    O sistema opera com 3 agentes especializados que compartilham memória e contexto:

    1. **Apolo (SDR)**: Triagem e qualificação inicial.
    2. **Vendedor (Icaro)**: Fechamento e negociação (assume leads qualificados).
    3. **Atendente (Suporte)**: Suporte ao cliente da base (blindagem).

    ### Fluxo de Conversação

    \`\`\`mermaid
    graph TD
        Start["Início da Conversa"] --> Router{"Roteador de Agentes"}
        
        Router -->|Lead Novo| Apolo["Apolo (SDR)"]
        Router -->|Qualificado| Vendedor["Vendedor (Icaro)"]
        Router -->|Cliente Base| Atendente["Atendente (Suporte)"]

        subgraph Apolo_Fluxo
            Apolo --> Saudacao{"Saudação + Menu"}
            Saudacao -->|"Opção 1/2"| Form["Enviar Link Formulário"]
            Form --> Wait["Aguardar Preenchimento"]
            Wait --> Analise["Análise de Perfil"]
            Analise -->|"Qualificado"| Update["Update Status -> Qualificado"]
            Update --> Vendedor
        end

        subgraph Vendedor_Fluxo
            Vendedor --> Contexto["Ler Memória Compartilhada"]
            Contexto --> Abordagem["Abordagem Consultiva"]
            Abordagem --> Agendar["Agendar Reunião (Link)"]
        end

        subgraph Shared_Memory
            Memoria[("Interpreter Memories (Vector Store)")]
        end

        Apolo -.->|Gravar Insights| Memoria
        Vendedor -.->|Ler Contexto| Memoria
        Atendente -.->|Ler/Gravar| Memoria
    \`\`\`

    ### Ferramentas e Capacidades

    #### **Memória Compartilhada (`interpreter`)**
    - **Função**: Permite que os bots salvem e recuperem informações contextuais importantes.
    - **Tecnologia**: Busca vetorial (Vector Search) para encontrar memórias relevantes por similaridade semântica.
    - **Uso**: 
        - Apolo salva: "Cliente tem dívida de 50k e urgência por bloqueio judicial."
        - Vendedor recupera: Ao iniciar, busca contexto e já sabe da urgência.

    #### **Envio de Mídia (`sendCommercialPresentation`)**
    - **Ação**: Envia PDFs e Vídeos nativamente via API (não apenas links de texto).
    - **Integração**: Evolution API.

    #### **Gatilhos e Comandos (Apolo)**

    O bot opera baseado em triggers específicos integrados ao fluxo do WhatsApp.

    #### **0. Atualização Cadastral** (\`conferencia_de_registro\`)
    Processo contínuo que injeta dados atualizados do banco no contexto do bot (\`userPrompt\`), permitindo que ele personalize o atendimento (ex: chamando o cliente pelo nome).

    #### **1. Menu Principal** (\`enviar_lista_enumerada\`)
    - **Gatilho**: \`[Trigger_1]\`
    - **Ação**: Apresenta as opções de serviço (1 a 5).
    - **Regra**: Nunca deve enviar perguntas abertas neste estágio.

    #### **2. Envio de Formulário** (\`enviar_formulario\`)
    - **Gatilho**: \`[Trigger_2]\`
    - **Ação**: Envia o link único do formulário web (\`haylanderform.vercel.app\`).
    - **Motivo**: A coleta de dados sensíveis (CNPJ, Faturamento) é mais segura e estruturada via formulário web do que via chat.

    #### **3. Apresentação Comercial** (\`envio_vd\`)
    - **Gatilho**: \`[Trigger_3]\`
    - **Ação**: Envia material rico (PDF/Vídeo) explicando os serviços.

    #### **4. Transbordo Humano** (\`chamar_atendente\`)
    - **Gatilho**: \`[Trigger_4]\`
    - **Ação**: Marca a conversa como "Pendente de Atendimento" e notifica a equipe.

    ### Matriz de Qualificação

    Após o preenchimento do formulário, o Apolo classifica o lead usando a função \`update_User1\`:

    | Classificação | Critério | Ação do Bot |
    | :--- | :--- | :--- |
    | **ICP (Ideal Customer)** | Dívida alta, Faturamento estável, Contato fácil | Transbordo Imediato (Prioridade Alta) |
    | **MQL (Marketing Qualified)** | Dívida média, Dados incompletos | Nutrição com conteúdo |
    | **Desqualificado** | Sem dívida, Apenas curiosidade | Encerramento educado |

    ---

    ## Resumo Técnico - Banco de Dados e Bot
    - **Banco de Dados**: PostgreSQL (Vercel Postgres) com schema relacional.
    - **Bot Engine**: Máquina de Estados Finitos (FSM) via Webhooks do WhatsApp.
    - **Integração**: Trigger-based (Gatilhos de palavras-chave ou botões).
    - **Identificação**: Chave primária de contato é o número de telefone (E.164).
    - **Qualificação**: Algoritmo determinístico baseado em dados financeiros (Dívida + Faturamento).
  `
}
