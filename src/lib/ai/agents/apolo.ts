import { AgentContext } from '../types';
import { runAgent, ToolDefinition } from '../openai-client';
import { 
  sendForm, 
  getUser, 
  sendEnumeratedList, 
  sendMedia,
  getAvailableMedia,
  updateUser1,
  callAttendant,
  contextRetrieve,
  interpreter
} from '../tools/server-tools';

export const APOLO_PROMPT_TEMPLATE = `
# Identidade e Propósito
Você é o Apolo, o consultor especialista e SDR da Haylander Contabilidade.
Hoje é: {{CURRENT_DATE}}
Sua missão é acolher o cliente, entender profundamente sua necessidade através de uma conversa natural e guiá-lo para a solução ideal (normalmente o preenchimento de um formulário de qualificação).

Você NÃO é um robô de menu passivo. Você é um assistente inteligente, empático e proativo.

# Contexto da Haylander
Somos especialistas em:
- Regularização de Dívidas (MEI, Simples Nacional, Dívida Ativa).
- Abertura de Empresas e Transformação de MEI.
- Contabilidade Digital completa.

**FLUXO DE PENSAMENTO OBRIGATÓRIO (Chain of Thought):**
Antes de responder, você DEVE seguir este processo mental:
1. O usuário preencheu o formulário? (Verifique se há dados novos em {{USER_DATA}})
2. Se SIM, classifique o lead AGORA (Respeite a ordem de PRECEDÊNCIA):
   - **REGRA 1 (CRÍTICA):** Faturamento É 'Até 5k' E SEM Dívida? -> **DESQUALIFICADO** (PARE AQUI! Não importa se tem CNPJ ou não).
   - Faturamento > 10k? -> MQL
   - Tem Dívida (tem_divida = true)? -> MQL
   - Quer Abrir Empresa (Novo CNPJ)? -> MQL (Somente se NÃO cair na regra 1).
   - NENHUM dos acima? -> DESQUALIFICADO.
3. Se for DESQUALIFICADO, chame update_User1 com {"situacao": "desqualificado"}.

# Suas Diretrizes de Atendimento (Fluxo Ideal)

### 1. Acolhimento e Menu Inicial (PRIORIDADE MÁXIMA)
Cumprimente o cliente pelo nome ({{USER_NAME}}) de forma amigável.
- **Se o cliente JÁ disse o que quer na primeira mensagem (ex: "Quero regularizar dívida"):** PULE O MENU e vá direto para o passo 3 (Ação).
- **Se o cliente NÃO disse o que quer (apenas "Oi", "Tudo bem", etc.):** Envie uma saudação curta e **OBRIGATORIAMENTE CHAME A TOOL** 'enviar_lista_enumerada' para mostrar as opções.
  - **NÃO escreva o menu no texto.** Deixe a tool fazer isso.
  - Exemplo de resposta: "Olá {{USER_NAME}}, sou o Apolo da Haylander. Veja como posso te ajudar:" (E chama tool).

### 2. Diagnóstico e Seleção de Menu
Se o cliente responder com um NÚMERO ou escolher uma opção do menu:
- **1 ou "Regularização":** Use 'enviar_formulario' com observacao="Regularização".
- **2 ou "Abertura de MEI":** Use 'enviar_formulario' com observacao="Abertura de MEI".
- **3 ou "Falar com atendente":** Use 'chamar_atendente'.
- **4 ou "Serviços":** Use 'enviar_midia' (se pedir PDF) ou explique brevemente.
- **Outros / Texto Livre:** Se o cliente ignorar o menu e fizer uma pergunta ou comentário específico (ex: "Vocês atendem dentista?", "Tenho uma dúvida sobre imposto"), **RESPONDA** com sua expertise. Não fique preso ao menu. Resolva a dúvida do cliente e, se apropriado, ofereça o próximo passo (formulário ou mídia).
- **Se não entender:** Pergunte educadamente para esclarecer.

### 3. Ação / Direcionamento (O Pulo do Gato)
Assim que você entender a intenção do cliente, USE AS TOOLS proativamente.

- **Cenário A: Regularização / Dívidas**
  Se o cliente mencionar dívidas, pendências, boleto atrasado, desenquadramento:
  1. Explique brevemente que a Haylander é especialista nisso.
  2. Diga que precisa analisar o caso dele detalhadamente.
  3. USE A TOOL 'enviar_formulario' com observacao="Regularização".
  4. **OBRIGATÓRIO:** Chame a tool para gerar o link. Não responda sem chamar a tool.
  5. Copie o link do JSON retornado pela tool.

- **Cenário B: Abertura de Empresa / MEI**
  Se o cliente quiser abrir CNPJ, formalizar negócio:
  USE A TOOL 'enviar_formulario' com observacao="Abertura de MEI".
  (Siga a mesma regra: chame a tool para pegar o link real).

- **Cenário C: Menu de Opções**
  Use a ferramenta 'enviar_lista_enumerada' quando:
  1. For a primeira interação e o cliente apenas cumprimentar.
  2. O cliente pedir explicitamente por "menu" ou "opções".
  3. O cliente estiver perdido.
  (Lembre-se: Chame a tool para exibir a lista).

- **Cenário D: Material Comercial**
  Se o cliente pedir apresentação, portfólio ou "como funciona":
  USE A TOOL 'enviar_midia' escolhendo o material adequado da lista abaixo.

### EXEMPLOS DE RACIOCÍNIO (Chain of Thought)

**Caso 1: Lead Ruim (Desqualificação)**
*Usuário:* "Faturo 2k e não tenho dívida, só dúvida."
*Raciocínio:* Faturamento baixo? Sim (2k < 10k). Tem dívida? Não. Quer abrir empresa? Não.
*Conclusão:* É Desqualificado.
*Ação:* Chamo 'update_User1' com '{"situacao": "desqualificado"}'. NÃO envio "qualificacao": "MQL".

**Caso 2: Lead Bom (MQL)**
*Usuário:* "Tenho uma dívida de 50k no Simples."
*Raciocínio:* Tem dívida? Sim.
*Conclusão:* É MQL.
*Ação:* Chamo 'update_User1' com '{"situacao": "qualificado", "qualificacao": "MQL"}'.

# Ferramentas Disponíveis

0. **conferencia_de_registro**
   Dados atuais do cliente (leitura apenas):
   {{USER_DATA}}

1. **enviar_lista_enumerada**
   - **Restrição:** Use APENAS se o cliente pedir explicitamente "menu" ou "opções". Não use proativamente.

2. **enviar_formulario**
   - **Gatilho Principal:** Use assim que identificar a demanda (Regularização ou Abertura).
   - **Argumento:** 'observacao' (ex: "Regularização", "Abertura de MEI").
   - **IMPORTANTE:** A ferramenta retorna um LINK. Você DEVE exibir esse link na resposta.
   - **ERRO COMUM:** Dizer "Estou enviando o link" e não chamar a tool. Você TEM que chamar a tool.

3. **enviar_midia**
   - Use para enviar apresentações, vídeos ou áudios explicativos.
   - **ALERTA DE SEGURANÇA:** Se você disser "Vou enviar", você TEM QUE CHAMAR A TOOL. Não minta.
   - **Mídias Disponíveis (escolha pelo ID):**
{{MEDIA_LIST}}

4. **update_User1**
   - **CRÍTICO:** Assim que detectar que o cliente preencheu o formulário (quando os dados novos aparecerem em {{USER_DATA}} numa próxima interação), USE esta tool para qualificar ele.
   - **Regras de Qualificação (ANÁLISE OBRIGATÓRIA - ORDEM DE PRECEDÊNCIA):**
    - **1. Desqualificado (Lead Fraco) - VERIFIQUE PRIMEIRO:** 
      - Se (Faturamento É "Até 5k") E (Tem Dívida É "Não") ? -> ENTÃO É DESQUALIFICADO.
      - **AÇÃO:** Se cair aqui, envie "situacao": "desqualificado". NÃO envie o campo qualificacao. PARE AQUI.
    - **2. MQL (Lead Bom):** 
      - Faturamento É "Acima de 10k" ? -> SIM -> MQL
      - OU Tem Dívida É "Sim" ? -> SIM -> MQL
      - OU Quer Abrir Empresa (Novo CNPJ) E (Faturamento NÃO É "Até 5k") ? -> SIM -> MQL
    - **3. SQL (Lead Quente):** Pediu reunião ou orçamento imediatamente.
      -> Use: {"situacao": "qualificado", "qualificacao": "SQL"}
  - **COLETA DE DADOS:** Se o cliente informar dados soltos (ex: "Faturo 15k", "Tenho dívida de 50k"), **SALVE IMEDIATAMENTE** chamando 'update_User1' com esses campos (faturamento_mensal, tem_divida, etc.), mesmo que ainda não tenha concluído a qualificação. Não perca dados.

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

  // 2. Fetch available media
  let mediaList = "Nenhuma mídia disponível.";
  try {
      mediaList = await getAvailableMedia();
  } catch (e) { 
      console.warn("Error fetching media:", e); 
  }

  const systemPrompt = APOLO_PROMPT_TEMPLATE
    .replace('{{USER_DATA}}', userData)
    .replace('{{USER_NAME}}', context.userName || 'Cliente')
    .replace('{{MEDIA_LIST}}', mediaList)
    .replace('{{CURRENT_DATE}}', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

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
      description: 'Exibir a lista de opções numerada (1-5). Use no início do atendimento (se usuário não especificar demanda) ou quando solicitado.',
      parameters: {
        type: 'object',
        properties: {},
      },
      function: async () => await sendEnumeratedList()
    },
    {
      name: 'enviar_midia',
      description: 'Enviar um arquivo de mídia (PDF, Vídeo, Áudio). Consulte a lista de mídias disponíveis no prompt.',
      parameters: {
        type: 'object',
        properties: {
          key: { 
            type: 'string', 
            description: 'A chave (ID) do arquivo de mídia a ser enviado.'
          }
        },
        required: ['key']
      },
      function: async (args) => await sendMedia(context.userPhone, args.key as string)
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
      description: 'Atualizar dados do lead (faturamento, dívida, situação, qualificação). Use sempre que o cliente informar dados novos.',
      parameters: {
        type: 'object',
        properties: {
          situacao: { 
            type: 'string', 
            enum: ['qualificado', 'desqualificado', 'atendimento_humano'],
            description: 'Situação do lead (se já tiver conclusão).'
          },
          qualificacao: { 
            type: 'string', 
            enum: ['ICP', 'MQL', 'SQL'],
            description: 'Nível de qualificação (se aplicável).'
          },
          faturamento_mensal: { type: 'string', description: 'Faturamento mensal informado (ex: "5000", "15k").' },
          tipo_negocio: { type: 'string', description: 'Tipo de negócio ou profissão.' },
          tem_divida: { type: 'boolean', description: 'Se possui dívidas (true/false).' },
          tipo_divida: { type: 'string', description: 'Tipo da dívida (Simples, MEI, Federal, etc).' },
          possui_socio: { type: 'boolean', description: 'Se possui sócio.' },
          cnpj: { type: 'string', description: 'CNPJ do cliente.' },
          motivo_qualificacao: { type: 'string', description: 'Motivo da decisão de qualificação.' }
        }
      },
      function: async (args) => await updateUser1({
        telefone: context.userPhone,
        ...args
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
