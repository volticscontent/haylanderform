
import { NextRequest, NextResponse } from 'next/server';
import { evolutionSendTextMessage, evolutionSendMediaMessage } from '@/lib/evolution';
import { notifySocketServer } from '@/lib/socket';

// Chave de API simples para proteger o endpoint de chamadas externas não autorizadas
const API_KEY = process.env.API_KEY || 'haylander-api-key';

export async function GET() {
  return NextResponse.json({ status: 'online', method: 'GET' });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}

export async function POST(req: NextRequest) {
  console.log(`[Message Send API] Received ${req.method} request`);
  try {
    // Verificar autenticação
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { phone, content, type = 'text', options } = body;

    if (!phone || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;

    if (type === 'media') {
      // Para mídia, content deve ser a URL e options pode conter caption/mimetype
      result = await evolutionSendMediaMessage(
        phone,
        content, // URL da mídia
        options?.mediaType || 'image', // image, video, document, audio
        options?.caption,
        options?.fileName
      );
    } else {
      // Texto padrão
      result = await evolutionSendTextMessage(phone, content);
    }

    if (result) {
      // Publish OUTGOING message to Socket Server (Real-time update)
      const outgoingSocketMsg = {
        chatId: phone,
        ...result
      };
      // Fire and forget notification
      notifySocketServer('chat-updates', outgoingSocketMsg).catch(err => 
        console.error('[Message Send API] Socket notification failed:', err)
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Message Send API] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    );
  }
}
