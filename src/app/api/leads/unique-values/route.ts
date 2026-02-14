import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const column = searchParams.get('column')

  if (!column) {
    return NextResponse.json({ error: 'Column parameter is required' }, { status: 400 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL })

  try {
    await client.connect()

    const columnTableMap: Record<string, string> = {
      // leads (core)
      'telefone': 'leads', 'nome_completo': 'leads', 'email': 'leads', 'atualizado_em': 'leads', 'data_cadastro': 'leads',
      
      // leads_empresarial
      'cnpj': 'leads_empresarial', 'razao_social': 'leads_empresarial', 'tipo_negocio': 'leads_empresarial', 'faturamento_mensal': 'leads_empresarial', 'cartao_cnpj': 'leads_empresarial',
      
      // leads_qualificacao
      'situacao': 'leads_qualificacao', 'qualificacao': 'leads_qualificacao', 'motivo_qualificacao': 'leads_qualificacao', 'interesse_ajuda': 'leads_qualificacao', 'pos_qualificacao': 'leads_qualificacao', 'possui_socio': 'leads_qualificacao',
      
      // leads_financeiro
      'calculo_parcelamento': 'leads_financeiro', 'valor_divida_ativa': 'leads_financeiro', 'valor_divida_municipal': 'leads_financeiro', 'valor_divida_estadual': 'leads_financeiro', 'valor_divida_federal': 'leads_financeiro', 'tipo_divida': 'leads_financeiro',
      
      // leads_vendas
      'servico_negociado': 'leads_vendas', 'procuracao': 'leads_vendas', 'data_reuniao': 'leads_vendas', 'status_atendimento': 'leads_vendas',
      
      // leads_atendimento
      'observacoes': 'leads_atendimento', 'data_controle_24h': 'leads_atendimento', 'envio_disparo': 'leads_atendimento', 'data_ultima_consulta': 'leads_atendimento',

      // Legacy/Aliases
      'teria_interesse': 'leads_qualificacao', // -> interesse_ajuda
      'servico_escolhido': 'leads_vendas', // -> servico_negociado
      'reuniao_agendada': 'leads_vendas', // -> ? (assuming mapped or ignored)
      'vendido': 'leads_vendas', // -> ?
      'confirmacao_qualificacao': 'leads_qualificacao' // -> ?
    }

    const columnRealNameMap: Record<string, string> = {
        'teria_interesse': 'interesse_ajuda',
        'servico_escolhido': 'servico_negociado'
    }

    const tableName = columnTableMap[column]
    if (!tableName) {
        // If column is not mapped, assume it's in leads if it's a valid column, otherwise return empty
        // For safety, let's stick to mapped columns or default to leads but be careful
        // Returning empty array for unknown columns is safer
        return NextResponse.json({ values: [] })
    }

    const realColumnName = columnRealNameMap[column] || column
    
    // Safety check for column name to prevent SQL injection (basic alphanumeric)
    if (!/^[a-zA-Z0-9_]+$/.test(realColumnName)) {
        return NextResponse.json({ error: 'Invalid column name' }, { status: 400 })
    }

    const query = `
        SELECT DISTINCT ${realColumnName} as value 
        FROM ${tableName} 
        WHERE ${realColumnName} IS NOT NULL 
        ORDER BY ${realColumnName} ASC
        LIMIT 1000
    `

    const res = await client.query(query)
    const values = res.rows.map(r => r.value).filter(v => v !== null && v !== '')

    return NextResponse.json({ values })
  } catch (error) {
    console.error('Error fetching unique values:', error)
    return NextResponse.json({ error: 'Failed to fetch values' }, { status: 500 })
  } finally {
    await client.end()
  }
}
