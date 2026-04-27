'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Download, MoreVertical, FileText, Phone, CheckCircle, AlertCircle, Clock, Trash2, Edit, Eye, X, User, Calendar, DollarSign, Building, Info, Send, ChevronLeft, ChevronRight } from 'lucide-react'
import { deleteLead, updateLeadFields } from './actions'
import { phoneMatches } from '@/lib/phone-utils'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import { useLocalStorage } from '@/hooks/useLocalStorage'

import { LeadRecord } from '@/types/lead'
import LeadDetailsSidebar from '@/components/LeadDetailsSidebar'
import { ChatAvatar } from '@/components/chat/ChatAvatar'

const DATE_COLUMNS = ['data_controle_24h', 'data_cadastro', 'atualizado_em', 'data_reuniao']


export default function LeadList({
  data,
  pagination
}: {
  data: LeadRecord[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null)
  const [startInEditMode, setStartInEditMode] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkColumn, setBulkColumn] = useState<keyof LeadRecord | ''>('')
  const [bulkOperator, setBulkOperator] = useState<'in' | 'not_in' | 'is_empty' | 'is_not_empty'>('in')
  const [bulkValues, setBulkValues] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<number | null>(null)
  const [updateColumn, setUpdateColumn] = useState<keyof LeadRecord | ''>('')

  // Modal de edição por critério
  const [editOpen, setEditOpen] = useState<boolean>(false)
  const [editValue, setEditValue] = useState<string>('')
  const [editLoading, setEditLoading] = useState<boolean>(false)

  // Estados para configurar visualização da tabela
  const AVAILABLE_COLUMNS = [
    { id: 'cliente', label: 'Cliente' },
    { id: 'contato', label: 'Contato' },
    { id: 'detalhes', label: 'Detalhes' },
    { id: 'procuracao', label: 'Procuração' },
    { id: 'empresa', label: 'Empresa' },
    { id: 'atualizado', label: 'Atualizado' },
  ]
  const DEFAULT_COLUMNS = AVAILABLE_COLUMNS.map(c => c.id)
  const [viewConfigOpen, setViewConfigOpen] = useState(false)

  const [visibleColumns, setVisibleColumns] = useLocalStorage<string[]>('lead_list_view_columns', DEFAULT_COLUMNS)

  const saveViewConfig = () => {
    setViewConfigOpen(false)
  }

  // Todas as colunas da ficha (campo->rótulo)
  const FIELD_COLUMNS: { id: keyof LeadRecord; label: string }[] = [
    { id: 'id', label: 'ID' },
    { id: 'telefone', label: 'Telefone' },
    { id: 'nome_completo', label: 'Nome completo' },
    { id: 'razao_social', label: 'Razão social' },
    { id: 'cnpj', label: 'CNPJ' },
    { id: 'email', label: 'E-mail' },
    { id: 'observacoes', label: 'Observações' },
    { id: 'calculo_parcelamento', label: 'Cálculo parcelamento' },
    { id: 'atualizado_em', label: 'Atualizado em' },
    { id: 'data_cadastro', label: 'Data cadastro' },
    { id: 'data_controle_24h', label: 'Controle 24h' },
    { id: 'envio_disparo', label: 'Envio/Disparo' },
    { id: 'situacao', label: 'Situação' },
    { id: 'qualificacao', label: 'Qualificação' },
    { id: 'motivo_qualificacao', label: 'Motivo qualificação' },
    { id: 'interesse_ajuda', label: 'Interesse em ajuda' },
    { id: 'valor_divida_ativa', label: 'Dívida ativa' },
    { id: 'valor_divida_municipal', label: 'Dívida municipal' },
    { id: 'valor_divida_estadual', label: 'Dívida estadual' },
    { id: 'valor_divida_federal', label: 'Dívida federal' },
    { id: 'tipo_divida', label: 'Tipo de dívida' },
    { id: 'tipo_negocio', label: 'Tipo de negócio' },
    { id: 'faturamento_mensal', label: 'Faturamento mensal' },
    { id: 'possui_socio', label: 'Possui sócio' },
    { id: 'servico', label: 'Serviço' },
    { id: 'procuracao', label: 'Procuração' },
    { id: 'status_atendimento', label: 'Status atendimento' },
    { id: 'data_reuniao', label: 'Data da reunião' },
  ]

  // Estado de colunas da ficha visíveis
  const [visibleFieldColumns, setVisibleFieldColumns] = useLocalStorage<(keyof LeadRecord)[]>('lead_list_view_field_columns', [])

  // Salvar configuração das colunas da ficha
  const saveFieldConfig = () => {
    // Agora é atualizado automaticmente via custom hook
  }

  useEffect(() => {
    if (!updateColumn) {
      setUpdateColumn(bulkColumn)
    }
  }, [bulkColumn, updateColumn])

  const [uniqueValues, setUniqueValues] = useState<string[]>([])
  const [uniqueValuesLoading, setUniqueValuesLoading] = useState(false)

  useEffect(() => {
    if (!bulkColumn) {
      setUniqueValues([])
      return
    }

    const fetchUniqueValues = async () => {
      setUniqueValuesLoading(true)
      try {
        const res = await fetch(`/api/leads/unique-values?column=${bulkColumn}`)
        if (res.ok) {
          const data = await res.json()
          setUniqueValues(data.values || [])
        }
      } catch (error) {
        console.error('Error fetching unique values:', error)
      } finally {
        setUniqueValuesLoading(false)
      }
    }

    fetchUniqueValues()
  }, [bulkColumn])



  // Close menu when clicking outside
  useOnClickOutside(menuRef, () => {
    setOpenMenuId(null)
  })

  const handleDelete = async (telefone: string | null) => {
    if (!telefone) return;
    if (confirm('Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.')) {
      const result = await deleteLead(telefone)
      if (result.success) {
        setOpenMenuId(null)
      } else {
        alert('Erro ao excluir: ' + result.message)
      }
    }
  }

  // Filter data based on search and status
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = (
        (row.nome_completo?.toLowerCase() || '').includes(searchLower) ||
        phoneMatches(row.telefone, searchTerm) ||
        (row.cnpj?.toLowerCase() || '').includes(searchLower)
      )

      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'pendente'
          ? (!row.envio_disparo || row.envio_disparo === 'Pendente')
          : row.envio_disparo === statusFilter

      // Bulk Filter Logic
      let matchesBulk = true
      if (bulkOpen && bulkColumn) {
        const val = row[bulkColumn]
        // Normaliza valor para string para comparação
        const strVal = val === null || typeof val === 'undefined' ? '' : String(val)

        if (bulkOperator === 'is_empty') {
          matchesBulk = strVal === ''
        } else if (bulkOperator === 'is_not_empty') {
          matchesBulk = strVal !== ''
        } else if (bulkValues.length > 0) {
          if (bulkOperator === 'in') {
            matchesBulk = bulkValues.includes(strVal)
          } else if (bulkOperator === 'not_in') {
            matchesBulk = !bulkValues.includes(strVal)
          }
        }
      }

      return matchesSearch && matchesStatus && matchesBulk
    })
  }, [data, searchTerm, statusFilter, bulkOpen, bulkColumn, bulkOperator, bulkValues])

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-[calc(100vh-140px)] relative">
      {selectedLead && (
        <LeadDetailsSidebar
          key={selectedLead.id} // <-- CHAVE MÁGICA REACT: Garante remontagem limpa, zerando os states de edição
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updated) => setSelectedLead(updated)}
          initialEditMode={startInEditMode}
        />
      )}

      {/* List Toolbar */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            id="lead-search"
            name="lead-search"
            type="text"
            className="block w-full rounded-md border-0 py-2 pl-10 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700"
            placeholder="Buscar por nome, telefone ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="status-filter"
            name="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full sm:w-40 rounded-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700"
          >
            <option value="all">Todos os Status</option>
            <option value="pendente">Pendentes (Geral)</option>
            <option value="a1">Pendente (Dia 1 - a1)</option>
            <option value="a2">Pendente (Dia 2 - a2)</option>
            <option value="a3">Pendente (Dia 3 - a3)</option>
            <option value="error">Erros</option>
          </select>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-black dark:text-white border border-zinc-300 rounded-md hover:bg-zinc-500 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button onClick={() => setBulkOpen((v) => !v)} className="inline-flex items-center p-2 px-4 rounded-md bg-zinc-900 dark:bg-white dark:text-black text-white hover:opacity-90 transition-colors text-sm font-medium flex items-center gap-2">
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </button>
          <button onClick={() => setViewConfigOpen(true)} className="inline-flex items-center inline-flex items-center p-2 px-4 rounded-md bg-zinc-900 dark:bg-white dark:text-black text-white hover:opacity-90 transition-colors text-sm font-medium flex items-center gap-2">
            <MoreVertical className="w-4 h-4" />
            <span className="hidden sm:inline">Visualização</span>
          </button>
        </div>
      </div>

      {bulkOpen && (
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-indigo-50/50 dark:bg-orange-800">
          <div className="max-w-3xl">
            <div className="bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-48">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Coluna</label>
                    <select
                      value={bulkColumn}
                      onChange={(e) => { const val = e.target.value; setBulkColumn(val ? (val as keyof LeadRecord) : ''); setBulkValues([]); }}
                      className="p-2 w-full rounded-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 px-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-orange-700"
                    >
                      <option value="">Selecione...</option>
                      <option value="nome_completo">Nome completo</option>
                      <option value="telefone">Telefone</option>
                      <option value="razao_social">Razão social</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="observacoes">Observações</option>
                      <option value="calculo_parcelamento">Cálculo parcelamento</option>
                      <option value="atualizado_em">Atualizado em</option>
                      <option value="data_cadastro">Data cadastro</option>
                      <option value="data_controle_24h">Controle 24h</option>
                      <option value="envio_disparo">Status envio</option>
                      <option value="situacao">Situação</option>
                      <option value="qualificacao">Qualificação</option>
                      <option value="motivo_qualificacao">Motivo qualificação</option>
                      <option value="interesse_ajuda">Interesse em ajuda</option>
                      <option value="valor_divida_ativa">Valor dívida ativa</option>
                      <option value="valor_divida_municipal">Valor dívida municipal</option>
                      <option value="valor_divida_estadual">Valor dívida estadual</option>
                      <option value="valor_divida_federal">Valor dívida federal</option>
                      <option value="tipo_divida">Tipo dívida</option>
                      <option value="tipo_negocio">Tipo negócio</option>
                      <option value="faturamento_mensal">Faturamento mensal</option>
                      <option value="possui_socio">Possui sócio</option>
                      <option value="servico">Serviço</option>
                      <option value="procuracao">Procuração</option>
                      <option value="reuniao_agendada">Reunião agendada</option>
                      <option value="cliente">Cliente</option>
                      <option value="data_reuniao">Data reunião</option>
                      <option value="confirmacao_qualificacao">Confirmação qualificação</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Operador</label>
                    <select
                      value={bulkOperator}
                      onChange={(e) => setBulkOperator(e.target.value as 'in' | 'not_in' | 'is_empty' | 'is_not_empty')}
                      className="p-2 w-full rounded-md py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-orange-700"
                      disabled={!bulkColumn}
                    >
                      <option value="in">Igual a (um dos)</option>
                      <option value="not_in">Diferente de (nenhum dos)</option>
                      <option value="is_empty">Vazio</option>
                      <option value="is_not_empty">Não vazio</option>
                    </select>
                  </div>
                </div>
                {bulkColumn && (bulkOperator === 'in' || bulkOperator === 'not_in') && (
                  <div className="mt-3">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Valores únicos</label>
                    <div className="mt-2 max-h-40 overflow-auto border border-zinc-200 dark:border-zinc-800 rounded-md p-2 bg-white dark:bg-zinc-900">
                      {uniqueValuesLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Clock className="w-5 h-5 animate-spin text-zinc-400" />
                        </div>
                      ) : uniqueValues.length === 0 ? (
                        <p className="text-sm text-zinc-500">Nenhum valor disponível para a coluna.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {uniqueValues.map((val) => (
                            <label key={val} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={bulkValues.includes(val)}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  setBulkValues((prev) => checked ? [...prev, val] : prev.filter(v => v !== val))
                                }}
                              />
                              <span className="truncate" title={val}>{val}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    disabled={bulkLoading}
                    onClick={async () => {
                      if (!confirm('Tem certeza que deseja excluir todos os registros pelo critério selecionado?')) return
                      if (!bulkColumn) { alert('Selecione a coluna.'); return }
                      if ((bulkOperator === 'in' || bulkOperator === 'not_in') && bulkValues.length === 0) { alert('Selecione ao menos um valor.'); return }
                      setBulkLoading(true)
                      setBulkResult(null)
                      try {
                        const res = await fetch('/api/leads/bulk-delete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ column: bulkColumn, operator: bulkOperator, values: bulkValues }),
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error || 'Erro ao excluir')
                        setBulkResult(data.deleted || 0)
                        location.reload()
                      } catch (err: unknown) {
                        const message = err instanceof Error ? err.message : 'Erro ao excluir'
                        alert(message)
                      } finally {
                        setBulkLoading(false)
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {bulkLoading ? 'Excluindo...' : 'Excluir por critério'}
                  </button>
                  {bulkResult !== null && (
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">Excluídos: {bulkResult}</span>
                  )}
                  <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-500 disabled:opacity-50"
                    onClick={() => {
                      if (!bulkColumn) { alert('Selecione a coluna.'); return }
                      if ((bulkOperator === 'in' || bulkOperator === 'not_in') && bulkValues.length === 0) { alert('Selecione ao menos um valor.'); return }
                      setEditValue('')
                      setEditOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Editar por critério
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewConfigOpen(false)} />
          <div className="relative z-10 w-[560px] rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="mb-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">Configurar visualização da lista</div>
            <div className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">Colunas agrupadas</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {AVAILABLE_COLUMNS.map((col) => (
                <label key={col.id} className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.id)}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setVisibleColumns((prev) => {
                        if (checked) return Array.from(new Set([...prev, col.id]))
                        return prev.filter((c) => c !== col.id)
                      })
                    }}
                  />
                  {col.label}
                </label>
              ))}
            </div>
            <div className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">Campos da ficha (todas as colunas)</div>
            <div className="flex items-center gap-2 mb-2">
              <button
                className="rounded pr-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700"
                onClick={() => setVisibleFieldColumns(FIELD_COLUMNS.map(f => f.id))}
              >Selecionar todos</button>
              <button
                className="rounded pr-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700"
                onClick={() => setVisibleFieldColumns([])}
              >Limpar</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[260px] overflow-auto pr-1">
              {FIELD_COLUMNS.map((field) => (
                <label key={String(field.id)} htmlFor={`column-${field.id}`} className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    id={`column-${field.id}`}
                    name={`column-${field.id}`}
                    type="checkbox"
                    checked={visibleFieldColumns.includes(field.id)}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setVisibleFieldColumns((prev) => {
                        if (checked) return Array.from(new Set([...prev, field.id]))
                        return prev.filter((c) => c !== field.id)
                      })
                    }}
                  />
                  {field.label}
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-between gap-2">
              <button
                className="rounded px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                onClick={() => { setVisibleColumns(DEFAULT_COLUMNS); setVisibleFieldColumns([]) }}
              >
                Padrão
              </button>
              <div className="flex gap-2">
                <button className="rounded px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={() => setViewConfigOpen(false)}>Cancelar</button>
                <button
                  className="rounded bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50 hover:bg-indigo-500"
                  onClick={() => { saveViewConfig(); saveFieldConfig(); setViewConfigOpen(false) }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Informar novo valor</h3>
              <button onClick={() => setEditOpen(false)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-600 dark:text-zinc-300">Coluna</label>
                <div className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">{String(bulkColumn || '')}</div>
              </div>
              {bulkColumn && (
                <div>
                  <label className="text-xs text-zinc-600 dark:text-zinc-300">Valores afetados</label>
                  <div className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
                    {bulkOperator === 'in' || bulkOperator === 'not_in' ? (
                      bulkValues.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {bulkValues.map((v) => (
                            <span key={v} className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800">{v}</span>
                          ))}
                        </div>
                      ) : (
                        <span>Nenhum valor selecionado</span>
                      )
                    ) : bulkOperator === 'is_empty' ? (
                      <span>Vazios</span>
                    ) : bulkOperator === 'is_not_empty' ? (
                      <span>Não vazios</span>
                    ) : (
                      <span>Critério desconhecido</span>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-zinc-600 dark:text-zinc-300">Novo valor</label>
                {uniqueValues.length > 0 && !DATE_COLUMNS.includes(bulkColumn || '') && (
                  <select
                    className="mt-1 block w-full rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  >
                    <option value="">Selecione um valor...</option>
                    {uniqueValues.map((val) => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                )}
                <div className="mt-2">
                  <input
                    type={DATE_COLUMNS.includes(bulkColumn || '') ? 'datetime-local' : 'text'}
                    className="block w-full rounded-md border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                    placeholder={DATE_COLUMNS.includes(bulkColumn || '') ? 'Selecione data e hora' : 'Digite o novo valor'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                  <p className="text-xs text-zinc-500 mt-1">Você pode selecionar um valor existente ou digitar um novo.</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                onClick={() => setEditOpen(false)}
              >
                Cancelar
              </button>
              <button
                disabled={editLoading || editValue.trim() === ''}
                className="px-3 py-2 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                onClick={async () => {
                  if (!bulkColumn) { alert('Selecione a coluna.'); return }
                  if ((bulkOperator === 'in' || bulkOperator === 'not_in') && bulkValues.length === 0) { alert('Selecione ao menos um valor.'); return }
                  if (editValue.trim() === '') { alert('Informe o novo valor.'); return }
                  setEditLoading(true)
                  try {
                    // Normaliza datas para ISO 8601 quando a coluna for de timestamp
                    const toISOIfDate = (col: string, val: string) => {
                      if (!val) return val
                      if (DATE_COLUMNS.includes(String(col))) {
                        // Trata 'datetime-local' como horário local ao converter para ISO
                        let d: Date
                        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(val)) {
                          const [datePart, timePart] = val.split('T')
                          const [y, m, dd] = datePart.split('-').map(Number)
                          const [hh, mm] = timePart.split(':').map(Number)
                          d = new Date(y, m - 1, dd, hh, mm, 0, 0)
                        } else {
                          d = new Date(val)
                        }
                        if (isNaN(d.getTime())) throw new Error('Data inválida. Use o seletor ou um formato válido.')
                        return d.toISOString()
                      }
                      return val
                    }
                    const normalizedValues = (bulkValues || []).map(v => toISOIfDate(bulkColumn || '', v))
                    const normalizedEditValue = toISOIfDate(bulkColumn || '', editValue)

                    const res = await fetch('/api/leads/bulk-update', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        where: { column: bulkColumn, operator: bulkOperator, values: normalizedValues },
                        update: { value: normalizedEditValue },
                      }),
                    })
                    const payload = await res.json()
                    if (!res.ok) throw new Error(payload.error || 'Erro ao atualizar')
                    setEditOpen(false)
                    location.reload()
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Erro ao atualizar'
                    alert(message)
                  } finally {
                    setEditLoading(false)
                  }
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto flex-1">
        {!isMounted ? (
          <div className="flex items-center justify-center h-64">
            <Clock className="w-8 h-8 animate-spin text-zinc-300" />
          </div>
        ) : (
          <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 sticky top-0 z-10">
              <tr>
                {visibleColumns.includes('cliente') && (
                  <th className="px-6 py-3 font-semibold">Cliente</th>
                )}
                {visibleColumns.includes('contato') && (
                  <th className="px-6 py-3 font-semibold">Contato</th>
                )}
                {visibleColumns.includes('detalhes') && (
                  <th className="px-6 py-3 font-semibold">Detalhes</th>
                )}
                {visibleColumns.includes('empresa') && (
                  <th className="px-6 py-3 font-semibold">Empresa</th>
                )}
                {visibleColumns.includes('atualizado') && (
                  <th className="px-6 py-3 font-semibold">Atualizado</th>
                )}
                {visibleColumns.includes('procuracao') && (
                  <th className="px-6 py-3 font-semibold text-center">Procuração</th>
                )}
                {FIELD_COLUMNS.filter(f => visibleFieldColumns.includes(f.id)).map((f) => (
                  <th key={String(f.id)} className="px-6 py-3 font-semibold">{f.label}</th>
                ))}
                <th className="px-6 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + visibleFieldColumns.length + 1} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <Search className="w-8 h-8 mb-2 opacity-20" />
                      <p>Nenhum registro encontrado para sua busca.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={`${row.telefone}-${idx}`} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    {visibleColumns.includes('cliente') && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <ChatAvatar
                            chatId={row.telefone || ''}
                            name={row.nome_completo || ''}
                            size={32}
                            className="text-[10px]"
                          />
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-200 flex flex-wrap items-center gap-2">
                              {row.nome_completo || 'Sem nome'}
                              {row.needs_attendant && (
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${row.attendant_requested_at && new Date(row.attendant_requested_at).getTime() < Date.now() - 3600000
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                  }`} title={row.attendant_requested_at ? `Solicitado em: ${new Date(row.attendant_requested_at).toLocaleString()}` : 'Solicitação de atendente'}>
                                  <AlertCircle size={10} />
                                  Ajuda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 font-mono">{row.cnpj || 'CNPJ não informado'}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('contato') && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                          <Phone className="w-3 h-3" />
                          <span>{row.telefone}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('detalhes') && (
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-zinc-500">Interesse:</span>
                            {row.interesse_ajuda === 'Sim' ? (
                              <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Sim
                              </span>
                            ) : (
                              <span className="text-zinc-400">Não/Indefinido</span>
                            )}
                          </div>
                          {row.calculo_parcelamento && (
                            <div className="text-xs text-zinc-500 truncate max-w-[150px]" title={row.calculo_parcelamento}>
                              💰 {row.calculo_parcelamento}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('empresa') && (
                      <td className="px-6 py-4">
                        {row.cnpj ? (
                          <Link
                            href={`/serpro?cnpj=${row.cnpj.replace(/\\D/g, '')}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium line-clamp-2"
                            title="Consultar no Serpro"
                          >
                            {row.razao_social || 'Sem nome da empresa'}
                          </Link>
                        ) : (
                          <span className="text-zinc-500 text-sm line-clamp-2">{row.razao_social || '-'}</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes('atualizado') && (
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500">
                        {row.atualizado_em ? new Date(row.atualizado_em).toLocaleString('pt-BR') : '-'}
                      </td>
                    )}
                    {visibleColumns.includes('procuracao') && (
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${row.procuracao
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : 'bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                            {row.procuracao ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {row.procuracao ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </td>
                    )}

                    {FIELD_COLUMNS.filter(f => visibleFieldColumns.includes(f.id)).map((f) => {
                      const raw = row[f.id]
                      const isBoolean = typeof raw === 'boolean' || raw === 'true' || raw === 'false'
                      let displayStr: string
                      if (raw === null || typeof raw === 'undefined') {
                        displayStr = '-'
                      } else if (isBoolean) {
                        displayStr = (raw === true || raw === 'true') ? 'Sim' : 'Não'
                      } else if (DATE_COLUMNS.includes(String(f.id))) {
                        try {
                          displayStr = new Date(String(raw)).toLocaleString('pt-BR')
                        } catch {
                          displayStr = String(raw)
                        }
                      } else {
                        displayStr = String(raw)
                      }
                      return (
                        <td key={String(f.id)} className="px-6 py-4 text-xs text-zinc-700 dark:text-zinc-200 whitespace-nowrap">
                          {displayStr}
                        </td>
                      )
                    })}

                    <td className="px-6 py-4 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setStartInEditMode(true)
                            setSelectedLead(row)
                          }}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(openMenuId === row.telefone ? null : row.telefone)
                            }}
                            className={`p-1.5 rounded-md transition-colors ${openMenuId === row.telefone ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === row.telefone && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white dark:bg-zinc-900 ring-1 ring-black/5 dark:ring-white/10 z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                            >
                              <div className="p-1" role="menu" aria-orientation="vertical">
                                <button
                                  onClick={() => {
                                    setStartInEditMode(false)
                                    setSelectedLead(row)
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                  role="menuitem"
                                >
                                  <Eye className="w-4 h-4 text-zinc-400" />
                                  Visualizar ficha
                                </button>
                                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                                <button
                                  onClick={() => handleDelete(row.telefone)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  role="menuitem"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Apagar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 p-3 flex justify-between items-center text-xs text-zinc-500">
        <span>
          {pagination ? (
            <>Mostrando {(pagination.page - 1) * pagination.limit + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} registros</>
          ) : (
            <>Mostrando {filteredData.length} de {data.length} registros</>
          )}
        </span>
        {pagination ? (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="flex items-center px-2">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1"
            >
              Próxima <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button className="px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50" disabled>Anterior</button>
            <button className="px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50" disabled>Próxima</button>
          </div>
        )}
      </div>

      {selectedLead && (
        <LeadDetailsSidebar
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updatedLead) => {
            // Refrescar sem recarregar a página inteira se possível
            router.refresh()
          }}
          initialEditMode={startInEditMode}
        />
      )}
    </div>
  )
}
