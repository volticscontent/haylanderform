'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { Search, Send } from 'lucide-react'

type Record = {
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
  teria_interesse: string | null
  valor_divida_ativa: string | null
  valor_divida_municipal: string | null
  valor_divida_estadual: string | null
  valor_divida_federal: string | null
  cartao_cnpj: string | null
  tipo_divida: string | null
  tipo_negocio: string | null
  faturamento_mensal: string | null
  possui_socio: boolean | null
}

export default function Disparo({ data }: { data: Record[] }) {
  type Criterion = { column: keyof Record | '' ; operator: 'in' | 'not_in' | 'is_empty' | 'is_not_empty'; values: string[]; manualValue: string }
  type Draft = {
    searchTerm?: string
    statusFilter?: 'all' | 'pendente' | string
    criteria?: Criterion[]
    column?: keyof Record
    operator?: 'in'|'not_in'|'is_empty'|'is_not_empty'
    values?: string[]
    manualValue?: string
    body?: string
    schedule?: string
    selectedPhones?: string[]
    attachments?: { link?: string }
  }
  const readDraft = (): Draft | null => {
    try {
      if (typeof window === 'undefined') return null
      const saved = localStorage.getItem('lead_disparo_draft')
      return saved ? JSON.parse(saved) as Draft : null
    } catch { return null }
  }
  const draft = readDraft()

  const [searchTerm, setSearchTerm] = useState<string>(draft?.searchTerm ?? '')
  const [statusFilter, setStatusFilter] = useState<string>(draft?.statusFilter ?? 'all')
  const [criteria, setCriteria] = useState<Criterion[]>(
    () =>
      draft?.criteria && Array.isArray(draft.criteria)
        ? draft.criteria
        : [{
            column: draft?.column ?? '',
            operator: draft?.operator ?? 'in',
            values: Array.isArray(draft?.values) ? (draft?.values as string[]) : [],
            manualValue: draft?.manualValue ?? ''
          }]
  )

  type Attachments = { image: File | null; audio: File | null; document: File | null; video: File | null; link: string }
  const [attachments, setAttachments] = useState<Attachments>(() => ({ image: null, audio: null, document: null, video: null, link: draft?.attachments?.link ?? '' }))
  const [selectedPhones, setSelectedPhones] = useState<string[]>(() => Array.isArray(draft?.selectedPhones) ? (draft?.selectedPhones as string[]) : [])
  const [body, setBody] = useState<string>(draft?.body ?? '')
  const [schedule, setSchedule] = useState<string>(draft?.schedule ?? '')

  // Estado do menu de placeholders
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState<boolean>(false)
  const [placeholderFilter, setPlaceholderFilter] = useState<string>('')
  const [placeholderIndex, setPlaceholderIndex] = useState<number>(0)
  const [commandStart, setCommandStart] = useState<number | null>(null)

  const insertPlaceholderAtCursor = (key: string) => {
    const el = textareaRef.current
    const placeholder = `{{${key}}}`
    const pos = commandStart ?? el?.selectionStart ?? body.length
    const start = body.slice(0, pos)
    const end = body.slice(pos)
    setBody(start + placeholder + end)
    setShowPlaceholderMenu(false)
    setCommandStart(null)
    setPlaceholderFilter('')
    setPlaceholderIndex(0)
    setTimeout(() => {
      const newPos = pos + placeholder.length
      if (el) { el.focus(); el.setSelectionRange(newPos, newPos) }
    }, 0)
  }

  // Painel de preview lateral
  const [previewOpen, setPreviewOpen] = useState<boolean>(false)
  const [attachmentUrls, setAttachmentUrls] = useState<{ image?: string; audio?: string; document?: string; video?: string }>({})

  useEffect(() => {
    const newUrls = {
      image: attachments.image ? URL.createObjectURL(attachments.image) : undefined,
      audio: attachments.audio ? URL.createObjectURL(attachments.audio) : undefined,
      document: attachments.document ? URL.createObjectURL(attachments.document) : undefined,
      video: attachments.video ? URL.createObjectURL(attachments.video) : undefined,
    }
    // eslint-disable-next-line
    setAttachmentUrls(newUrls)
    return () => {
      Object.values(newUrls).forEach(u => u && URL.revokeObjectURL(u))
    }
  }, [attachments])

  const getUniqueValues = (col: keyof Record | '') => {
    if (!col || !Array.isArray(data)) return [] as string[]
    const set = new Set<string>()
    for (const row of data) {
      const v = row[col]
      const s = v == null ? '' : String(v)
      if (s.length) set.add(s)
    }
    return Array.from(set).sort()
  }

  useEffect(() => {
    // Efeito vazio; estados são inicializados via localStorage no lazy initializer
  }, [])

  const filteredData = useMemo(() => {
    const toStr = (v: unknown) => (v == null ? '' : String(v))
    return (Array.isArray(data) ? data : []).filter((row: Record) => {
      // Busca por nome, telefone ou CNPJ
      const searchLower = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !searchLower ||
        toStr(row.nome_completo).toLowerCase().includes(searchLower) ||
        toStr(row.telefone).toLowerCase().includes(searchLower) ||
        toStr(row.cnpj).toLowerCase().includes(searchLower)

      // Filtro de status
      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'pendente'
          ? (!row.envio_disparo || row.envio_disparo === 'Pendente')
          : row.envio_disparo === statusFilter

      // Critérios (AND)
      const matchesAllCriteria = (criteria && Array.isArray(criteria) && criteria.length > 0)
        ? criteria.every(c => {
            if (!c.column) return true
            const strVal = toStr(row[c.column])
            let ok = true
            if (c.operator === 'in') {
              ok = c.values.length === 0 || c.values.includes(strVal)
            } else if (c.operator === 'not_in') {
              ok = c.values.length === 0 || !c.values.includes(strVal)
            } else if (c.operator === 'is_empty') {
              ok = strVal.length === 0
            } else if (c.operator === 'is_not_empty') {
              ok = strVal.length > 0
            }
            if (c.manualValue && c.operator !== 'in') {
              ok = ok && strVal.toLowerCase().includes(c.manualValue.toLowerCase())
            }
            return ok
          })
        : true

      return matchesSearch && matchesStatus && matchesAllCriteria
    })
  }, [data, searchTerm, statusFilter, criteria])

  const affectedCount = filteredData.length

  const previewSample = filteredData[0]
  const placeholderKeys = useMemo(() => Object.keys(previewSample ?? {}), [previewSample])
  const filteredPlaceholders = useMemo(() => {
    const f = placeholderFilter.toLowerCase()
    return placeholderKeys.filter(k => k.toLowerCase().includes(f))
  }, [placeholderFilter, placeholderKeys])
  const previewBody = useMemo(() => {
    const mapVar = (txt: string, row: Record | undefined) => {
      if (!row) return txt
      return txt.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_m, key: string) => {
        const val = row[key as keyof Record]
        return val == null ? '' : String(val)
      })
    }
    return mapVar(body, previewSample)
  }, [body, previewSample])

  const saveDraft = () => {
    const payload = { searchTerm, statusFilter, criteria, body, schedule, selectedPhones, attachments: { link: attachments.link, imageName: attachments.image?.name, audioName: attachments.audio?.name, documentName: attachments.document?.name, videoName: attachments.video?.name } }
    localStorage.setItem('lead_disparo_draft', JSON.stringify(payload))
    alert('Rascunho salvo localmente.')
  }

  const submit = async () => {
    // Somente frontend: salva configuração completa localmente
    if (!body.trim()) { alert('Informe a mensagem.'); return }
    if (!selectedPhones.length) { alert('Selecione ao menos um destinatário.'); return }
    const cfg = {
      recipients: selectedPhones,
      schedule,
      message: body,
      attachments: {
        link: attachments.link,
        imageName: attachments.image?.name,
        audioName: attachments.audio?.name,
        documentName: attachments.document?.name,
        videoName: attachments.video?.name,
      },
      filters: { searchTerm, statusFilter, criteria }
    }
    localStorage.setItem('lead_disparo_config', JSON.stringify(cfg))
    alert(`Configuração de disparo criada (${selectedPhones.length} destinatários).`)
  }

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-0 py-2 pl-10 text-zinc-900 ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700"
              placeholder="Buscar por nome, telefone ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full sm:w-52 rounded-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendentes (Geral)</option>
              <option value="a1">Pendente (Dia 1 - a1)</option>
              <option value="a2">Pendente (Dia 2 - a2)</option>
              <option value="a3">Pendente (Dia 3 - a3)</option>
              <option value="error">Erros</option>
            </select>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Destinatários: <span className="font-semibold">{affectedCount}</span></div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Critérios (máx. 3)</div>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                onClick={() => criteria.length < 3 && setCriteria([...criteria, { column: '', operator: 'in', values: [], manualValue: '' }])}
              >
                Adicionar critério
              </button>
            </div>

            <div className="space-y-4">
              {criteria.map((c, idx) => (
                <div key={idx} className="rounded-md border border-zinc-300 dark:border-zinc-700 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Critério {idx + 1}</span>
                    {idx > 0 && (
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => setCriteria(criteria.filter((_, i) => i !== idx))}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <select
                      className="p-2 w-full rounded-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700"
                      value={c.column}
                      onChange={(e) => {
                        const col = e.target.value as keyof Record
                        const next = [...criteria]
                        next[idx] = { ...next[idx], column: col, values: [], manualValue: '' }
                        setCriteria(next)
                      }}
                    >
                      <option value="">Selecione...</option>
                      <option value="nome_completo">Nome completo</option>
                      <option value="telefone">Telefone</option>
                      <option value="razao_social">Razão social</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="envio_disparo">Status envio</option>
                      <option value="teria_interesse">Teria interesse</option>
                      <option value="situacao">Situação</option>
                    </select>
                    <select
                      className="w-40 rounded-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700"
                      value={c.operator}
                      onChange={(e) => {
                        const op = e.target.value as Criterion['operator']
                        const next = [...criteria]
                        next[idx] = { ...next[idx], operator: op }
                        setCriteria(next)
                      }}
                    >
                      <option value="in">Está em</option>
                      <option value="not_in">Não está em</option>
                      <option value="is_empty">Está vazio</option>
                      <option value="is_not_empty">Não está vazio</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs mb-1 text-zinc-600 dark:text-zinc-400">Lista de valores únicos</div>
                      <div className="rounded-md border border-zinc-300 dark:border-zinc-700 overflow-hidden">
                        <div className="max-h-48 overflow-auto">
                          {getUniqueValues(c.column).length === 0 ? (
                            <div className="px-3 py-2 text-xs text-zinc-500">Nenhum valor disponível</div>
                          ) : (
                            getUniqueValues(c.column).map((v) => (
                              <label key={v} className="flex items-center gap-2 px-3 py-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={c.values.includes(v)}
                                  onChange={(e) => {
                                    const next = [...criteria]
                                    const checked = e.target.checked
                                    next[idx].values = checked ? Array.from(new Set([...next[idx].values, v])) : next[idx].values.filter(x => x !== v)
                                    setCriteria(next)
                                  }}
                                />
                                {v}
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-1 text-zinc-600 dark:text-zinc-400">Valor manual</div>
                      <input
                        type="text"
                        value={c.manualValue}
                        onChange={(e) => {
                          const next = [...criteria]
                          next[idx] = { ...next[idx], manualValue: e.target.value }
                          setCriteria(next)
                        }}
                        placeholder="Digite um valor..."
                        className="p-2 w-full rounded-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4">
          <div>
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Mensagem</div>
            {/* WhatsApp apenas: remove seleção de canal e assunto */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === '/' && !showPlaceholderMenu) {
                    e.preventDefault()
                    const el = textareaRef.current
                    const pos = el?.selectionStart ?? body.length
                    setCommandStart(pos)
                    setPlaceholderFilter('')
                    setPlaceholderIndex(0)
                    setShowPlaceholderMenu(true)
                  } else if (showPlaceholderMenu) {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setPlaceholderIndex(i => Math.min(i + 1, filteredPlaceholders.length - 1)) }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setPlaceholderIndex(i => Math.max(i - 1, 0)) }
                    else if (e.key === 'Enter') { e.preventDefault(); const k = filteredPlaceholders[placeholderIndex]; if (k) insertPlaceholderAtCursor(k) }
                    else if (e.key === 'Escape') { e.preventDefault(); setShowPlaceholderMenu(false); setCommandStart(null) }
                    else if (e.key === 'Backspace') { e.preventDefault(); setPlaceholderFilter(f => f.slice(0, -1)) }
                    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); setPlaceholderFilter(f => f + e.key) }
                  }
                }}
                placeholder="Corpo da mensagem (digite '/' para inserir variáveis dinâmicas)"
                rows={8}
                className="p-2 w-full rounded-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700"
              />
              {showPlaceholderMenu && (
                <div className="absolute left-2 bottom-2 z-20 w-64 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg">
                  <div className="px-2 py-1 text-xs text-zinc-500">Placeholders</div>
                  <input
                    autoFocus
                    value={placeholderFilter}
                    onChange={(e) => setPlaceholderFilter(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-transparent outline-none border-b border-zinc-200 dark:border-zinc-700"
                    placeholder="Filtrar..."
                  />
                  <div className="max-h-40 overflow-auto">
                    {filteredPlaceholders.map((k, idx) => (
                      <div
                        key={k}
                        onMouseDown={(e) => { e.preventDefault(); insertPlaceholderAtCursor(k) }}
                        className={"px-2 py-1 text-sm cursor-pointer " + (idx === placeholderIndex ? 'bg-indigo-50 dark:bg-indigo-900/30' : '')}
                      >
                        {'{{' + k + '}}'}
                      </div>
                    ))}
                    {!filteredPlaceholders.length && (
                      <div className="px-2 py-2 text-sm text-zinc-500">Sem resultados</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <div className="text-xs mb-1 text-zinc-600 dark:text-zinc-400">Imagem (opcional)</div>
                <div className="rounded-md border border-zinc-300 dark:border-zinc-700 p-3 flex items-center justify-between gap-3">
                  <input type="file" accept="image/*" onChange={(e) => setAttachments(a => ({ ...a, image: e.target.files?.[0] || null }))} />
                  {attachments.image && attachmentUrls.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={attachmentUrls.image} alt="Prévia" className="h-12 w-12 object-cover rounded" />
                  )}
                </div>
                {attachments.image && (
                  <div className="text-xs mt-1 text-zinc-500">{attachments.image.name} — {((attachments.image.size/1024)).toFixed(1)} KB</div>
                )}
              </div>
              <div>
                <div className="text-xs mb-1 text-zinc-600 dark:text-zinc-400">Áudio (opcional)</div>
                <div className="rounded-md border border-zinc-300 dark:border-zinc-700 p-3">
                  <input type="file" accept="audio/*" onChange={(e) => setAttachments(a => ({ ...a, audio: e.target.files?.[0] || null }))} />
                  {attachments.audio && attachmentUrls.audio && (
                    <audio controls className="mt-2 w-full">
                      <source src={attachmentUrls.audio} />
                    </audio>
                  )}
                </div>
                {attachments.audio && (
                  <div className="text-xs mt-1 text-zinc-500">{attachments.audio.name}</div>
                )}
              </div>
              <div>
                <div className="text-xs mb-1 text-zinc-600 dark:text-zinc-400">Documento (opcional)</div>
                <div className="rounded-md border border-zinc-300 dark:border-zinc-700 p-3 flex items-center justify-between gap-3">
                  <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain" onChange={(e) => setAttachments(a => ({ ...a, document: e.target.files?.[0] || null }))} />
                  {attachments.document && attachmentUrls.document && (
                    <a href={attachmentUrls.document} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">Abrir</a>
                  )}
                </div>
                {attachments.document && (
                  <div className="text-xs mt-1 text-zinc-500">{attachments.document.name}</div>
                )}
              </div>
              <div>
                <div className="text-xs mb-1 text-zinc-600 dark:text-zinc-400">Vídeo (opcional)</div>
                <div className="rounded-md border border-zinc-300 dark:border-zinc-700 p-3">
                  <input type="file" accept="video/*" onChange={(e) => setAttachments(a => ({ ...a, video: e.target.files?.[0] || null }))} />
                  {attachments.video && attachmentUrls.video && (
                    <video controls className="mt-2 h-24 w-full">
                      <source src={attachmentUrls.video} />
                    </video>
                  )}
                </div>
                {attachments.video && (
                  <div className="text-xs mt-1 text-zinc-500">{attachments.video.name}</div>
                )}
              </div>
              <div className="md:col-span-2">
                <div className="text-xs mb-1 text-zinc-600 dark:text-zinc-400">Link (opcional)</div>
                <input
                  type="url"
                  value={attachments.link}
                  onChange={(e) => setAttachments(a => ({ ...a, link: e.target.value }))}
                  placeholder="https://exemplo.com"
                  className="p-2 w-full rounded-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700"
                />
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Agendamento</div>
            <input
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-64 p-2  rounded-md border-0 py-1.5 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700"
            />
            <div className="mt-4">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mb-1">Destinatários</div>
              <div className="flex items-center gap-2 mb-2">
                <button type="button" className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700" onClick={() => setSelectedPhones(filteredData.map(r => String(r.telefone || '').trim()).filter(Boolean))}>Selecionar todos (filtrados)</button>
                <button type="button" className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700" onClick={() => setSelectedPhones([])}>Limpar seleção</button>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Selecionados: {selectedPhones.length}</span>
              </div>
              <div className="max-h-48 overflow-auto rounded border border-zinc-200 dark:border-zinc-700">
                {filteredData.map((row, idx) => {
                  const phone = String(row.telefone || '').trim()
                  if (!phone) return null
                  const checked = selectedPhones.includes(phone)
                  return (
                    <label key={`${phone}-${idx}`} className="flex items-center gap-2 px-3 py-1 text-sm">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        const isChecked = e.target.checked
                        setSelectedPhones(prev => isChecked ? Array.from(new Set([...prev, phone])) : prev.filter(p => p !== phone))
                      }} />
                      <span className="text-zinc-900 dark:text-zinc-200">{row.nome_completo || '(Sem nome)'} — {phone}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          <div>Destinatários filtrados: <span className="font-semibold">{affectedCount}</span></div>
          <div>Selecionados: <span className="font-semibold">{selectedPhones.length}</span></div>
          <div className="mt-1">Preview (1º destinatário):</div>
          <div className="mt-1 p-2 rounded border border-zinc-200 dark:border-zinc-700 text-xs whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-900/40">{previewBody || '(Mensagem vazia)'}</div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-colors">
            Preview da mensagem
          </button>
          <button onClick={saveDraft} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-500 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-colors">
            Salvar rascunho
          </button>
          <button onClick={submit} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors">
            <Send className="w-4 h-4" />
            Criar disparo
          </button>
        </div>
      </div>
    </div>
    {previewOpen && (
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/30" onClick={() => setPreviewOpen(false)} />
        <div className="w-full sm:w-[380px] md:w-[420px] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-xl overflow-y-auto">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">Preview da mensagem</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">Mostrando com dados do primeiro destinatário filtrado</div>
            </div>
            <button type="button" className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={() => setPreviewOpen(false)}>Fechar</button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="text-xs mb-1 text-zinc-600 dark:text-zinc-400">Mensagem</div>
              <div className="p-3 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 text-sm whitespace-pre-wrap">{previewBody || '(Mensagem vazia)'}</div>
            </div>
            <div>
              <div className="text-xs mb-1 text-zinc-600 dark:text-zinc-400">Anexos</div>
              <div className="space-y-3">
                {attachments.image && attachmentUrls.image && (
                  <div>
                    <div className="text-xs text-zinc-500">Imagem</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attachmentUrls.image} alt="Imagem" className="mt-1 h-24 w-full object-cover rounded" />
                  </div>
                )}
                {attachments.audio && attachmentUrls.audio && (
                  <div>
                    <div className="text-xs text-zinc-500">Áudio</div>
                    <audio controls className="mt-1 w-full">
                      <source src={attachmentUrls.audio} />
                    </audio>
                  </div>
                )}
                {attachments.video && attachmentUrls.video && (
                  <div>
                    <div className="text-xs text-zinc-500">Vídeo</div>
                    <video controls className="mt-1 w-full">
                      <source src={attachmentUrls.video} />
                    </video>
                  </div>
                )}
                {attachments.document && attachmentUrls.document && (
                  <div>
                    <div className="text-xs text-zinc-500">Documento</div>
                    <a href={attachmentUrls.document} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">{attachments.document.name}</a>
                  </div>
                )}
                {attachments.link && (
                  <div>
                    <div className="text-xs text-zinc-500">Link</div>
                    <a href={attachments.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">{attachments.link}</a>
                  </div>
                )}
                {!attachments.image && !attachments.audio && !attachments.video && !attachments.document && !attachments.link && (
                  <div className="text-xs text-zinc-500">Nenhum anexo selecionado</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  )
}