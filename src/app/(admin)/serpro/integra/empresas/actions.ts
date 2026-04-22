'use server';

import { revalidatePath } from 'next/cache';
import { backendGet, backendPost, backendPut, backendDelete } from '@/lib/backend-proxy';

export type LeadParaImportar = {
  id: number;
  nome_completo: string;
  cnpj: string;
  email: string | null;
  telefone: string | null;
  procuracao_ativa: boolean;
};

export type IntegraEmpresa = {
  id: number;
  cnpj: string;
  razao_social: string;
  regime_tributario: string;
  ativo: boolean;
  servicos_habilitados: string[];
  lead_id: number | null;
  certificado_validade: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listarEmpresas(): Promise<IntegraEmpresa[]> {
  const res = await backendGet('/api/integra/empresas');
  if (!res.ok) return [];
  return res.json();
}

export async function criarEmpresa(data: {
  cnpj: string;
  razao_social: string;
  regime_tributario?: string;
  servicos_habilitados?: string[];
  lead_id?: number;
  certificado_validade?: string;
  observacoes?: string;
}) {
  const res = await backendPost('/api/integra/empresas', data);
  const body = await res.json();
  if (res.ok) revalidatePath('/(admin)/serpro/integra/empresas', 'page');
  return { ok: res.ok, data: body };
}

export async function atualizarEmpresa(id: number, updates: Partial<IntegraEmpresa>) {
  const res = await fetch(
    `${process.env.BOT_BACKEND_URL || 'http://127.0.0.1:3001'}/api/integra/empresas/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.BOT_BACKEND_SECRET ? { 'x-api-key': process.env.BOT_BACKEND_SECRET } : {}),
      },
      body: JSON.stringify(updates),
    }
  );
  const body = await res.json();
  if (res.ok) revalidatePath('/(admin)/serpro/integra/empresas', 'page');
  return { ok: res.ok, data: body };
}

export async function excluirEmpresa(id: number) {
  const res = await fetch(
    `${process.env.BOT_BACKEND_URL || 'http://127.0.0.1:3001'}/api/integra/empresas/${id}`,
    {
      method: 'DELETE',
      headers: process.env.BOT_BACKEND_SECRET ? { 'x-api-key': process.env.BOT_BACKEND_SECRET } : {},
    }
  );
  if (res.ok) revalidatePath('/(admin)/serpro/integra/empresas', 'page');
  return { ok: res.ok };
}

export async function toggleAtivo(id: number, ativo: boolean) {
  return atualizarEmpresa(id, { ativo });
}

export async function listarLeadsParaImportar(): Promise<LeadParaImportar[]> {
  const res = await backendGet('/api/integra/leads-para-importar');
  if (!res.ok) return [];
  return res.json();
}

export async function importarLeadComoEmpresa(lead: LeadParaImportar) {
  return criarEmpresa({
    cnpj: lead.cnpj,
    razao_social: lead.nome_completo,
    regime_tributario: 'mei',
    lead_id: lead.id,
  });
}
