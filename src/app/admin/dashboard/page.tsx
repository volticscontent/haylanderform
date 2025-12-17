import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Client } from 'pg'
import DashboardCharts from './DashboardCharts'

async function getData() {
  if (!process.env.DATABASE_URL) {
    return []
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  
  try {
    await client.connect()
    const res = await client.query(`
      SELECT 
        l.id,
        l.nome_completo,
        l.telefone,
        l.email,
        le.cnpj,
        lf.calculo_parcelamento,
        l.data_cadastro,
        l.atualizado_em,
        la.envio_disparo,
        lq.situacao,
        lq.qualificacao,
        lq.interesse_ajuda,
        lq.pos_qualificacao as confirmacao_qualificacao,
        (lv.data_reuniao IS NOT NULL) as reuniao_agendada,
        (lv.servico_negociado IS NOT NULL) as vendido
      FROM leads l
      LEFT JOIN leads_empresarial le ON l.id = le.lead_id
      LEFT JOIN leads_qualificacao lq ON l.id = lq.lead_id
      LEFT JOIN leads_financeiro lf ON l.id = lf.lead_id
      LEFT JOIN leads_atendimento la ON l.id = la.lead_id
      LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
      ORDER BY l.atualizado_em DESC 
      LIMIT 500
    `)
    return res.rows
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return []
  } finally {
    await client.end()
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  if (!session || session.value !== 'true') {
    redirect('/admin/login')
  }

  const data = await getData()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard Analítico</h1>
      </div>
      <DashboardCharts data={data} />
    </div>
  )
}
