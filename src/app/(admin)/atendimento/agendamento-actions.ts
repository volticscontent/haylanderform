'use server';

import { backendGet, backendPost } from '@/lib/backend-proxy';

export interface SchedulingLead {
  id: number;
  nome_completo: string | null;
  telefone: string;
  cnpj: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
}

export async function searchLeadsForScheduling(term: string): Promise<{ success: boolean; data?: SchedulingLead[]; error?: string }> {
  if (!term || term.length < 3) return { success: true, data: [] };
  try {
    const params = new URLSearchParams({ term });
    const res = await backendGet('/api/atendimento/leads/search', params);
    return res.json();
  } catch {
    return { success: false, error: 'Erro ao buscar clientes.' };
  }
}

export async function sendSchedulingLink(phone: string, link: string): Promise<{ success: boolean; error?: string }> {
  if (!phone) return { success: false, error: 'Telefone não fornecido.' };
  try {
    const res = await backendPost('/api/atendimento/scheduling/send-link', { phone, link });
    return res.json();
  } catch {
    return { success: false, error: 'Erro ao enviar mensagem.' };
  }
}
