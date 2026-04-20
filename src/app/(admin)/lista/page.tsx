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

    // Detecta quais colunas existem no schema atual
    const colRes = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'leads'
    `)
    const cols = new Set(colRes.rows.map((r: { column_name: string }) => r.column_name))

    const hasLeadsProcesso = await client.query(`
      SELECT 1 FROM information_schema.tables WHERE table_name = 'leads_processo'
    `).then(r => r.rows.length > 0)

    const valorDivida = cols.has('valor_divida_pgfn')
      ? 'l.valor_divida_pgfn AS valor_divida_ativa'
      : cols.has('valor_divida_ativa')
        ? 'l.valor_divida_ativa'
        : 'NULL::numeric AS valor_divida_ativa'

    const joinClause = hasLeadsProcesso
      ? `LEFT JOIN leads_processo lp ON l.id = lp.lead_id`
      : ''

    const processoFields = hasLeadsProcesso
      ? `lp.observacoes, lp.data_controle_24h, lp.envio_disparo, lp.servico,
         lp.procuracao, lp.status_atendimento, lp.cliente, lp.data_reuniao,
         (lp.data_reuniao IS NOT NULL) AS reuniao_agendada,`
      : `NULL::text AS observacoes, NULL::timestamptz AS data_controle_24h,
         NULL::text AS envio_disparo, NULL::text AS servico,
         NULL::boolean AS procuracao, NULL::text AS status_atendimento,
         NULL::boolean AS cliente, NULL::timestamptz AS data_reuniao,
         FALSE AS reuniao_agendada,`

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
          ${valorDivida},
          ${processoFields}
          NULL::jsonb AS metadata
        FROM leads l
        ${joinClause}
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
      {!error && (
        <div className="text-xs text-zinc-400 font-mono">
          DB: {total} leads encontrados · DATABASE_URL: {process.env.DATABASE_URL ? '✓ configurada' : '✗ ausente'}
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
