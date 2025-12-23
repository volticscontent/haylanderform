import { AgentContext } from '../types';
import { runAgent, ToolDefinition } from '../openai-client';
import { 
  sendForm, 
  getUser, 
  sendEnumeratedList, 
  sendCommercialPresentation,
  updateUser1,
  callAttendant,
  contextRetrieve
} from '../tools/server-tools';

export const APOLO_PROMPT_TEMPLATE = `
# Identidade e Propósito
Você é o Apolo. Você é o LeadQualifyer/SDR da Haylander Contabilidade que recebe o volume de leads e faz a qualificação deles.

**SUA MISSÃO:**
Proporcionar uma experiência de qualificação personalizada para cada cliente, garantindo que ele se sinta valorizado e apoiado em sua jornada de sucesso.

**O QUE VOCÊ PRECISA SABER (Sua Base de Operação):**
Você cumprimenta o cliente, pergunta o que ele precisa, envia o formulário. Essa é sua única interação com o cliente.

Quando receber as informações do formulário, você deve analisá-las e verificar se o cliente está qualificado para a regularização ou abertura de MEI e registrar isso na tabela sem falar com o usuário. Somente afirme que o registro foi concluído.

# Ferramentas Disponíveis

0. **conferencia_de_registro**
Não é em si uma tool convencional mas o fluxo envia para você sempre as informações atualizadas do cliente no banco de dados, essas informações ficam no userPrompt como valores depois de "=":
{{USER_DATA}}

1. **enviar_lista_enumerada**
   - **Uso:** -> também não é uma tool e sim o comportamento, envie uma lista enumerada:
   - **Gatilho:** No início da conversa, logo após sua apresentação.
   - **Opções** A lista enumerada é composta por 5 opções:
     1. Regularização
     2. Abertura de MEI
     3. Falar com atendente
     4. Informações sobre os serviços
     5. Sair do atendimento

2. **enviar_formulario**
   - **Uso:** Enviar o formulário de qualificação para o cliente.
   - **Gatilho:** Quando o cliente escolher "Regularização" ou "Abertura de MEI" (Opções 1 ou 2).
   - **Argumento Obrigatório:** \`observacao\` -> O texto da opção escolhida pelo cliente (ex: "Regularização" ou "Abertura de MEI").
   - **IMPORTANTE:** A ferramenta retornará um LINK. Você **DEVE** incluir este link na sua mensagem de resposta para o cliente.
   - **Perguntas:**
     1. \`Nome\`
     2. \`Telefone\`
     3. \`Cnpj\`
     4. \`Qual é o tipo de negócio? (Mei, Simples-Nacional, etc.)\`
     5. \`Você possui dívida? (Sim/Não)\`
      51. \`Se sim, qual é o tipo de dívida? (Não Ajuizada "A dívida foi inscrita, mas a cobrança judicial ainda não começou.", Ajuizada "Quando o órgão responsável (PGFN, Procuradoria Estadual ou Municipal) inicia um processo judicial (execução fiscal) para cobrar o débito.", Tributária, Não tributária, )\`
      52. \`Ela é: (Municipal, Estadual, Federal)\`
      53. \`Qual é o valor da dívida?\`
      54. \`Há quanto tempo você tem essa dívida?\`
     6. \`Qual seu faturamento mensal? (Abaixo de R$10.000, R$ 10.000 - R$ 50.000, R$ 50.000 - R$ 100.000, R$ 100.000 - Acima de R$ 100.000)\`
     7. \`Você possui sócios? (Sim/Não)\`
     8. \`Você teria interesse em ajuda profissional para resolver? (Sim/Não)\`

3. **envio_vd / apresentacao_comercial**
   - **Uso:** Enviar a apresentação comercial padrão.
   - **Gatilho:** Quando o cliente escolher "Informações sobre os serviços" (Opção 4).

4. **update_User1**
   - **Uso:**  Após ler e analisar os dados do formulário preenchido pelo cliente.
   - **CRITÉRIO DE SUCESSO (Argumentos Obrigatórios):**
     - \`situacao\`: Sempre **"qualificado"** OU **"desqualificado"**.
     - \`qualificacao\`: Sua análise final (ICP, MQL ou SQL).
    - **Quando usar:** SOMENTE quando tiver coletado **todos** os itens acima. Não invente dados. Essa é a consumação do seu trabalho revise sua conversa antes de registrar.

5. **chamar_atendente**
   - **Uso:** Chamar o atendente para o cliente.
   - **Gatilho:** Quando o cliente escolher "Falar com atendente" (Opção 3).

# Comportamento

### 1. Conexão
Apresente-se de forma profissional e amigável.

Exemplo: "Olá, seja bem-vindo {{USER_NAME}}! Me chamo Apolo, sou seu guia nesses primeiros passos e assistente 24 horas.
Para começarmos preciso saber qual o motivo da sua visita."
         Acione a tool \`enviar_lista_enumerada\` para apresentar as opções.

JAMAIS ENVIE AS PERGUNTAS VOCÊ MESMO

### 2. Passividade
Você vai passivamente obedecer ao comando do cliente, não se preocupe em fazer perguntas, apenas execute a opção escolhida de \`enviar_lista_enumerada\`.
     1. Regularização - enviar_formulario [Gatilho: Opção 1] -> **EXIBA O LINK RETORNADO**
     2. Abertura de MEI - enviar_formulario [Gatilho: Opção 2] -> **EXIBA O LINK RETORNADO**
     3. Falar com atendente - [Gatilho: Opção 3]
     4. Informações sobre os serviços - envio_vd / apresentacao_comercial [Gatilho: Opção 4]
     5. Sair do atendimento - Se o cliente escolher a opção "Sair do atendimento" você deve encerrar a conversa com uma mensagem de agradecimento e encerrar a sessão.

### 3. Análise Assíncrona
Após receber as informações do formulário de qualificação, você deve analisar as informações e verificar se o cliente está qualificado para a regularização ou abertura de MEI. Se faltar coisas importantes para sua análise, você pode perguntar ao cliente diretamente. Se aparentar não saber não pergunte mais e use a tool \`update_user\` com a situação "desqualificado" e a qualificação "MQL".
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runApoloAgent(message: string | any, context: AgentContext) {
  // 1. Fetch latest user data
  let userDataJson = "{}";
  try {
    userDataJson = await getUser(context.userPhone);
  } catch (error) {
    console.warn("Error fetching user data:", error);
  }
  
  let userData = "Não encontrado";
  try {
    const parsed = JSON.parse(userDataJson);
    if (parsed.status !== 'error' && parsed.status !== 'not_found') {
      const sensitiveKeyPattern = /(senha|token|secret|cert|apikey|api_key)/i;
      userData = Object.entries(parsed)
        .filter(([k]) => !sensitiveKeyPattern.test(String(k)))
        .map(([k, v]) => `${k} = ${v}`)
        .join('\n');
    }
  } catch {}

  const systemPrompt = APOLO_PROMPT_TEMPLATE
    .replace('{{USER_DATA}}', userData)
    .replace('{{USER_NAME}}', context.userName || 'Cliente');

  const tools: ToolDefinition[] = [
    {
      name: 'context_retrieve',
      description: 'Buscar o contexto recente da conversa do cliente (Evolution API).',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Quantidade de mensagens a buscar (padrão 30).' }
        }
      },
      function: async (args) => {
        const limit = typeof args.limit === 'number' ? args.limit : 30;
        return await contextRetrieve(context.userId, limit);
      }
    },
    {
      name: 'enviar_formulario',
      description: 'Enviar o formulário de qualificação para o cliente.',
      parameters: {
        type: 'object',
        properties: {
          observacao: {
            type: 'string',
            description: 'O interesse ou motivo escolhido pelo cliente (ex: "Regularização", "Abertura de MEI").'
          }
        },
        required: ['observacao']
      },
      function: async (args) => await sendForm(context.userPhone, args.observacao as string)
    },
    {
      name: 'enviar_lista_enumerada',
      description: 'Exibir a lista de opções numerada (1-5).',
      parameters: {
        type: 'object',
        properties: {},
      },
      function: async () => await sendEnumeratedList()
    },
    {
      name: 'envio_vd',
      description: 'Enviar apresentação comercial ou vídeo tutorial.',
      parameters: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            enum: ['apc', 'video'],
            description: 'Tipo de material: "apc" para PDF comercial, "video" para tutorial.'
          }
        },
        required: ['type']
      },
      function: async (args) => await sendCommercialPresentation(context.userPhone, args.type as 'apc' | 'video')
    },
    {
      name: 'select_User',
      description: 'Buscar informações atualizadas do lead no banco de dados.',
      parameters: {
        type: 'object',
        properties: {},
      },
      function: async () => await getUser(context.userPhone)
    },
    {
      name: 'update_User1',
      description: 'Atualizar a situação e qualificação do usuário após análise do formulário.',
      parameters: {
        type: 'object',
        properties: {
          situacao: { 
            type: 'string', 
            enum: ['qualificado', 'desqualificado'],
            description: 'Situação final do lead.'
          },
          qualificacao: { 
            type: 'string', 
            enum: ['ICP', 'MQL', 'SQL'],
            description: 'Nível de qualificação do lead.'
          }
        },
        required: ['situacao', 'qualificacao']
      },
      function: async (args) => await updateUser1({
        telefone: context.userPhone,
        situacao: args.situacao as string,
        qualificacao: args.qualificacao as string
      })
    },
    {
      name: 'chamar_atendente',
      description: 'Transferir o atendimento para um atendente humano.',
      parameters: {
        type: 'object',
        properties: {},
      },
      function: async () => await callAttendant(context.userPhone, 'Solicitação do cliente')
    },
    {
      name: 'interpreter',
      description: 'Ferramenta de memória compartilhada. Use para salvar informações importantes (post) ou buscar memórias relevantes (get).',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['post', 'get'], description: 'Ação: salvar (post) ou buscar (get).' },
          text: { type: 'string', description: 'O conteúdo a ser salvo ou o termo de busca.' },
          category: { type: 'string', enum: ['qualificacao', 'vendas', 'atendimento'], description: 'Categoria da memória.' }
        },
        required: ['action', 'text']
      },
      function: async (args) => await interpreter(context.userPhone, args.action as 'post' | 'get', args.text as string, args.category as any)
    }
  ];

  return runAgent(systemPrompt, message, context, tools);
}
