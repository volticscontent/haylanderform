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
    // Cascade delete will handle related tables
    await client.query('DELETE FROM leads WHERE telefone = $1', [telefone])
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

  const allowedColumns = new Set([
    'telefone', 'nome_completo', 'email', 'senha_gov', 'nome_mae', 'cpf', 'data_nascimento',
    'cnpj', 'razao_social', 'nome_fantasia', 'tipo_negocio', 'faturamento_mensal', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep', 'dados_serpro', 'cartao_cnpj',
    'situacao', 'qualificacao', 'motivo_qualificacao', 'interesse_ajuda', 'pos_qualificacao', 'possui_socio',
    'tem_divida', 'tipo_divida', 'valor_divida_municipal', 'valor_divida_estadual', 'valor_divida_federal', 'valor_divida_ativa', 'tempo_divida', 'calculo_parcelamento',
    'servico_negociado', 'status_atendimento', 'data_reuniao', 'procuracao', 'procuracao_ativa', 'procuracao_validade',
    'atendente_id', 'envio_disparo', 'data_controle_24h', 'data_ultima_consulta', 'observacoes'
  ])

  const columnTableMap: Record<string, string> = {
    // leads (core)
    'nome_completo': 'leads',
    'email': 'leads',
    'cpf': 'leads',
    'data_nascimento': 'leads',
    'nome_mae': 'leads',
    'senha_gov': 'leads',
    'telefone': 'leads',

    // leads_empresarial
    'cnpj': 'leads_empresarial',
    'razao_social': 'leads_empresarial',
    'nome_fantasia': 'leads_empresarial',
    'tipo_negocio': 'leads_empresarial',
    'faturamento_mensal': 'leads_empresarial',
    'endereco': 'leads_empresarial',
    'numero': 'leads_empresarial',
    'complemento': 'leads_empresarial',
    'bairro': 'leads_empresarial',
    'cidade': 'leads_empresarial',
    'estado': 'leads_empresarial',
    'cep': 'leads_empresarial',
    'dados_serpro': 'leads_empresarial',
    'cartao_cnpj': 'leads_empresarial',

    // leads_qualificacao
    'situacao': 'leads_qualificacao',
    'qualificacao': 'leads_qualificacao',
    'motivo_qualificacao': 'leads_qualificacao',
    'interesse_ajuda': 'leads_qualificacao',
    'pos_qualificacao': 'leads_qualificacao',
    'possui_socio': 'leads_qualificacao',

    // leads_financeiro
    'tem_divida': 'leads_financeiro',
    'tipo_divida': 'leads_financeiro',
    'valor_divida_municipal': 'leads_financeiro',
    'valor_divida_estadual': 'leads_financeiro',
    'valor_divida_federal': 'leads_financeiro',
    'valor_divida_ativa': 'leads_financeiro',
    'tempo_divida': 'leads_financeiro',
    'calculo_parcelamento': 'leads_financeiro',

    // leads_vendas
    'servico_negociado': 'leads_vendas',
    'status_atendimento': 'leads_vendas',
    'data_reuniao': 'leads_vendas',
    'procuracao': 'leads_vendas',
    'procuracao_ativa': 'leads_vendas',
    'procuracao_validade': 'leads_vendas',

    // leads_atendimento
    'atendente_id': 'leads_atendimento',
    'envio_disparo': 'leads_atendimento',
    'data_controle_24h': 'leads_atendimento',
    'data_ultima_consulta': 'leads_atendimento',
    'observacoes': 'leads_atendimento',
  }

  const booleanColumns = new Set(['possui_socio', 'reuniao_agendada', 'vendido', 'confirmacao_qualificacao', 'pos_qualificacao', 'procuracao', 'tem_divida', 'procuracao_ativa'])
  const dateColumns = new Set(['data_reuniao', 'data_cadastro', 'data_controle_24h', 'data_ultima_consulta', 'procuracao_validade', 'data_nascimento'])

  // Filter and normalize values
  const entries = Object.entries(updates).filter(([k]) => allowedColumns.has(k))
  if (entries.length === 0) {
    return { success: false, message: 'Nenhum campo válido para atualizar' }
  }

  const normalized = entries.map(([k, v]) => {
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
    // Default case
    if (value === null) value = v as string | boolean | null

    return { key: k, value, table: columnTableMap[k] }
  })

  // Group by table
  const updatesByTable: Record<string, { keys: string[], values: (string | number | boolean | null)[] }> = {}
  
  normalized.forEach(({ key, value, table }) => {
    if (!table) return // Skip if no table mapping found (should be caught by allowedColumns but just in case)
    if (!updatesByTable[table]) {
      updatesByTable[table] = { keys: [], values: [] }
    }
    updatesByTable[table].keys.push(key)
    updatesByTable[table].values.push(value)
  })

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    await client.query('BEGIN')

    // 1. Get Lead ID
    const leadRes = await client.query('SELECT id FROM leads WHERE telefone = $1', [telefone])
    if (leadRes.rowCount === 0) {
      throw new Error('Lead not found')
    }
    const leadId = leadRes.rows[0].id

    // 2. Execute updates per table
    for (const [table, data] of Object.entries(updatesByTable)) {
      const setClauses = data.keys.map((k, i) => `${k} = $${i + 2}`).join(', ') // $1 is leadId or telefone
      
      if (table === 'leads') {
        // For main table, update by ID (or telefone, but ID is safer inside transaction)
        await client.query(
          `UPDATE leads SET ${setClauses}, atualizado_em = NOW() WHERE id = $1`,
          [leadId, ...data.values]
        )
      } else {
        // For sub-tables, update by lead_id. 
        // NOTE: We use UPSERT (INSERT ... ON CONFLICT DO UPDATE) to handle cases where the sub-row might not exist yet?
        // But our migration ensured they exist. However, new leads created via old flow might not have them?
        // Safer to use UPDATE and check rowCount, if 0 then INSERT? 
        // Or just use UPDATE if we assume they exist.
        // Let's assume they exist for now as we migrated everything.
        // Actually, if we add a new lead via old code, it might not create sub-entries. 
        // So we should use INSERT ON CONFLICT DO UPDATE.
        
        const columns = ['lead_id', ...data.keys].join(', ')
        const placeholders = ['$1', ...data.keys.map((_, i) => `$${i + 2}`)].join(', ')
        const updateSet = data.keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
        
        await client.query(
          `INSERT INTO ${table} (${columns}) VALUES (${placeholders})
           ON CONFLICT (lead_id) DO UPDATE SET ${updateSet}, updated_at = NOW()`,
          [leadId, ...data.values]
        )
      }
    }

    await client.query('COMMIT')
    revalidatePath('/admin/lista')
    return { success: true, message: 'Ficha atualizada com sucesso' }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error updating lead fields:', error)
    return { success: false, message: 'Erro ao atualizar ficha' }
  } finally {
    await client.end()
  }
}
