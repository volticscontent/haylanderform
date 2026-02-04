'use server';

import { evolutionFindChats, evolutionFindMessages, evolutionSendTextMessage, evolutionSendMediaMessage, evolutionSendWhatsAppAudio, evolutionGetBase64FromMediaMessage } from "@/lib/evolution";
import pool from "@/lib/db";
import { generatePhoneVariations } from "@/lib/phone-utils";

interface Lead {
    id: number;
    telefone: string;
    nome_completo: string | null;
    situacao: string | null;
    data_reuniao: string | null;
}

interface Chat {
    id: string;
    remoteJid?: string;
    pushName?: string | null;
    unreadCount?: number;
    profilePicUrl?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lastMessage?: any;
    conversationTimestamp?: number;
    [key: string]: unknown;
}

interface Message {
    key?: {
        remoteJid: string;
        fromMe: boolean;
        id: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message?: any;
    base64?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

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
    const chatsArray = Array.isArray(chats) ? (chats as Chat[]) : [];
    
    // Get all registered phone numbers to minimize DB queries
    const registeredMap = new Map();
    const matchedLeadIds = new Set<number>();
    let allLeads: Lead[] = [];

    try {
        const { rows: leads } = await pool.query<Lead>(`
          SELECT 
            l.id, 
            l.telefone, 
            l.nome_completo, 
            lq.situacao,
            lv.data_reuniao
          FROM leads l
          LEFT JOIN leads_qualificacao lq ON l.id = lq.lead_id
          LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
        `);
        allLeads = leads;

        leads.forEach((lead) => {
            if (lead.telefone) {
                const leadData = {
                    id: lead.id,
                    name: lead.nome_completo,
                    status: lead.situacao,
                    data_reuniao: lead.data_reuniao
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
    const enrichedChats = await Promise.all(chatsArray.map(async (chat) => {
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

        if (leadInfo) {
            matchedLeadIds.add(leadInfo.id);
        }

        const enrichedChat = { 
            ...chat, 
            isRegistered: !!leadInfo,
            leadId: leadInfo?.id || undefined,
            leadName: leadInfo?.name || undefined,
            leadStatus: leadInfo?.status || undefined,
            // Ensure date is serialized to string to prevent React rendering errors
            leadDataReuniao: leadInfo?.data_reuniao ? new Date(leadInfo.data_reuniao).toISOString() : undefined
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

    // Find leads with appointments that were not matched to any chat
    const virtualChats = allLeads
        .filter((lead) => lead.data_reuniao && !matchedLeadIds.has(lead.id) && lead.telefone)
        .map((lead) => {
            const phone = lead.telefone.replace(/\D/g, '');
            const jid = `${phone}@s.whatsapp.net`;
            return {
                id: jid,
                remoteJid: jid,
                name: lead.nome_completo || phone,
                pushName: lead.nome_completo,
                profilePicUrl: null,
                unreadCount: 0,
                lastMessage: null,
                conversationTimestamp: Math.floor(new Date(lead.data_reuniao!).getTime() / 1000), // Use meeting time
                isRegistered: true,
                leadId: lead.id,
                leadName: lead.nome_completo,
                leadStatus: lead.situacao,
                leadDataReuniao: lead.data_reuniao,
                isVirtual: true
            };
        });

    return { success: true, data: [...enrichedChats, ...virtualChats] };
  } catch (error) {
    console.error("Error fetching chats:", error);
    return { success: false, error: "Failed to fetch chats" };
  }
}

export async function getLeadByPhone(phone: string) {
    try {
        const cleanPhone = phone.replace(/\D/g, '');
        
        const query = `
            SELECT 
                l.id,
                l.telefone, 
                l.nome_completo, 
                l.email,
                l.data_cadastro,
                l.atualizado_em,
                
                -- leads_empresarial
                le.razao_social,
                le.cnpj, 
                le.cartao_cnpj,
                le.tipo_negocio,
                le.faturamento_mensal,
                le.endereco,
                le.numero,
                le.complemento,
                le.bairro,
                le.cidade,
                le.estado,
                le.cep,

                -- leads_atendimento
                la.observacoes,
                la.data_controle_24h,
                la.envio_disparo,
                la.data_ultima_consulta,
                la.atendente_id,

                -- leads_financeiro
                lf.calculo_parcelamento, 
                lf.valor_divida_ativa,
                lf.valor_divida_municipal,
                lf.valor_divida_estadual,
                lf.valor_divida_federal,
                lf.tipo_divida,
                lf.tem_divida,
                lf.tempo_divida,

                -- leads_qualificacao
                lq.situacao,
                lq.qualificacao,
                lq.motivo_qualificacao,
                lq.interesse_ajuda,
                lq.pos_qualificacao,
                lq.possui_socio,

                -- leads_vendas
                lv.servico_negociado,
                lv.status_atendimento,
                lv.data_reuniao,
                lv.procuracao,
                lv.procuracao_ativa,
                lv.procuracao_validade

            FROM leads l
            LEFT JOIN leads_empresarial le ON l.id = le.lead_id
            LEFT JOIN leads_qualificacao lq ON l.id = lq.lead_id
            LEFT JOIN leads_financeiro lf ON l.id = lf.lead_id
            LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
            LEFT JOIN leads_atendimento la ON l.id = la.lead_id
            WHERE l.telefone = $1
        `;

        // Try exact match first
        let result = await pool.query(query, [cleanPhone]);
        
        if (result.rows.length === 0) {
            // Try variations
            const variations = generatePhoneVariations(cleanPhone);
            if (variations.length > 0) {
                // Build OR clause for variations
                const placeholders = variations.map((_, i) => `$${i + 1}`).join(', ');
                
                // Need to rebuild query for IN clause
                const variationQuery = query.replace('WHERE l.telefone = $1', `WHERE l.telefone IN (${placeholders}) LIMIT 1`);
                
                result = await pool.query(variationQuery, variations);
            }
        }

        if (result.rows.length > 0) {
            const lead = result.rows[0];
            // Ensure dates are serialized to strings
            const serializedLead = {
                ...lead,
                data_cadastro: lead.data_cadastro ? new Date(lead.data_cadastro).toISOString() : null,
                atualizado_em: lead.atualizado_em ? new Date(lead.atualizado_em).toISOString() : null,
                data_controle_24h: lead.data_controle_24h ? new Date(lead.data_controle_24h).toISOString() : null,
                envio_disparo: lead.envio_disparo ? new Date(lead.envio_disparo).toISOString() : null,
                data_ultima_consulta: lead.data_ultima_consulta ? new Date(lead.data_ultima_consulta).toISOString() : null,
                data_reuniao: lead.data_reuniao ? new Date(lead.data_reuniao).toISOString() : null,
                procuracao_validade: lead.procuracao_validade ? new Date(lead.procuracao_validade).toISOString() : null,
            };
            return { success: true, data: serializedLead };
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

export async function getConsultationsByCnpj(cnpj: string) {
    try {
        console.log(`[getConsultationsByCnpj] Buscando consultas para CNPJ bruto: "${cnpj}"`);
        const cleanCnpj = cnpj.replace(/\D/g, '');
        console.log(`[getConsultationsByCnpj] CNPJ limpo: "${cleanCnpj}"`);

        const query = `
            SELECT 
                id,
                cnpj,
                tipo_servico,
                resultado,
                status,
                created_at
            FROM consultas_serpro
            WHERE cnpj = $1
            ORDER BY created_at DESC
        `;
        
        const { rows } = await pool.query(query, [cleanCnpj]);
        console.log(`[getConsultationsByCnpj] Encontradas ${rows.length} consultas.`);
        
        const serializedRows = rows.map(row => ({
            ...row,
            created_at: row.created_at ? new Date(row.created_at).toISOString() : null
        }));

        return { success: true, data: serializedRows };
    } catch (error) {
        console.error('[getConsultationsByCnpj] Error fetching consultations:', error);
        return { success: false, error: 'Falha ao buscar consultas' };
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
    let records = (response?.messages?.records || (Array.isArray(response) ? response : [])) as Message[];

    // Enrich media messages with base64
    if (Array.isArray(records)) {
      records = await Promise.all(records.map(async (msg) => {
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
