
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function consolidateContext(currentContext: string | null, newObservation: string): Promise<string> {
  const date = new Date().toLocaleString('pt-BR');
  
  // If there's no previous context, just return the new observation with date
  if (!currentContext || currentContext.trim() === '') {
      return `[${date}] ${newObservation}`;
  }

  // 1. N8N Webhook Integration (Priority)
  if (process.env.N8N_CONTEXT_WEBHOOK_URL) {
    try {
      console.log('[Context Brain] Delegating to n8n Webhook...');
      const response = await fetch(process.env.N8N_CONTEXT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContext,
          newObservation,
          date
        })
      });

      if (!response.ok) {
        throw new Error(`n8n responded with ${response.status}`);
      }

      const data = await response.json();
      // Expecting { context: "consolidated text" } or just returning the text key
      if (data.context) {
        return data.context;
      }
      console.warn('[Context Brain] n8n response did not contain "context" field, falling back to local.');
    } catch (n8nError) {
      console.error('[Context Brain] n8n Webhook failed:', n8nError);
      // Fallthrough to local logic
    }
  }

  // 2. Local Logic (Fallback)
  const prompt = `
Você é o "Cérebro de Contexto" da Haylander Contabilidade.
Sua função é manter um registro histórico, cronológico e consolidado da jornada do cliente.

CONTEXTO ATUAL DO CLIENTE:
"""
${currentContext}
"""

NOVA OBSERVAÇÃO A SER REGISTRADA (Data: ${date}):
"""
${newObservation}
"""

INSTRUÇÕES:
1. Analise o contexto atual e a nova observação.
2. Integre a nova informação ao histórico. Mantenha o formato de log cronológico se já estiver assim, ou crie um resumo cronológico.
3. IMPORTANTE: Registre a DATA (${date}) para a nova informação.
4. Se a nova observação indicar uma MUDANÇA DE INTENÇÃO (ex: antes queria A, agora quer B), deixe isso explícito ("Em [Data], cliente mudou de ideia...").
5. Preserve valores, documentos mencionados e dores específicas do cliente.
6. Retorne APENAS o novo texto completo consolidado. Não adicione saudações ou explicações fora do texto.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const consolidated = response.choices[0].message.content;
    
    if (!consolidated) {
        throw new Error("Empty response from AI");
    }

    return consolidated;
  } catch (error) {
    console.error('[Context Brain] Error consolidating context:', error);
    // Fallback: simple append
    return `${currentContext}\n[${date}] ${newObservation}`;
  }
}
