'use client'

import { X, User, Phone, Mail, Building, CheckCircle, DollarSign, FileText, Calendar, Clock, AlertCircle, Globe, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getConsultationsByCnpj } from '@/app/admin/atendimento/actions'

interface SerproConsultation {
    id: number;
    tipo_servico: string;
    resultado: any;
    status: number;
    created_at: string;
}

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
    const [consultations, setConsultations] = useState<SerproConsultation[]>([]);
    const [loadingConsultations, setLoadingConsultations] = useState(false);
    const [expandedConsultation, setExpandedConsultation] = useState<number | null>(null);

    const fetchConsultations = useCallback(() => {
        if (lead.cnpj) {
            setLoadingConsultations(true);
            console.log('[LeadSheet] Buscando consultas para:', lead.cnpj);
            getConsultationsByCnpj(lead.cnpj)
                .then(res => {
                    console.log('[LeadSheet] Resultado busca:', res);
                    if (res.success && res.data) {
                        setConsultations(res.data as SerproConsultation[]);
                    } else {
                        setConsultations([]);
                    }
                })
                .catch(err => {
                    console.error('[LeadSheet] Erro na busca:', err);
                    setConsultations([]);
                })
                .finally(() => setLoadingConsultations(false));
        } else {
            setConsultations([]);
        }
    }, [lead.cnpj]);

    useEffect(() => {
        fetchConsultations();
    }, [fetchConsultations]);

    const toggleConsultation = (id: number) => {
        if (expandedConsultation === id) {
            setExpandedConsultation(null);
        } else {
            setExpandedConsultation(id);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. Informações de Qualificação */}
            <section>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Informações de Qualificação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem label="Qualificação" value={lead.qualificacao} />
                    <InfoItem label="Interesse em Ajuda" value={lead.interesse_ajuda} />
                    
                    <div className="md:col-span-2">
                         <InfoItem label="Motivo da Qualificação" value={lead.motivo_qualificacao} italic />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <BadgeItem label="Protestos" value={lead.tem_protestos} />
                        <BadgeItem label="Exec. Fiscal" value={lead.tem_execucao_fiscal} />
                        <BadgeItem label="Dív. Ativa" value={lead.tem_divida_ativa} />
                        <BadgeItem label="Parcelamento" value={lead.tem_parcelamento} />
                    </div>

                    <div className="md:col-span-2 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-semibold text-red-900 dark:text-red-200">Dados Financeiros</span>
                        </div>
                        <InfoItem label="Tipo de Dívida" value={lead.tipo_divida} className="text-red-600 dark:text-red-400" />
                        <div className="grid grid-cols-2 gap-4">
                            <InfoItem label="Dívida Ativa" value={lead.valor_divida_ativa} isMono isCurrency />
                            <InfoItem label="Dívida Federal" value={lead.valor_divida_federal} isMono isCurrency />
                            <InfoItem label="Dívida Estadual" value={lead.valor_divida_estadual} isMono isCurrency />
                            <InfoItem label="Dívida Municipal" value={lead.valor_divida_municipal} isMono isCurrency />
                        </div>
                    </div>

                     <div className="md:col-span-2 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                         <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">Cálculo de Parcelamento</span>
                        </div>
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
                </div>
            </section>

            {/* 2. Informações do Cliente */}
            <section>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <User className="w-4 h-4 text-blue-500" /> Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                     <InfoItem icon={<User className="w-3 h-3 opacity-50" />} label="Nome Completo" value={lead.nome_completo} />
                     <InfoItem label="Razão Social" value={lead.razao_social} />
                     <InfoItem label="CNPJ" value={lead.cnpj} isMono />
                     <InfoItem icon={<Phone className="w-3 h-3 opacity-50" />} label="Telefone" value={lead.telefone} />
                     <InfoItem icon={<Mail className="w-3 h-3 opacity-50" />} label="Email" value={lead.email} />
                     <InfoItem label="Tipo de Negócio" value={lead.tipo_negocio} />
                     <InfoItem label="Faturamento Mensal" value={lead.faturamento_mensal} isCurrency />
                     <InfoItem label="Porte da Empresa" value={lead.porte_empresa} />
                     <InfoItem label="Sócios" value={lead.possui_socio ? 'Sim' : 'Não'} />
                     <InfoItem label="Idade Sócios" value={lead.idades_socios} />
                </div>
            </section>

            {/* 3. Informação do Comercial */}
            <section>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <Building className="w-4 h-4 text-purple-500" /> Informação do Comercial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem label="Situação" value={lead.situacao} />
                    <InfoItem label="Serviço Escolhido" value={lead.servico_escolhido} />
                    <InfoItem label="Serviço Negociado" value={lead.servico_negociado} />
                    
                    <div className="grid grid-cols-2 gap-4 md:col-span-2">
                        <BadgeItem label="Reunião Agendada" value={lead.reuniao_agendada} />
                        <BadgeItem label="Vendido" value={lead.vendido} />
                    </div>

                    <InfoItem icon={<Calendar className="w-3 h-3" />} label="Data Reunião" value={lead.data_reuniao} />
                    
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

                    <div className="md:col-span-2 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-2">
                         <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Dados do Sistema</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <InfoItem icon={<Calendar className="w-3 h-3" />} label="Cadastro" value={lead.data_cadastro ? new Date(lead.data_cadastro).toLocaleString('pt-BR') : '-'} />
                            <InfoItem icon={<Clock className="w-3 h-3" />} label="Atualização" value={lead.atualizado_em ? new Date(lead.atualizado_em).toLocaleString('pt-BR') : '-'} />
                            <InfoItem icon={<Clock className="w-3 h-3" />} label="Controle 24h" value={lead.data_controle_24h ? new Date(lead.data_controle_24h).toLocaleString('pt-BR') : '-'} />
                            <InfoItem icon={<Clock className="w-3 h-3" />} label="Última Consulta" value={lead.data_ultima_consulta ? new Date(lead.data_ultima_consulta).toLocaleString('pt-BR') : '-'} />
                         </div>
                    </div>
                </div>
            </section>

            {/* 4. Histórico de Consultas Serpro */}
            <section>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-500" /> Histórico de Consultas Serpro
                    </div>
                    <button 
                        onClick={fetchConsultations}
                        disabled={loadingConsultations}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50"
                        title="Atualizar consultas"
                    >
                        <RefreshCw className={`w-3 h-3 ${loadingConsultations ? 'animate-spin' : ''}`} />
                    </button>
                </h3>
                
                {loadingConsultations ? (
                    <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    </div>
                ) : consultations.length === 0 ? (
                    <p className="text-sm text-zinc-500 p-2">Nenhuma consulta registrada para este CNPJ.</p>
                ) : (
                    <div className="space-y-3">
                        {consultations.map((consultation) => (
                            <div key={consultation.id} className="bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                <button 
                                    onClick={() => toggleConsultation(consultation.id)}
                                    className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${consultation.status === 200 ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <div>
                                            <span className="text-sm font-medium text-zinc-900 dark:text-white block">
                                                {consultation.tipo_servico}
                                            </span>
                                            <span className="text-xs text-zinc-500 block">
                                                {new Date(consultation.created_at).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                    {expandedConsultation === consultation.id ? 
                                        <ChevronUp className="w-4 h-4 text-zinc-500" /> : 
                                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                                    }
                                </button>
                                
                                {expandedConsultation === consultation.id && (
                                    <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
                                        <pre className="text-xs text-zinc-700 dark:text-zinc-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-[300px]">
                                            {JSON.stringify(consultation.resultado, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

function BadgeItem({ label, value }: { label: string, value: string | boolean | null }) {
    const isYes = value === 'Sim' || value === true || (typeof value === 'string' && value.toLowerCase() === 'sim');
    
    // Determine status for styling
    let statusColor = 'text-zinc-400 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900';
    if (isYes) statusColor = 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10';
    
    return (
        <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${statusColor} text-center transition-all`}>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-medium">{label}</span>
            <span className={`text-xs font-bold`}>
                {isYes ? 'SIM' : 'NÃO'}
            </span>
        </div>
    )
}

interface InfoItemProps {
    icon?: React.ReactNode;
    label: string;
    value?: string | number | boolean | null;
    truncate?: boolean;
    isMono?: boolean;
    italic?: boolean;
    className?: string;
    isCurrency?: boolean;
}

function InfoItem({ icon, label, value, truncate, isMono, italic, className, isCurrency }: InfoItemProps) {
    // Safety check for Date objects to prevent "Objects are not valid as a React child" error
    // This happens if the DB returns a Date object and it's passed directly to value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeValue = (value as any) instanceof Date ? (value as any).toLocaleString('pt-BR') : value;

    const handleDragStart = (e: React.DragEvent) => {
        if (!safeValue) {
            e.preventDefault()
            return
        }
        
        let dragValue = safeValue
        if (isCurrency && safeValue) {
             dragValue = Number(safeValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        }
        
        e.dataTransfer.setData('text/plain', String(dragValue))
        e.dataTransfer.effectAllowed = 'copy'
    }

    return (
        <div className={`space-y-1 ${className || ''}`}>
            <label className="text-xs text-zinc-500 select-none">{label}</label>
            <div 
                draggable={!!safeValue}
                onDragStart={handleDragStart}
                className={`flex items-center gap-2 text-zinc-900 dark:text-zinc-200 ${isMono ? 'font-mono' : ''} ${italic ? 'italic' : ''} ${safeValue ? 'cursor-grab active:cursor-grabbing hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -mx-1 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700' : ''}`}
            >
                {icon}
                <span className={truncate ? 'truncate' : ''} title={truncate ? String(safeValue) : undefined}>
                    {isCurrency && safeValue ? Number(safeValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : (safeValue || '-')}
                </span>
            </div>
        </div>
    )
}
