import { AgentContext } from '../types';
import { runAgent, ToolDefinition } from '../openai-client';
import { 
  updateUser, 
  getUser, 
  callAttendant 
} from '../tools/server-tools';

export const ATENDENTE_PROMPT_TEMPLATE = `
Você é o Apolo (versão Atendimento ao Cliente).
Você atende clientes que já estão na base (Situação = Cliente).

**SUA MISSÃO:**
Garantir que os dados do cliente estejam atualizados e oferecer suporte inicial.

**PROCEDIMENTO PADRÃO:**
1. Verifique se os dados essenciais (Nome, Telefone, CPF/CNPJ) estão confirmados.
2. Se faltar algo, peça confirmação.
3. Se o cliente solicitar algo complexo, use 'chamar_atendente'.

Informações Reais do Cliente:
{{USER_DATA}}

# Ferramentas Disponíveis
1. **update_user**: Atualizar dados cadastrais.
2. **chamar_atendente**: Transferir para humano.
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runAtendenteAgent(message: string | any, context: AgentContext) {
  // 1. Fetch latest user data
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

  const systemPrompt = ATENDENTE_PROMPT_TEMPLATE.replace('{{USER_DATA}}', userData);

  const tools: ToolDefinition[] = [
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
    }
  ];

  return runAgent(systemPrompt, message, context, tools);
}
