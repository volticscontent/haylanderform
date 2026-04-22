'use client'

import { useState, useTransition } from 'react'
import { Mail, MailOpen, RefreshCw, Loader2 } from 'lucide-react'
import { marcarLida, sincronizarCaixaPostal, CaixaPostalMsg } from '../actions'
import { useRouter } from 'next/navigation'

export default function CaixaPostalClient({ mensagens }: { mensagens: CaixaPostalMsg[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState<number | null>(null)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const handleMarcarLida = (id: number) => {
    startTransition(async () => {
      await marcarLida(id)
      router.refresh()
    })
  }

  const handleSincronizar = () => {
    startTransition(async () => {
      const result = await sincronizarCaixaPostal()
      setSyncMsg(result.ok ? `Sincronização iniciada (execução ${result.data?.execucao_id})` : 'Erro ao sincronizar')
      setTimeout(() => setSyncMsg(null), 5000)
      router.refresh()
    })
  }

  const naoLidas = mensagens.filter(m => !m.lida).length

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-600" /> Caixa Postal
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Todas lidas'} · {mensagens.length} total
          </p>
        </div>
        <button
          onClick={handleSincronizar}
          disabled={pending}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sincronizar
        </button>
      </div>

      {syncMsg && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-2 text-sm text-indigo-700 dark:text-indigo-400">
          {syncMsg}
        </div>
      )}

      {mensagens.length === 0 ? (
        <p className="text-zinc-400 text-sm">Nenhuma mensagem. Clique em Sincronizar para buscar da Receita Federal.</p>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {mensagens.map(m => (
            <div
              key={m.id}
              className={`px-4 py-4 ${!m.lida ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {m.lida
                    ? <MailOpen className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                    : <Mail className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />}
                  <div className="min-w-0">
                    <button
                      onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                      className="text-left w-full"
                    >
                      <p className={`text-sm font-medium truncate ${!m.lida ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {m.assunto || '(Sem assunto)'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {m.razao_social} · {m.cnpj}
                        {m.data_mensagem && ` · ${new Date(m.data_mensagem).toLocaleDateString('pt-BR')}`}
                      </p>
                    </button>

                    {expanded === m.id && m.conteudo && (
                      <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {m.conteudo}
                      </div>
                    )}
                  </div>
                </div>

                {!m.lida && (
                  <button
                    onClick={() => handleMarcarLida(m.id)}
                    disabled={pending}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 shrink-0 transition-colors"
                  >
                    Marcar lida
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
