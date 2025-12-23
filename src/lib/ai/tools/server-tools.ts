import pool from '../../db';
import { evolutionFindMessages, evolutionSendMediaMessage } from '@/lib/evolution';
import { generateEmbedding } from '../embedding';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toWhatsAppJid(phoneOrJid: string): string {
  if (phoneOrJid.includes('@')) return phoneOrJid;
  const digits = phoneOrJid.replace(/\D/g, '');
  if (!digits) return phoneOrJid;
  return `${digits}@s.whatsapp.net`;
}

function extractMessageText(raw: unknown): string | null {
  if (!isObject(raw)) return null;

  const conversation = raw.conversation;
  if (typeof conversation === 'string' && conversation.trim()) return conversation;

  const extendedTextMessage = raw.extendedTextMessage;
  if (isObject(extendedTextMessage) && typeof extendedTextMessage.text === 'string' && extendedTextMessage.text.trim()) {
    return extendedTextMessage.text;
  }

  const imageMessage = raw.imageMessage;
  if (isObject(imageMessage)) {
    const caption = imageMessage.caption;
    if (typeof caption === 'string' && caption.trim()) return caption;
    return '[imagem]';
  }

  const documentMessage = raw.documentMessage;
  if (isObject(documentMessage)) {
    const caption = documentMessage.caption;
    if (typeof caption === 'string' && caption.trim()) return caption;
    const fileName = documentMessage.fileName;
    if (typeof fileName === 'string' && fileName.trim()) return `[documento] ${fileName}`;
    return '[documento]';
  }

  if (isObject(raw.audioMessage)) return '[audio]';
  if (isObject(raw.videoMessage)) return '[video]';
  if (isObject(raw.stickerMessage)) return '[sticker]';

  return null;
}

// 1. getUser
export async function getUser(phone: string): Promise<string> {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM leads WHERE telefone = $1 LIMIT 1', [phone]);
    if (res.rows.length === 0) return JSON.stringify({ status: "not_found" });
    return JSON.stringify(res.rows[0]);
  } catch (error) {
    console.error('getUser error:', error);
    return JSON.stringify({ status: "error", message: String(error) });
  } finally {
    client.release();
  }
}

// 11. sendForm
export async function sendForm(phone: string, observacao: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://haylanderform.vercel.app';
  const link = `${baseUrl}/${phone}`;
  
  // Save the interest/observation
  await updateUser({ telefone: phone, observacoes: `Interesse: ${observacao}` });
  
  return JSON.stringify({ 
      link, 
      message: `Formulário gerado para ${observacao}. Link: ${link}` 
  });
}

// 12. sendEnumeratedList
export async function sendEnumeratedList(): Promise<string> {
  const list = `1. Regularização
2. Abertura de MEI
3. Falar com atendente
4. Informações sobre os serviços
5. Sair do atendimento`;
  return JSON.stringify({ message: list });
}

// 13. updateUser1 (Alias for compatibility)
export const updateUser1 = updateUser;

// 2. createUser
export async function createUser(data: Record<string, any>): Promise<string> {
  const client = await pool.connect();
  try {
    const { nome_completo, telefone, email, ...rest } = data;
    const res = await client.query(
      `INSERT INTO leads (nome_completo, telefone, email, data_cadastro) VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [nome_completo, telefone, email]
    );
    return JSON.stringify({ status: "success", id: res.rows[0].id });
  } catch (error) {
    console.error('createUser error:', error);
    return JSON.stringify({ status: "error", message: String(error) });
  } finally {
    client.release();
  }
}

// 3. updateUser
export async function updateUser(data: Record<string, any>): Promise<string> {
    const client = await pool.connect();
    try {
        const { telefone, ...fields } = data;
        if (!telefone) return JSON.stringify({ status: "error", message: "Telefone is required" });

        // Basic fields for leads table
        const leadsFields = ['nome_completo', 'email', 'cpf', 'nome_mae', 'senha_gov', 'situacao', 'observacoes'];
        const updateFields: string[] = [];
        const values: any[] = [];
        let i = 1;

        for (const [key, value] of Object.entries(fields)) {
            if (leadsFields.includes(key)) {
                updateFields.push(`${key} = $${i}`);
                values.push(value);
                i++;
            }
        }

        if (updateFields.length > 0) {
            values.push(telefone);
            await client.query(`UPDATE leads SET ${updateFields.join(', ')} WHERE telefone = $${i}`, values);
        }

        return JSON.stringify({ status: "success", message: "User updated" });
    } catch (error) {
        console.error('updateUser error:', error);
        return JSON.stringify({ status: "error", message: String(error) });
    } finally {
        client.release();
    }
}

// 4. checkAvailability
export async function checkAvailability(dateStr: string): Promise<string> {
  const client = await pool.connect();
  try {
    // Check if there is a meeting at this time
    // dateStr format expected: 'dd/MM/yyyy HH:mm'
    const res = await client.query(
        `SELECT l.nome_completo FROM leads l JOIN leads_vendas lv ON l.id = lv.lead_id WHERE lv.data_reuniao = $1`,
        [dateStr]
    );
    if (res.rows.length > 0) {
        return JSON.stringify({ available: false, message: "Horário indisponível." });
    }
    return JSON.stringify({ available: true, message: "Horário disponível." });
  } catch (error) {
    console.error('checkAvailability error:', error);
    return JSON.stringify({ status: "error", message: String(error) });
  } finally {
    client.release();
  }
}

// 5. scheduleMeeting
export async function scheduleMeeting(phone: string, dateStr: string, type: string = 'Reunião de Fechamento'): Promise<string> {
  const client = await pool.connect();
  try {
    const userRes = await client.query('SELECT id FROM leads WHERE telefone = $1', [phone]);
    if (userRes.rows.length === 0) return JSON.stringify({ status: "error", message: "Usuário não encontrado." });
    
    const leadId = userRes.rows[0].id;

    // Ensure leads_vendas exists
    await client.query(`
        INSERT INTO leads_vendas (lead_id) VALUES ($1) ON CONFLICT (lead_id) DO NOTHING
    `, [leadId]);

    await client.query(`
        UPDATE leads_vendas SET data_reuniao = $1 WHERE lead_id = $2
    `, [dateStr, leadId]);

    return JSON.stringify({ status: "success", message: `Reunião agendada para ${dateStr}` });
  } catch (error) {
    console.error('scheduleMeeting error:', error);
    return JSON.stringify({ status: "error", message: String(error) });
  } finally {
    client.release();
  }
}

// 6. callAttendant
export async function callAttendant(phone: string, reason: string = 'Solicitação do cliente'): Promise<string> {
    const client = await pool.connect();
    try {
      const attendantNumber = process.env.ATTENDANT_PHONE;
      const instanceId = process.env.EVOLUTION_INSTANCE_ID;
      const apiBaseUrl = process.env.EVOLUTION_API_URL;
      const apiKey = process.env.EVOLUTION_API_KEY;

      if (attendantNumber && instanceId && apiBaseUrl && apiKey) {
        const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');
        const apiUrl = `${cleanBaseUrl}/message/sendText/${instanceId}`;

        console.log(`Sending notification to attendant ${attendantNumber} via ${apiUrl}...`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify({
                number: attendantNumber,
                text: `🔔 *Solicitação de Atendimento*\n\nO cliente *${phone}* solicitou falar com um atendente.\n\n📝 *Motivo:* ${reason}\n\n🔗 *Link para conversa:* https://wa.me/${phone}`
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to send WhatsApp notification:", errorText);
        } else {
            console.log("Notification sent successfully.");
        }

        return JSON.stringify({ status: "success", message: "Atendente notificado. Aguarde um momento." });
      }

      console.warn('Evolution API não configurada para notificação automática de atendente.');
      return JSON.stringify({ status: "success", message: "Solicitação registrada. Aguarde um momento." });
    } catch (error: unknown) {
      console.error('Error calling attendant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return JSON.stringify({ status: "error", message: errorMessage });
    } finally {
        client.release();
    }
}

// 7. contextRetrieve
export async function contextRetrieve(phone: string, limit: number = 30): Promise<string> {
    try {
        const jid = toWhatsAppJid(phone);
        const data = await evolutionFindMessages(jid, limit);
        
        if (!data || !data.messages || !Array.isArray(data.messages.records)) {
             return "[]";
        }
        
        const messages = data.messages.records.map((m: any) => {
            const fromMe = m.key.fromMe;
            const text = extractMessageText(m.message);
            if (!text) return null;
            return `[${fromMe ? 'Bot' : 'User'}] ${text}`;
        }).filter(Boolean).reverse(); // Oldest first

        return JSON.stringify(messages);
    } catch (error) {
        console.error('contextRetrieve error:', error);
        return "[]";
    }
}

// 8. searchServices
export async function searchServices(query: string): Promise<string> {
    // Placeholder - in real app, query a vector store of services or a database
    const services = [
        "Abertura de Empresa (MEI, ME, EPP)",
        "Migração de MEI para ME",
        "Contabilidade Digital Completa",
        "BPO Financeiro",
        "Regularização de Pendências (Receita Federal)",
        "Imposto de Renda (PF e PJ)",
        "Folha de Pagamento e Pro-labore",
        "Certificado Digital"
    ];
    
    // Simple keyword filter
    const filtered = services.filter(s => s.toLowerCase().includes(query.toLowerCase()));
    return JSON.stringify(filtered.length > 0 ? filtered : services);
}

// 9. sendCommercialPresentation
export async function sendCommercialPresentation(phone: string, type: 'apc' | 'video' = 'apc'): Promise<string> {
  const jid = toWhatsAppJid(phone);
  
  try {
    if (type === 'apc') {
      await evolutionSendMediaMessage(
        jid,
        'https://pub-9bcc48f0ec304eabbad08c9e3dec23de.r2.dev/apc%20haylander.pdf',
        'document',
        'Apresentação Comercial Haylander',
        'Apresentacao_Haylander.pdf',
        'application/pdf'
      );
      return JSON.stringify({ 
        status: "sent", 
        message: "Apresentação comercial enviada com sucesso (PDF).",
        type 
      });
    } else {
      await evolutionSendMediaMessage(
        jid,
        'https://pub-9bcc48f0ec304eabbad08c9e3dec23de.r2.dev/0915.mp4',
        'video',
        'Vídeo Tutorial',
        'tutorial.mp4',
        'video/mp4'
      );
      return JSON.stringify({ 
        status: "sent", 
        message: "Vídeo tutorial enviado com sucesso.",
        type 
      });
    }
  } catch (error) {
    console.error(`Error sending ${type}:`, error);
    return JSON.stringify({ 
      status: "error", 
      message: `Erro ao enviar ${type}: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
}

// 10. interpreter (Shared Memory)
export async function interpreter(
  phone: string,
  action: 'post' | 'get',
  text: string,
  category: 'qualificacao' | 'vendas' | 'atendimento' = 'atendimento'
): Promise<string> {
  const client = await pool.connect();
  try {
    // 1. Ensure table exists (Soft check)
    // We try to create with vector first. If it fails (e.g. type vector does not exist), we try without.
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS interpreter_memories (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50),
                embedding vector(1536),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
    } catch (err) {
        // Fallback: Create without embedding column if vector extension is missing
        await client.query(`
            CREATE TABLE IF NOT EXISTS interpreter_memories (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
    }

    // 2. Handle Actions
    if (action === 'post') {
        const embedding = await generateEmbedding(text);
        
        if (embedding && embedding.length > 0) {
             try {
                // Try insert with vector
                // Format for pgvector: string "[1.0, 2.0, ...]"
                const vectorStr = JSON.stringify(embedding);
                
                await client.query(
                    `INSERT INTO interpreter_memories (phone, content, category, embedding) VALUES ($1, $2, $3, $4::vector)`,
                    [phone, text, category, vectorStr]
                );
             } catch (e) {
                 // Fallback: Insert without embedding (column missing or other error)
                 await client.query(
                    `INSERT INTO interpreter_memories (phone, content, category) VALUES ($1, $2, $3)`,
                    [phone, text, category]
                );
             }
        } else {
             await client.query(
                `INSERT INTO interpreter_memories (phone, content, category) VALUES ($1, $2, $3)`,
                [phone, text, category]
            );
        }
        return JSON.stringify({ status: "stored", message: "Memória armazenada com sucesso." });

    } else { // GET
        const embedding = await generateEmbedding(text);
        let rows = [];

        if (embedding && embedding.length > 0) {
            try {
                // Try vector search (Cosine Similarity)
                const vectorStr = JSON.stringify(embedding);
                const res = await client.query(`
                    SELECT content, category, created_at, 1 - (embedding <=> $1::vector) as similarity
                    FROM interpreter_memories
                    WHERE phone = $2
                    ORDER BY similarity DESC
                    LIMIT 5
                `, [vectorStr, phone]);
                rows = res.rows;
            } catch (e) {
                // Fallback: Text search (ILIKE)
                const res = await client.query(`
                    SELECT content, category, created_at
                    FROM interpreter_memories
                    WHERE phone = $1 AND content ILIKE $2
                    ORDER BY created_at DESC
                    LIMIT 5
                `, [phone, `%${text}%`]);
                 rows = res.rows;
            }
        } else {
             // Just get latest for phone
             const res = await client.query(`
                SELECT content, category, created_at
                FROM interpreter_memories
                WHERE phone = $1
                ORDER BY created_at DESC
                LIMIT 5
            `, [phone]);
            rows = res.rows;
        }

        if (rows.length === 0) {
            return JSON.stringify({ status: "no_results", message: "Nenhuma memória relevante encontrada." });
        }
        
        const memories = rows.map(r => {
            const date = new Date(r.created_at).toLocaleString('pt-BR');
            return `[${date}] [${r.category}] ${r.content}`;
        }).join('\n');

        return JSON.stringify({ 
            status: "success", 
            memories
        });
    }

  } catch (error: unknown) {
    console.error('Interpreter error:', error);
    return JSON.stringify({ status: "error", message: String(error) });
  } finally {
    client.release();
  }
}
