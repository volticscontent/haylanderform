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
        telefone, 
        nome_completo, 
        cnpj, 
        calculo_parcelamento, 
        data_cadastro,
        atualizado_em,
        envio_disparo,
        situacao,
        qualificação as qualificacao,
        "teria_interesse?" as teria_interesse
      FROM haylander 
      ORDER BY atualizado_em DESC 
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
