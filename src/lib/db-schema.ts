
export interface LeadsTable {
  id: number;
  telefone: string;
  nome_completo: string | null;
  email: string | null;
  data_cadastro: Date | null;
  atualizado_em: Date | null;
}

export interface LeadsEmpresarialTable {
  id: number;
  lead_id: number;
  cnpj: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  tipo_negocio: string | null;
  faturamento_mensal: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  dados_serpro: Record<string, unknown> | null; // JSONB
  cartao_cnpj: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface LeadsQualificacaoTable {
  id: number;
  lead_id: number;
  situacao: 'nao_respondido' | 'desqualificado' | 'qualificado' | 'cliente' | null;
  qualificacao: 'MQL' | 'ICP' | 'SQL' | null;
  motivo_qualificacao: string | null;
  interesse_ajuda: string | null;
  pos_qualificacao: boolean | null;
  possui_socio: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface LeadsFinanceiroTable {
  id: number;
  lead_id: number;
  tem_divida: boolean | null;
  tipo_divida: string | null;
  valor_divida_municipal: number | null;
  valor_divida_estadual: number | null;
  valor_divida_federal: number | null;
  valor_divida_ativa: number | null;
  tempo_divida: string | null;
  calculo_parcelamento: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface LeadsVendasTable {
  id: number;
  lead_id: number;
  servico_negociado: string | null;
  status_atendimento: string | null;
  data_reuniao: Date | null;
  procuracao: boolean | null;
  procuracao_ativa: boolean | null;
  procuracao_validade: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface LeadsAtendimentoTable {
  id: number;
  lead_id: number;
  atendente_id: string | null;
  envio_disparo: string | null;
  data_controle_24h: Date | null;
  data_ultima_consulta: Date | null;
  observacoes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

// Aggregated type for Admin Dashboard (Joined view)
export interface LeadComplete extends LeadsTable {
  // From leads_empresarial
  cnpj?: string | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  tipo_negocio?: string | null;
  faturamento_mensal?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  dados_serpro: Record<string, unknown> | null;
  cartao_cnpj?: string | null;

  // From leads_qualificacao
  situacao?: 'nao_respondido' | 'desqualificado' | 'qualificado' | 'cliente' | null;
  qualificacao?: 'MQL' | 'ICP' | 'SQL' | null;
  motivo_qualificacao?: string | null;
  interesse_ajuda?: string | null;
  pos_qualificacao?: boolean | null;
  possui_socio?: boolean | null;

  // From leads_financeiro
  tem_divida?: boolean | null;
  tipo_divida?: string | null;
  valor_divida_municipal?: number | null;
  valor_divida_estadual?: number | null;
  valor_divida_federal?: number | null;
  valor_divida_ativa?: number | null;
  tempo_divida?: string | null;
  calculo_parcelamento?: string | null;

  // From leads_vendas
  servico_negociado?: string | null;
  status_atendimento?: string | null;
  data_reuniao?: Date | null;
  procuracao?: boolean | null;
  procuracao_ativa?: boolean | null;
  procuracao_validade?: Date | null;

  // From leads_atendimento
  atendente_id?: string | null;
  envio_disparo?: string | null;
  data_controle_24h?: Date | null;
  data_ultima_consulta?: Date | null;
  observacoes?: string | null;
  [key: string]: string | number | boolean | Date | Record<string, unknown> | null | undefined;
}

export interface DisparosTable {
  id: number;
  channel: string;
  instance_name: string | null;
  body: string;
  status: 'draft' | 'preview' | 'scheduled' | 'processing' | 'completed' | 'failed';
  schedule_at: Date | null;
  filters: Record<string, unknown> | null;
  stats: Record<string, unknown> | null;
  created_at: Date | null;
  updated_at: Date | null;
}
