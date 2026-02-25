/**
 * Integração com n8n para Workflow de Regularização Fiscal
 * Implementa endpoints para processamento distribuído de mensagens
 */

import { NextRequest, NextResponse } from 'next/server';
import { processMessageSegments, MessageSegment } from '@/lib/ai/regularizacao-system';
import { trackResourceDelivery } from '@/lib/ai/tools/server-tools';
import { evolutionSendTextMessage, evolutionSendMediaMessage } from '@/lib/evolution';
import { toWhatsAppJid } from '@/lib/utils';

/**
 * Processa mensagens segmentadas via n8n
 * Endpoint: POST /api/webhook/n8n/message-split
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, segments, leadId } = body;

    if (!phone || !segments || !Array.isArray(segments)) {
      return NextResponse.json(
        { error: 'Dados inválidos: phone e segments são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`[n8n-message-split] Processing ${segments.length} segments for ${phone}`);

    // Processa mensagens segmentadas com delay
    for (const segment of segments) {
      if (segment.delay) {
        await new Promise(resolve => setTimeout(resolve, segment.delay));
      }
      
      await processMessageSegment(phone, segment);
      
      // Tracking de recursos entregues
      if (leadId && segment.metadata?.trackingKey) {
        await trackResourceDelivery(
          leadId,
          segment.type === 'media' ? 'video-tutorial' : 'link-ecac',
          segment.metadata.trackingKey,
          { segmentId: segment.id, phone }
        );
      }
    }

    return NextResponse.json({ 
      status: 'success', 
      message: `${segments.length} mensagens processadas com sucesso`,
      phone,
      segmentsProcessed: segments.length
    });

  } catch (error) {
    console.error('[n8n-message-split] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar mensagens segmentadas', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Processa um segmento de mensagem individual
 */
async function processMessageSegment(phone: string, segment: MessageSegment): Promise<void> {
  try {
    const jid = toWhatsAppJid(phone);
    
    switch (segment.type) {
      case 'text':
        await evolutionSendTextMessage(jid, segment.content);
        break;
        
      case 'link':
        await evolutionSendTextMessage(jid, segment.content);
        if (segment.metadata?.url) {
          await evolutionSendTextMessage(jid, String(segment.metadata.url));
        }
        break;
        
      case 'media':
        if (segment.metadata?.mediaKey) {
          await evolutionSendMediaMessage(
            jid,
            String(segment.metadata.mediaUrl),
            segment.metadata.mediaType as 'image' | 'video' | 'audio' | 'document',
            segment.content, // caption
            String(segment.metadata.mediaKey), // filename
            String(segment.metadata.mimetype)
          );
        }
        break;
        
      default:
        console.warn(`[n8n-message-split] Unknown segment type: ${segment.type}`);
    }
    
    console.log(`[n8n-message-split] Sent segment: ${segment.id} (${segment.type})`);
    
  } catch (error) {
    console.error(`[n8n-message-split] Error processing segment ${segment.id}:`, error);
    // Não lança erro para não parar o fluxo completo
  }
}

/**
 * Atualiza tracking de recursos via n8n
 * Endpoint: POST /api/webhook/n8n/tracking
 */
export async function updateTracking(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, resourceType, resourceKey, status, metadata } = body;

    if (!leadId || !resourceType || !resourceKey) {
      return NextResponse.json(
        { error: 'Dados inválidos: leadId, resourceType e resourceKey são obrigatórios' },
        { status: 400 }
      );
    }

    await trackResourceDelivery(leadId, resourceType, resourceKey, metadata);
    
    if (status === 'completed') {
      // Atualiza status para completed
      // Implementation would go here
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Tracking atualizado com sucesso',
      leadId,
      resourceType,
      resourceKey,
      resourceStatus: status
    });

  } catch (error) {
    console.error('[n8n-tracking] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tracking', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Inicia workflow de regularização via n8n
 * Endpoint: POST /api/webhook/n8n/regularizacao
 */
export async function startRegularizacaoWorkflow(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, leadId, tipoProcesso } = body;

    if (!phone || !leadId || !tipoProcesso) {
      return NextResponse.json(
        { error: 'Dados inválidos: phone, leadId e tipoProcesso são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`[n8n-regularizacao] Starting workflow for ${phone}, tipo: ${tipoProcesso}`);

    let segments: MessageSegment[] = [];

    switch (tipoProcesso) {
      case 'autonomo':
        segments = [
          {
            id: 'regularizacao-intro',
            content: 'Olá! Vi que você está interessado em regularização fiscal. Vou te explicar o processo passo a passo.',
            type: 'text',
            delay: 500
          },
          {
            id: 'regularizacao-dividas',
            content: 'Para realizar a regularização, precisamos consultar suas dívidas no PGMEI (Programa de Regularização do Microempreendedor Individual) e na Dívida Ativa da União.',
            type: 'text',
            delay: 1000
          },
          {
            id: 'regularizacao-procuracao',
            content: 'Para isso, você precisa ter uma procuração cadastrada no e-CAC (Centro Virtual de Atendimento ao Contribuinte). Isso é obrigatório e garante segurança no processo.',
            type: 'text',
            delay: 1000
          },
          {
            id: 'regularizacao-opcoes',
            content: 'Você prefere fazer o processo de forma autônoma, com nosso passo a passo, ou gostaria de ser auxiliado por um de nossos especialistas?',
            type: 'text',
            delay: 1000
          }
        ];
        break;
        
      case 'assistido':
        segments = [
          {
            id: 'assistido-intro',
            content: 'Ótima escolha! Um de nossos especialistas irá auxiliá-lo durante todo o processo.',
            type: 'text',
            delay: 500
          },
          {
            id: 'assistido-preparacao',
            content: 'Vou transferir você para um atendente que irá te guiar passo a passo na criação da procuração e no processo completo de regularização.',
            type: 'text',
            delay: 1000
          }
        ];
        break;
        
      default:
        return NextResponse.json(
          { error: 'tipoProcesso inválido. Use: autonomo ou assistido' },
          { status: 400 }
        );
    }

    // Processa mensagens segmentadas
    await processMessageSegments(phone, segments, (segment) => processMessageSegment(phone, segment));

    // Tracking inicial
    await trackResourceDelivery(leadId, 'workflow-start', `regularizacao-${tipoProcesso}`, {
      phone,
      timestamp: new Date().toISOString(),
      segments: segments.length
    });

    return NextResponse.json({ 
      status: 'success', 
      message: `Workflow de regularização ${tipoProcesso} iniciado com sucesso`,
      phone,
      leadId,
      tipoProcesso,
      segmentsProcessed: segments.length
    });

  } catch (error) {
    console.error('[n8n-regularizacao] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao iniciar workflow de regularização', details: String(error) },
      { status: 500 }
    );
  }
}