export interface SerproClient {
  id?: string | number
  nome: string
  cnpj: string
  telefone?: string | null
  email?: string | null
  data_ultima_consulta: string | Date | null
  procuracao_ativa: boolean
  procuracao_validade?: string | Date | null
}
