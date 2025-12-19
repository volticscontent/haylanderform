'use server'

import { Client } from 'pg'

export type Meeting = {
  id: string
  lead_id: string
  nome_completo: string
  telefone: string
  data_reuniao: string
  observacoes: string | null
}

export async function getMeetings() {
  if (!process.env.DATABASE_URL) {
    return { success: false, message: 'Database connection not configured' }
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    
    const query = `
      SELECT 
        l.id,
        l.nome_completo,
        l.telefone,
        lv.data_reuniao,
        la.observacoes
      FROM leads l
      JOIN leads_vendas lv ON l.id = lv.lead_id
      LEFT JOIN leads_atendimento la ON l.id = la.lead_id
      WHERE lv.data_reuniao IS NOT NULL AND lv.data_reuniao != ''
    `
    
    const result = await client.query(query)
    
    return { success: true, data: result.rows as Meeting[] }
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return { success: false, message: 'Erro ao buscar agendamentos' }
  } finally {
    await client.end()
  }
}
