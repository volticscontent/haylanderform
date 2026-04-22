'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, CheckCircle, Clock, XCircle, Phone, Mail, FileText, RefreshCw } from 'lucide-react'
import { SerproClient } from '@/types/client'
import { ChatAvatar } from '../chat/ChatAvatar'
import ConsultationHistoryModal from './ConsultationHistoryModal'

interface ClientCardProps {
  client: SerproClient
  className?: string
  onSelectCnpj?: (cnpj: string) => void
}

export default function ClientCard({ client, className = '', onSelectCnpj }: ClientCardProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-'
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return '-'
    }
  }

  const formatCnpj = (cnpj: string) => {
    const digits = cnpj.replace(/\D/g, '');
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") || cnpj;
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3")
    }
    return phone
  }

  return (
    <>
      <div className={`group relative bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 p-5 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/20 transition-all duration-500 hover:-translate-y-1 ${className}`}>
        
        {/* Subtle top glow ring effect on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border border-transparent bg-gradient-to-b from-blue-500/10 dark:from-white/5 to-transparent [mask-image:linear-gradient(to_bottom,white,transparent)]" />

        <div className="flex items-start gap-4 mb-4 relative z-10">
          <ChatAvatar
            chatId={client.telefone || ''}
            name={client.nome}
            size={40}
            className="w-10 h-10 shrink-0 border border-zinc-200 dark:border-zinc-700"
          />

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1 mr-2 tracking-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" title={client.nome}>
                {client.nome}
              </h3>

              <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border shadow-sm ${client.procuracao_ativa
                ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200/50 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                : 'bg-gradient-to-r from-zinc-50 to-zinc-100 text-zinc-600 border-zinc-200/50 dark:from-zinc-800/40 dark:to-zinc-800/20 dark:text-zinc-400 dark:border-zinc-700/50'
                }`}>
                {client.procuracao_ativa ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span className="hidden sm:inline">Com Procuração</span>
                    <span className="sm:hidden">Proc. OK</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    <span className="hidden sm:inline">Sem Procuração</span>
                    <span className="sm:hidden">S/ Proc.</span>
                  </>
                )}
                {client.data_ultima_consulta && (
                  <span className="ml-1 pl-1 border-l border-zinc-200 dark:border-zinc-700 flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Validada
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
              {formatCnpj(client.cnpj)}
            </p>

            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              {client.telefone && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <Phone className="w-3 h-3 text-zinc-400" />
                  <span>{formatPhone(client.telefone)}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 max-w-full">
                  <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate max-w-[150px]" title={client.email}>{client.email}</span>
                </div>
              )}
            </div>
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

        <div className="mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50 flex justify-between items-center relative z-10">
          {onSelectCnpj ? (
            <button
              onClick={() => onSelectCnpj(client.cnpj)}
              className="text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold transition-all px-2.5 py-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-500/10 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-consultar
            </button>
          ) : <div />}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="text-xs flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold transition-all px-2.5 py-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-500/10 active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            Ver Histórico
          </button>
        </div>
      </div>

      <ConsultationHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        cnpj={client.cnpj}
        clientName={client.nome}
      />
    </>
  )
}
