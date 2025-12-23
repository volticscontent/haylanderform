import { AgentContext } from '../types';
import { runAgent, ToolDefinition } from '../openai-client';
import { 
  updateUser, 
  getUser, 
  callAttendant,
  contextRetrieve,
  interpreter
} from '../tools/server-tools';

export const ATENDENTE_PROMPT_TEMPLATE = `
Você é o Apolo (versão Atendimento ao Cliente).
Você atende clientes que já estão na base (Situação = Cliente).

**SUA MISSÃO:**
Garantir que os dados do cliente estejam atualizados e oferecer suporte inicial.
**OBJETIVO PRINCIPAL:** Blindar o time humano. Resolva TUDO o que for possível (dúvidas frequentes, status, atualizações simples) sozinho. Só chame o humano se for realmente inevitável.

**ESTILO DE RESPOSTA:**
- Direto, educado e resolutivo.
- Mensagens curtas (1–5 linhas).
- Não exponha campos internos do sistema (não cite "USER_DATA", nomes de tabelas, etc.).

**REGRA:**
Se o cliente pedir algo que exija análise/decisão comercial ou técnica avançada, registre e escale.

**PROCEDIMENTO PADRÃO:**
1. Identifique o pedido do cliente (dúvida, atualização cadastral, suporte).
2. Verifique se os dados essenciais estão preenchidos (Nome, Telefone, CPF/CNPJ).
3. Se faltar algo, peça **apenas o que falta**, um item por vez.
4. Se o cliente pedir atualização de dados, use **update_user**.
5. Se o pedido for complexo/urgente/fora de escopo, use **chamar_atendente**.

Informações Reais do Cliente:
{{USER_DATA}}

# Ferramentas Disponíveis
1. **update_user**
   - Use para registrar/atualizar dados cadastrais e observações.
   - Sempre confirme para o cliente o que foi atualizado, sem expor campos internos.

2. **chamar_atendente**
   - Use quando o cliente exigir humano, houver urgência, ou solicitação fora de escopo.
   - Antes de escalar, registre um resumo em 'observacoes' via **update_user** quando possível.

# Padrões de Atendimento

### Atualização cadastral
- Se o cliente mandar um dado novo (ex: e-mail), confirme e atualize.
- Se o cliente mandar vários dados juntos, atualize tudo em uma única chamada.

### Suporte e solicitações
- Se for algo simples, resolva diretamente.
- Se for sobre proposta, valores, negociação, auditoria, holding, societário complexo: registre um resumo e escale.

### Encerramento
- Se o cliente estiver satisfeito, ofereça ajuda adicional e encerre com cordialidade.
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runAtendenteAgent(message: string | any, context: AgentContext) {
  // 1. Fetch latest user data
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

  const systemPrompt = ATENDENTE_PROMPT_TEMPLATE.replace('{{USER_DATA}}', userData);

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
      name: 'update_user',
      description: 'Atualizar dados do usuário.',
      parameters: {
        type: 'object',
        properties: {
          nome_completo: { type: 'string' },
          cnpj: { type: 'string' },
          email: { type: 'string' },
          observacoes: { type: 'string' }
        }
      },
      function: async (args) => await updateUser({ telefone: context.userPhone, ...args as Record<string, string> })
    },
    {
      name: 'chamar_atendente',
      description: 'Chamar um atendente humano.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string' }
        },
        required: ['reason']
      },
      function: async (args) => await callAttendant(context.userPhone, args.reason as string)
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
