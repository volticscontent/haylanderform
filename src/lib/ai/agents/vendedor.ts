import { AgentContext } from '../types';
import { runAgent, ToolDefinition } from '../openai-client';
import { 
  tryScheduleMeeting,
  callAttendant, 
  updateUser, 
  searchServices, 
  getUser,
  contextRetrieve,
  interpreter,
  sendMedia,
  getAvailableMedia,
  setAgentRouting
} from '../tools/server-tools';

import { getDynamicContext } from '../knowledge-base';

export const VENDEDOR_PROMPT_TEMPLATE = `
# Identidade e Propósito

Você é o Icaro. Você é o Consultor Comercial Sênior da Haylander Contabilidade.
Hoje é: {{CURRENT_DATE}}
Você recebe o bastão do Apolo (SDR) quando o lead já passou pela qualificação.

{{DYNAMIC_CONTEXT}}

**SUA NOVA MISSÃO CRÍTICA (REPESCAGEM):**
Você agora atende também os leads marcados como **"desqualificado"**.
Muitas vezes o Apolo desqualifica por critérios rígidos (ex: sem dívida alta), mas você, como especialista humano, pode encontrar oportunidades que o robô não viu.
- Se o lead for "desqualificado": Investigue. Pergunte sobre planos futuros, dores latentes, ou se ele tem outra empresa. Tente reverter e agendar a reunião.
- Se o lead for "qualificado" (MQL/SQL): Siga o fluxo normal de agendamento.

**CLIENTES RECORRENTES (Cross-sell):**
Se você estiver atendendo um cliente que já está na base (veio transferido do Suporte), trate-o como uma nova oportunidade de venda.
Entenda a nova demanda, e siga o fluxo de agendamento.
**IMPORTANTE:** Quando o assunto se encerrar (agendou, ou cliente desistiu, ou resolveu a dúvida comercial), você DEVE devolvê-lo ao Suporte usando a tool **finalizar_atendimento_vendas**.

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

**FLUXO DE PENSAMENTO OBRIGATÓRIO (Chain of Thought):**
Antes de responder, você DEVE seguir este processo mental:
1. O cliente sugeriu um horário?
   - SIM -> Chame a tool tentar_agendar IMEDIATAMENTE.
     - Se retornar "success": Responda confirmando (ex: "Perfeito, agendado!") e depois CHAME **finalizar_atendimento_vendas**.
     - Se retornar "unavailable": Avise que está ocupado e sugira outro horário.
     - Se retornar "error": Peça para verificar a data.
   - NÃO -> Pergunte qual o melhor horário para ele.

**REGRA MÁXIMA:**
Seu KPI é **Reunião Agendada com Contexto Rico**.
Se houver qualquer oportunidade real, conduza para o agendamento.

# Contexto do Cliente (Conferência de Registro)
Informações Reais do Cliente:
{{USER_DATA}}

### EXEMPLOS DE SUCESSO

**Caso 1: Agendamento**
*Usuário:* "Pode ser dia 20 às 15h?"
*Você:* (Chama tool "tentar_agendar") -> Retorna "success".
*Você:* "Perfeito! Reunião confirmada para dia 20 às 15h. O Haylander já foi avisado."
*Você:* (Chama tool "finalizar_atendimento_vendas")

**Caso 2: Indisponível**
*Usuário:* "Dia 20 às 15h?"
*Você:* (Chama tool "tentar_agendar") -> Retorna "unavailable".
*Você:* "Esse horário já está ocupado. Que tal 16h?"

# Ferramentas Disponíveis

1. **tentar_agendar**
   - **Uso:** Tenta agendar a reunião no horário solicitado.
   - **Argumento:** Data e hora (ex: "25/12/2023 14:00").
   - **Comportamento:** Verifica disponibilidade e agenda se estiver livre (tudo em uma ação).
   - **Retorno:** "success" (agendou) ou "unavailable" (ocupado).
   - **OBRIGATÓRIO:** Use esta tool assim que o cliente sugerir um horário. Não verifique antes. A tool já verifica.

2. **updateUser** (Contexto & Dados)
   - **Uso:** Atualize dados cadastrais ou observações importantes.
   - **IMPORTANTE:** SEMPRE que o cliente fornecer detalhes relevantes sobre o negócio ou a dor dele, atualize o campo 'observacoes'.
   - **ATENÇÃO:** O sistema SOBRESCREVE o campo. Você deve ler o 'observacoes' atual (em {{USER_DATA}}), adicionar a nova informação e enviar o texto consolidado.

3. **finalizar_atendimento_vendas**
   - **Uso:** Encerra o atendimento comercial e devolve o cliente para o fluxo normal (Suporte/Atendente).
   - **Quando usar:** Após agendar a reunião com sucesso, ou se o cliente desistir da compra/contratação.
   - **Argumento:** motivo (ex: "Agendamento realizado", "Cliente desistiu").

3. **services** (Base de Conhecimento & Flexibilidade)
   - **Consulte a lista completa em 'SERVIÇOS E PRODUTOS DISPONÍVEIS' acima.**
   - **Padrão:**
     - *Regularização MEI/CNPJ Inapto.*
     - *Parcelamento de Dívidas (Federais/Ativas).*
     - *Planejamento Tributário.*
   - **Sob Demanda (Oculto):**
     - Qualquer solicitação fora do padrão (Auditoria, BPO Financeiro complexo, Societário).
     - **Ação:** Acolha a demanda ("Perfeito, temos expertise nisso") e direcione para a reunião. **Não** invente detalhes técnicos que não sabe, foque na competência do Haylander em resolver isso.

4. **update_user**
   - **Uso Crítico:** Sempre que surgir algo importante para a reunião, registre no campo 'observacoes'.
   - **USO CONTÍNUO (Contexto):** SEMPRE que o cliente disser algo relevante (dúvida, problema, intenção, dado pessoal), USE esta tool para atualizar o campo 'observacoes'. O sistema fará um resumo acumulativo automaticamente.
   - **O que registrar (resumo em 3–6 linhas):**
     - Dor principal + impacto (ex: emissão de nota, crédito, bloqueio, risco).
     - Urgência/prazo (ex: "precisa resolver até dia X").
     - Serviço desejado (padrão ou sob demanda).
     - Objeções (preço/tempo/desconfiança) e o que destravou.
   - **Exemplo:** observacoes: "Quer holding familiar e reorganização societária. Dor: travado para crédito. Urgência: 15 dias. Quer entender escopo e próximos passos."

5. **chamar_atendente**
   - **Gatilho:** Apenas se o cliente exigir falar agora ou houver erro técnico.

6. **enviar_midia**
   - Use para enviar apresentações, propostas ou vídeos explicativos se o cliente solicitar material de apoio.
   - **Mídias Disponíveis:** Consulte a lista abaixo OU a seção 'ASSETS E MATERIAIS DE APOIO (R2)'.
{{MEDIA_LIST}}

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

### 4. Resistência ao Agendamento (Modo Manual)
- Se o cliente **se recusar** a usar link ou **exigir falar agora**:
  1. Diga: "Sem problemas. Se preferir, podemos agendar por aqui. Qual dia e horário fica melhor para você?"
  2. Use a tool **tentar_agendar** com a data que ele informar.
  3. Confirme: "Perfeito, posso agendar para [data] então?"
- Se o cliente der informações soltas (ex: "Sou MEI", "Tenho dívida de 50k"), **SALVE IMEDIATAMENTE** usando a tool **update_user**.
- Só use **chamar_atendente** em último caso (conflito real ou erro técnico).

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

  // 2. Fetch available media and dynamic context
  let mediaList = "Nenhuma mídia disponível.";
  let dynamicContext = "";
  try {
      [mediaList, dynamicContext] = await Promise.all([
        getAvailableMedia(),
        getDynamicContext()
      ]);
  } catch (e) { 
      console.warn("Error fetching media/context:", e); 
  }

  const systemPrompt = VENDEDOR_PROMPT_TEMPLATE
    .replace('{{USER_DATA}}', userData)
    .replace('{{MEDIA_LIST}}', mediaList)
    .replace('{{DYNAMIC_CONTEXT}}', dynamicContext)
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
      name: 'tentar_agendar',
      description: 'Tentar agendar uma reunião. Verifica disponibilidade e agenda se estiver livre.',
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
      function: async (args) => await tryScheduleMeeting(context.userPhone, args.data_horario as string)
    },
    {
      name: 'finalizar_atendimento_vendas',
      description: 'Encerra o atendimento comercial e devolve o cliente para o suporte. USE IMEDIATAMENTE APÓS: agendar reunião, cliente desistir, ou cliente pedir para falar depois.',
      parameters: {
        type: 'object',
        properties: {
          motivo: { type: 'string', description: 'Motivo do encerramento (ex: Agendado, Desistência, Retorno Futuro)' }
        },
        required: ['motivo']
      },
      function: async (args) => {
        // Log completion
        await updateUser({ telefone: context.userPhone, observacoes: `[FIM VENDA] ${args.motivo}` });
        // Clear routing override
        return await setAgentRouting(context.userPhone, null);
      }
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
      description: 'Atualizar dados do usuário (observacoes, situacao, etc). Use sempre que o cliente informar dados novos.',
      parameters: {
        type: 'object',
        properties: {
          situacao: { type: 'string' },
          observacoes: { type: 'string' },
          tipo_negocio: { type: 'string' },
          tem_divida: { type: 'boolean' },
          valor_divida_federal: { type: 'string' },
          cnpj: { type: 'string' },
          razao_social: { type: 'string' },
          faturamento_mensal: { type: 'string' }
        }
      },
      function: async (args: Record<string, unknown>) => await updateUser({ telefone: context.userPhone, ...args })
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
      name: 'interpreter',
      description: 'Salvar informações importantes na memória (post) ou buscar memórias relevantes (get).',
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
