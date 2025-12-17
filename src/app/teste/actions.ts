'use server';

import { runApoloAgent } from '@/lib/ai/agents/apolo';
import { runVendedorAgent } from '@/lib/ai/agents/vendedor';
import { runAtendenteAgent } from '@/lib/ai/agents/atendente';
import { getUser, updateUser } from '@/lib/ai/tools/server-tools';
import { AgentContext } from '@/lib/ai/types';

export async function sendMessageAction(message: string, userPhone: string) {
  try {
    const sender = `${userPhone}@s.whatsapp.net`;
    const pushName = 'Test User';

    console.log(`[Test Chat] Mensagem de ${userPhone}: ${message}`);

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
      console.log('[Test Chat] Novo usuário detectado. Criando registro...');
      await updateUser({ telefone: userPhone, nome_completo: pushName, situacao: 'aguardando_qualificação' });
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
      history: [] 
    };

    let responseText = '';
    let agentName = '';

    // 2. Despachar para o Agente Correto
    switch (userState) {
      case 'qualified':
        agentName = 'Vendedor (Icaro)';
        console.log(`[Test Chat] Direcionando para ${agentName}`);
        responseText = await runVendedorAgent(message, context);
        break;
      case 'customer':
        agentName = 'Atendente (Apolo Customer)';
        console.log(`[Test Chat] Direcionando para ${agentName}`);
        responseText = await runAtendenteAgent(message, context);
        break;
      case 'lead':
      default:
        agentName = 'Apolo (SDR)';
        console.log(`[Test Chat] Direcionando para ${agentName}`);
        responseText = await runApoloAgent(message, context);
        break;
    }

    return { 
      response: responseText, 
      agent: agentName,
      userState 
    };

  } catch (error: unknown) {
    console.error('Erro no Test Chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage };
  }
}
