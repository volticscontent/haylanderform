'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, CheckCircle, Clock, Edit, User, Calendar, DollarSign, Building, Info, X } from 'lucide-react'
import { updateLeadFields } from '@/app/(admin)/lista/actions'
import { LeadRecord } from '@/types/lead'
import { ChatAvatar } from '@/components/chat/ChatAvatar'

interface LeadDetailsSidebarProps {
  lead: LeadRecord | null
  onClose: () => void
  onUpdate?: (lead: LeadRecord) => void
  initialEditMode?: boolean
}

export default function LeadDetailsSidebar({ lead, onClose, onUpdate, initialEditMode = false }: LeadDetailsSidebarProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(initialEditMode)
  const [formData, setFormData] = useState<LeadRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [serproHistory, setSerproHistory] = useState<{ tipo_servico: string; status: number; created_at: string }[]>([])

  useEffect(() => {
    if (lead) {
      setFormData(lead)
      if (lead.cnpj) {
        const cnpj = lead.cnpj.replace(/\D/g, '')
        fetch(`/api/serpro/history?cnpj=${cnpj}`)
          .then(r => r.json())
          .then(d => setSerproHistory(d.history ?? []))
          .catch(() => { })
      }
    }
  }, [lead])

  if (!lead || !formData) return null

  const handleChange = (field: keyof LeadRecord, value: unknown) => {
    setFormData(prev => prev ? ({ ...prev, [field]: value }) as LeadRecord : null)
  }

  const handleSave = async () => {
    if (!formData || !lead.telefone) return
    setSaving(true)
    try {
      const updates: Record<string, unknown> = {}
      let hasChanges = false

      Object.keys(formData).forEach((key) => {
        const k = key as keyof LeadRecord
        if (formData[k] !== (lead as unknown as Record<string, unknown>)[k]) {
          updates[k] = formData[k]
          hasChanges = true
        }
      })

      if (hasChanges) {
        const res = await updateLeadFields(lead.telefone, updates)
        if (res.success) {
          setIsEditing(false)
          if (onUpdate) onUpdate({ ...lead, ...updates } as LeadRecord)
          router.refresh()
        } else {
          alert('Erro ao atualizar: ' + res.message)
        }
      } else {
        setIsEditing(false)
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const EditableField = ({
    label,
    field,
    type = 'text',
    options = []
  }: { label: string, field: keyof LeadRecord, type?: string, options?: string[] }) => {
    const value = formData[field]

    if (!isEditing) {
      let displayValue: string | number | boolean = value as string | number | boolean
      if (typeof value === 'boolean') displayValue = value ? 'Sim' : 'Não'
      else if (typeof value === 'object' && value !== null) displayValue = JSON.stringify(value)
      
      if (!displayValue && displayValue !== 0) displayValue = '-'

      return (
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">{label}</label>
          <div className="text-zinc-900 dark:text-zinc-200 font-medium break-words text-sm">
            {displayValue}
          </div>
        </div>
      )
    }

    if (type === 'select' && options.length > 0) {
      return (
        <div className="space-y-1">
          <label htmlFor={`field-${field}`} className="text-xs text-zinc-500">{label}</label>
          <select
            id={`field-${field}`}
            name={field}
            value={String(value || '')}
            onChange={(e) => handleChange(field, e.target.value)}
            className="w-full rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm p-2"
          >
            <option value="">Selecione...</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )
    }

    if (type === 'textarea') {
      return (
        <div className="space-y-1 md:col-span-2">
          <label htmlFor={`field-${field}`} className="text-xs text-zinc-500">{label}</label>
          <textarea
            id={`field-${field}`}
            name={field}
            value={String(value || '')}
            onChange={(e) => handleChange(field, e.target.value)}
            rows={4}
            className="w-full rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm p-2"
          />
        </div>
      )
    }

    return (
      <div className="space-y-1">
        <label htmlFor={`field-${field}`} className="text-xs text-zinc-500">{label}</label>
        <input
          id={`field-${field}`}
          name={field}
          type={type}
          value={String(value || '')}
          onChange={(e) => handleChange(field, type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value)}
          className="w-full rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm p-2"
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 h-full shadow-2xl p-0 overflow-hidden flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex flex-col gap-3 items-start p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="w-full flex justify-between items-start">
            <div className="flex items-center gap-4">
              <ChatAvatar 
                chatId={lead.telefone || ''} 
                name={lead.nome_completo || ''} 
                size={48} 
                className="text-lg"
              />
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{lead.nome_completo || 'Sem nome'}</h2>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span className="font-mono">{lead.cnpj || 'CNPJ N/A'}</span>
                  {lead.situacao && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {lead.situacao}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-zinc-500" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {lead.cnpj && (
              <Link href={`/serpro?cnpj=${lead.cnpj.replace(/\D/g, '')}`} className="p-2 px-3 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" /> Serpro
              </Link>
            )}
            {lead.telefone && (
              <Link href={`/reuniao/${lead.telefone}`} className="p-2 px-3 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Reunião
              </Link>
            )}
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="p-2 px-4 rounded-md bg-zinc-900 dark:bg-white dark:text-black text-white hover:opacity-90 transition-colors text-sm font-medium flex items-center gap-2">
                <Edit className="w-4 h-4" /> Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="p-2 px-4 rounded-md bg-zinc-200 text-zinc-700 hover:bg-zinc-300 transition-colors text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="p-2 px-4 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2">
                  {saving ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Dados e Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <EditableField label="Telefone" field="telefone" />
              <EditableField label="Email" field="email" />
              <div className="md:col-span-2">
                <EditableField label="Razão Social" field="razao_social" />
              </div>
              <EditableField label="CNPJ" field="cnpj" />
              <EditableField label="Status Atendimento" field="status_atendimento" />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building className="w-4 h-4" /> Empresa e Qualificação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditableField label="Tipo de Negócio" field="tipo_negocio" />
              <EditableField label="Faturamento" field="faturamento_mensal" />
              <EditableField label="Qualificação" field="qualificacao" type="select" options={['MQL', 'ICP', 'SQL']} />
              <EditableField label="Situação" field="situacao" type="select" options={['nao_respondido', 'desqualificado', 'qualificado', 'cliente']} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Financeiro
            </h3>
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 grid grid-cols-2 gap-4">
              <EditableField label="Dívida Federal" field="valor_divida_federal" />
              <EditableField label="Dívida Ativa" field="valor_divida_ativa" />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> Observações
            </h3>
            <EditableField label="Notas Internas" field="observacoes" type="textarea" />
          </section>
        </div>
      </div>
    </div>
  )
}
