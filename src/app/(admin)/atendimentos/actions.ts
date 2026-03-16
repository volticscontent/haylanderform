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

interface DatabaseMeetingRow {
  id: string
  nome_completo: string
  telefone: string
  data_reuniao: Date | string
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
      WHERE lv.data_reuniao IS NOT NULL AND CAST(lv.data_reuniao AS TEXT) <> ''
    `
    
    const result = await client.query<DatabaseMeetingRow>(query)
    
    const meetings = result.rows.map((row) => ({
      ...row,
      data_reuniao: row.data_reuniao instanceof Date ? row.data_reuniao.toISOString() : row.data_reuniao
    }))
    
    return { success: true, data: meetings as Meeting[] }
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return { success: false, message: 'Erro ao buscar agendamentos' }
  } finally {
    await client.end()
  }
}
