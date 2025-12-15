import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Client } from 'pg'
import LeadList from './LeadList'

async function getData(page: number = 1, limit: number = 50) {
  if (!process.env.DATABASE_URL) {
    return { data: [], total: 0 }
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })
  
  try {
    await client.connect()
    
    // Get total count
    const countRes = await client.query('SELECT COUNT(*) FROM haylander')
    const total = parseInt(countRes.rows[0].count)
    
    // Get paginated data
    const offset = (page - 1) * limit
    const res = await client.query(`
      SELECT 
        id,
        telefone, 
        nome_completo, 
        razao_social,
        cnpj, 
        email,
        observacoes,
        calculo_parcelamento, 
        atualizado_em,
        data_cadastro,
        data_controle_24h,
        envio_disparo,
        situacao,
        qualificação as qualificacao,
        motivo_qualificação as motivo_qualificacao,
        "teria_interesse?" as teria_interesse,
        valor_divida_ativa,
        valor_divida_municipal,
        valor_divida_estadual,
        valor_divida_federal,
        "cartão-cnpj" as cartao_cnpj,
        tipo_divida,
        tipo_negócio as tipo_negocio,
        faturamento_mensal,
        possui_sócio as possui_socio
      FROM haylander 
      ORDER BY atualizado_em DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset])
    
    return { data: res.rows, total }
  } catch (error) {
    console.error('Error fetching list data:', error)
    return { data: [], total: 0 }
  } finally {
    await client.end()
  }
}

export default async function ListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  if (!session || session.value !== 'true') {
    redirect('/admin/login')
  }

  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1
  const limit = 50
  const { data, total } = await getData(page, limit)

  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Base de Contatos</h1>
      </div>
      <LeadList 
        data={data} 
        pagination={{
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }} 
      />
    </div>
  )
}
