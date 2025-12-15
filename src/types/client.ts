export interface SerproClient {
  id?: string | number
  nome: string
  cnpj: string
  data_ultima_consulta: string | Date | null
  procuracao_ativa: boolean
  procuracao_validade?: string | Date | null
}
