import pool from './db';

const HISTORY_LIMIT = 20; // Maintain last 20 messages

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getChatHistory(phone: string): Promise<ChatMessage[]> {
  try {
    const res = await pool.query(
      `SELECT role, content FROM chat_history 
       WHERE phone = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [phone, HISTORY_LIMIT]
    );

    // O banco retorna do mais novo para o mais antigo (DESC)
    // Precisamos inverter para o LLM entender a cronologia (Antigo -> Novo)
    const history = res.rows.map(row => ({
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content
    })).reverse();

    return history;
  } catch (error) {
    console.error(`[ChatHistory] Error fetching history for ${phone}:`, error);
    return [];
  }
}

export async function addToHistory(phone: string, role: 'user' | 'assistant' | 'system', content: string | any[]) {
  // Handle multimodal content (arrays) by extracting text
  let textContent = '';
  if (typeof content === 'string') {
    textContent = content;
  } else if (Array.isArray(content)) {
    // Try to find text component
    const textPart = content.find(c => c.type === 'text');
    if (textPart) {
      textContent = textPart.text;
    } else {
      textContent = '[Arquivo/Imagem enviado]';
    }
  } else {
    textContent = JSON.stringify(content);
  }

  try {
    await pool.query(
      `INSERT INTO chat_history (phone, role, content) VALUES ($1, $2, $3)`,
      [phone, role, textContent]
    );
    
    // Opcional: Limpeza automática de mensagens muito antigas (não essencial agora)
  } catch (error) {
    console.error(`[ChatHistory] Error adding to history for ${phone}:`, error);
  }
}

export async function clearHistory(phone: string) {
    try {
        await pool.query(`DELETE FROM chat_history WHERE phone = $1`, [phone]);
    } catch (error) {
        console.error(`[ChatHistory] Error clearing history for ${phone}:`, error);
    }
}
