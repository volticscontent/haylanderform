'use client'

import { useState, useTransition } from 'react'
import { Bot, Play, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { executarRobo, atualizarRobo, IntegraRobo } from '../actions'
import { useRouter } from 'next/navigation'

const ROBO_LABELS: Record<string, string> = {
  pgmei: 'PGMEI — Guia MEI',
  pgdas: 'PGDAS — Simples Nacional',
  cnd: 'CND — Certidão Negativa',
  caixa_postal: 'Caixa Postal — Receita Federal',
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-zinc-400 text-xs">Nunca executado</span>
  const map: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    partial:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    running:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-zinc-100 text-zinc-600'}`}>
      {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'failed' && <XCircle className="w-3 h-3" />}
      {status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'partial' && <Clock className="w-3 h-3" />}
      {status}
    </span>
  )
}

export default function RobosClient({ robos }: { robos: IntegraRobo[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [runningTipo, setRunningTipo] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  const handleExecutar = (tipo: string) => {
    setRunningTipo(tipo)
    startTransition(async () => {
      const result = await executarRobo(tipo)
      setFeedback(prev => ({
        ...prev,
        [tipo]: result.ok ? `Execução ${result.data?.execucao_id} iniciada` : 'Erro ao iniciar',
      }))
      setRunningTipo(null)
      router.refresh()
    })
  }

  const handleToggle = (tipo: string, ativo: boolean) => {
    startTransition(async () => {
      await atualizarRobo(tipo, { ativo: !ativo })
      router.refresh()
    })
  }

  const handleDia = (tipo: string, dia: number) => {
    startTransition(async () => {
      await atualizarRobo(tipo, { dia_execucao: dia })
      router.refresh()
    })
  }

  const handleHora = (tipo: string, hora: string) => {
    startTransition(async () => {
      await atualizarRobo(tipo, { hora_execucao: hora })
      router.refresh()
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-600" /> Robôs — Configuração
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Gerencie o agendamento e disparo manual dos robôs Serpro.</p>
      </div>

      <div className="space-y-4">
        {robos.length === 0 && (
          <p className="text-zinc-400 text-sm">Nenhum robô encontrado. Verifique se a tabela integra_robos foi populada.</p>
        )}
        {robos.map(r => (
          <div key={r.tipo_robo} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(r.tipo_robo, r.ativo)}
                    disabled={pending}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.ativo ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                  >
                    <span className={`inline-block w-3.5 h-3.5 transform rounded-full bg-white shadow transition-transform ${r.ativo ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">
                    {ROBO_LABELS[r.tipo_robo] ?? r.tipo_robo}
                  </h3>
                  <StatusBadge status={r.ult_status} />
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Dia do mês:
                    <input
                      type="number"
                      min={1} max={28}
                      defaultValue={r.dia_execucao}
                      onBlur={e => handleDia(r.tipo_robo, parseInt(e.target.value))}
                      className="w-16 px-2 py-1 text-sm border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Hora:
                    <input
                      type="time"
                      defaultValue={String(r.hora_execucao).slice(0, 5)}
                      onBlur={e => handleHora(r.tipo_robo, e.target.value + ':00')}
                      className="px-2 py-1 text-sm border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </label>
                </div>

                {r.ult_inicio && (
                  <p className="text-xs text-zinc-400 mt-2">
                    Última execução: {new Date(r.ult_inicio).toLocaleString('pt-BR')}
                    {r.ult_sucesso != null && ` · ${r.ult_sucesso} ok, ${r.ult_falhas} erros de ${r.ult_total}`}
                  </p>
                )}
                {feedback[r.tipo_robo] && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">{feedback[r.tipo_robo]}</p>
                )}
              </div>

              <button
                onClick={() => handleExecutar(r.tipo_robo)}
                disabled={!!pending || runningTipo === r.tipo_robo}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors shrink-0"
              >
                {runningTipo === r.tipo_robo
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Play className="w-4 h-4" />}
                Executar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
