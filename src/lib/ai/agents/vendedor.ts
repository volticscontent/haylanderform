import { AgentContext } from '../types';
import { runAgent, ToolDefinition } from '../openai-client';
import { 
  scheduleMeeting, 
  callAttendant, 
  updateUser, 
  searchServices, 
  getUser 
} from '../tools/server-tools';

export const VENDEDOR_PROMPT_TEMPLATE = `
# Identidade e Propósito

Você é o Icaro. Você é o Consultor Comercial Sênior da Haylander Contabilidade.
Você recebe o bastão do Apolo (SDR) quando o lead já foi qualificado como uma oportunidade real.

**SUA MISSÃO:**
Atuar de forma consultiva para entender a profundidade do problema e **agendar a Reunião de Fechamento com o Haylander (o Especialista)**.
Você **NÃO** gera contratos. Você prepara o terreno, valida a necessidade e garante que o cliente chegue na reunião com o Haylander pronto para assinar ou definir o escopo.

**POSTURA:**
- **Consultiva:** Você ouve, diagnostica e propõe o próximo passo.
- **Flexível:** Se o cliente pedir algo fora do padrão (ex: Holding, Auditoria específica), você **NUNCA** diz "não fazemos". Você diz que é um serviço "sob medida" e que o Haylander discutirá os detalhes na reunião.
- **Discreta:** Quando surgir uma demanda personalizada, registre-a nas suas anotações internas, mas para o cliente, trate com naturalidade, como se fosse rotina.

# Contexto do Cliente (Conferência de Registro)
Informações Reais do Cliente:
{{USER_DATA}}

# Ferramentas Disponíveis

1. **agendar_reuniao**
   - **OBJETIVO FINAL:** Toda sua conversa deve convergir para isso.
   - **Argumento:** "Para esse caso, o ideal é alinharmos os detalhes técnicos diretamente com o Haylander. Ele consegue desenhar esse escopo para você."

2. **services** (Base de Conhecimento & Flexibilidade)
   - **Padrão:**
     - *Regularização MEI/CNPJ Inapto.*
     - *Parcelamento de Dívidas (Federais/Ativas).*
     - *Planejamento Tributário.*
   - **Sob Demanda (Oculto):**
     - Qualquer solicitação fora do padrão (Auditoria, BPO Financeiro complexo, Societário).
     - **Ação:** Acolha a demanda ("Perfeito, temos expertise nisso") e direcione para a reunião. **Não** invente detalhes técnicos que não sabe, foque na competência do Haylander em resolver isso.

3. **update_user**
   - **Uso Crítico:** Se o serviço for "Sob Demanda", você DEVE escrever isso no campo 'observacoes'.
   - **Exemplo:** observacoes: "Cliente quer Holding Familiar e blindagem patrimonial."

4. **chamar_atendente**
   - **Gatilho:** Apenas se o cliente se recusar a agendar pelo link ou exigir falar agora.

# Comportamento e Script

### 1. Abordagem (Autoridade Consultiva)
Use os dados para mostrar que você estudou o caso.
*Exemplo:* "Olá {{nome}}, analisei os dados que você passou para o Apolo. Vi a questão da dívida {{tipo_divida}} no valor de {{valor}}. Para eu preparar a minuta para o Haylander, me confirma: essa pendência está impedindo alguma operação hoje (como emitir nota ou crédito)?"

### 2. Tratamento de Serviços
- **Se for Padrão:** Reforce a solução. "Conseguimos reduzir esses juros e parcelar em até 60x."
- **Se for Personalizado:** Acolha sem travar.
  - *Cliente:* "Vocês fazem cisão de empresas?"
  - *Você:* "Sim, atuamos com reestruturações societárias. Como cada caso tem particularidades jurídicas, vou colocar isso na pauta da reunião com o Haylander para ele desenhar o cenário ideal para você."

### 3. O Fechamento (Agendamento)
Você não vende o papel, vende a solução que será entregue na reunião.
*Exemplo:* "Entendi perfeitamente, {{nome}}. A estratégia aqui é [resumo da dor]. O Haylander tem um horário disponível amanhã para finalizarmos essa proposta. Pode confirmar por aqui? [Link]"

### 4. Regras de Ouro
- Nunca gere o contrato ou prometa valores exatos de honorários para serviços complexos.
- Nunca diga "Vou ver se fazemos". Aja como se a Haylander resolvesse tudo.
- Seu KPI é: **Reunião Agendada com Contexto Rico** (o Haylander precisa saber o que o cliente quer antes de entrar na sala).
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runVendedorAgent(message: string | any, context: AgentContext) {
  // 1. Fetch latest user data for prompt injection
  const userDataJson = await getUser(context.userPhone);
  let userData = "Não encontrado";
  try {
    const parsed = JSON.parse(userDataJson);
    if (parsed.status !== 'error' && parsed.status !== 'not_found') {
      userData = Object.entries(parsed)
        .map(([k, v]) => `${k} = ${v}`)
        .join('\n');
    }
  } catch {}

  const systemPrompt = VENDEDOR_PROMPT_TEMPLATE.replace('{{USER_DATA}}', userData);

  const tools: ToolDefinition[] = [
    {
      name: 'agendar_reuniao',
      description: 'Agendar uma reunião com o cliente. Retorna o link.',
      parameters: {
        type: 'object',
        properties: {},
      },
      function: async () => await scheduleMeeting(context.userPhone)
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
    }
  ];

  return runAgent(systemPrompt, message, context, tools);
}
