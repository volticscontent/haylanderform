import OpenAI from 'openai';
import { AgentContext } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

export type ToolParameters = Record<string, unknown>;

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameters;
  function: (args: ToolParameters) => Promise<string>;
}

export async function runAgent(
  systemPrompt: string,
  userMessage: string,
  context: AgentContext,
  tools: ToolDefinition[]
): Promise<string> {
  // Construct messages history
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...context.history.map(h => ({ role: h.role, content: h.content } as OpenAI.Chat.Completions.ChatCompletionMessageParam)),
    { role: 'user', content: userMessage }
  ];

  const toolsConfig: OpenAI.Chat.Completions.ChatCompletionTool[] = tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using a fast model as per workflow (gpt-4o-mini mentioned in workflow)
      messages,
      tools: toolsConfig.length > 0 ? toolsConfig : undefined,
      tool_choice: toolsConfig.length > 0 ? 'auto' : undefined,
    });

    const choice = response.choices[0];
    const message = choice.message;

    if (message.tool_calls) {
      // Handle tool calls
      messages.push(message); // Add assistant's tool call message to history

      for (const toolCall of message.tool_calls) {
        if (toolCall.type === 'function') {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          
          const tool = tools.find(t => t.name === toolName);
          if (tool) {
            const toolResult = await tool.function(toolArgs);
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResult,
            });
          }
        }
      }

      // Second call to get final response
      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
      });

      return secondResponse.choices[0].message.content || '';
    }

    return message.content || '';
  } catch (error: unknown) {
    console.error('Error running agent:', error);
    return "Desculpe, tive um problema técnico. Tente novamente mais tarde.";
  }
}
