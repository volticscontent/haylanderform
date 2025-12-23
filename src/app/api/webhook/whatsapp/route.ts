import { NextResponse } from 'next/server';
import { runApoloAgent } from '@/lib/ai/agents/apolo';
import { runVendedorAgent } from '@/lib/ai/agents/vendedor';
import { runAtendenteAgent } from '@/lib/ai/agents/atendente';
import { AgentContext } from '@/lib/ai/types';
import { getUser, updateUser } from '@/lib/ai/tools/server-tools';

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
    const body = await req.json();
    console.log('[Webhook] Body recebido:', JSON.stringify(body, null, 2));

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
    // 3. Document extraction (PDF) - Placeholder for future implementation
    else if (msgData?.documentMessage) {
      const caption = msgData.documentMessage.caption || '';
      message = caption + ' [Arquivo recebido. O sistema ainda não processa o conteúdo interno de PDFs, mas analisará a legenda/nome.]';
      console.log('[Webhook] Documento recebido. Leitura de conteúdo PDF temporariamente desativada.');
    }

    const sender = body.data?.key?.remoteJid;
    const fromMe = body.data?.key?.fromMe;
    const pushName = body.data?.pushName;

    if (fromMe) {
      console.log('[Webhook] Ignorando mensagem enviada por mim.');
      return NextResponse.json({ status: 'ignored_from_me' });
    }

    const restrictForTest =
      process.env.WHATSAPP_TEST_RESTRICT_REMOTE_JID === 'true' ||
      (process.env.EVOLUTION_INSTANCE_NAME || '').toLowerCase().includes('teste');

    if (restrictForTest && sender) {
      const allowedSuffix = process.env.WHATSAPP_TEST_ALLOWED_JID_SUFFIX || '3182354127';
      const senderDigits = sender.replace('@s.whatsapp.net', '').replace(/\D/g, '');
      if (!senderDigits.endsWith(allowedSuffix)) {
        console.log(`[Webhook] Ignorando remetente não permitido em modo teste: ${sender}`);
        return NextResponse.json({ status: 'ignored_not_allowed' });
      }
    }

    if (!message || !sender) {
      console.log('[Webhook] Mensagem ou remetente inválidos/ausentes.');
      return NextResponse.json({ status: 'ignored_invalid' });
    }

    const userPhone = sender.replace('@s.whatsapp.net', '');
    const logMsg = typeof message === 'string' ? message : '[Conteúdo Multimodal/Imagem]';
    console.log(`[Webhook] Mensagem de ${userPhone}: ${logMsg}`);

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
      console.log('[Router] Novo usuário detectado. Criando registro...');
      await updateUser({ telefone: userPhone, nome_completo: pushName || 'Desconhecido', situacao: 'aguardando_qualificação' });
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
      } else if (user.qualificacao && user.qualificacao !== 'desqualificado') {
        // Se já tem qualificação (MQL, SQL, ICP), vai para Vendedor
        userState = 'qualified';
      } else {
        // Padrão: Apolo (ainda qualificando ou desqualificado tentando contato)
        userState = 'lead';
      }
    }

    // Contexto compartilhado
    const context: AgentContext = {
      userId: sender,
      userName: pushName,
      userPhone: userPhone,
      history: [] // Em produção, carregar histórico do Redis/DB
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

    // 3. Enviar resposta
    await sendWhatsAppMessage(sender, responseText);

    return NextResponse.json({ status: 'success' });
  } catch (error: unknown) {
    console.error('Erro no Webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function sendWhatsAppMessage(to: string, text: string) {
  if (!text) return;

  // Prioritize Evolution Config if available
  if (EVOLUTION_API_URL && EVOLUTION_INSTANCE_NAME && EVOLUTION_API_KEY) {
    try {
      const cleanUrl = EVOLUTION_API_URL.replace(/\/$/, '');
      const url = `${cleanUrl}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;
      
      console.log(`[Evolution] Enviando mensagem para ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: to.replace('@s.whatsapp.net', ''),
          text: text
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Evolution] Erro na resposta da API: ${response.status} - ${errorText}`);
      } else {
        const data = await response.json();
        console.log('[Evolution] Mensagem enviada com sucesso:', JSON.stringify(data));
      }
      return;
    } catch (error) {
      console.error('Erro ao enviar mensagem via Evolution:', error);
    }
  }

  // Fallback to generic WHATSAPP_API_URL
  if (!WHATSAPP_API_URL) {
    console.log('--- MENSAGEM DE RESPOSTA (MOCK) ---');
    console.log(`Para: ${to}`);
    console.log(`Texto: ${text}`);
    console.log('----------------------------');
    return;
  }

  try {
    await fetch(`${WHATSAPP_API_URL}/message/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': WHATSAPP_API_KEY || ''
      },
      body: JSON.stringify({
        number: to.replace('@s.whatsapp.net', ''),
        text: text
      })
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
}
