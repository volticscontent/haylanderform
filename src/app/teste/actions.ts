'use server';

import { backendPost, backendGet, backendPut } from '@/lib/backend-proxy';

export async function sendMessageAction(message: string, userPhone: string, targetAgent?: string) {
  try {
    const res = await backendGet(`/api/leads/user/${encodeURIComponent(userPhone)}`);
    let userState: 'lead' | 'qualified' | 'customer' = 'lead';
    let agentName = 'Apolo (SDR)';

    if (res.ok) {
      const user = await res.json() as Record<string, unknown>;
      if (user.situacao === 'cliente') userState = 'customer';
      else if (user.qualificacao) userState = 'qualified';
    } else {
      await backendPost('/api/leads/update-fields', {
        telefone: userPhone,
        updates: { nome_completo: 'Test User', situacao: 'aguardando_qualificação' },
      });
    }

    const forced = targetAgent && targetAgent !== 'auto' ? targetAgent.toLowerCase() : null;
    const state = forced || userState;
    if (state === 'vendedor' || state === 'qualified') agentName = 'Vendedor (Icaro)';
    else if (state === 'atendente' || state === 'customer') agentName = 'Atendente (Apolo Customer)';

    await new Promise((r) => setTimeout(r, 1000));
    return {
      response: `[Agente ${agentName}] Esta é uma simulação offline. Mensagem recebida: "${message}"`,
      agent: agentName,
      userState,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getUserDataAction(phone: string) {
  try {
    const res = await backendGet(`/api/leads/user/${encodeURIComponent(phone)}`);
    if (!res.ok) return JSON.stringify({ status: 'not_found' });
    const data = await res.json();
    return JSON.stringify(data);
  } catch {
    return JSON.stringify({ status: 'error' });
  }
}

export async function updateUserDataAction(data: Record<string, unknown>) {
  try {
    const { telefone, ...updates } = data;
    const res = await backendPut('/api/leads/update-fields', { telefone, updates });
    return res.json();
  } catch {
    return JSON.stringify({ status: 'error' });
  }
}
