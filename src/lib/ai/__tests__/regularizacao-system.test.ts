/**
 * Testes Unitários para Sistema de Regularização Fiscal
 * Testa fluxo completo de mensagens segmentadas e tracking
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { 
  createRegularizacaoMessageSegments,
  createAutonomoMessageSegments,
  createAssistidoMessageSegments,
  processMessageSegments
} from '@/lib/ai/regularizacao-system';
import { 
  trackResourceDelivery,
  hasResourceBeenDelivered,
  checkProcuracaoStatus,
  markProcuracaoCompleted,
  sendMessageSegment
} from '@/lib/ai/tools/server-tools';

// Mock das funções de envio
jest.mock('@/lib/evolution', () => ({
  evolutionSendTextMessage: jest.fn().mockResolvedValue({ success: true }),
  evolutionSendMediaMessage: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('@/lib/utils', () => ({
  toWhatsAppJid: jest.fn((phone) => `${phone}@s.whatsapp.net`)
}));

// Mock do banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn()
}));

describe('Sistema de Regularização Fiscal', () => {
  
  describe('Criação de Mensagens Segmentadas', () => {
    
    it('deve criar mensagens de regularização corretamente', () => {
      const segments = createRegularizacaoMessageSegments();
      
      expect(segments).toHaveLength(4);
      expect(segments[0].id).toBe('intro-regularizacao');
      expect(segments[0].type).toBe('text');
      expect(segments[0].content).toContain('regularização fiscal');
      
      expect(segments[1].id).toBe('explicacao-dividas');
      expect(segments[1].content).toContain('PGMEI');
      expect(segments[1].content).toContain('Dívida Ativa da União');
      
      expect(segments[2].id).toBe('explicacao-procuracao');
      expect(segments[2].content).toContain('procuração cadastrada no e-CAC');
      
      expect(segments[3].id).toBe('oferecer-opcoes');
      expect(segments[3].content).toContain('duas opções');
    });
    
    it('deve criar mensagens de processo autônomo corretamente', () => {
      const segments = createAutonomoMessageSegments();
      
      expect(segments).toHaveLength(5);
      expect(segments[0].id).toBe('autonomo-inicio');
      expect(segments[1].id).toBe('link-ecac');
      expect(segments[1].metadata?.url).toBe('https://cav.receita.fazenda.gov.br/autenticacao/login');
      expect(segments[2].id).toBe('video-tutorial');
      expect(segments[3].id).toBe('video-media');
      expect(segments[4].id).toBe('instrucoes-finais');
    });
    
    it('deve criar mensagens de processo assistido corretamente', () => {
      const segments = createAssistidoMessageSegments();
      
      expect(segments).toHaveLength(3);
      expect(segments[0].id).toBe('assistido-inicio');
      expect(segments[1].id).toBe('preparacao-atendimento');
      expect(segments[2].id).toBe('aguarde-atendente');
    });
  });
  
  describe('Processamento de Mensagens', () => {
    
    it('deve processar mensagens segmentadas com delay', async () => {
      const mockSendFunction = jest.fn().mockResolvedValue(undefined);
      const segments = [
        { id: 'test1', content: 'Mensagem 1', type: 'text' as const, delay: 100 },
        { id: 'test2', content: 'Mensagem 2', type: 'text' as const }
      ];
      
      const startTime = Date.now();
      await processMessageSegments('5511999999999', segments, mockSendFunction);
      const endTime = Date.now();
      
      expect(mockSendFunction).toHaveBeenCalledTimes(2);
      expect(mockSendFunction).toHaveBeenCalledWith(segments[0]);
      expect(mockSendFunction).toHaveBeenCalledWith(segments[1]);
      
      // Verifica se o delay foi aplicado (deve ter demorado pelo menos 100ms)
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
    
    it('deve enviar mensagem de texto corretamente', async () => {
      const { evolutionSendTextMessage } = require('@/lib/evolution');
      
      const segment = {
        id: 'test-text',
        content: 'Teste de mensagem',
        type: 'text' as const
      };
      
      await sendMessageSegment('5511999999999', segment);
      
      expect(evolutionSendTextMessage).toHaveBeenCalledWith(
        '5511999999999@s.whatsapp.net',
        'Teste de mensagem'
      );
    });
    
    it('deve enviar link corretamente', async () => {
      const { evolutionSendTextMessage } = require('@/lib/evolution');
      
      const segment = {
        id: 'test-link',
        content: 'Acesse este link:',
        type: 'link' as const,
        metadata: { url: 'https://example.com' }
      };
      
      await sendMessageSegment('5511999999999', segment);
      
      expect(evolutionSendTextMessage).toHaveBeenCalledTimes(2);
      expect(evolutionSendTextMessage).toHaveBeenCalledWith(
        '5511999999999@s.whatsapp.net',
        'Acesse este link:'
      );
      expect(evolutionSendTextMessage).toHaveBeenCalledWith(
        '5511999999999@s.whatsapp.net',
        'https://example.com'
      );
    });
  });
  
  describe('Sistema de Tracking', () => {
    
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    it('deve rastrear entrega de recurso', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
      const mockPool = { connect: jest.fn(() => ({ query: mockQuery, release: jest.fn() })) };
      jest.doMock('@/lib/db', () => mockPool);
      
      await trackResourceDelivery(123, 'video-tutorial', 'video-test', { test: 'data' });
      
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO resource_tracking'),
        [123, 'video-tutorial', 'video-test', JSON.stringify({ test: 'data' })]
      );
    });
    
    it('deve verificar se recurso foi entregue', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rows: [{ count: '1' }] });
      const mockPool = { connect: jest.fn(() => ({ query: mockQuery, release: jest.fn() })) };
      jest.doMock('@/lib/db', () => mockPool);
      
      const result = await hasResourceBeenDelivered(123, 'video-tutorial', 'video-test');
      
      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)'),
        [123, 'video-tutorial', 'video-test']
      );
    });
    
    it('deve verificar status da procuração', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ 
        rows: [{ status: 'completed' }] 
      });
      const mockPool = { connect: jest.fn(() => ({ query: mockQuery, release: jest.fn() })) };
      jest.doMock('@/lib/db', () => mockPool);
      
      const result = await checkProcuracaoStatus(123);
      
      expect(result).toBe(true);
    });
    
    it('deve marcar procuração como concluída', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
      const mockPool = { connect: jest.fn(() => ({ query: mockQuery, release: jest.fn() })) };
      jest.doMock('@/lib/db', () => mockPool);
      
      await markProcuracaoCompleted(123);
      
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE resource_tracking'),
        [123]
      );
    });
  });
  
  describe('Integração com n8n', () => {
    
    it('deve criar payload correto para n8n', () => {
      const segments = createRegularizacaoMessageSegments();
      const payload = {
        phone: '5511999999999',
        leadId: 123,
        segments: segments.map(s => ({
          ...s,
          metadata: {
            ...s.metadata,
            trackingKey: s.id
          }
        }))
      };
      
      expect(payload.phone).toBe('5511999999999');
      expect(payload.leadId).toBe(123);
      expect(payload.segments).toHaveLength(4);
      expect(payload.segments[0].metadata?.trackingKey).toBe('intro-regularizacao');
    });
  });
  
  describe('Fluxo Completo de Regularização', () => {
    
    it('deve executar fluxo autônomo completo', async () => {
      const mockSendFunction = jest.fn().mockResolvedValue(undefined);
      
      // Passo 1: Mensagens de introdução
      const introSegments = createRegularizacaoMessageSegments();
      await processMessageSegments('5511999999999', introSegments, mockSendFunction);
      
      expect(mockSendFunction).toHaveBeenCalledTimes(4);
      
      // Passo 2: Processo autônomo
      const autonomoSegments = createAutonomoMessageSegments();
      await processMessageSegments('5511999999999', autonomoSegments, mockSendFunction);
      
      expect(mockSendFunction).toHaveBeenCalledTimes(9); // 4 + 5
      
      // Verifica conteúdo das mensagens
      const allCalls = mockSendFunction.mock.calls;
      expect(allCalls[0][1].content).toContain('regularização fiscal');
      expect(allCalls[4][1].metadata?.url).toBe('https://cav.receita.fazenda.gov.br/autenticacao/login');
    });
    
    it('deve executar fluxo assistido completo', async () => {
      const mockSendFunction = jest.fn().mockResolvedValue(undefined);
      
      // Passo 1: Mensagens de introdução
      const introSegments = createRegularizacaoMessageSegments();
      await processMessageSegments('5511999999999', introSegments, mockSendFunction);
      
      // Passo 2: Processo assistido
      const assistidoSegments = createAssistidoMessageSegments();
      await processMessageSegments('5511999999999', assistidoSegments, mockSendFunction);
      
      expect(mockSendFunction).toHaveBeenCalledTimes(7); // 4 + 3
      
      // Verifica conteúdo das mensagens
      const allCalls = mockSendFunction.mock.calls;
      expect(allCalls[5][1].content).toContain('especialistas irá auxiliá-lo');
      expect(allCalls[6][1].content).toContain('aguarde alguns instantes');
    });
  });
});

export {};