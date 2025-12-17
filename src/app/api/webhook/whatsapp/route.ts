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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[Webhook] Body recebido:', JSON.stringify(body, null, 2));

    // Suporte a diferentes formatos de mensagem da Evolution API
    const message = 
      body.data?.message?.conversation || 
      body.data?.message?.extendedTextMessage?.text ||
      body?.data?.message?.imageMessage?.caption || 
      '';

    const sender = body.data?.key?.remoteJid;
    const fromMe = body.data?.key?.fromMe;
    const pushName = body.data?.pushName;

    if (fromMe) {
      console.log('[Webhook] Ignorando mensagem enviada por mim.');
      return NextResponse.json({ status: 'ignored_from_me' });
    }

    if (!message || !sender) {
      console.log('[Webhook] Mensagem ou remetente inválidos/ausentes.');
      return NextResponse.json({ status: 'ignored_invalid' });
    }

    const userPhone = sender.replace('@s.whatsapp.net', '');
    console.log(`[Webhook] Mensagem de ${userPhone}: ${message}`);

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
