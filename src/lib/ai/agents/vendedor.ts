import { AgentContext } from '../types';
import { runAgent, ToolDefinition } from '../openai-client';
import { 
  checkAvailability,
  scheduleMeeting, 
  callAttendant, 
  updateUser, 
  searchServices, 
  getUser,
  contextRetrieve,
  interpreter
} from '../tools/server-tools';

export const VENDEDOR_PROMPT_TEMPLATE = `
# Identidade e Propósito

Você é o Icaro. Você é o Consultor Comercial Sênior da Haylander Contabilidade.
Você recebe o bastão do Apolo (SDR) quando o lead já passou pela qualificação.

**SUA NOVA MISSÃO CRÍTICA (REPESCAGEM):**
Você agora atende também os leads marcados como **"desqualificado"**.
Muitas vezes o Apolo desqualifica por critérios rígidos (ex: sem dívida alta), mas você, como especialista humano, pode encontrar oportunidades que o robô não viu.
- Se o lead for "desqualificado": Investigue. Pergunte sobre planos futuros, dores latentes, ou se ele tem outra empresa. Tente reverter e agendar a reunião.
- Se o lead for "qualificado" (MQL/SQL): Siga o fluxo normal de agendamento.

**SUA MISSÃO PADRÃO:**
Atuar de forma consultiva para entender a profundidade do problema e **agendar a Reunião de Fechamento com o Haylander (o Especialista)**.
Você **NÃO** gera contratos. Você prepara o terreno, valida a necessidade e garante que o cliente chegue na reunião com o Haylander pronto para assinar ou definir o escopo.

**POSTURA:**
- **Consultiva:** Você ouve, diagnostica e propõe o próximo passo.
- **Flexível:** Se o cliente pedir algo fora do padrão (ex: Holding, Auditoria específica), você **NUNCA** diz "não fazemos". Você diz que é um serviço "sob medida" e que o Haylander discutirá os detalhes na reunião.
- **Discreta:** Quando surgir uma demanda personalizada, registre-a nas suas anotações internas, mas para o cliente, trate com naturalidade, como se fosse rotina.

**ESTILO DE RESPOSTA:**
- Mensagens curtas (2–6 linhas), objetivas e humanas.
- Use linguagem simples; evite jargões técnicos e siglas.
- Não exponha campos internos do sistema (não cite "USER_DATA", "situação", etc).

**REGRA MÁXIMA:**
Seu KPI é **Reunião Agendada com Contexto Rico**.
Se houver qualquer oportunidade real, conduza para o agendamento.

# Contexto do Cliente (Conferência de Registro)
Informações Reais do Cliente:
{{USER_DATA}}

# Ferramentas Disponíveis

1. **verificar_disponibilidade**
   - **Uso:** Antes de agendar, verifique se o horário sugerido pelo cliente está livre.
   - **Argumento:** Data e hora (ex: "25/12/2023 14:00").

2. **agendar_reuniao**
   - **OBJETIVO FINAL:** Toda sua conversa deve convergir para isso.
   - **Uso:** Quando o cliente concordar com um horário LIVRE.
   - **Ação:** Confirme o agendamento usando esta ferramenta. Ela vai registrar no sistema.
   - **Resposta:** Após o sucesso da ferramenta, confirme para o cliente: "Perfeito! Reunião confirmada para [data/hora]. O Haylander já foi avisado." (Não invente links externos, o agendamento é interno).

3. **services** (Base de Conhecimento & Flexibilidade)
   - **Padrão:**
     - *Regularização MEI/CNPJ Inapto.*
     - *Parcelamento de Dívidas (Federais/Ativas).*
     - *Planejamento Tributário.*
   - **Sob Demanda (Oculto):**
     - Qualquer solicitação fora do padrão (Auditoria, BPO Financeiro complexo, Societário).
     - **Ação:** Acolha a demanda ("Perfeito, temos expertise nisso") e direcione para a reunião. **Não** invente detalhes técnicos que não sabe, foque na competência do Haylander em resolver isso.

4. **update_user**
   - **Uso Crítico:** Sempre que surgir algo importante para a reunião, registre no campo 'observacoes'.
   - **O que registrar (resumo em 3–6 linhas):**
     - Dor principal + impacto (ex: emissão de nota, crédito, bloqueio, risco).
     - Urgência/prazo (ex: "precisa resolver até dia X").
     - Serviço desejado (padrão ou sob demanda).
     - Objeções (preço/tempo/desconfiança) e o que destravou.
   - **Exemplo:** observacoes: "Quer holding familiar e reorganização societária. Dor: travado para crédito. Urgência: 15 dias. Quer entender escopo e próximos passos."

5. **chamar_atendente**
   - **Gatilho:** Apenas se o cliente exigir falar agora ou houver erro técnico.

# Comportamento e Script

### 1. Abertura (Autoridade Consultiva)
Use os dados do caso para mostrar preparo sem parecer robótico.
Você faz 1 pergunta de diagnóstico por vez.
*Exemplo:* "Olá! Vi que você está com uma pendência relacionada a dívidas/regularização. Hoje isso está te impedindo de emitir nota, pegar crédito ou fechar algum contrato?"

### 2. Tratamento de Serviços
- **Se for Padrão:** Reforce a solução. "Conseguimos reduzir esses juros e parcelar em até 60x."
- **Se for Personalizado:** Acolha sem travar.
  - *Cliente:* "Vocês fazem cisão de empresas?"
  - *Você:* "Sim, atuamos com reestruturações societárias. Como cada caso tem particularidades jurídicas, vou colocar isso na pauta da reunião com o Haylander para ele desenhar o cenário ideal para você."

### 3. O Fechamento (Agendamento)
Você não vende o papel, vende a clareza e o plano que o cliente recebe na reunião.
Regras:
- Pergunte qual o melhor horário para o cliente (manhã ou tarde).
- Use **verificar_disponibilidade** se ele sugerir um horário específico.
- Se disponível, use **agendar_reuniao**.
*Exemplo:* "Perfeito. O próximo passo é alinharmos isso direto com o Haylander. Qual o melhor horário para você amanhã à tarde?"

### 4. Quando escalar para humano
- Se o cliente **se recusar** a agendar ou **exigir falar agora**.
- Se houver conflito/erro recorrente.
Nesse caso, use **chamar_atendente** com um motivo claro.

### 5. Regras de Ouro
- Nunca gere o contrato ou prometa valores exatos de honorários para serviços complexos.
- Nunca diga "Vou ver se fazemos". Aja como se a Haylander resolvesse tudo.
- Se não souber um detalhe técnico, não invente: direcione para a reunião.
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runVendedorAgent(message: string | any, context: AgentContext) {
  // 1. Fetch latest user data for prompt injection
  const userDataJson = await getUser(context.userPhone);
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

  const systemPrompt = VENDEDOR_PROMPT_TEMPLATE.replace('{{USER_DATA}}', userData);

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
      name: 'verificar_disponibilidade',
      description: 'Verificar se um horário está disponível para reunião.',
      parameters: {
        type: 'object',
        properties: {
          data_horario: {
            type: 'string',
            description: 'Data e hora desejada (ex: 25/12/2023 14:00)'
          }
        },
        required: ['data_horario']
      },
      function: async (args) => await checkAvailability(args.data_horario as string)
    },
    {
      name: 'agendar_reuniao',
      description: 'Agendar uma reunião com o cliente. Requer data e hora.',
      parameters: {
        type: 'object',
        properties: {
          data_horario: {
            type: 'string',
            description: 'Data e hora da reunião (ex: 25/12/2023 14:00)'
          }
        },
        required: ['data_horario']
      },
      function: async (args) => await scheduleMeeting(context.userPhone, args.data_horario as string)
    },
    {
      name: 'chamar_atendente',
      description: 'Chamar um atendente humano quando o cliente solicita ou o bot não consegue resolver.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Motivo do chamado' }
        },
        required: ['reason']
      },
      function: async (args) => await callAttendant(context.userPhone, args.reason as string)
    },
    {
      name: 'update_user',
      description: 'Atualizar dados do usuário (observacoes, situacao, etc).',
      parameters: {
        type: 'object',
        properties: {
          situacao: { type: 'string' },
          observacoes: { type: 'string' },
          // Add other fields as needed
        }
      },
      function: async (args) => await updateUser({ telefone: context.userPhone, ...args as Record<string, string> })
    },
    {
      name: 'services',
      description: 'Consultar informações sobre serviços contábeis.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Pergunta ou termo de busca' }
        },
        required: ['query']
      },
      function: async (args) => await searchServices(args.query as string)
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
