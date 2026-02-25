/**
 * Sistema de Tracking para Regularização Fiscal
 * Implementa tracking de recursos entregues aos clientes
 */

import { sendToN8nHandler } from '../n8n-client';

export interface TrackingData {
  leadId: number;
  resourceType: 'video-tutorial' | 'link-ecac' | 'formulario' | 'documentacao';
  resourceKey: string;
  deliveredAt: Date;
  accessedAt?: Date;
  status: 'delivered' | 'accessed' | 'completed';
  metadata?: Record<string, unknown>;
}

/**
 * Registra a entrega de um recurso ao cliente
 */
export async function trackResourceDelivery(
  leadId: number, 
  resourceType: TrackingData['resourceType'], 
  resourceKey: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Implementation will be added to server-tools.ts
  console.log(`[Tracking] Resource delivered: ${resourceType} - ${resourceKey} for lead ${leadId}`);
}

/**
 * Verifica se um recurso já foi entregue ao cliente
 */
export async function hasResourceBeenDelivered(
  leadId: number, 
  resourceType: TrackingData['resourceType'], 
  resourceKey: string
): Promise<boolean> {
  // Implementation will be added to server-tools.ts
  return false;
}

/**
 * Sistema de Mensagens Segmentadas para Regularização
 * Resolve o problema de SSR na Vercel com múltiplas renderizações
 */

export interface MessageSegment {
  id: string;
  content: string;
  type: 'text' | 'media' | 'link';
  delay?: number; // delay in milliseconds before sending
  metadata?: Record<string, unknown>;
}

/**
 * Cria mensagens segmentadas para o fluxo de regularização
 */
export function createRegularizacaoMessageSegments(): MessageSegment[] {
  return [
    {
      id: 'intro-regularizacao',
      content: `Olá! Vi que você está interessado em regularização fiscal. Vou te explicar o processo passo a passo.`,
      type: 'text',
      delay: 500
    },
    {
      id: 'explicacao-dividas',
      content: `Para realizar a regularização, precisamos consultar suas dívidas no PGMEI (Programa de Regularização do Microempreendedor Individual) e na Dívida Ativa da União.`,
      type: 'text',
      delay: 1500
    },
    {
      id: 'explicacao-procuracao',
      content: `Para isso, você precisa ter uma procuração cadastrada no e-CAC (Centro Virtual de Atendimento ao Contribuinte). Isso é obrigatório e garante segurança no processo.`,
      type: 'text',
      delay: 2000
    },
    {
      id: 'oferecer-opcoes',
      content: `Você prefere fazer o processo de forma autônoma, com nosso passo a passo, ou gostaria de ser auxiliado por um de nossos atendentes?`,
      type: 'text',
      delay: 1500
    }
  ];
}

/**
 * Cria mensagens para o processo autônomo
 */
export function createAutonomoMessageSegments(): MessageSegment[] {
  return [
    {
      id: 'autonomo-inicio',
      content: `Perfeito! Vou te enviar o passo a passo completo para você realizar o processo de forma autônoma.`,
      type: 'text',
      delay: 1000
    },
    {
      id: 'link-ecac',
      content: `Acesse o e-CAC através deste link oficial: https://cav.receita.fazenda.gov.br/autenticacao/login`,
      type: 'link',
      delay: 1500,
      metadata: { url: 'https://cav.receita.fazenda.gov.br/autenticacao/login', trackingKey: 'link-ecac' }
    },
    {
      id: 'video-tutorial',
      content: `Aqui está um vídeo tutorial completo ensinando como criar a procuração no e-CAC:`,
      type: 'text',
      delay: 2000
    },
    {
      id: 'video-media',
      content: 'https://haylander.com.br/videos/procuracao-ecac-tutorial.mp4', // URL fixa ou resolvida dinamicamente
      type: 'media',
      delay: 2500,
      metadata: { mediaKey: 'video-tutorial-procuracao-ecac', trackingKey: 'video-tutorial', mediaType: 'video' }
    },
    {
      id: 'instrucoes-finais',
      content: `Após criar a procuração, volte aqui e me diga que conseguiu. Então enviarei o formulário para darmos continuidade ao processo de regularização.`,
      type: 'text',
      delay: 3000
    }
  ];
}

/**
 * Cria mensagens para atendimento assistido
 */
export function createAssistidoMessageSegments(): MessageSegment[] {
  return [
    {
      id: 'assistido-inicio',
      content: `Ótima escolha! Um de nossos especialistas irá auxiliá-lo durante todo o processo.`,
      type: 'text',
      delay: 1000
    },
    {
      id: 'preparacao-atendimento',
      content: `Vou transferir você para um atendente que irá te guiar passo a passo na criação da procuração e no processo completo de regularização.`,
      type: 'text',
      delay: 1500
    },
    {
      id: 'aguarde-atendente',
      content: `Por favor, aguarde alguns instantes enquanto um especialista se prepara para te atender.`,
      type: 'text',
      delay: 2000
    }
  ];
}

/**
 * Processa mensagens segmentadas enviando para o n8n (Gerenciador de Mensagens e Follow-up)
 * Substitui o processamento local que causava timeouts na Vercel
 */
export async function processMessageSegments(
  phone: string,
  segments: MessageSegment[], 
  // Mantendo assinatura antiga para compatibilidade parcial
  sendFunction?: (segment: MessageSegment) => Promise<void>,
  context: string = 'regularizacao-fiscal'
): Promise<void> {
  
  // Se temos telefone, usamos o novo fluxo do n8n
  if (phone) {
    try {
      console.log(`[MessageManager] Enviando ${segments.length} segmentos para n8n (Phone: ${phone}, Context: ${context})`);
      
      const n8nSegments = segments.map(s => ({
        content: s.content,
        type: s.type === 'link' ? 'text' : s.type, // n8n/evolution trata link como texto
        delay: s.delay,
        options: s.metadata
      }));

      await sendToN8nHandler({
        phone,
        messages: n8nSegments,
        context
      });
      return;
    } catch (error) {
      console.error('[MessageManager] Erro ao enviar para n8n, tentando fallback local:', error);
    }
  }

  // Fallback para processamento local (Legado ou Erro n8n)
  if (sendFunction) {
    console.warn('[MessageManager] Usando processamento local (Risco de Timeout)');
    for (const segment of segments) {
      if (segment.delay) {
        await new Promise(resolve => setTimeout(resolve, segment.delay));
      }
      await sendFunction(segment);
    }
  }
}

/**
 * Verifica se o cliente já concluiu o processo de procuração
 */
export async function checkProcuracaoStatus(leadId: number): Promise<boolean> {
  // Implementation will be added to server-tools.ts
  return false;
}

/**
 * Marca procuração como concluída
 */
export async function markProcuracaoCompleted(leadId: number): Promise<void> {
  // Implementation will be added to server-tools.ts
  console.log(`[Tracking] Procuração marcada como concluída para lead ${leadId}`);
}
