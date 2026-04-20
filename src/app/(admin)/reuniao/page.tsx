import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Client } from 'pg'
import Link from 'next/link'
import { Calendar, User, Building, Phone, Clock } from 'lucide-react'

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
  const agora = new Date()
  const futuras = reunioes.filter(r => new Date(r.data_reuniao) >= agora)
  const passadas = reunioes.filter(r => new Date(r.data_reuniao) < agora)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-600" /> Reuniões
        </h1>
        <span className="text-sm text-zinc-500">{futuras.length} próximas · {passadas.length} realizadas</span>
      </div>

      {reunioes.length === 0 && (
        <p className="text-zinc-400 text-sm">Nenhuma reunião agendada.</p>
      )}

      {futuras.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Próximas</h2>
          {futuras.map(r => <ReuniaoCard key={r.id} reuniao={r} upcoming />)}
        </section>
      )}

      {passadas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mt-4">Realizadas / Passadas</h2>
          {passadas.map(r => <ReuniaoCard key={r.id} reuniao={r} upcoming={false} />)}
        </section>
      )}
    </div>
  )
}

function ReuniaoCard({ reuniao, upcoming }: { reuniao: Record<string, string | null>, upcoming: boolean }) {
  const dt = reuniao.data_reuniao ? new Date(reuniao.data_reuniao) : null
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-xl border p-4 flex items-start justify-between gap-4 ${
      upcoming ? 'border-purple-200 dark:border-purple-800' : 'border-zinc-200 dark:border-zinc-800 opacity-60'
    }`}>
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-white">
          <User className="w-4 h-4 text-zinc-400" />
          {reuniao.nome_completo || 'Sem nome'}
        </div>
        {reuniao.razao_social && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Building className="w-3 h-3" /> {reuniao.razao_social}
            {reuniao.cnpj && <span className="font-mono text-xs">· {reuniao.cnpj}</span>}
          </div>
        )}
        {reuniao.telefone && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Phone className="w-3 h-3" /> {reuniao.telefone}
          </div>
        )}
        {reuniao.servico && (
          <span className="inline-block text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full mt-1">
            {reuniao.servico}
          </span>
        )}
      </div>
      <div className="text-right shrink-0 space-y-2">
        {dt && (
          <div className="flex items-center gap-1 text-sm font-medium text-purple-700 dark:text-purple-300">
            <Clock className="w-4 h-4" />
            <div>
              <div>{dt.toLocaleDateString('pt-BR')}</div>
              <div className="text-xs text-zinc-500">{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        )}
        {reuniao.telefone && (
          <Link
            href={`/reuniao/${reuniao.telefone}`}
            className="block text-xs text-purple-600 hover:text-purple-800 underline"
          >
            Reagendar
          </Link>
        )}
      </div>
    </div>
  )
}
