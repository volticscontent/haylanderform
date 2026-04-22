'use client'

import { useState, useTransition } from 'react'
import { FileText, Download, Play, AlertCircle, Loader2 } from 'lucide-react'
import { getGuiaDownloadUrl, IntegraGuia } from '../actions'

const TIPO_LABELS: Record<string, string> = {
  das_mei: 'DAS MEI',
  das_sn:  'DAS Simples',
  darf:    'DARF',
  das_avulso: 'DAS Avulso',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    pago:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    vencido:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-zinc-100 text-zinc-600'}`}>
      {status}
    </span>
  )
}

function GuiaRow({ g }: { g: IntegraGuia }) {
  const [pending, startTransition] = useTransition()
  const vencimento = g.vencimento ? new Date(g.vencimento) : null
  const vencida = vencimento && vencimento < new Date() && g.status_pagamento === 'pendente'

  const handleDownload = () => {
    startTransition(async () => {
      const url = await getGuiaDownloadUrl(g.id)
      if (url) window.open(url, '_blank')
    })
  }

  return (
    <tr className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${vencida ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
      <td className="px-4 py-3 text-sm">
        <p className="font-medium text-zinc-900 dark:text-white">{g.razao_social}</p>
        <p className="text-xs text-zinc-400 font-mono">{g.cnpj}</p>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{TIPO_LABELS[g.tipo] ?? g.tipo}</td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
        {g.competencia ? `${g.competencia.slice(4)}/${g.competencia.slice(0, 4)}` : '—'}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white">
        {g.valor ? `R$ ${Number(g.valor).toFixed(2)}` : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-500">
        {vencimento ? vencimento.toLocaleDateString('pt-BR') : '—'}
        {vencida && <AlertCircle className="w-3.5 h-3.5 text-red-500 inline ml-1" />}
      </td>
      <td className="px-4 py-3"><StatusBadge status={g.status_pagamento} /></td>
      <td className="px-4 py-3">
        {g.pdf_r2_key ? (
          <button
            onClick={handleDownload}
            disabled={pending}
            title="Baixar PDF"
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
        ) : (
          <span className="text-xs text-zinc-300 dark:text-zinc-600">—</span>
        )}
      </td>
    </tr>
  )
}

export default function GuiasClient({ guias }: { guias: IntegraGuia[] }) {
  const pendentes = guias.filter(g => g.status_pagamento === 'pendente').length
  const vencidas  = guias.filter(g => {
    if (g.status_pagamento !== 'pendente' || !g.vencimento) return false
    return new Date(g.vencimento) < new Date()
  }).length

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" /> Guias
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {guias.length} registradas · {pendentes} pendentes
            {vencidas > 0 && <span className="text-red-500 ml-1">· {vencidas} vencidas</span>}
          </p>
        </div>
      </div>

      {guias.length === 0 ? (
        <p className="text-zinc-400 text-sm">Nenhuma guia gerada ainda. Execute o robô PGMEI para gerar guias.</p>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                {['Empresa', 'Tipo', 'Competência', 'Valor', 'Vencimento', 'Status', 'PDF'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guias.map(g => <GuiaRow key={g.id} g={g} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
