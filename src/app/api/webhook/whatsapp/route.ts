import { NextResponse } from 'next/server';
import { runApoloAgent } from '@/lib/ai/agents/apolo';
import { runVendedorAgent } from '@/lib/ai/agents/vendedor';
import { runAtendenteAgent } from '@/lib/ai/agents/atendente';
import { AgentContext } from '@/lib/ai/types';
import { getUser, updateUser, createUser, getAgentRouting } from '@/lib/ai/tools/server-tools';
import { addToHistory, getChatHistory } from '@/lib/chat-history';
import { evolutionSendTextMessage } from '@/lib/evolution';
import redis from '@/lib/redis';

// Helper to notify Socket Server (Redis Pub/Sub -> HTTP Fallback)
async function notifySocketServer(channel: string, message: object) {
  try {
    // 1. Try Redis Pub/Sub (Fastest)
    await redis.publish(channel, JSON.stringify(message));
  } catch (redisError) {
    console.warn('[Webhook] Redis publish failed, trying HTTP fallback:', redisError);

    // 2. HTTP Fallback to Socket Server
    try {
      // Assuming Socket Server runs on localhost:3002 as configured
      // In production, this URL should be in env vars
      const socketServerUrl = 'http://localhost:3003/notify';
      await fetch(socketServerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      console.log('[Webhook] HTTP notification sent to Socket Server successfully.');
    } catch (httpError) {
      console.error('[Webhook] Both Redis and HTTP notification failed:', httpError);
    }
  }
}

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME;

export async function GET() {
  return NextResponse.json({
    status: 'online',
    message: 'Webhook is active and ready to receive POST requests',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  try {
    const apiKeyHeader = req.headers.get('apikey') || req.headers.get('authorization')?.replace('Bearer ', '');
    if (process.env.EVOLUTION_API_KEY && apiKeyHeader !== process.env.EVOLUTION_API_KEY) {
      console.warn('[Webhook] Unauthorized access attempt.');
      return NextResponse.json({ status: 'unauthorized', error: 'Invalid API Key' }, { status: 401 });
    }

    const body = await req.json();
    console.log('[Webhook] Body recebido:', JSON.stringify(body, null, 2));

    // Ignorar eventos que não sejam de mensagem
    if (body.event !== 'messages.upsert') {
      console.log(`[Webhook] Ignorando evento não-mensagem: ${body.event}`);
      return NextResponse.json({ status: 'ignored_event_type' });
    }

    const msgData = body.data?.message;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let message: string | any[] = '';

    // 1. Text extraction
    if (msgData?.conversation) {
      message = msgData.conversation;
    } else if (msgData?.extendedTextMessage?.text) {
      message = msgData.extendedTextMessage.text;
    }
    // 2. Image extraction
    else if (msgData?.imageMessage) {
      const caption = msgData.imageMessage.caption || '';
      // Evolution API usually sends base64 in body.data.base64 if configured
      const base64 = body.data?.base64 || msgData.imageMessage.base64;
      const mimetype = msgData.imageMessage.mimetype || 'image/jpeg';

      if (base64) {
        message = [
          { type: 'text', text: caption || 'Analise esta imagem.' },
          { type: 'image_url', image_url: { url: `data:${mimetype};base64,${base64}` } }
        ];
        console.log('[Webhook] Imagem processada com sucesso.');
      } else {
        message = caption;
        console.log('[Webhook] Imagem recebida mas sem base64. Habilite "Include Base64" no Webhook da Evolution API.');
      }
    }
    // 3. Document extraction (PDF)
    else if (msgData?.documentMessage) {
      const caption = msgData.documentMessage.caption || '';
      const fileName = msgData.documentMessage.fileName || 'documento.pdf';
      const base64 = body.data?.base64 || msgData.documentMessage?.base64;
      const mimetype = msgData.documentMessage.mimetype || 'application/pdf';

      if (base64 && mimetype === 'application/pdf') {
        try {
          // @ts-ignore
          const pdfParseModule: any = await import('pdf-parse');
          const pdfParse = pdfParseModule.default || pdfParseModule;
          const pdfBuffer = Buffer.from(base64, 'base64');
          const pdfData = await pdfParse(pdfBuffer);
          message = `${caption} [Conteúdo do PDF ${fileName} extraído com sucesso]:\n\n${pdfData.text}`;
          console.log('[Webhook] PDF extraído com sucesso.');
        } catch (err) {
          console.error('[Webhook] Erro ao extrair PDF:', err);
          message = `${caption} [Arquivo PDF: ${fileName} - Falha ao extrair texto do PDF]`;
        }
      } else {
        message = `${caption} [Arquivo: ${fileName} - Formato não suportado para extração automática]`;
      }
    }
    // 4. Audio extraction
    else if (msgData?.audioMessage) {
      const base64 = body.data?.base64 || msgData.audioMessage?.base64;
      if (base64) {
        try {
          const { OpenAI } = await import('openai');
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          // Convert base64 to File-like object (Blob or Stream)
          // For OpenAI Node SDK, we can use a temporary file or an intermediate buffer with custom name
          const fs = await import('fs');
          const os = await import('os');
          const path = await import('path');
          const { v4: uuidv4 } = await import('uuid');

          const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}.ogg`);
          fs.writeFileSync(tempFilePath, Buffer.from(base64, 'base64'));

          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: 'whisper-1',
          });

          fs.unlinkSync(tempFilePath); // Cleanup

          message = `[ÁUDIO TRANSCRITO DO CLIENTE]: "${transcription.text}"`;
          console.log('[Webhook] Áudio transcrito com sucesso:', transcription.text);
        } catch (err) {
          console.error('[Webhook] Falha na transcrição de áudio:', err);
          message = '[Áudio recebido] (Falha na transcrição automática)';
        }
      } else {
        message = '[Áudio recebido] (Sem conteúdo base64 para transcrição)';
        console.log('[Webhook] Áudio recebido, mas sem base64.');
      }
    }
    // 5. Sticker extraction
    else if (msgData?.stickerMessage) {
      message = '[Sticker recebido]';
      console.log('[Webhook] Sticker recebido.');
    }
    // 6. Video extraction
    else if (msgData?.videoMessage) {
      const caption = msgData.videoMessage.caption || '';
      message = `${caption} [Vídeo recebido]`;
      console.log('[Webhook] Vídeo recebido.');
    }
    // 7. Contact/Location extraction
    else if (msgData?.contactMessage || msgData?.contactsArrayMessage) {
      message = '[Contato recebido]';
    } else if (msgData?.locationMessage) {
      message = '[Localização recebida]';
    }

    // Identify the user phone
    // Priority 1: 'senderpn' or 'senderPhone' (Explicit user phone number, reported by user)
    // Priority 2: 'remoteJid' (Standard, but might be an LID)
    const sender = body.senderpn ||
      body.data?.senderpn ||
      body.senderPhone ||
      body.data?.senderPhone ||
      body.data?.key?.remoteJid;

    const fromMe = body.data?.key?.fromMe;
    const pushName = body.data?.pushName;

    // Diagnostic logging for LID or missing phone
    if (sender && sender.includes('@lid')) {
      console.log('[Webhook] Received LID. Dumping body keys to find real phone:', Object.keys(body), 'Data keys:', body.data ? Object.keys(body.data) : 'No data');
    }

    if (fromMe) {
      console.log('[Webhook] Ignorando mensagem enviada por mim.');
      return NextResponse.json({ status: 'ignored_from_me' });
    }

    if (!message || !sender) {
      console.log('[Webhook] Mensagem ou remetente inválidos/ausentes.');
      return NextResponse.json({ status: 'ignored_invalid' });
    }

    /*
    const restrictForTest =
      process.env.WHATSAPP_TEST_RESTRICT_REMOTE_JID === 'true' ||
      (process.env.EVOLUTION_INSTANCE_NAME || '').toLowerCase().includes('teste');

    if (restrictForTest && sender) {
      const allowedSuffix = process.env.WHATSAPP_TEST_ALLOWED_JID_SUFFIX || '3182354127';
      const senderDigits = sender.replace('@s.whatsapp.net', '').replace(/\D/g, '');
      if (!senderDigits.endsWith(allowedSuffix)) {
        console.log(`[Webhook] Ignorando remetente não permitido em modo teste: ${sender} (Esperado final: ${allowedSuffix})`);
        return NextResponse.json({ status: 'ignored_not_allowed' });
      }
      console.log(`[Webhook] Modo Teste Ativo: Remetente ${sender} permitido.`);
    }
    */

    const userPhone = sender.replace('@s.whatsapp.net', '');
    const logMsg = typeof message === 'string' ? message : '[Conteúdo Multimodal/Imagem]';
    console.log(`[Webhook] Mensagem de ${userPhone}: ${logMsg}`);

    // 0. Notify n8n about User Activity (Follow-up)
    if (process.env.N8N_WHATSAPP_EVENTS_URL) {
      // Fire and forget - Don't await to avoid blocking response
      console.log(`[Webhook] Notificando N8N (Follow-up): ${process.env.N8N_WHATSAPP_EVENTS_URL}`);
      fetch(process.env.N8N_WHATSAPP_EVENTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userPhone,
          name: pushName || 'Cliente',
          message: typeof message === 'string' ? message : JSON.stringify(message),
          event: 'user_message',
          timestamp: new Date().toISOString()
        })
      }).catch(err => console.error('[Webhook] Failed to notify n8n of user message:', err));
    }

    // 0. Salvar mensagem do usuário no histórico
    await addToHistory(userPhone, 'user', message);

    // Adicionar à fila de sincronização de contexto (Redis Sorted Set)
    // O Cron Job processará apenas usuários inativos há 10 minutos
    redis.zadd('context_sync_queue', Date.now(), userPhone).catch(err =>
      console.error('[Webhook] Erro ao adicionar à fila de contexto:', err)
    );
    // Reset 5-minute nudge flag
    redis.del(`context_nudge_sent:${userPhone}`).catch(() => { });

    // Publish INCOMING message to Redis for Real-time
    const incomingSocketMsg = {
      chatId: sender,
      ...body.data
    };
    notifySocketServer('chat-updates', incomingSocketMsg).catch(err =>
      console.error('[Webhook] Socket notification failed:', err)
    );

    // 1. Determinar o Estado do Usuário (Routing Logic)
    let userState: 'lead' | 'qualified' | 'customer' = 'lead';

    // Consultar Banco de Dados
    const userJson = await getUser(userPhone);
    let user: Record<string, unknown> | null = null;

    try {
      if (userJson) {
        const parsed = JSON.parse(userJson);
        if (parsed.status !== 'error' && parsed.status !== 'not_found') {
          user = parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao parsear usuario:', e);
    }

    if (!user) {
      // Novo usuário: Criar e mandar para Apolo
      console.log(`[Router] Novo usuário detectado (${userPhone}). Criando registro...`);
      try {
        const createResult = await createUser({ telefone: userPhone, nome_completo: pushName || 'Desconhecido' });
        console.log(`[Router] Resultado criação usuário: ${createResult}`);

        // Verifica se houve erro na criação, mas prossegue como lead
        const parsedResult = JSON.parse(createResult);
        if (parsedResult.status === 'error') {
          console.error(`[Router] Falha ao criar usuário no banco: ${parsedResult.message}`);
          // Continua mesmo com erro, para não deixar o usuário sem resposta
        } else {
          await updateUser({ telefone: userPhone, situacao: 'nao_respondido' });
        }
      } catch (createError) {
        console.error(`[Router] Exceção crítica ao criar usuário:`, createError);
      }
      userState = 'lead';
    } else {
      // Usuário existente: Atualizar dados (sync)
      // Se tiver pushName, e o nome atual for vazio ou Desconhecido, atualiza.
      // Se não, apenas chama updateUser para atualizar o 'atualizado_em'
      const currentName = user.nome_completo as string;
      const shouldUpdateName = pushName && (!currentName || currentName === 'Desconhecido' || currentName.trim() === '');

      if (shouldUpdateName) {
        console.log(`[Router] Atualizando nome do usuário ${userPhone} para ${pushName}`);
        await updateUser({ telefone: userPhone, nome_completo: pushName });
        // Update local user object for correct context
        user.nome_completo = pushName;
      } else {
        // Atualiza apenas timestamp (e garante que o user está 'ativo')
        await updateUser({ telefone: userPhone });
      }

      // Usuário existente: Verificar regras
      if (user.situacao === 'cliente') {
        userState = 'customer';
      } else if (user.qualificacao) {
        // Se já tem qualificação (MQL, SQL, ICP ou Desqualificado), vai para Vendedor (Repescagem incluída)
        userState = 'qualified';
      } else {
        // Padrão: Apolo (ainda qualificando ou sem status)
        userState = 'lead';
      }
    }

    // 1.5 Verificar Override de Roteamento (Cross-sell / Up-sell)
    const routingOverride = await getAgentRouting(userPhone);
    if (routingOverride === 'vendedor') {
      console.log(`[Router] Override ativo: Redirecionando ${userPhone} para Vendas (Cross-sell).`);
      userState = 'qualified'; // Força roteamento para Vendedor
    }

    // Contexto compartilhado
    const history = await getChatHistory(userPhone);
    const context: AgentContext = {
      userId: sender,
      userName: pushName,
      userPhone: userPhone,
      history: history
    };

    let responseText = '';

    // 2. Despachar para o Agente Correto
    switch (userState) {
      case 'qualified':
        console.log(`[Router] Direcionando para VENDEDOR (Icaro)`);
        responseText = await runVendedorAgent(message, context);
        break;
      case 'customer':
        console.log(`[Router] Direcionando para ATENDENTE (Apolo Customer)`);
        responseText = await runAtendenteAgent(message, context);
        break;
      case 'lead':
      default:
        console.log(`[Router] Direcionando para APOLO (SDR)`);
        responseText = await runApoloAgent(message, context);
        break;
    }

    // 3. Salvar resposta e Enviar
    if (responseText) {
      await addToHistory(userPhone, 'assistant', responseText);
    }

    try {
      // Split responseText by |||
      const messages = responseText.split('|||').map((m: string) => m.trim()).filter((m: string) => m.length > 0);

      for (const msg of messages) {
        const sentMessage = await evolutionSendTextMessage(sender, msg);

        if (sentMessage) {
          // Publish OUTGOING message to Redis
          const outgoingSocketMsg = {
            chatId: sender,
            ...sentMessage
          };
          await notifySocketServer('chat-updates', outgoingSocketMsg);
        }

        // Add a small human-like delay between multiple messages (1.5 seconds)
        if (messages.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    } catch (sendError) {
      console.error(`[Webhook] Falha ao enviar mensagem para ${sender}:`, sendError);
      // Não retorna 500 para não travar o webhook do WhatsApp (que ficaria tentando reenviar)
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Erro no Webhook:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
