'use server'

import { revalidatePath } from 'next/cache';
import { backendPost, backendPut } from '@/lib/backend-proxy';

export async function deleteLead(telefone: string) {
  try {
    const res = await backendPost('/api/leads/delete', { telefone });
    const data = await res.json();
    if (data.success) revalidatePath('');
    return data;
  } catch (error) {
    console.error('Error deleting lead:', error);
    return { success: false, message: 'Erro ao excluir lead' };
  }
}

export async function updateLeadFields(telefone: string, updates: Record<string, unknown>) {
  try {
    const res = await backendPut('/api/leads/update-fields', { telefone, updates });
    const data = await res.json();
    if (data.success) {
      revalidatePath('/lista');
      revalidatePath('/(admin)/lista', 'page');
    }
    return data;
  } catch (error) {
    console.error('Error updating lead fields:', error);
    return { success: false, message: 'Erro ao atualizar ficha' };
  }
}
