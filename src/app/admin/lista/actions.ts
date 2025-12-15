'use server'

import { Client } from 'pg'
import { revalidatePath } from 'next/cache'

export async function deleteLead(telefone: string) {
  if (!process.env.DATABASE_URL) {
    return { success: false, message: 'Database connection not configured' }
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    await client.query('DELETE FROM haylander WHERE telefone = $1', [telefone])
    revalidatePath('/admin/lista')
    return { success: true, message: 'Lead excluído com sucesso' }
  } catch (error) {
    console.error('Error deleting lead:', error)
    return { success: false, message: 'Erro ao excluir lead' }
  } finally {
    await client.end()
  }
}

export async function updateLeadFields(telefone: string, updates: Record<string, unknown>) {
  if (!process.env.DATABASE_URL) {
    return { success: false, message: 'Database connection not configured' }
  }

  // Lista de colunas permitidas para atualização (exclui id)
  const allowedColumns = new Set([
    'telefone',
    'nome_completo',
    'razao_social',
    'cnpj',
    'email',
    'observacoes',
    'calculo_parcelamento',
    'data_cadastro',
    'data_controle_24h',
    'envio_disparo',
    'situacao',
    'qualificacao',
    'motivo_qualificacao',
    'teria_interesse',
    'valor_divida_ativa',
    'valor_divida_municipal',
    'valor_divida_estadual',
    'valor_divida_federal',
    'cartao_cnpj',
    'tipo_divida',
    'tipo_negocio',
    'faturamento_mensal',
    'possui_socio',
    'servico_escolhido',
    'reuniao_agendada',
    'vendido',
    'data_reuniao',
    'confirmacao_qualificacao',
  ])

  const booleanColumns = new Set(['possui_socio', 'reuniao_agendada', 'vendido', 'confirmacao_qualificacao'])
  const dateColumns = new Set(['data_reuniao', 'data_cadastro', 'data_controle_24h'])

  // Filtra e normaliza valores
  const entries = Object.entries(updates).filter(([k]) => allowedColumns.has(k))
  if (entries.length === 0) {
    return { success: false, message: 'Nenhum campo válido para atualizar' }
  }

  const normalized: Array<[string, string | boolean | null]> = entries.map(([k, v]) => {
    let value: string | boolean | null = null
    if (booleanColumns.has(k)) {
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase()
        value = s === 'sim' || s === 'true' || s === '1'
      } else {
        value = !!v
      }
    }
    if (dateColumns.has(k) && typeof v === 'string') {
      let d: Date
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) {
        const [datePart, timePart] = v.split('T')
        const [y, m, dd] = datePart.split('-').map(Number)
        const [hh, mm] = timePart.split(':').map(Number)
        d = new Date(y, m - 1, dd, hh, mm, 0, 0)
      } else {
        d = new Date(v)
      }
      value = isNaN(d.getTime()) ? v : d.toISOString()
    }
    return [k, value]
  })

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()

    const setPlaceholders = normalized.map(([k], i) => `${k} = $${i + 1}`)
    const params: (string | boolean | null)[] = normalized.map(([, v]) => v)

    // Atualiza também o timestamp de atualização
    const sql = `UPDATE haylander SET ${[...setPlaceholders, 'atualizado_em = NOW()'].join(', ')} WHERE telefone = $${setPlaceholders.length + 1}`
    params.push(telefone)

    const result = await client.query(sql, params)
    revalidatePath('/admin/lista')
    return { success: true, message: 'Ficha atualizada com sucesso', rowsAffected: result.rowCount }
  } catch (error) {
    console.error('Error updating lead fields:', error)
    return { success: false, message: 'Erro ao atualizar ficha' }
  } finally {
    await client.end()
  }
}
