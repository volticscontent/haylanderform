// Derivações puras sobre o histórico de consultas (consultas_serpro).
// Mantém a lógica fora dos componentes para legibilidade e teste isolado.

export interface Consultation {
  id: number;
  tipo_servico: string;
  resultado: unknown;
  status: number;
  source: string;
  created_at: string;
}

export interface Empresa {
  id: number | null;
  cnpj: string;
  razao_social: string | null;
  regime_tributario: string | null;
  ativo: boolean;
  servicos_habilitados: string[];
  certificado_validade: string | null;
  fonte: 'cadastro' | 'fallback';
  // Campos fiscais por empresa (integra_empresas) — null quando não preenchidos ainda
  procuracao_ativa?: boolean | null;
  procuracao_validade?: string | null;
  tem_divida?: boolean | null;
  valor_divida_pgfn?: number | null;
}

export interface ClienteEmpresas {
  lead: { id: number; nome: string } | null;
  procuracao_ativa: boolean;
  procuracao_validade: string | null;
  empresas: Empresa[];
}

export type ValidationStatus = 'validada' | 'sem_procuracao' | 'erro' | 'nunca';

// Rótulos amigáveis por serviço. PGFN e PGFN_API são o mesmo serviço (Dívida Ativa).
const SERVICE_LABELS: Record<string, string> = {
  PGMEI: 'PGMEI (DAS-MEI)',
  PGMEI_EXTRATO: 'Extrato PGMEI',
  PGMEI_BOLETO: 'Boleto PGMEI',
  CCMEI_DADOS: 'Dados CCMEI',
  PGDASD: 'PGDAS-D (Simples)',
  DEFIS: 'DEFIS',
  PARCELAMENTO_SN_CONSULTAR: 'Parcelamento SN',
  CND: 'Certidão (CND)',
  CAIXAPOSTAL: 'Caixa Postal',
  CAIXA_POSTAL: 'Caixa Postal',
  DCTFWEB: 'DCTFWeb',
  SICALC: 'SICALC',
  SITFIS: 'Situação Fiscal',
  SIT_FISCAL_RELATORIO: 'Relatório Sit. Fiscal',
  PGFN_API: 'Dívida Ativa (PGFN)',
  PGFN: 'Dívida Ativa (PGFN)',
  PROCURACAO: 'Procuração e-CAC',
  CNPJ_API: 'Dados do CNPJ',
};

/** Consolida variações que representam o mesmo serviço sob uma única chave. */
export function normalizeService(service: string): string {
  if (service === 'PGFN') return 'PGFN_API';
  if (service === 'CAIXA_POSTAL') return 'CAIXAPOSTAL';
  return service;
}

export function serviceLabel(service: string): string {
  return SERVICE_LABELS[service] ?? SERVICE_LABELS[normalizeService(service)] ?? service;
}

/** Marcação de erro embutido no payload (procuração negada pelo e-CAC). */
function isProcuracaoAusente(resultado: unknown): boolean {
  if (!resultado || typeof resultado !== 'object') return false;
  const r = resultado as Record<string, unknown>;
  if (r.error_type === 'procuracao_ausente') return true;
  const text = JSON.stringify(resultado);
  return /40011|AUT-403|AutorizacaoNegada/.test(text);
}

/** Marcação de payload de erro genérico. */
function isErrorPayload(resultado: unknown): boolean {
  if (!resultado || typeof resultado !== 'object') return false;
  return (resultado as Record<string, unknown>).status === 'error';
}

/** Classifica uma consulta como API funcional/validada para a empresa. */
export function validationFromConsultation(c: Consultation | undefined): ValidationStatus {
  if (!c) return 'nunca';
  if (isProcuracaoAusente(c.resultado)) return 'sem_procuracao';
  if (c.status >= 400 || isErrorPayload(c.resultado)) return 'erro';
  if (c.status >= 200 && c.status < 300) return 'validada';
  return 'erro';
}

/** Última consulta de cada serviço (consolidado), mais recente primeiro. */
export function latestByService(history: Consultation[]): Consultation[] {
  const map = new Map<string, Consultation>();
  for (const c of history) {
    const key = normalizeService(c.tipo_servico);
    const prev = map.get(key);
    if (!prev || new Date(c.created_at) > new Date(prev.created_at)) {
      map.set(key, c);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/** Dias restantes até uma data (negativo = vencido). null se data ausente. */
export function daysUntil(date: string | null, now: number): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - now) / 86_400_000);
}

/** Conjunto de serviços a exibir na aba "APIs funcionais": habilitados + já consultados. */
export function servicesForEmpresa(empresa: Empresa, history: Consultation[]): string[] {
  const set = new Set<string>();
  for (const s of empresa.servicos_habilitados ?? []) set.add(normalizeService(s));
  for (const c of history) set.add(normalizeService(c.tipo_servico));
  return Array.from(set).sort((a, b) => serviceLabel(a).localeCompare(serviceLabel(b)));
}
