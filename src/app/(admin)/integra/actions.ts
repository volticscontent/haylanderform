'use server';

import { backendGet, backendPost } from '@/lib/backend-proxy';
import { revalidatePath } from 'next/cache';

// ---- Types ----

export type IntegraRobo = {
  tipo_robo: string;
  ativo: boolean;
  dia_execucao: number;
  hora_execucao: string;
  ultima_execucao: string | null;
  proxima_execucao: string | null;
  ult_status: string | null;
  ult_sucesso: number | null;
  ult_falhas: number | null;
  ult_total: number | null;
  ult_inicio: string | null;
  ult_fim: string | null;
};

export type IntegraGuia = {
  id: number;
  empresa_id: number;
  cnpj: string;
  razao_social: string;
  tipo: string;
  competencia: string | null;
  valor: string | null;
  vencimento: string | null;
  status_pagamento: string;
  codigo_barras: string | null;
  pdf_r2_key: string | null;
  created_at: string;
};

export type CaixaPostalMsg = {
  id: number;
  empresa_id: number;
  cnpj: string;
  razao_social: string;
  assunto: string | null;
  conteudo: string | null;
  data_mensagem: string | null;
  lida: boolean;
  created_at: string;
};

export type DashboardSummary = {
  empresas: { ativas: string; inativas: string; total: string };
  guias: { geradas_mes: string; pendentes: string; vencidas: string; pagas_mes: string };
  robos: IntegraRobo[];
  certificados_vencendo: { id: number; cnpj: string; razao_social: string; certificado_validade: string }[];
  historico_recente: { robo_tipo: string; status: string; iniciado_em: string; concluido_em: string | null; sucesso: number; falhas: number }[];
};

// ---- Dashboard ----

export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  const res = await backendGet('/api/integra/dashboard/summary');
  if (!res.ok) return null;
  return res.json();
}

// ---- Robôs ----

export async function listarRobos(): Promise<IntegraRobo[]> {
  const res = await backendGet('/api/integra/robos');
  if (!res.ok) return [];
  return res.json();
}

export async function executarRobo(tipo: string) {
  const res = await backendPost(`/api/integra/robos/${tipo}/executar`, {});
  revalidatePath('/(admin)/integra/robos', 'page');
  return { ok: res.ok, data: await res.json() };
}

export async function atualizarRobo(tipo: string, updates: { ativo?: boolean; dia_execucao?: number; hora_execucao?: string }) {
  const BASE = process.env.BOT_BACKEND_URL || 'http://127.0.0.1:3001';
  const res = await fetch(`${BASE}/api/integra/robos/${tipo}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.BOT_BACKEND_SECRET ? { 'x-api-key': process.env.BOT_BACKEND_SECRET } : {}),
    },
    body: JSON.stringify(updates),
  });
  revalidatePath('/(admin)/integra/robos', 'page');
  return { ok: res.ok, data: await res.json() };
}

// ---- Guias ----

export async function listarGuias(params?: { empresa_id?: number; competencia?: string; tipo?: string; status?: string }): Promise<IntegraGuia[]> {
  const qs = new URLSearchParams();
  if (params?.empresa_id) qs.set('empresa_id', String(params.empresa_id));
  if (params?.competencia) qs.set('competencia', params.competencia);
  if (params?.tipo) qs.set('tipo', params.tipo);
  if (params?.status) qs.set('status', params.status);
  const res = await backendGet(`/api/integra/guias?${qs}`);
  if (!res.ok) return [];
  return res.json();
}

// ---- Caixa Postal ----

export async function listarCaixaPostal(params?: { empresa_id?: number; lida?: boolean }): Promise<CaixaPostalMsg[]> {
  const qs = new URLSearchParams();
  if (params?.empresa_id) qs.set('empresa_id', String(params.empresa_id));
  if (params?.lida !== undefined) qs.set('lida', String(params.lida));
  const res = await backendGet(`/api/integra/caixa-postal?${qs}`);
  if (!res.ok) return [];
  return res.json();
}

export async function marcarLida(id: number) {
  const BASE = process.env.BOT_BACKEND_URL || 'http://127.0.0.1:3001';
  const res = await fetch(`${BASE}/api/integra/caixa-postal/${id}/lida`, {
    method: 'PATCH',
    headers: process.env.BOT_BACKEND_SECRET ? { 'x-api-key': process.env.BOT_BACKEND_SECRET } : {},
  });
  revalidatePath('/(admin)/integra/caixa-postal', 'page');
  return { ok: res.ok };
}

export async function sincronizarCaixaPostal() {
  const res = await backendPost('/api/integra/caixa-postal/sincronizar', {});
  return { ok: res.ok, data: await res.json() };
}

// ---- Guias extras ----

export async function getGuiaDownloadUrl(id: number): Promise<string | null> {
  const res = await backendGet(`/api/integra/guias/${id}/download`);
  if (!res.ok) return null;
  const data = await res.json();
  return (data as any).url ?? null;
}

export async function gerarGuia(empresa_id: number, tipo_robo = 'pgmei') {
  const res = await backendPost('/api/integra/guias/gerar', { empresa_id, tipo_robo });
  return { ok: res.ok, data: await res.json() };
}

// ---- Billing ----

export type BillingDetalhe = {
  empresa_id: number;
  cnpj: string;
  razao_social: string;
  robo_tipo: string;
  consultas: string;
  preco_unitario: string | null;
  custo_total: string;
};

export type BillingData = {
  mes: string;
  totais: { total_consultas: string; custo_total: string };
  detalhe: BillingDetalhe[];
  precos: { tipo_robo: string; preco_unitario: string; descricao: string | null }[];
};

export async function getBilling(mes?: string): Promise<BillingData | null> {
  const qs = mes ? `?mes=${mes}` : '';
  const res = await backendGet(`/api/integra/billing${qs}`);
  if (!res.ok) return null;
  return res.json();
}

export async function atualizarPreco(tipo_robo: string, preco_unitario: number) {
  const BASE = process.env.BOT_BACKEND_URL || 'http://127.0.0.1:3001';
  const res = await fetch(`${BASE}/api/integra/billing/precos/${tipo_robo}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.BOT_BACKEND_SECRET ? { 'x-api-key': process.env.BOT_BACKEND_SECRET } : {}),
    },
    body: JSON.stringify({ preco_unitario }),
  });
  revalidatePath('/(admin)/integra/billing', 'page');
  return { ok: res.ok, data: await res.json() };
}
