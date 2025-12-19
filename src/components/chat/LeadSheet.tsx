'use client'

import { X, User, Phone, Mail, Building, CheckCircle, DollarSign, FileText, Info, Calendar, Clock, AlertCircle, GripVertical } from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'


// Reusing LeadRecord type structure but adapting optionality as data might be partial
export type LeadSheetData = {
  id: number
  telefone: string | null
  nome_completo: string | null
  razao_social: string | null
  cnpj: string | null
  email: string | null
  observacoes: string | null
  calculo_parcelamento: string | null
  atualizado_em: string | null
  data_cadastro: string | null
  data_controle_24h: string | null
  envio_disparo: string | null
  situacao: string | null
  qualificacao: string | null
  motivo_qualificacao: string | null
  interesse_ajuda: string | null
  valor_divida_ativa: string | null
  valor_divida_municipal: string | null
  valor_divida_estadual: string | null
  valor_divida_federal: string | null
  cartao_cnpj: string | null
  tipo_divida: string | null
  tipo_negocio: string | null
  faturamento_mensal: string | null
  possui_socio: boolean | null
  pos_qualificacao: boolean | null
  servico_negociado: string | null
  data_ultima_consulta: string | null
  procuracao: boolean | null
  idades_socios: string | null
  porte_empresa: string | null
  score_serasa: string | null
  tem_cartorios: string | null
  motivo_divida: string | null
  tem_protestos: string | null
  tem_divida_ativa: string | null
  tem_execucao_fiscal: string | null
  tem_parcelamento: string | null
  parcelamento_ativo: string | null
  servico_escolhido: string | null
  reuniao_agendada: boolean | null
  vendido: boolean | null
  data_reuniao: string | null
  confirmacao_qualificacao: boolean | null
}

interface LeadSheetProps {
  lead: LeadSheetData | null
  isOpen: boolean
  onClose: () => void
  loading?: boolean
  mode?: 'overlay' | 'inline'
}

export function LeadSheet({ lead, isOpen, onClose, loading, mode = 'overlay' }: LeadSheetProps) {
  const [width, setWidth] = useState(400);
  const isResizingRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizingRef.current) return;
        
        // Calculate new width: Window width - mouse X position
        // Since the sidebar is on the right, the width is the distance from the right edge
        const newWidth = window.innerWidth - e.clientX;
        
        // Constraints
        if (newWidth > 300 && newWidth < 800) {
            setWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        isResizingRef.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    };

    if (isOpen && mode === 'inline') {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, mode]);

  const startResizing = (e: React.MouseEvent) => {
      e.preventDefault();
      isResizingRef.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
  };

  if (!isOpen) return null

  if (mode === 'inline') {
      return (
        <div 
            ref={sidebarRef}
            style={{ width: `${width}px` }}
            className="bg-white dark:bg-zinc-900 h-full border-l border-zinc-200 dark:border-zinc-800 flex flex-col animate-in slide-in-from-right duration-300 shadow-xl z-20 relative"
        >
             {/* Resize Handle */}
             <div 
                onMouseDown={startResizing}
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-600 transition-colors z-50 flex items-center justify-center group -ml-0.5"
             >
                 {/* Visual indicator on hover */}
                 <div className="h-8 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>

             {/* Header */}
             <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                    {lead?.nome_completo ? lead.nome_completo.substring(0, 2).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">{lead?.nome_completo || 'Sem nome'}</h2>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-mono">{lead?.cnpj || 'CNPJ N/A'}</span>
                    </div>
                  </div>
               </div>
               <button 
                 onClick={onClose}
                 className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>

             {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
             ) : !lead ? (
                 <div className="flex-1 flex items-center justify-center flex-col gap-4 text-zinc-500 p-4 text-center">
                     <AlertCircle className="w-10 h-10 opacity-20" />
                     <p className="text-sm">Nenhuma ficha encontrada.</p>
                     <button onClick={onClose} className="text-xs text-indigo-600 hover:underline">Fechar</button>
                 </div>
             ) : (
                <LeadSheetContent lead={lead} />
             )}
        </div>
      )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 h-full shadow-2xl p-0 overflow-hidden flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300">
        
        {loading ? (
           <div className="flex-1 flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
        ) : !lead ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-zinc-500">
                <AlertCircle className="w-12 h-12 opacity-20" />
                <p>Nenhuma ficha encontrada para este contato.</p>
                <button onClick={onClose} className="text-sm text-indigo-600 hover:underline">Fechar</button>
            </div>
        ) : (
        <>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
               {lead.nome_completo ? lead.nome_completo.substring(0, 2).toUpperCase() : <User className="w-6 h-6" />}
             </div>
             <div>
               <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{lead.nome_completo || 'Sem nome'}</h2>
               <div className="flex items-center gap-2 text-sm text-zinc-500">
                 <span className="font-mono">{lead.cnpj || 'CNPJ N/A'}</span>
                 {lead.situacao && (
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-300/50 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                     {lead.situacao}
                   </span>
                 )}
               </div>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <LeadSheetContent lead={lead} />
        </>
        )}
      </div>
    </div>
  )
}

function LeadSheetContent({ lead }: { lead: LeadSheetData }) {
    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* 1. Dados de Contato */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Dados Pessoais e Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <InfoItem icon={<Phone className="w-3 h-3 opacity-50" />} label="Telefone" value={lead.telefone} />
              <InfoItem icon={<Mail className="w-3 h-3 opacity-50" />} label="Email" value={lead.email} />
              <div className="md:col-span-2">
                 <InfoItem label="Razão Social" value={lead.razao_social} />
              </div>
            </div>
          </section>

          {/* 2. Dados da Empresa */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building className="w-4 h-4" /> Dados da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem label="Tipo de Negócio" value={lead.tipo_negocio} />
              <InfoItem label="Faturamento Mensal" value={lead.faturamento_mensal} />
              <InfoItem label="Possui Sócio?" value={lead.possui_socio ? 'Sim' : 'Não'} />
              <InfoItem label="Cartão CNPJ" value={lead.cartao_cnpj} truncate />
            </div>
          </section>

          {/* 3. Qualificação */}
          <section>
             <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
               <CheckCircle className="w-4 h-4" /> Qualificação
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem label="Status (Qualificação)" value={lead.qualificacao} />
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 select-none">Interesse em Ajuda?</label>
                  <p 
                    draggable={!!lead.interesse_ajuda}
                    onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', lead.interesse_ajuda || '');
                        e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className={`font-medium ${lead.interesse_ajuda === 'Sim' ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-zinc-200'} ${lead.interesse_ajuda ? 'cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -mx-1 transition-colors inline-block' : ''}`}
                  >
                    {lead.interesse_ajuda || '-'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <InfoItem label="Motivo da Qualificação" value={lead.motivo_qualificacao} italic />
                </div>
             </div>
          </section>

          {/* 4. Dados Financeiros e Dívidas */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Dados Financeiros
            </h3>
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 space-y-4">
               <InfoItem label="Tipo de Dívida" value={lead.tipo_divida} className="text-red-600 dark:text-red-400" />
               <div className="grid grid-cols-2 gap-4">
                 <InfoItem label="Dívida Ativa" value={lead.valor_divida_ativa} isMono />
                 <InfoItem label="Dívida Federal" value={lead.valor_divida_federal} isMono />
                 <InfoItem label="Dívida Estadual" value={lead.valor_divida_estadual} isMono />
                 <InfoItem label="Dívida Municipal" value={lead.valor_divida_municipal} isMono />
               </div>
            </div>
          </section>

          {/* 5. Cálculo Parcelamento (Destaque) */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Cálculo Parcelamento da Dívida
            </h3>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
              <p 
                draggable={!!lead.calculo_parcelamento}
                onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', lead.calculo_parcelamento || '');
                    e.dataTransfer.effectAllowed = 'copy';
                }}
                className={`text-zinc-900 dark:text-zinc-200 text-sm whitespace-pre-wrap font-mono leading-relaxed ${lead.calculo_parcelamento ? 'cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 rounded p-1 -m-1 transition-colors' : ''}`}
              >
                {lead.calculo_parcelamento || 'Nenhum cálculo disponível.'}
              </p>
            </div>
          </section>

          {/* 6. Informações do Sistema */}
          <section>
             <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
               <Info className="w-4 h-4" /> Informações do Sistema
             </h3>
             <div className="grid grid-cols-2 gap-6">
                <InfoItem icon={<Calendar className="w-3 h-3" />} label="Data de Cadastro" value={lead.data_cadastro ? new Date(lead.data_cadastro).toLocaleString('pt-BR') : '-'} />
                <InfoItem icon={<Clock className="w-3 h-3" />} label="Última Atualização" value={lead.atualizado_em ? new Date(lead.atualizado_em).toLocaleString('pt-BR') : '-'} />
                <InfoItem icon={<Clock className="w-3 h-3" />} label="Controle 24h" value={lead.data_controle_24h ? new Date(lead.data_controle_24h).toLocaleString('pt-BR') : '-'} />
                <InfoItem icon={<Clock className="w-3 h-3" />} label="Última Consulta" value={lead.data_ultima_consulta ? new Date(lead.data_ultima_consulta).toLocaleString('pt-BR') : '-'} />
                
                <InfoItem label="Procuração" value={lead.procuracao ? 'Sim' : 'Não'} />
                
                <div className="space-y-1 md:col-span-2">
                   <label className="text-xs text-zinc-500 select-none">Status de Envio (Disparo)</label>
                   <span 
                     draggable={!!lead.envio_disparo}
                     onDragStart={(e) => {
                         e.dataTransfer.setData('text/plain', lead.envio_disparo || '');
                         e.dataTransfer.effectAllowed = 'copy';
                     }}
                     className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                     ['a1', 'a2', 'a3'].includes(lead.envio_disparo || '')
                       ? 'bg-blue-50 text-blue-700 ml-3 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' 
                       : (lead.envio_disparo === 'concluido' || lead.envio_disparo === 'Concluido')
                       ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                       : lead.envio_disparo === 'error'
                       ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                       : 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
                   } ${lead.envio_disparo ? 'cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity' : ''}`}>
                     {['a1', 'a2', 'a3'].includes(lead.envio_disparo || '') && <Clock className="w-3 h-3" />}
                     {(lead.envio_disparo === 'concluido' || lead.envio_disparo === 'Concluido') && <CheckCircle className="w-3 h-3" />}
                     {(!lead.envio_disparo || lead.envio_disparo === 'Pendente') && <Clock className="w-3 h-3" />}
                     {lead.envio_disparo === 'error' && <AlertCircle className="w-3 h-3" />}
                     {lead.envio_disparo || 'Pendente'}
                   </span>
                </div>
                {lead.observacoes && (
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs text-zinc-500 select-none">Observações Internas</label>
                    <p 
                        draggable={!!lead.observacoes}
                        onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', lead.observacoes || '');
                            e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg cursor-grab active:cursor-grabbing hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      {lead.observacoes}
                    </p>
                  </div>
                )}
             </div>
          </section>
        </div>
    )
}

function InfoItem({ icon, label, value, truncate, isMono, italic, className, isCurrency }: any) {
    const handleDragStart = (e: React.DragEvent) => {
        if (!value) {
            e.preventDefault()
            return
        }
        
        let dragValue = value
        if (isCurrency && value) {
             dragValue = Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        }
        
        e.dataTransfer.setData('text/plain', String(dragValue))
        e.dataTransfer.effectAllowed = 'copy'
    }

    return (
        <div className={`space-y-1 ${className || ''}`}>
            <label className="text-xs text-zinc-500 select-none">{label}</label>
            <div 
                draggable={!!value}
                onDragStart={handleDragStart}
                className={`flex items-center gap-2 text-zinc-900 dark:text-zinc-200 ${isMono ? 'font-mono' : ''} ${italic ? 'italic' : ''} ${value ? 'cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -mx-1 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700' : ''}`}
            >
                {icon}
                <span className={truncate ? 'truncate' : ''} title={truncate ? String(value) : undefined}>
                    {isCurrency && value ? Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (value || '-')}
                </span>
            </div>
        </div>
    )
}

function StatusBadge({ label, value }: any) {
    const handleDragStart = (e: React.DragEvent) => {
        if (!value) {
            e.preventDefault()
            return
        }
        e.dataTransfer.setData('text/plain', String(value))
        e.dataTransfer.effectAllowed = 'copy'
    }

    return (
        <div className="space-y-1">
            <label className="text-xs text-zinc-500 select-none">{label}</label>
            <div 
                draggable={!!value}
                onDragStart={handleDragStart}
                className={`text-zinc-900 dark:text-zinc-200 font-medium ${value ? 'cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -mx-1 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 inline-block' : ''}`}
            >
                {value || '-'}
            </div>
        </div>
    )
}