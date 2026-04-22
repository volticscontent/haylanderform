import { getDashboardSummary } from '../actions'
import { Building2, FileText, AlertTriangle, CheckCircle2, Clock, XCircle, Bot } from 'lucide-react'

export const dynamic = 'force-dynamic'

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color ?? 'text-zinc-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-zinc-400 text-xs">—</span>
  const map: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    partial:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    running:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-zinc-100 text-zinc-600'}`}>
      {status}
    </span>
  )
}

function RoboLabel({ tipo }: { tipo: string }) {
  const labels: Record<string, string> = {
    pgmei: 'PGMEI',
    pgdas: 'PGDAS',
    cnd: 'CND',
    caixa_postal: 'Caixa Postal',
  }
  return <span className="font-medium">{labels[tipo] ?? tipo}</span>
}

export default async function IntegraDashboard() {
  const data = await getDashboardSummary()

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-zinc-400 text-sm">Não foi possível carregar os dados. Verifique a conexão com o backend.</p>
      </div>
    )
  }

  const { empresas, guias, robos, certificados_vencendo, historico_recente } = data

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-600" /> Integra Contador — Dashboard
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Visão consolidada das empresas, guias e robôs.</p>
      </div>

      {/* Cards de Empresas */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Empresas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total" value={empresas.total} />
          <StatCard label="Ativas" value={empresas.ativas} color="text-green-600 dark:text-green-400" />
          <StatCard label="Inativas" value={empresas.inativas} color="text-zinc-400" />
        </div>
      </section>

      {/* Cards de Guias */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Guias
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Geradas (mês)" value={guias.geradas_mes} />
          <StatCard label="Pagas (mês)" value={guias.pagas_mes} color="text-green-600 dark:text-green-400" />
          <StatCard label="Pendentes" value={guias.pendentes} color="text-yellow-600 dark:text-yellow-400" />
          <StatCard label="Vencidas" value={guias.vencidas} color="text-red-600 dark:text-red-400" />
        </div>
      </section>

      {/* Alertas: certificados vencendo */}
      {certificados_vencendo.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Certificados Vencendo (30 dias)
          </h2>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl divide-y divide-amber-100 dark:divide-amber-900">
            {certificados_vencendo.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{c.razao_social}</p>
                  <p className="text-xs text-zinc-500 font-mono">{c.cnpj}</p>
                </div>
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {new Date(c.certificado_validade).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Status dos Robôs */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Status dos Robôs</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {robos.length === 0 && (
            <p className="px-4 py-3 text-sm text-zinc-400">Nenhum robô configurado.</p>
          )}
          {robos.map(r => (
            <div key={r.tipo_robo} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${r.ativo ? 'bg-green-500' : 'bg-zinc-300'}`} />
                <RoboLabel tipo={r.tipo_robo} />
                <span className="text-xs text-zinc-400">dia {r.dia_execucao} às {String(r.hora_execucao).slice(0, 5)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <StatusBadge status={r.ult_status} />
                {r.ult_sucesso != null && (
                  <span className="text-xs text-zinc-500">
                    {r.ult_sucesso} ok · {r.ult_falhas} erros
                  </span>
                )}
                {r.ult_inicio && (
                  <span className="text-xs text-zinc-400 hidden md:block">
                    {new Date(r.ult_inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico recente */}
      {historico_recente.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Últimas Execuções
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
            {historico_recente.map((h, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-3">
                  {h.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                   h.status === 'failed' ? <XCircle className="w-4 h-4 text-red-500" /> :
                   <Clock className="w-4 h-4 text-blue-500" />}
                  <RoboLabel tipo={h.robo_tipo} />
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{h.sucesso} ok · {h.falhas} erros</span>
                  <span>{new Date(h.iniciado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
