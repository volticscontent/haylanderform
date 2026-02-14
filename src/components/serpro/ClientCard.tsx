'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, CheckCircle, Clock, XCircle, Phone, Mail, FileText } from 'lucide-react'
import { SerproClient } from '@/types/client'
import WhatsAppAvatar from '@/components/WhatsAppAvatar'
import ConsultationHistoryModal from './ConsultationHistoryModal'

interface ClientCardProps {
  client: SerproClient
  className?: string
}

export default function ClientCard({ client, className = '' }: ClientCardProps) {
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
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
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
      <div className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-start gap-3 mb-3">
          <WhatsAppAvatar 
            phone={client.telefone} 
            alt={client.nome} 
            className="w-10 h-10 shrink-0 border border-zinc-200 dark:border-zinc-700" 
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 mr-2" title={client.nome}>
                {client.nome}
              </h3>
              
              <div className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                client.procuracao_ativa 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
              }`}>
                {client.procuracao_ativa ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
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

        <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="text-xs flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
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
