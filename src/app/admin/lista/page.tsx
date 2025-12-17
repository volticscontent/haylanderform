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
    const countRes = await client.query('SELECT COUNT(*) FROM leads')
    const total = parseInt(countRes.rows[0].count)
    
    // Get paginated data
    const offset = (page - 1) * limit
    const res = await client.query(`
      SELECT 
        l.id,
        l.telefone, 
        l.nome_completo, 
        l.email,
        l.data_cadastro,
        l.atualizado_em,
        
        -- leads_empresarial
        le.razao_social,
        le.cnpj, 
        le.cartao_cnpj,
        le.tipo_negocio,
        le.faturamento_mensal,

        -- leads_atendimento
        la.observacoes,
        la.data_controle_24h,
        la.envio_disparo,
        la.data_ultima_consulta,

        -- leads_financeiro
        lf.calculo_parcelamento, 
        lf.valor_divida_ativa,
        lf.valor_divida_municipal,
        lf.valor_divida_estadual,
        lf.valor_divida_federal,
        lf.tipo_divida,

        -- leads_qualificacao
        lq.situacao,
        lq.qualificacao,
        lq.motivo_qualificacao,
        lq.interesse_ajuda,
        lq.pos_qualificacao,
        lq.possui_socio,

        -- leads_vendas
        lv.servico_negociado,
        lv.procuracao

      FROM leads l
      LEFT JOIN leads_empresarial le ON l.id = le.lead_id
      LEFT JOIN leads_qualificacao lq ON l.id = lq.lead_id
      LEFT JOIN leads_financeiro lf ON l.id = lf.lead_id
      LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
      LEFT JOIN leads_atendimento la ON l.id = la.lead_id
      ORDER BY l.atualizado_em DESC 
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
