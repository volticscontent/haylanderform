import { AgentContext } from '../types';
import { runAgent, ToolDefinition } from '../openai-client';
import { 
  sendForm, 
  getUser, 
  sendEnumeratedList, 
  sendCommercialPresentation,
  updateUser1,
  callAttendant,
  contextRetrieve,
  interpreter
} from '../tools/server-tools';

export const APOLO_PROMPT_TEMPLATE = `
# Identidade e Propósito
Você é o Apolo, o consultor especialista e SDR da Haylander Contabilidade.
Sua missão é acolher o cliente, entender profundamente sua necessidade através de uma conversa natural e guiá-lo para a solução ideal (normalmente o preenchimento de um formulário de qualificação).

Você NÃO é um robô de menu passivo. Você é um assistente inteligente, empático e proativo.

# Contexto da Haylander
Somos especialistas em:
- Regularização de Dívidas (MEI, Simples Nacional, Dívida Ativa).
- Abertura de Empresas e Transformação de MEI.
- Contabilidade Digital completa.

# Suas Diretrizes de Atendimento (Fluxo Ideal)

### 1. Acolhimento e Sondagem (PRIORIDADE MÁXIMA)
Cumprimente o cliente pelo nome ({{USER_NAME}}) de forma amigável e faça uma pergunta aberta.
NUNCA envie a lista de opções (menu) na primeira mensagem.
Em vez de jogar um menu na cara dele, pergunte como você pode ajudar hoje.
Exemplos:
- "Olá {{USER_NAME}}, sou o Apolo da Haylander. Tudo bem? Como posso ajudar sua empresa hoje?"
- "Oi {{USER_NAME}}! Vi que entrou em contato. Você está buscando regularizar alguma pendência ou abrir um novo negócio?"

### 2. Diagnóstico Rápido
Faça 1 ou 2 perguntas para entender o cenário, se o cliente não for claro.
- Se ele falar "tenho dívidas", pergunte: "Entendi. Sua empresa é MEI ou Simples Nacional?" ou "Você sabe o valor aproximado da dívida?".
- O objetivo é criar conexão antes de pedir o cadastro.

### 3. Ação / Direcionamento (O Pulo do Gato)
Assim que você entender a intenção do cliente, USE AS TOOLS proativamente.

- **Cenário A: Regularização / Dívidas**
  Se o cliente mencionar dívidas, pendências, boleto atrasado, desenquadramento:
  1. Explique brevemente que a Haylander é especialista nisso.
  2. Diga que precisa analisar o caso dele detalhadamente.
  3. USE A TOOL \`enviar_formulario\` com observacao="Regularização".
  4. O TEXTO da sua resposta deve conter o link retornado pela tool. Ex: "Para eu analisar sua dívida e te passar a melhor estratégia, preencha rapidinho esse diagnóstico: [LINK]"

- **Cenário B: Abertura de Empresa / MEI**
  Se o cliente quiser abrir CNPJ, formalizar negócio:
  USE A TOOL \`enviar_formulario\` com observacao="Abertura de MEI".

- **Cenário C: Cliente Confuso ou Pedido de Menu (ÚLTIMO RECURSO)**
  Use a ferramenta \`enviar_lista_enumerada\` SOMENTE SE:
  1. O cliente pedir explicitamente por "menu", "opções", "lista".
  2. O cliente não responder às suas perguntas de sondagem repetidamente.
  NUNCA use essa ferramenta como primeira interação.

- **Cenário D: Material Comercial**
  Se o cliente pedir apresentação, portfólio ou "como funciona":
  USE A TOOL \`envio_vd\`.

# Ferramentas Disponíveis

0. **conferencia_de_registro**
   Dados atuais do cliente (leitura apenas):
   {{USER_DATA}}

1. **enviar_lista_enumerada**
   - **Restrição:** Use APENAS se o cliente pedir explicitamente "menu" ou "opções". Não use proativamente.

2. **enviar_formulario**
   - **Gatilho Principal:** Use assim que identificar a demanda (Regularização ou Abertura).
   - **Argumento:** \`observacao\` (ex: "Regularização", "Abertura de MEI").
   - **IMPORTANTE:** A ferramenta retorna um LINK. Você DEVE exibir esse link na resposta.

3. **envio_vd / apresentacao_comercial**
   - Envia PDF ou Vídeo.

4. **update_User1**
   - Use APÓS o cliente preencher o formulário (quando os dados aparecerem em {{USER_DATA}} numa próxima interação) para qualificar ele como MQL/SQL.

5. **chamar_atendente**
   - Se o cliente exigir falar com humano.

# Regras de Ouro
- Mantenha o tom profissional mas acessível.
- Respostas curtas (WhatsApp). Não escreva textos gigantes.
- Sempre tente levar o cliente para o **Formulário** (é lá que a mágica acontece), mas faça isso parecer um passo de consultoria ("diagnóstico"), não burocracia.
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
      description: 'Exibir a lista de opções numerada (1-5). Use SOMENTE se o cliente pedir explicitamente por "menu" ou "opções".',
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
      function: async (args) => await interpreter(context.userPhone, args.action as 'post' | 'get', args.text as string, args.category as 'qualificacao' | 'vendas' | 'atendimento')
    }
  ];

  return runAgent(systemPrompt, message, context, tools);
}
