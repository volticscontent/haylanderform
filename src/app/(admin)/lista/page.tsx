import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Client } from 'pg'
import LeadList from './LeadList'

async function getData(page: number = 1, limit: number = 50) {
  if (!process.env.DATABASE_URL) return { data: [], total: 0, error: 'DATABASE_URL não configurada' }
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
          le.razao_social, le.cnpj, le.tipo_negocio, le.faturamento_mensal,
          lq.situacao, lq.qualificacao, lq.motivo_qualificacao, lq.interesse_ajuda,
          lq.pos_qualificacao, lq.possui_socio, lq.confirmacao_qualificacao,
          lf.calculo_parcelamento, lf.tipo_divida,
          lf.valor_divida_municipal, lf.valor_divida_estadual, lf.valor_divida_federal,
          lf.valor_divida_ativa,
          la.observacoes, la.data_controle_24h, la.envio_disparo,
          COALESCE(lv.servico_negociado, lv.servico_escolhido) AS servico,
          lv.procuracao, lv.status_atendimento, lv.cliente, lv.data_reuniao,
          COALESCE(lv.reuniao_agendada, lv.data_reuniao IS NOT NULL) AS reuniao_agendada,
          NULL::jsonb AS metadata
        FROM leads l
        LEFT JOIN leads_empresarial  le ON l.id = le.lead_id
        LEFT JOIN leads_qualificacao lq ON l.id = lq.lead_id
        LEFT JOIN leads_financeiro   lf ON l.id = lf.lead_id
        LEFT JOIN leads_vendas       lv ON l.id = lv.lead_id
        LEFT JOIN leads_atendimento  la ON l.id = la.lead_id
        ORDER BY l.atualizado_em DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
    ])

    const total = parseInt(countRes.rows[0].count)
    const data = dataRes.rows.map(r => ({
      ...r,
      data_cadastro:     r.data_cadastro     instanceof Date ? r.data_cadastro.toISOString()     : r.data_cadastro,
      atualizado_em:     r.atualizado_em     instanceof Date ? r.atualizado_em.toISOString()     : r.atualizado_em,
      data_controle_24h: r.data_controle_24h instanceof Date ? r.data_controle_24h.toISOString() : r.data_controle_24h,
      data_reuniao:      r.data_reuniao      instanceof Date ? r.data_reuniao.toISOString()      : r.data_reuniao,
    }))
    return { data, total, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Lista DB error:', msg)
    return { data: [], total: 0, error: msg }
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
  const { data, total, error } = await getData(page, limit)

  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Base de Contatos</h1>
      </div>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-mono">
          <strong>Erro DB:</strong> {error}
        </div>
      )}
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
