'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
import { SerproClient } from '@/types/client'

interface ClientCardProps {
  client: SerproClient
  className?: string
}

export default function ClientCard({ client, className = '' }: ClientCardProps) {
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-'
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return '-'
    }
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1" title={client.nome}>
            {client.nome}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
            {client.cnpj}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border ${
          client.procuracao_ativa 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
            : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
        }`}>
          {client.procuracao_ativa ? (
            <>
              <CheckCircle className="w-3 h-3" />
              <span>Com Procuração</span>
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              <span>Sem Procuração</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            Última Consulta
          </span>
          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200 pl-4.5">
            {formatDate(client.data_ultima_consulta)}
          </p>
        </div>

        {client.procuracao_ativa && (
          <div className="space-y-1">
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              <Calendar className="w-3 h-3" />
              Validade Proc.
            </span>
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200 pl-4.5">
              {formatDate(client.procuracao_validade)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
