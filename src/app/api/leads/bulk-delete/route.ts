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

    // Backward compatibility: if qualification is provided, use old logic
    if (body.qualification) {
      const qualification: 'vazio' | 'Qualificado' | 'Desqualificado' = body.qualification
      if (!qualification) {
        await client.end()
        return NextResponse.json({ error: 'qualification é obrigatório' }, { status: 400 })
      }

      let res
      if (qualification === 'vazio') {
        res = await client.query(`DELETE FROM haylander WHERE "qualificação" IS NULL OR "qualificação" = ''`)
      } else {
        res = await client.query('DELETE FROM haylander WHERE "qualificação" = $1', [qualification])
      }

      await client.end()
      revalidatePath('/admin/lista')
      return NextResponse.json({ success: true, deleted: res.rowCount })
    }

    // New generic criteria logic
    const column: string | undefined = body.column
    const operator: 'in' | 'not_in' | 'is_empty' | 'is_not_empty' | undefined = body.operator
    const values: string[] = Array.isArray(body.values) ? body.values : []

    const allowedColumns: Record<string, string> = {
      telefone: 'telefone',
      nome_completo: 'nome_completo',
      razao_social: 'razao_social',
      cnpj: 'cnpj',
      email: 'email',
      observacoes: 'observacoes',
      calculo_parcelamento: 'calculo_parcelamento',
      atualizado_em: 'atualizado_em',
      data_cadastro: 'data_cadastro',
      data_controle_24h: 'data_controle_24h',
      envio_disparo: 'envio_disparo',
      situacao: 'situacao',
      qualificacao: '"qualificação"',
      motivo_qualificacao: '"motivo_qualificação"',
      teria_interesse: '"teria_interesse?"',
      valor_divida_ativa: 'valor_divida_ativa',
      valor_divida_municipal: 'valor_divida_municipal',
      valor_divida_estadual: 'valor_divida_estadual',
      valor_divida_federal: 'valor_divida_federal',
      cartao_cnpj: '"cartão-cnpj"',
      tipo_divida: 'tipo_divida',
      tipo_negocio: '"tipo_negócio"',
      faturamento_mensal: 'faturamento_mensal',
      possui_socio: '"possui_sócio"',
      // Novas colunas do vendedor
      servico_escolhido: '"serviço_escolhido"',
      reuniao_agendada: '"reunião_agendada"',
      vendido: 'vendido',
      data_reuniao: '"data_reunião"',
      confirmacao_qualificacao: '"confirmação_qualificação"',
    }

    if (!column || !operator) {
      await client.end()
      return NextResponse.json({ error: 'column e operator são obrigatórios' }, { status: 400 })
    }

    const dbCol = allowedColumns[column]
    if (!dbCol) {
      await client.end()
      return NextResponse.json({ error: 'Coluna não permitida' }, { status: 400 })
    }

    if ((operator === 'in' || operator === 'not_in') && values.length === 0) {
      await client.end()
      return NextResponse.json({ error: 'values é obrigatório para operadores in/not_in' }, { status: 400 })
    }

    let sql = ''
    let params: string[][] = []

    switch (operator) {
      case 'in':
        sql = `DELETE FROM haylander WHERE ${dbCol}::text = ANY($1)`
        params = [values]
        break
      case 'not_in':
        sql = `DELETE FROM haylander WHERE NOT (${dbCol}::text = ANY($1)) OR ${dbCol} IS NULL`
        params = [values]
        break
      case 'is_empty':
        sql = `DELETE FROM haylander WHERE ${dbCol} IS NULL OR ${dbCol}::text = ''`
        break
      case 'is_not_empty':
        sql = `DELETE FROM haylander WHERE ${dbCol} IS NOT NULL AND ${dbCol}::text <> ''`
        break
      default:
        await client.end()
        return NextResponse.json({ error: 'Operador inválido' }, { status: 400 })
    }

    const res = await client.query(sql, params)
    await client.end()

    revalidatePath('/admin/lista')
    return NextResponse.json({ success: true, deleted: res.rowCount })
  } catch (error: unknown) {
    console.error('Bulk delete error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao excluir em massa'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}