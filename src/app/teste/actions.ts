'use server';

import { getUser, updateUser } from '@/lib/server-tools';

export async function sendMessageAction(message: string, userPhone: string, targetAgent?: string) {
  try {
    const sender = `${userPhone}@s.whatsapp.net`;
    const pushName = 'Test User';

    console.log(`[Test Chat] Mensagem de ${userPhone}: ${message} (Target: ${targetAgent || 'Auto'})`);

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
      } else if (user.qualificacao) {
        userState = 'qualified';
      } else {
        userState = 'lead';
      }
    }

    let responseText = '[Erro de Simulação] A lógica de IA foi movida para o servidor "bot-backend", impedindo simulação realista neste painel offline.';
    let agentName = 'Sistema';

    // 2. Despachar para o Agente Correto (Ou Forçado)
    if (targetAgent && targetAgent !== 'auto') {
      switch (targetAgent.toLowerCase()) {
        case 'vendedor':
          agentName = 'Vendedor (Icaro)';
          break;
        case 'atendente':
          agentName = 'Atendente (Apolo Customer)';
          break;
        case 'apolo':
        default:
          agentName = 'Apolo (SDR)';
          break;
      }
    } else {
      switch (userState) {
        case 'qualified':
          agentName = 'Vendedor (Icaro)';
          break;
        case 'customer':
          agentName = 'Atendente (Apolo Customer)';
          break;
        case 'lead':
        default:
          agentName = 'Apolo (SDR)';
          break;
      }
    }

    // Simulando delay de api
    await new Promise(r => setTimeout(r, 1000));

    return {
      response: `[Agente ${agentName}] Esta é uma simulação offline. O Motor de IA real está rodando no bot-backend. Mensagem recebida: "${message}"`,
      agent: agentName,
      userState
    };

  } catch (error: unknown) {
    console.error('Erro no Test Chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { error: errorMessage };
  }
}

export async function getUserDataAction(phone: string) {
  return await getUser(phone);
}

export async function updateUserDataAction(data: Parameters<typeof updateUser>[0]) {
  return await updateUser(data);
}
