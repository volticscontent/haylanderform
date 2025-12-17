import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 })
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()

    // Backward compatibility: if qualification is provided, use logic mapping to new table
    if (body.qualification) {
      const qualification: 'vazio' | 'Qualificado' | 'Desqualificado' = body.qualification
      if (!qualification) {
        await client.end()
        return NextResponse.json({ error: 'qualification é obrigatório' }, { status: 400 })
      }

      let sql = ''
      let params: string[] = []

      if (qualification === 'vazio') {
        sql = `
            DELETE FROM leads l
            USING leads_qualificacao lq
            WHERE l.id = lq.lead_id
            AND (lq.qualificacao IS NULL OR lq.qualificacao = '')
        `
      } else {
        sql = `
            DELETE FROM leads l
            USING leads_qualificacao lq
            WHERE l.id = lq.lead_id
            AND lq.qualificacao = $1
        `
        params = [qualification]
      }
      
      const res = await client.query(sql, params)
      await client.end()
      revalidatePath('/admin/lista')
      return NextResponse.json({ success: true, deleted: res.rowCount })
    }

    // New generic criteria logic
    const column: string | undefined = body.column
    const operator: 'in' | 'not_in' | 'is_empty' | 'is_not_empty' | undefined = body.operator
    const values: string[] = Array.isArray(body.values) ? body.values : []

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
      'servico_negociado': 'leads_vendas', 'procuracao': 'leads_vendas', 'data_reuniao': 'leads_vendas',
      
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

    if (!column || !operator) {
      await client.end()
      return NextResponse.json({ error: 'column e operator são obrigatórios' }, { status: 400 })
    }

    const whereTableName = columnTableMap[column] || 'leads'
    const whereColReal = columnRealNameMap[column] || column

    if ((operator === 'in' || operator === 'not_in') && values.length === 0) {
      await client.end()
      return NextResponse.json({ error: 'values é obrigatório para operadores in/not_in' }, { status: 400 })
    }

    let sql = ''
    let params: string[][] = []

    // Construct WHERE clause logic
    // We need to alias the joined table if it's not leads
    // If whereTableName == 'leads', alias is 'l' (or just leads)
    // If whereTableName != 'leads', alias is 't'
    
    let whereClause = ''
    const targetAlias = whereTableName === 'leads' ? 'l' : 't'
    const colRef = `${targetAlias}.${whereColReal}`

    switch (operator) {
      case 'in':
        whereClause = `${colRef}::text = ANY($1)`
        params = [values]
        break
      case 'not_in':
        whereClause = `NOT (${colRef}::text = ANY($1)) OR ${colRef} IS NULL`
        params = [values]
        break
      case 'is_empty':
        whereClause = `${colRef} IS NULL OR ${colRef}::text = ''`
        break
      case 'is_not_empty':
        whereClause = `${colRef} IS NOT NULL AND ${colRef}::text <> ''`
        break
    }

    if (whereTableName === 'leads') {
        sql = `DELETE FROM leads l WHERE ${whereClause}`
    } else {
        sql = `
            DELETE FROM leads l
            USING ${whereTableName} t
            WHERE l.id = t.lead_id
            AND ${whereClause}
        `
    }

    const res = await client.query(sql, params)
    await client.end()

    revalidatePath('/admin/lista')

    return NextResponse.json({ success: true, deleted: res.rowCount })
  } catch (error: unknown) {
    console.error('Bulk delete error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao deletar em massa'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
