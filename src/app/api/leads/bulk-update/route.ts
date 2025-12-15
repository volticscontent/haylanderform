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

    // WHERE criteria
    const column: string | undefined = body?.where?.column ?? body.column
    const operator: 'in' | 'not_in' | 'is_empty' | 'is_not_empty' | undefined = body?.where?.operator ?? body.operator
    const values: string[] = Array.isArray(body?.where?.values ?? body.values) ? (body?.where?.values ?? body.values) : []

    // UPDATE target (reutiliza coluna do WHERE por padrão)
    const updateColumn: string | undefined = body?.update?.column ?? body.updateColumn ?? column
    const updateAction: 'set_value' | 'set_empty' | 'toggle_boolean' | undefined =
      body?.update?.action ?? body.updateAction ?? (body?.update?.empty ? 'set_empty' : 'set_value')
    const updateValueRaw: unknown = body?.update?.value ?? body.updateValue

    const allowedWhereColumns: Record<string, string> = {
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
      // Novas colunas do vendedor (para critérios)
      servico_escolhido: '"serviço_escolhido"',
      reuniao_agendada: '"reunião_agendada"',
      vendido: 'vendido',
      data_reuniao: '"data_reunião"',
      confirmacao_qualificacao: '"confirmação_qualificação"',
    }

    const allowedUpdateColumns: Record<string, { col: string, type: 'text' | 'boolean' | 'timestamp' }> = {
      telefone: { col: 'telefone', type: 'text' },
      nome_completo: { col: 'nome_completo', type: 'text' },
      razao_social: { col: 'razao_social', type: 'text' },
      cnpj: { col: 'cnpj', type: 'text' },
      email: { col: 'email', type: 'text' },
      observacoes: { col: 'observacoes', type: 'text' },
      calculo_parcelamento: { col: 'calculo_parcelamento', type: 'text' },
      atualizado_em: { col: 'atualizado_em', type: 'timestamp' },
      data_cadastro: { col: 'data_cadastro', type: 'timestamp' },
      data_controle_24h: { col: 'data_controle_24h', type: 'timestamp' },
      envio_disparo: { col: 'envio_disparo', type: 'text' },
      situacao: { col: 'situacao', type: 'text' },
      qualificacao: { col: '"qualificação"', type: 'text' },
      motivo_qualificacao: { col: '"motivo_qualificação"', type: 'text' },
      teria_interesse: { col: '"teria_interesse?"', type: 'text' },
      valor_divida_ativa: { col: 'valor_divida_ativa', type: 'text' },
      valor_divida_municipal: { col: 'valor_divida_municipal', type: 'text' },
      valor_divida_estadual: { col: 'valor_divida_estadual', type: 'text' },
      valor_divida_federal: { col: 'valor_divida_federal', type: 'text' },
      cartao_cnpj: { col: '"cartão-cnpj"', type: 'text' },
      tipo_divida: { col: 'tipo_divida', type: 'text' },
      tipo_negocio: { col: '"tipo_negócio"', type: 'text' },
      faturamento_mensal: { col: 'faturamento_mensal', type: 'text' },
      possui_socio: { col: '"possui_sócio"', type: 'boolean' },
      // Novas colunas do vendedor (para atualização)
      servico_escolhido: { col: '"serviço_escolhido"', type: 'text' },
      reuniao_agendada: { col: '"reunião_agendada"', type: 'boolean' },
      vendido: { col: 'vendido', type: 'boolean' },
      data_reuniao: { col: '"data_reunião"', type: 'timestamp' },
      confirmacao_qualificacao: { col: '"confirmação_qualificação"', type: 'boolean' },
    }

    if (!column || !operator) {
      await client.end()
      return NextResponse.json({ error: 'where.column e where.operator são obrigatórios' }, { status: 400 })
    }

    const dbWhereCol = allowedWhereColumns[column]
    if (!dbWhereCol) {
      await client.end()
      return NextResponse.json({ error: 'Coluna (WHERE) não permitida' }, { status: 400 })
    }

    const dbUpdate = allowedUpdateColumns[updateColumn!]
    if (!dbUpdate) {
      await client.end()
      return NextResponse.json({ error: 'Coluna de atualização não permitida' }, { status: 400 })
    }

    let setSql = ''
    const params: Array<string | string[]> = []

    if (updateAction === 'set_empty') {
      setSql = `UPDATE haylander SET ${dbUpdate.col} = NULL`
    } else if (updateAction === 'toggle_boolean') {
      if (dbUpdate.type !== 'boolean') {
        await client.end()
        return NextResponse.json({ error: 'Toggle booleano só é válido para colunas booleanas' }, { status: 400 })
      }
      setSql = `UPDATE haylander SET ${dbUpdate.col} = NOT COALESCE(${dbUpdate.col}::boolean, FALSE)`
    } else {
      // set_value
      if (typeof updateValueRaw === 'undefined' || updateValueRaw === null) {
        await client.end()
        return NextResponse.json({ error: 'Informe o novo valor para set_value' }, { status: 400 })
      }
      setSql = `UPDATE haylander SET ${dbUpdate.col} = $1${
        dbUpdate.type === 'boolean' ? '::boolean' : dbUpdate.type === 'timestamp' ? '::timestamp' : ''
      }`
      params.push(String(updateValueRaw))
    }

    let whereSql = ''
    let whereParams: string[][] = []
    switch (operator) {
      case 'in':
        whereSql = `${dbWhereCol}::text = ANY($${params.length + 1})`
        whereParams = [values]
        break
      case 'not_in':
        whereSql = `NOT (${dbWhereCol}::text = ANY($${params.length + 1})) OR ${dbWhereCol} IS NULL`
        whereParams = [values]
        break
      case 'is_empty':
        whereSql = `${dbWhereCol} IS NULL OR ${dbWhereCol}::text = ''`
        break
      case 'is_not_empty':
        whereSql = `${dbWhereCol} IS NOT NULL AND ${dbWhereCol}::text <> ''`
        break
      default:
        await client.end()
        return NextResponse.json({ error: 'Operador inválido' }, { status: 400 })
    }

    const sql = `${setSql} WHERE ${whereSql}`
    const res = await client.query(sql, [...params, ...whereParams])
    await client.end()

    revalidatePath('/admin/lista')

    return NextResponse.json({ success: true, updated: res.rowCount })
  } catch (error: unknown) {
    console.error('Bulk update error:', error)
    const message = error instanceof Error ? error.message : 'Erro ao atualizar em massa'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}