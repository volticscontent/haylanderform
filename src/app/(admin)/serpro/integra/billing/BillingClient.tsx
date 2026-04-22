'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react'
import { atualizarPreco, BillingData } from '../actions'

const ROBO_LABELS: Record<string, string> = {
  pgmei:        'PGMEI',
  pgdas:        'PGDAS',
  cnd:          'CND',
  caixa_postal: 'Caixa Postal',
}

function fmt(v: string | number | null | undefined) {
  const n = Number(v ?? 0)
  return isNaN(n) ? '—' : `R$ ${n.toFixed(2)}`
}

function MesNavbar({ mes, onChange }: { mes: string; onChange: (m: string) => void }) {
  const [ano, mesNum] = mes.split('-').map(Number)
  const prev = () => {
    const d = new Date(ano, mesNum - 2, 1)
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const next = () => {
    const d = new Date(ano, mesNum, 1)
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return (
    <div className="flex items-center gap-3">
      <button onClick={prev} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
        <ChevronLeft className="w-4 h-4 text-zinc-500" />
      </button>
      <span className="font-semibold text-zinc-900 dark:text-white min-w-32 text-center">
        {MESES[mesNum - 1]} {ano}
      </span>
      <button onClick={next} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
        <ChevronRight className="w-4 h-4 text-zinc-500" />
      </button>
    </div>
  )
}

function PrecosEditor({ precos }: { precos: BillingData['precos'] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(precos.map(p => [p.tipo_robo, p.preco_unitario]))
  )
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    startTransition(async () => {
      await Promise.all(
        Object.entries(values).map(([tipo, val]) =>
          atualizarPreco(tipo, parseFloat(val) || 0)
        )
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Preços por Consulta</h3>
      <div className="space-y-3">
        {precos.map(p => (
          <div key={p.tipo_robo} className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400 w-32 shrink-0">
              {ROBO_LABELS[p.tipo_robo] ?? p.tipo_robo}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-zinc-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={values[p.tipo_robo] ?? p.preco_unitario}
                onChange={e => setValues(prev => ({ ...prev, [p.tipo_robo]: e.target.value }))}
                className="w-24 px-2 py-1 text-sm border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>
            {p.descricao && <span className="text-xs text-zinc-400">{p.descricao}</span>}
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={pending}
        className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Salvo!' : 'Salvar Preços'}
      </button>
    </div>
  )
}

export default function BillingClient({ data, mesAtual }: { data: BillingData | null; mesAtual: string }) {
  const router = useRouter()

  const handleMes = (mes: string) => {
    router.push(`?mes=${mes}`)
  }

  // Agrupar detalhe por empresa para tabela
  const porEmpresa: Record<string, { razao_social: string; cnpj: string; servicos: typeof data extends null ? never : BillingData['detalhe']; totalEmpresa: number }> = {}
  if (data) {
    for (const row of data.detalhe) {
      if (!porEmpresa[row.empresa_id]) {
        porEmpresa[row.empresa_id] = { razao_social: row.razao_social, cnpj: row.cnpj, servicos: [], totalEmpresa: 0 }
      }
      porEmpresa[row.empresa_id].servicos.push(row)
      porEmpresa[row.empresa_id].totalEmpresa += Number(row.custo_total)
    }
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-600" /> Billing Tracker
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Consumo e custo estimado de consultas Serpro.</p>
        </div>
        <MesNavbar mes={mesAtual} onChange={handleMes} />
      </div>

      {!data ? (
        <p className="text-zinc-400 text-sm">Sem dados para este período.</p>
      ) : (
        <>
          {/* Cards totais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <p className="text-sm text-zinc-500">Total de Consultas</p>
              <p className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">{data.totais.total_consultas || 0}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <p className="text-sm text-zinc-500">Custo Estimado</p>
              <p className="text-3xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">{fmt(data.totais.custo_total)}</p>
            </div>
          </div>

          {/* Tabela por empresa */}
          {data.detalhe.length === 0 ? (
            <p className="text-zinc-400 text-sm">Nenhuma consulta bem-sucedida neste período.</p>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    {['Empresa', 'Serviço', 'Consultas', 'Preço unit.', 'Custo'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(porEmpresa).map(([empId, emp]) => (
                    <React.Fragment key={empId}>
                      {emp.servicos.map((s, i) => (
                        <tr key={`${empId}-${s.robo_tipo}`} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          {i === 0 ? (
                            <td className="px-4 py-3 text-sm" rowSpan={emp.servicos.length}>
                              <p className="font-medium text-zinc-900 dark:text-white">{emp.razao_social}</p>
                              <p className="text-xs text-zinc-400 font-mono">{emp.cnpj}</p>
                            </td>
                          ) : null}
                          <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{ROBO_LABELS[s.robo_tipo] ?? s.robo_tipo}</td>
                          <td className="px-4 py-3 text-sm text-zinc-900 dark:text-white text-center">{s.consultas}</td>
                          <td className="px-4 py-3 text-sm text-zinc-500">{fmt(s.preco_unitario)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white">{fmt(s.custo_total)}</td>
                        </tr>
                      ))}
                      <tr className="border-b-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <td className="px-4 py-2" />
                        <td className="px-4 py-2 text-xs text-zinc-400 text-right" colSpan={3}>Total {emp.razao_social}</td>
                        <td className="px-4 py-2 text-sm font-bold text-zinc-900 dark:text-white">{fmt(emp.totalEmpresa)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Editor de preços */}
          <PrecosEditor precos={data.precos} />
        </>
      )}
    </div>
  )
}
