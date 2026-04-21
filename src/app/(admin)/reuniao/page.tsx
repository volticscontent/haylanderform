import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Client } from 'pg'
import { ReuniaoView } from './ReuniaoView'

async function getReunioesAgendadas() {
  if (!process.env.DATABASE_URL) return []
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    const { rows } = await client.query(`
      SELECT
        l.id, l.telefone, l.nome_completo,
        le.razao_social, le.cnpj,
        lv.data_reuniao, lv.status_atendimento,
        COALESCE(lv.servico_negociado, lv.servico_escolhido) AS servico
      FROM leads_vendas lv
      JOIN leads l ON l.id = lv.lead_id
      LEFT JOIN leads_empresarial le ON le.lead_id = l.id
      WHERE lv.data_reuniao IS NOT NULL
      ORDER BY lv.data_reuniao ASC
    `)
    return rows.map(r => ({
      ...r,
      data_reuniao: r.data_reuniao instanceof Date ? r.data_reuniao.toISOString() : r.data_reuniao,
    }))
  } catch (e) {
    console.error('Reunioes error:', e)
    return []
  } finally {
    await client.end()
  }
}

export default async function ReuniaoListPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  const { verifyAdminSession } = await import('@/lib/dashboard-auth')
  if (!await verifyAdminSession(session?.value)) redirect('/login')

  const reunioes = await getReunioesAgendadas()
  return <ReuniaoView reunioes={reunioes} />
}
