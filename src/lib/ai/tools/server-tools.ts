import pool from '../../db';
import { redis } from '@/lib/redis';
import { cosineSimilarity } from '@/lib/utils';
import { evolutionFindMessages, evolutionSendMediaMessage } from '@/lib/evolution';
import { generateEmbedding } from '../embedding';
import { consultarServico } from '@/lib/serpro';
import { saveConsultation } from '@/lib/serpro-db';

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

function parseDateStr(dateStr: string): Date | null {
    // Expected format: dd/MM/yyyy HH:mm
    const parts = dateStr.split(' ');
    if (parts.length !== 2) return null;

    const [datePart, timePart] = parts;
    const dateSplit = datePart.split('/');
    const timeSplit = timePart.split(':');

    if (dateSplit.length !== 3 || timeSplit.length !== 2) return null;

    const day = parseInt(dateSplit[0], 10);
    const month = parseInt(dateSplit[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(dateSplit[2], 10);
    const hour = parseInt(timeSplit[0], 10);
    const minute = parseInt(timeSplit[1], 10);

    const d = new Date(year, month, day, hour, minute);
    if (isNaN(d.getTime())) return null;
    return d;
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

// 14. checkCnpjSerpro
export async function checkCnpjSerpro(cnpj: string, service: 'CCMEI_DADOS' | 'SIT_FISCAL' = 'CCMEI_DADOS'): Promise<string> {
    try {
        console.log(`[checkCnpjSerpro] Consulting ${service} for ${cnpj}...`);
        const result = await consultarServico(service, cnpj);
        
        // Save to DB (async)
        saveConsultation(cnpj, service, result, 200).catch(err => 
            console.error('[checkCnpjSerpro] Error saving consultation:', err)
        );

        return JSON.stringify(result);
    } catch (error: unknown) {
        console.error('checkCnpjSerpro error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return JSON.stringify({ status: 'error', message: errorMessage });
    }
}

// 15. getAvailableMedia
export async function getAvailableMedia(): Promise<string> {
    const mediaList = [
        { key: 'apc', description: 'Apresentação Comercial (PDF)', type: 'document' },
        { key: 'video_institucional', description: 'Vídeo Institucional', type: 'video' }
    ];
    return JSON.stringify(mediaList);
}

// 16. sendMedia
export async function sendMedia(phone: string, keyOrUrl: string): Promise<string> {
    // 1. Legacy/Hardcoded keys
    if (keyOrUrl === 'apc') {
        return sendCommercialPresentation(phone, 'apc');
    } else if (keyOrUrl === 'video_institucional' || keyOrUrl === 'video') {
        return sendCommercialPresentation(phone, 'video');
    }

    // 2. Generic Handling (R2 Assets)
    let mediaUrl = keyOrUrl;
    let fileName = keyOrUrl.split('/').pop() || 'arquivo';

    // If it's a key (not a URL), try to construct the URL using R2_PUBLIC_URL
    if (!keyOrUrl.startsWith('http')) {
         const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
         if (R2_PUBLIC_URL) {
             mediaUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${keyOrUrl}`;
         } else {
             return JSON.stringify({ status: "error", message: "URL base do R2 não configurada e chave fornecida não é URL completa." });
         }
    }

    // Determine type
    const ext = mediaUrl.split('.').pop()?.toLowerCase();
    let mediaType = 'document'; // default
    let mimetype = 'application/octet-stream';

    if (['mp4', 'mov', 'avi'].includes(ext || '')) {
        mediaType = 'video';
        mimetype = 'video/mp4';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
        mediaType = 'image';
        mimetype = 'image/jpeg';
    } else if (['mp3', 'ogg', 'wav'].includes(ext || '')) {
        mediaType = 'audio';
        mimetype = 'audio/mpeg';
    } else if (ext === 'pdf') {
        mediaType = 'document';
        mimetype = 'application/pdf';
    }

    try {
        const jid = toWhatsAppJid(phone);
        await evolutionSendMediaMessage(
            jid,
            mediaUrl,
            mediaType,
            fileName, // caption/title
            fileName, // filename
            mimetype
        );
        return JSON.stringify({ status: "sent", message: `Arquivo ${fileName} enviado com sucesso.` });
    } catch (error) {
        console.error(`Error sending generic media ${keyOrUrl}:`, error);
        return JSON.stringify({ status: "error", message: `Erro ao enviar arquivo: ${String(error)}` });
    }
}

export async function setAgentRouting(phone: string, agent: string | null): Promise<string> {
  const redisKey = `routing_override:${phone}`;
  try {
    if (agent) {
      // Set override for 24 hours
      await redis.set(redisKey, agent, 'EX', 86400); 
      return JSON.stringify({ status: "success", message: `Routing override set to ${agent}` });
    } else {
      // Clear override
      await redis.del(redisKey);
      return JSON.stringify({ status: "success", message: "Routing override cleared" });
    }
  } catch (error) {
    console.error('setAgentRouting error:', error);
    return JSON.stringify({ status: "error", message: String(error) });
  }
}

export async function getAgentRouting(phone: string): Promise<string | null> {
  const redisKey = `routing_override:${phone}`;
  try {
    return await redis.get(redisKey);
  } catch (error) {
    console.error('getAgentRouting error:', error);
    return null;
  }
}

export async function tryScheduleMeeting(phone: string, dateStr: string): Promise<string> {
    const avail = await checkAvailability(dateStr);
    const availJson = JSON.parse(avail);
    
    if (availJson.available) {
        return await scheduleMeeting(phone, dateStr);
    }
    
    return JSON.stringify({ status: "unavailable", message: availJson.message || "Horário indisponível." });
}

// 11. sendForm
export async function sendForm(phone: string, observacao: string): Promise<string> {
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://haylanderform.vercel.app';

  // Fix: Ignore temporary tunnel URLs (loca.lt, ngrok) and force production URL for the form
  if (baseUrl.includes('loca.lt') || baseUrl.includes('ngrok-free.app')) {
      baseUrl = 'https://haylanderform.vercel.app';
  }

  baseUrl = baseUrl.replace(/\/$/, '');
  const link = `${baseUrl}/${phone}`;
  
  // Save the interest/observation
  await updateUser({ telefone: phone, observacoes: `Interesse: ${observacao}` });
  
  return JSON.stringify({ 
      link, 
      message: `Formulário gerado com sucesso. O link é: ${link}. Envie este link EXATO para o cliente.` 
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
export async function createUser(data: Record<string, unknown>): Promise<string> {
  const client = await pool.connect();
  try {
    const { nome_completo, telefone, email } = data;
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
export async function updateUser(data: Record<string, unknown>): Promise<string> {
    const client = await pool.connect();
    try {
        const { telefone, ...fields } = data;
        if (!telefone) return JSON.stringify({ status: "error", message: "Telefone is required" });

        // Basic fields for leads table
        const leadsFields = ['nome_completo', 'email', 'cpf', 'nome_mae', 'senha_gov', 'situacao', 'observacoes', 'qualificacao'];
        const updateFields: string[] = [];
        const values: unknown[] = [];
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

        // Always update 24h window when user interacts/updates
        const resId = await client.query('SELECT id FROM leads WHERE telefone = $1', [telefone]);
        if (resId.rows.length > 0) {
             const leadId = resId.rows[0].id;
             // Upsert into leads_atendimento (Check first to avoid ON CONFLICT issues if constraint missing)
             const check = await client.query('SELECT id FROM leads_atendimento WHERE lead_id = $1', [leadId]);
             if (check.rows.length > 0) {
                 await client.query('UPDATE leads_atendimento SET data_controle_24h = NOW() WHERE lead_id = $1', [leadId]);
             } else {
                 await client.query('INSERT INTO leads_atendimento (lead_id, data_controle_24h) VALUES ($1, NOW())', [leadId]);
             }
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
    
    // Simple validation
    if (!/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(dateStr)) {
        return JSON.stringify({ available: false, message: "Formato de data inválido. Use dd/MM/yyyy HH:mm" });
    }

    const parsedDate = parseDateStr(dateStr);
    if (!parsedDate) {
        return JSON.stringify({ available: false, message: "Data inválida." });
    }

    const res = await client.query(
        `SELECT l.nome_completo FROM leads l JOIN leads_vendas lv ON l.id = lv.lead_id WHERE lv.data_reuniao = $1`,
        [parsedDate]
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
export async function scheduleMeeting(phone: string, dateStr: string): Promise<string> {
  const client = await pool.connect();
  try {
    const userRes = await client.query('SELECT id FROM leads WHERE telefone = $1', [phone]);
    if (userRes.rows.length === 0) return JSON.stringify({ status: "error", message: "Usuário não encontrado." });
    
    const leadId = userRes.rows[0].id;

    // Ensure leads_vendas exists
    await client.query(`
        INSERT INTO leads_vendas (lead_id) VALUES ($1) ON CONFLICT (lead_id) DO NOTHING
    `, [leadId]);

    const parsedDate = parseDateStr(dateStr);
    if (!parsedDate) return JSON.stringify({ status: "error", message: "Data inválida." });

    await client.query(`
        UPDATE leads_vendas SET data_reuniao = $1 WHERE lead_id = $2
    `, [parsedDate, leadId]);

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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'apikey': apiKey
              },
              body: JSON.stringify({
                  number: attendantNumber,
                  text: `🔔 *Solicitação de Atendimento*\n\nO cliente *${phone}* solicitou falar com um atendente.\n\n📝 *Motivo:* ${reason}\n\n🔗 *Link para conversa:* https://wa.me/${phone}`
              }),
              signal: controller.signal
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error("Failed to send WhatsApp notification:", errorText);
          } else {
              console.log("Notification sent successfully.");
          }
        } finally {
          clearTimeout(timeoutId);
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
        
        const records = data?.messages?.records;

        if (!Array.isArray(records)) {
             return "[]";
        }
        
        const messages = records.map((m: { key: { fromMe: boolean }; message: unknown }) => {
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
  
  // Default values (fallback)
  const defaultApc = 'https://pub-9bcc48f0ec304eabbad08c9e3dec23de.r2.dev/apc%20haylander.pdf';
  const defaultVideo = 'https://pub-9bcc48f0ec304eabbad08c9e3dec23de.r2.dev/0915.mp4';

  let mediaUrl = type === 'apc' ? defaultApc : defaultVideo;

  try {
      // Fetch from DB
      try {
          const settingKey = type === 'apc' ? 'apresentacao_comercial' : 'video_ecac';
          const res = await pool.query('SELECT value FROM system_settings WHERE key = $1', [settingKey]);
          if (res.rows.length > 0 && res.rows[0].value) {
              mediaUrl = res.rows[0].value;
          }
      } catch (dbErr) {
          console.error('Error fetching system setting, using default:', dbErr);
      }

    if (type === 'apc') {
      await evolutionSendMediaMessage(
        jid,
        mediaUrl,
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
        mediaUrl,
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
  const redisKey = `interpreter_memory:${phone}`;
  
  try {
    console.log(`[Interpreter] Action: ${action}, Phone: ${phone}, Text: "${text}"`);

    // 1. Ensure table exists (Soft check - Postgres Backup)
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
    } catch {
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
        
        // --- Redis Write (Primary Speed Layer) ---
        try {
            const memoryObj = {
                content: text,
                category,
                embedding: embedding || [], // Ensure array
                created_at: new Date().toISOString()
            };
            await redis.lpush(redisKey, JSON.stringify(memoryObj));
            await redis.ltrim(redisKey, 0, 49); // Keep last 50 memories
            console.log('[Interpreter] Memory saved to Redis');
        } catch (err) {
            console.error('Redis write error:', err);
        }
        // -----------------------------------------

        if (embedding && embedding.length > 0) {
             try {
                // Try insert with vector
                // Format for pgvector: string "[1.0, 2.0, ...]"
                const vectorStr = JSON.stringify(embedding);
                
                await client.query(
                    `INSERT INTO interpreter_memories (phone, content, category, embedding) VALUES ($1, $2, $3, $4::vector)`,
                    [phone, text, category, vectorStr]
                );
             } catch {
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
        console.log('[Interpreter] Memory saved to Postgres');
        return JSON.stringify({ status: "stored", message: "Memória armazenada com sucesso." });

    } else { // GET
        const embedding = await generateEmbedding(text);
        
        interface InterpreterMemory {
            content: string;
            category: string;
            embedding?: number[];
            created_at: string;
            similarity?: number;
        }

        let rows: InterpreterMemory[] = [];

        // --- Redis Read (Primary Speed Layer) ---
        try {
            const rawMemories = await redis.lrange(redisKey, 0, -1);
            if (rawMemories.length > 0) {
                const memories = rawMemories.map(m => JSON.parse(m) as InterpreterMemory);
                
                if (embedding && embedding.length > 0) {
                    // Calculate Cosine Similarity in memory (fast for small lists)
                    const scored = memories.map((m) => {
                        const sim = (m.embedding && m.embedding.length > 0) 
                            ? cosineSimilarity(embedding, m.embedding) 
                            : 0;
                        return { ...m, similarity: sim };
                    });
                    
                    // Sort by similarity desc
                    scored.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
                    
                    // Filter by threshold if needed, but for now just take top 5
                    rows = scored.slice(0, 5);
                } else {
                    // Just return latest (already sorted by LPUSH)
                    rows = memories.slice(0, 5);
                }
                console.log(`[Interpreter] Redis Hit! Found ${rows.length} memories.`);
            } else {
                console.log('[Interpreter] Redis Miss. Fallback to Postgres.');
            }
        } catch (err) {
             console.error('Redis read error:', err);
        }
        // ----------------------------------------

        // Fallback to Postgres if Redis yielded no results
        if (rows.length === 0) {
            console.log('[Interpreter] Querying Postgres...');
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
                } catch {
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
            console.log(`[Interpreter] Postgres Result: Found ${rows.length} memories.`);
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
