export const botArchitecture = {
  title: 'Arquitetura do Bot e Fluxo Conversacional',
  content: `
    ## Visão Geral
    A inteligência conversacional do sistema é composta por agentes especializados que operam sobre uma máquina de estados, utilizando modelos de linguagem (LLMs) para gerar respostas e tomar decisões.

    A comunicação entre o usuário (WhatsApp) e o bot é assíncrona e mediada pela **Evolution API**.

    ---

    ## Ecossistema de Agentes

    O sistema não utiliza um único "bot", mas sim três personas distintas que assumem o controle da conversa dependendo do estágio do lead.

    ### 1. Apolo (SDR - Sales Development Representative)
    - **Objetivo**: Triagem, qualificação e coleta de dados iniciais.
    - **Personalidade**: Profissional, direto, focado em entender a dor do cliente.
    - **Ferramentas**: Envio de formulário, consulta de dados básicos.
    - **Gatilho de Entrada**: Lead Novo ou Sem Interação Recente.

    ### 2. Icaro (Vendedor / Closer)
    - **Objetivo**: Negociação, apresentação de propostas e agendamento de reuniões.
    - **Personalidade**: Consultivo, persuasivo, especialista em tributário.
    - **Ferramentas**: Leitura de perfil financeiro, agendamento.
    - **Gatilho de Entrada**: Lead qualificado como SQL (Sales Qualified Lead).

    ### 3. Atendente (Suporte / Customer Success)
    - **Objetivo**: Tira-dúvidas, pós-venda e suporte técnico.
    - **Personalidade**: Empático, paciente, resolutivo.
    - **Ferramentas**: Consulta de status de serviço.
    - **Gatilho de Entrada**: Cliente já convertido ou MQL em nutrição.

    ---

    ## Fluxo de Conversação e Decisão (Bot Engine)

    O diagrama abaixo detalha como o sistema processa cada mensagem recebida.

    \`\`\`mermaid
    flowchart TD
        Msg["Mensagem Recebida - WhatsApp"] --> Webhook["Webhook Handler"]
        Webhook -->|Extrai Telefone| LoadCtx["Carregar Contexto - Redis + DB"]
        
        LoadCtx --> Router{"Roteador de Agentes"}
        
        Router -->|Lead Novo| AgentA["Carregar Prompt Apolo"]
        Router -->|Lead SQL| AgentB["Carregar Prompt Icaro"]
        Router -->|Cliente| AgentC["Carregar Prompt Atendente"]
        
        subgraph Processamento do Agente
            AgentA & AgentB & AgentC --> Inject["Injeção de Dados - RAG"]
            Inject -->|Dados do DB + Memória| LLM["Chamada OpenAI - GPT-4o"]
            
            LLM -->|Decisão| Action{"Ação Necessária?"}
            
            Action -->|Sim: Ferramenta| Tool["Executar Função - ex: update_lead"]
            Tool -->|Resultado| LLM
            
            Action -->|Não: Apenas Resposta| Response["Gerar Texto Final"]
        end
        
        Response --> SaveCtx["Salvar Histórico - Redis"]
        SaveCtx --> Send["Enviar via Evolution API"]
        Send --> User["Usuário"]
    \`\`\`

    ---

    ## Gerenciamento de Memória e Contexto

    Para manter conversas coerentes, o bot utiliza dois níveis de memória:

    ### 1. Memória de Curto Prazo (Redis)
    - **O que armazena**: As últimas 10-20 mensagens da conversa atual.
    - **Objetivo**: Manter o fio da meada ("O que eu acabei de perguntar?").
    - **TTL**: Expira após 24h de inatividade.

    ### 2. Memória de Longo Prazo (Postgres + pgvector)
    - **O que armazena**: Fatos importantes extraídos da conversa (ex: "Cliente disse que tem pressa pois conta foi bloqueada").
    - **Objetivo**: Personalização profunda e continuidade entre sessões.
    - **Mecanismo**: 
        1. O bot identifica um fato relevante.
        2. Gera um embedding (vetor numérico) desse fato.
        3. Salva na tabela \`interpreter_memories\`.
        4. Em conversas futuras, busca memórias similares semanticamente.

    ---

    ## Gatilhos e Comandos Específicos

    Além da conversação livre, o bot obedece a gatilhos determinísticos para garantir processos críticos.

    | Gatilho | Ação | Descrição |
    | :--- | :--- | :--- |
    | **[Trigger_1]** | Menu Principal | Força a exibição das opções de serviço. |
    | **[Trigger_2]** | Enviar Formulário | Envia o link único do LeadForm. |
    | **[Trigger_3]** | Apresentação | Envia PDF/Vídeo institucional. |
    | **[Trigger_4]** | Transbordo | Marca conversa como pendente para humano. |

    ---

    ## Como os Dados Fluem para o Bot?

    O "cérebro" do bot não acessa o banco de dados diretamente para tudo. Ele recebe um **Prompt de Sistema** enriquecido dinamicamente a cada mensagem.

    **Exemplo de Prompt Montado:**
    > "Você é o Apolo. O usuário se chama **Gustavo**.
    > Dados do CRM:
    > - Empresa: Haylander Tech
    > - Dívida: R$ 50.000 (Ativa)
    > - Status: Aguardando Qualificação
    >
    > Histórico Recente:
    > - User: Como resolvo isso?
    > - Bot: Preciso entender sua dívida...
    >
    > Instrução Atual: Convença-o a preencher o formulário."
  `
}
