'use server';

import { evolutionFindChats, evolutionFindMessages, evolutionSendTextMessage, evolutionSendMediaMessage, evolutionSendWhatsAppAudio, evolutionGetBase64FromMediaMessage } from "@/lib/evolution";
import pool from "@/lib/db";
import { generatePhoneVariations } from "@/lib/phone-utils";

export async function triggerBot(chatId: string, botName: string) {
    try {
        console.log(`Triggering bot ${botName} for chat ${chatId}`);
        
        // TODO: Implement actual bot triggering logic here
        // This could be a webhook call, an Evolution API call to start a Typebot, etc.
        // Example: await evolutionStartTypebot(chatId, botName);

        // For now, we'll simulate a delay and success
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true, message: `Bot ${botName} iniciado com sucesso` };
    } catch (error) {
        console.error(`Error triggering bot ${botName}:`, error);
        return { success: false, error: `Falha ao iniciar bot ${botName}` };
    }
}

export async function getChats() {
  try {
    const chats = await evolutionFindChats();
    
    // Get all registered phone numbers to minimize DB queries
    const registeredMap = new Map();
    try {
        const { rows: leads } = await pool.query('SELECT id, telefone, nome_completo, situacao FROM leads');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        leads.forEach((lead: any) => {
            if (lead.telefone) {
                const leadData = {
                    id: lead.id,
                    name: lead.nome_completo,
                    status: lead.situacao
                };
                
                const variations = generatePhoneVariations(lead.telefone);
                variations.forEach(v => registeredMap.set(v, leadData));
            }
        });
    } catch (dbError) {
        console.error("Database error fetching leads:", dbError);
        // Continue without registration info if DB fails
    }
    
    // Enrich chats with lastMessage and registration status
    if (Array.isArray(chats)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrichedChats = await Promise.all(chats.map(async (chat: any) => {
        const jid = chat.remoteJid || chat.id;
        const phone = jid ? jid.split('@')[0].replace(/\D/g, '') : '';
        
        // Try to find exact match or variations
        let leadInfo = registeredMap.get(phone);
        
        if (!leadInfo && phone) {
            // If direct match failed, try generating variations of the chat phone
            // This handles cases where database has "5531..." but chat is "31..." or vice-versa
            // and our initial map population might have missed some edge cases
            const chatPhoneVariations = generatePhoneVariations(phone);
            for (const variant of chatPhoneVariations) {
                const found = registeredMap.get(variant);
                if (found) {
                    leadInfo = found;
                    break;
                }
            }
        }

        const enrichedChat = { 
            ...chat, 
            isRegistered: !!leadInfo,
            leadId: leadInfo?.id || undefined,
            leadName: leadInfo?.name || undefined,
            leadStatus: leadInfo?.status || undefined,
            leadDataReuniao: leadInfo?.data_reuniao || undefined
        };

        // Always fetch the latest message to ensure accuracy
        try {
          if (jid) {
            // Fetch only 1 message to get the last one
            const msgsData = await evolutionFindMessages(jid, 1);
            const records = msgsData?.messages?.records || (Array.isArray(msgsData) ? msgsData : []);
            
            if (records.length > 0) {
              enrichedChat.lastMessage = records[0];
            }
          }
        } catch (e) {
          console.error(`Failed to fetch last message for ${chat.id}`, e);
        }
        return enrichedChat;
      }));
      return { success: true, data: enrichedChats };
    }

    return { success: true, data: chats };
  } catch (error) {
    console.error("Error fetching chats:", error);
    return { success: false, error: "Failed to fetch chats" };
  }
}

export async function getLeadByPhone(phone: string) {
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        // Try exact match first
        let result = await pool.query('SELECT * FROM leads WHERE telefone = $1', [cleanPhone]);
        
        if (result.rows.length === 0) {
            // Try variations
            const variations = generatePhoneVariations(cleanPhone);
            if (variations.length > 0) {
                // Build OR clause for variations
                const placeholders = variations.map((_, i) => `$${i + 1}`).join(', ');
                result = await pool.query(`SELECT * FROM leads WHERE telefone IN (${placeholders}) LIMIT 1`, variations);
            }
        }

        if (result.rows.length > 0) {
            return { success: true, data: result.rows[0] };
        }
        
        return { success: false, error: 'Lead não encontrado' };
    } catch (error) {
        console.error("Error fetching lead:", error);
        return { success: false, error: "Failed to fetch lead" };
    }
}

export async function registerLead(name: string, phone: string) {
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        // Check if already exists
        const { rows: existing } = await pool.query('SELECT id FROM leads WHERE telefone = $1', [cleanPhone]);
        if (existing.length > 0) {
            return { success: false, error: 'Usuário já cadastrado' };
        }

        const { rows } = await pool.query(
            'INSERT INTO leads (nome_completo, telefone, data_cadastro) VALUES ($1, $2, NOW()) RETURNING id',
            [name, cleanPhone]
        );
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error('Error registering lead:', error);
        return { success: false, error: 'Falha ao cadastrar' };
    }
}

export async function massRegisterLeads(leads: {name: string, phone: string}[]) {
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const results = [];
            for (const lead of leads) {
                const cleanPhone = lead.phone.replace(/\D/g, '');
                // Skip if exists
                 const { rows: existing } = await client.query('SELECT id FROM leads WHERE telefone = $1', [cleanPhone]);
                 if (existing.length > 0) continue;

                 const { rows } = await client.query(
                    'INSERT INTO leads (nome_completo, telefone, data_cadastro) VALUES ($1, $2, NOW()) RETURNING id',
                    [lead.name, cleanPhone]
                );
                results.push(rows[0]);
            }
            await client.query('COMMIT');
            return { success: true, count: results.length };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error mass registering:', error);
        return { success: false, error: 'Falha no cadastro em massa' };
    }
}

export async function getMessages(jid: string, page: number = 1) {
  try {
    // Fetch 20 messages per page
    const response = await evolutionFindMessages(jid, 20, page);
    
    // Normalize structure
    let records = response?.messages?.records || (Array.isArray(response) ? response : []);

    // Enrich media messages with base64
    if (Array.isArray(records)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      records = await Promise.all(records.map(async (msg: any) => {
        const content = msg.message || msg;
        
        // Check for any media type that might need base64
        const mediaMsg = content.audioMessage || 
                        content.imageMessage ||
                        content.videoMessage ||
                        content.documentMessage ||
                        content.stickerMessage ||
                        content.viewOnceMessage?.message?.audioMessage || 
                        content.viewOnceMessage?.message?.imageMessage ||
                        content.viewOnceMessage?.message?.videoMessage ||
                        content.viewOnceMessageV2?.message?.audioMessage || 
                        content.viewOnceMessageV2?.message?.imageMessage ||
                        content.viewOnceMessageV2?.message?.videoMessage ||
                        content.ephemeralMessage?.message?.audioMessage ||
                        content.ephemeralMessage?.message?.imageMessage ||
                        content.ephemeralMessage?.message?.videoMessage ||
                        content.documentWithCaptionMessage?.message?.audioMessage ||
                        content.documentWithCaptionMessage?.message?.imageMessage ||
                        content.documentWithCaptionMessage?.message?.videoMessage ||
                        content.documentWithCaptionMessage?.message?.documentMessage;

        if (mediaMsg && !msg.base64) {
          try {
             // We pass the full message object as expected by Evolution API
             const base64Data = await evolutionGetBase64FromMediaMessage(msg);
             if (base64Data?.base64) {
               return { ...msg, base64: base64Data.base64 };
             }
          } catch (e) {
            console.error(`Failed to fetch base64 for message ${msg.key?.id}`, e);
          }
        }
        return msg;
      }));
    }

    // Reconstruct response to match what frontend expects
    // Frontend looks for res.data.messages.records or res.data as array
    return { success: true, data: { messages: { records } } };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Failed to fetch messages" };
  }
}

export async function sendMessage(jid: string, text: string) {
  try {
    const result = await evolutionSendTextMessage(jid, text);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

export async function sendMedia(jid: string, formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'image' | 'video' | 'audio' | 'document';
    const caption = formData.get('caption') as string || undefined;
    
    if (!file) throw new Error("No file provided");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Check if it's a voice note (audio recorded by user)
    const isVoiceNote = formData.get('isVoiceNote') === 'true';

    let result;
    if (isVoiceNote && type === 'audio') {
      result = await evolutionSendWhatsAppAudio(jid, base64);
    } else {
      result = await evolutionSendMediaMessage(
        jid, 
        base64, 
        type, 
        caption, 
        file.name, 
        file.type
      );
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending media:", error);
    return { success: false, error: "Failed to send media" };
  }
}
