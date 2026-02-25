
/**
 * Cliente para integração com n8n
 * Centraliza chamadas aos webhooks do n8n para envio de mensagens e controle de fluxo
 */

interface MessageSegment {
  content: string;
  type?: 'text' | 'media';
  delay?: number;
  options?: Record<string, unknown>;
}

interface N8nMessagePayload {
  phone: string;
  messages: MessageSegment[];
  context?: string;
  leadId?: number;
}

const N8N_WEBHOOK_URL = (process.env.N8N_WEBHOOK_URL || 'https://n8n.haylander.com.br/webhook').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY; // Se necessário header de auth

/**
 * Envia mensagens para o n8n processar (Split, Delay, Follow-up)
 */
export async function sendToN8nHandler(payload: N8nMessagePayload): Promise<boolean> {
  try {
    const url = `${N8N_WEBHOOK_URL}/system-message`;
    
    console.log(`[n8n-client] Enviando ${payload.messages.length} mensagens para ${payload.phone} via n8n...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { 'X-N8n-Api-Key': N8N_API_KEY } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`n8n responded with ${response.status}: ${await response.text()}`);
    }

    return true;
  } catch (error) {
    console.error('[n8n-client] Erro ao enviar para n8n:', error);
    // Em caso de falha crítica do n8n, podemos implementar fallback local aqui?
    // Por enquanto, apenas loga e retorna false
    return false;
  }
}

/**
 * Notifica o n8n sobre atividade do cliente para resetar timers de follow-up
 */
export async function notifyClientActivity(phone: string): Promise<void> {
  try {
    const url = `${N8N_WEBHOOK_URL}/client-message`;
    
    // Fire and forget - não precisamos esperar resposta crítica
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, timestamp: Date.now() })
    }).catch(err => console.error('[n8n-client] Erro ao notificar atividade (background):', err));

  } catch (error) {
    console.error('[n8n-client] Erro ao notificar atividade:', error);
  }
}
