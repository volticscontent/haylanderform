import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Client } from 'pg'
import LeadList from './LeadList'

async function getData(page: number = 1, limit: number = 50) {
  if (!process.env.DATABASE_URL) return { data: [], total: 0 }
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    const offset = (page - 1) * limit
    const [countRes, dataRes] = await Promise.all([
      client.query('SELECT COUNT(*) FROM leads'),
      client.query(`
        SELECT
          l.id, l.telefone, l.nome_completo, l.email, l.data_cadastro, l.atualizado_em,
          l.needs_attendant, l.attendant_requested_at,
          l.razao_social, l.cnpj, l.tipo_negocio, l.faturamento_mensal,
          l.situacao, l.qualificacao, l.motivo_qualificacao, l.interesse_ajuda,
          l.pos_qualificacao, l.possui_socio, l.confirmacao_qualificacao,
          l.calculo_parcelamento, l.tipo_divida,
          l.valor_divida_municipal, l.valor_divida_estadual, l.valor_divida_federal,
          l.valor_divida_pgfn AS valor_divida_ativa,
          lp.observacoes, lp.data_controle_24h, lp.envio_disparo,
          lp.servico AS servico_negociado, lp.servico AS servico_escolhido,
          lp.procuracao, lp.status_atendimento, lp.cliente, lp.data_reuniao,
          (lp.data_reuniao IS NOT NULL) AS reuniao_agendada,
          NULL::text        AS cartao_cnpj,
          NULL::timestamptz AS data_ultima_consulta
        FROM leads l
        LEFT JOIN leads_processo lp ON l.id = lp.lead_id
        ORDER BY l.atualizado_em DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
    ])
    const total = parseInt(countRes.rows[0].count)
    const data = dataRes.rows.map(r => ({
      ...r,
      data_cadastro:    r.data_cadastro    instanceof Date ? r.data_cadastro.toISOString()    : r.data_cadastro,
      atualizado_em:    r.atualizado_em    instanceof Date ? r.atualizado_em.toISOString()    : r.atualizado_em,
      data_controle_24h:r.data_controle_24h instanceof Date ? r.data_controle_24h.toISOString():r.data_controle_24h,
      data_reuniao:     r.data_reuniao     instanceof Date ? r.data_reuniao.toISOString()     : r.data_reuniao,
    }))
    return { data, total }
  } catch (e) {
    console.error('Lista DB error:', e)
    return { data: [], total: 0 }
  } finally {
    await client.end()
  }
}

export default async function ListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  const { verifyAdminSession } = await import('@/lib/dashboard-auth')
  const isValid = await verifyAdminSession(session?.value)

  if (!isValid) {
    redirect('/login')
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
