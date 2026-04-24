export type LeadRecord = {
  id: number
  telefone: string | null
  nome_completo: string | null
  razao_social: string | null
  cnpj: string | null
  email: string | null
  observacoes: string | null
  calculo_parcelamento: string | null
  atualizado_em: string | Date | null
  data_cadastro: string | Date | null
  data_controle_24h: string | null
  envio_disparo: string | null
  situacao: string | null
  qualificacao: string | null
  motivo_qualificacao: string | null
  interesse_ajuda: string | null
  valor_divida_ativa: string | null
  valor_divida_municipal: string | null
  valor_divida_estadual: string | null
  valor_divida_federal: string | null
  tipo_divida: string | null
  tipo_negocio: string | null
  faturamento_mensal: string | null
  possui_socio: boolean | null
  pos_qualificacao: boolean | null
  servico: string | null
  status_atendimento: string | null
  procuracao: boolean | null
  data_reuniao: string | null
  needs_attendant: boolean | null
  attendant_requested_at: string | null
  reuniao_agendada: boolean | null
  cliente: boolean | null
  confirmacao_qualificacao: boolean | null
  metadata: Record<string, unknown> | null
}
