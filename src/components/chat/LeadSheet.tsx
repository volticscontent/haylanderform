'use client'

import {
  X, User, Phone, Mail, Building, CheckCircle, DollarSign, FileText,
  Calendar, Clock, AlertCircle, Globe, ChevronDown, ChevronUp, RefreshCw,
  Briefcase, TrendingUp, Users
} from 'lucide-react'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getConsultationsByCnpj } from '@/app/(admin)/atendimento/actions'
import { DataViewer } from '@/components/serpro/DataViewer'
import { ChatAvatar } from './ChatAvatar'

interface SerproConsultation {
  id: number
  tipo_servico: string
  resultado: unknown
  status: number
  created_at: string
}

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
  cliente: boolean | null
  data_reuniao: string | null
  confirmacao_qualificacao: boolean | null
  needs_attendant: boolean | null
  attendant_requested_at: string | null
}

interface LeadSheetProps {
  lead: LeadSheetData | null
  isOpen: boolean
  onClose: () => void
  loading?: boolean
  mode?: 'overlay' | 'inline'
}

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(v: string | null) {
  if (!v) return null
  const n = Number(v)
  if (isNaN(n)) return v
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(v: string | null) {
  if (!v) return null
  return new Date(v).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function statusDisparo(s: string | null) {
  const lower = (s || '').toLowerCase()
  if (!s || s === 'Pendente') return { label: 'Pendente', color: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' }
  if (['a1', 'a2', 'a3'].includes(lower)) return { label: s, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
  if (lower === 'concluido') return { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' }
  if (lower === 'error') return { label: 'Erro', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
  return { label: s, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ icon, label, accent }: { icon: React.ReactNode; label: string; accent: string }) {
  return (
    <div className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${accent}`}>
      <span className="opacity-70">{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{label}</h3>
    </div>
  )
}

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className={`text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function Flag({ label, yes, danger = true }: { label: string; yes: string | boolean | null; danger?: boolean }) {
  const active = yes === true || yes === 'Sim' || String(yes || '').toLowerCase() === 'sim'
  if (!active) return (
    <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
      <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium leading-tight text-center">{label}</span>
      <span className="text-xs font-bold text-zinc-300 dark:text-zinc-600">—</span>
    </div>
  )
  return (
    <div className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border ${danger ? 'bg-red-50 border-red-200 dark:bg-red-900/15 dark:border-red-900/40' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/15 dark:border-emerald-900/40'}`}>
      <span className={`text-[10px] uppercase tracking-wider font-medium leading-tight text-center ${danger ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{label}</span>
      <span className={`text-xs font-bold ${danger ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>SIM</span>
    </div>
  )
}

// ─── main content ────────────────────────────────────────────────────────────

function LeadSheetContent({ lead }: { lead: LeadSheetData }) {
  const [consultations, setConsultations] = useState<SerproConsultation[]>([])
  const [loadingConsultations, setLoadingConsultations] = useState(!!lead.cnpj)
  const [expandedConsultation, setExpandedConsultation] = useState<number | null>(null)

  const fetchConsultations = useCallback(() => {
    if (!lead.cnpj) { setConsultations([]); setLoadingConsultations(false); return }
    setLoadingConsultations(true)
    getConsultationsByCnpj(lead.cnpj.replace(/\D/g, ''))
      .then(res => setConsultations(res.success && res.data ? res.data as SerproConsultation[] : []))
      .catch(() => setConsultations([]))
      .finally(() => setLoadingConsultations(false))
  }, [lead.cnpj])

  useEffect(() => { fetchConsultations() }, [fetchConsultations])

  const disparo = statusDisparo(lead.envio_disparo)

  const hasDivida = lead.valor_divida_ativa || lead.valor_divida_federal || lead.valor_divida_estadual || lead.valor_divida_municipal
  const totalDivida = [lead.valor_divida_ativa, lead.valor_divida_federal, lead.valor_divida_estadual, lead.valor_divida_municipal]
    .reduce((acc, v) => acc + (Number(v) || 0), 0)

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">

      {/* ── CONTATO ──────────────────────────────────────────────── */}
      <section className="p-5 space-y-4">
        <SectionHeader icon={<User className="w-4 h-4 text-blue-500" />} label="Contato" accent="border-blue-200 dark:border-blue-900" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Telefone" value={lead.telefone} />
          <Field label="Email" value={lead.email} />
          <Field label="Razão Social" value={lead.razao_social} />
          <Field label="CNPJ" value={lead.cnpj} mono />
          <Field label="Tipo de Negócio" value={lead.tipo_negocio} />
          <Field label="Porte" value={lead.porte_empresa} />
          <Field label="Faturamento Mensal" value={fmtCurrency(lead.faturamento_mensal)} />
          {lead.possui_socio !== null && (
            <Field label="Possui Sócio" value={lead.possui_socio ? 'Sim' : 'Não'} />
          )}
          {lead.idades_socios && <Field label="Idade dos Sócios" value={lead.idades_socios} />}
        </div>
      </section>

      {/* ── QUALIFICAÇÃO ─────────────────────────────────────────── */}
      <section className="p-5 space-y-4">
        <SectionHeader icon={<TrendingUp className="w-4 h-4 text-indigo-500" />} label="Qualificação" accent="border-indigo-200 dark:border-indigo-900" />

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Situação" value={lead.situacao} />
          <Field label="Qualificação" value={lead.qualificacao} />
          <Field label="Interesse em Ajuda" value={lead.interesse_ajuda} />
          <Field label="Pós-Qualificação" value={lead.pos_qualificacao ? 'Sim' : lead.pos_qualificacao === false ? 'Não' : null} />
          {lead.motivo_qualificacao && (
            <div className="col-span-2">
              <Field label="Motivo" value={<span className="italic text-zinc-600 dark:text-zinc-300">{lead.motivo_qualificacao}</span>} />
            </div>
          )}
        </div>

        {/* Flags */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          <Flag label="Procuração" yes={lead.procuracao} danger={false} />
          <Flag label="Protestos" yes={lead.tem_protestos} />
          <Flag label="Exec. Fiscal" yes={lead.tem_execucao_fiscal} />
          <Flag label="Dív. Ativa" yes={lead.tem_divida_ativa} />
          <Flag label="Parcelamento" yes={lead.tem_parcelamento} />
        </div>
      </section>

      {/* ── FINANCEIRO ───────────────────────────────────────────── */}
      {hasDivida && (
        <section className="p-5 space-y-4">
          <SectionHeader icon={<DollarSign className="w-4 h-4 text-red-500" />} label="Financeiro" accent="border-red-200 dark:border-red-900" />

          {/* Total em destaque */}
          <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-3">
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Total de Dívidas</span>
            <span className="text-xl font-bold text-red-700 dark:text-red-300 tabular-nums">
              {totalDivida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="Tipo de Dívida" value={lead.tipo_divida} />
            <Field label="Dívida Ativa" value={fmtCurrency(lead.valor_divida_ativa)} />
            <Field label="Dívida Federal" value={fmtCurrency(lead.valor_divida_federal)} />
            <Field label="Dívida Estadual" value={fmtCurrency(lead.valor_divida_estadual)} />
            <Field label="Dívida Municipal" value={fmtCurrency(lead.valor_divida_municipal)} />
          </div>

          {lead.calculo_parcelamento && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Cálculo de Parcelamento</p>
              <pre
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', lead.calculo_parcelamento || '')}
                className="text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 whitespace-pre-wrap leading-relaxed cursor-grab overflow-x-auto max-h-40"
              >
                {lead.calculo_parcelamento}
              </pre>
            </div>
          )}
        </section>
      )}

      {/* ── COMERCIAL ────────────────────────────────────────────── */}
      <section className="p-5 space-y-4">
        <SectionHeader icon={<Briefcase className="w-4 h-4 text-amber-500" />} label="Comercial" accent="border-amber-200 dark:border-amber-900" />

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Serviço Escolhido" value={lead.servico_escolhido} />
          <Field label="Serviço Negociado" value={lead.servico_negociado} />
          {lead.data_reuniao && <Field label="Data da Reunião" value={fmtDate(lead.data_reuniao)} />}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {/* Reunião */}
          {lead.reuniao_agendada && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Calendar className="w-3 h-3" /> Reunião agendada
            </span>
          )}
          {lead.cliente && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Users className="w-3 h-3" /> Cliente
            </span>
          )}
          {/* Disparo */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-transparent ${disparo.color}`}>
            <FileText className="w-3 h-3" /> Disparo: {disparo.label}
          </span>
        </div>

        {lead.observacoes && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Observações</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 leading-relaxed">
              {lead.observacoes}
            </p>
          </div>
        )}
      </section>

      {/* ── SISTEMA ──────────────────────────────────────────────── */}
      <section className="p-5 space-y-4">
        <SectionHeader icon={<Clock className="w-4 h-4 text-zinc-400" />} label="Sistema" accent="border-zinc-200 dark:border-zinc-700" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Cadastrado em" value={fmtDate(lead.data_cadastro)} />
          <Field label="Atualizado em" value={fmtDate(lead.atualizado_em)} />
          <Field label="Controle 24h" value={fmtDate(lead.data_controle_24h)} />
          <Field label="Última Consulta Serpro" value={fmtDate(lead.data_ultima_consulta)} />
        </div>
      </section>

      {/* ── SERPRO ───────────────────────────────────────────────── */}
      <section className="p-5 space-y-3">
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-cyan-200 dark:border-cyan-900">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-500 opacity-70" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Consultas Serpro</h3>
            {consultations.length > 0 && (
              <span className="text-[10px] font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 rounded-full">
                {consultations.length}
              </span>
            )}
          </div>
          <button
            onClick={fetchConsultations}
            disabled={loadingConsultations}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${loadingConsultations ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingConsultations ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
          </div>
        ) : consultations.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">Nenhuma consulta registrada.</p>
        ) : (
          <div className="space-y-2">
            {consultations.map((c) => (
              <div key={c.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <button
                  onClick={() => setExpandedConsultation(expandedConsultation === c.id ? null : c.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === 200 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{c.tipo_servico}</span>
                    <span className="text-xs text-zinc-400 shrink-0 hidden sm:block">{fmtDate(c.created_at)}</span>
                  </div>
                  {expandedConsultation === c.id
                    ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
                </button>
                {expandedConsultation === c.id && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3 overflow-x-auto max-h-60">
                    <DataViewer data={c.resultado} />
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

// ─── shell ───────────────────────────────────────────────────────────────────

function SheetHeader({ lead, onClose }: { lead: LeadSheetData; onClose: () => void }) {
  const disparo = statusDisparo(lead.envio_disparo)
  return (
    <div className="flex items-center gap-3 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
      <ChatAvatar chatId={lead.telefone || ''} name={lead.nome_completo || ''} size={44} />
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white truncate leading-tight">
          {lead.nome_completo || 'Sem nome'}
        </h2>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {lead.cnpj && <span className="text-[11px] font-mono text-zinc-400">{lead.cnpj}</span>}
          {lead.situacao && (
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {lead.situacao}
            </span>
          )}
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${disparo.color}`}>
            {disparo.label}
          </span>
          {lead.needs_attendant && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse">
              Atendente
            </span>
          )}
        </div>
      </div>
      <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 transition-colors shrink-0">
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

export function LeadSheet({ lead, isOpen, onClose, loading, mode = 'overlay' }: LeadSheetProps) {
  const [width, setWidth] = useState(420)
  const isResizingRef = useRef(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return
      const newWidth = window.innerWidth - e.clientX
      if (newWidth > 320 && newWidth < 800) setWidth(newWidth)
    }
    const handleMouseUp = () => {
      isResizingRef.current = false
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }
    if (isOpen && mode === 'inline') {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isOpen, mode])

  if (!isOpen) return null

  const empty = (
    <div className="flex-1 flex items-center justify-center flex-col gap-3 text-zinc-400 p-6 text-center">
      <AlertCircle className="w-10 h-10 opacity-20" />
      <p className="text-sm">Nenhuma ficha encontrada.</p>
      <button onClick={onClose} className="text-xs text-indigo-600 hover:underline">Fechar</button>
    </div>
  )

  const spinner = (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600" />
    </div>
  )

  if (mode === 'inline') {
    return (
      <div
        ref={sidebarRef}
        style={{ width }}
        className="bg-white dark:bg-zinc-900 h-full border-l border-zinc-200 dark:border-zinc-800 flex flex-col animate-in slide-in-from-right duration-300 shadow-xl z-20 relative"
      >
        {/* Resize handle */}
        <div
          onMouseDown={(e) => { e.preventDefault(); isResizingRef.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none' }}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-400/40 transition-colors z-50 -ml-0.5"
        />
        {loading ? spinner : !lead ? empty : (
          <>
            <SheetHeader lead={lead} onClose={onClose} />
            <LeadSheetContent key={lead.id} lead={lead} />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300">
        {loading ? spinner : !lead ? empty : (
          <>
            <SheetHeader lead={lead} onClose={onClose} />
            <LeadSheetContent key={lead.id} lead={lead} />
          </>
        )}
      </div>
    </div>
  )
}
