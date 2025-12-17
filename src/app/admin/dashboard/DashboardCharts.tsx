'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Send,
  Users
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { format, subDays, differenceInDays, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'

const MetaAdsFunnel = dynamic(() => import('@/components/MetaAdsFunnel'), { ssr: false })

type LeadDashboardRecord = {
  telefone: string | null
  nome_completo: string | null
  cnpj: string | null
  calculo_parcelamento: string | null
  data_cadastro?: string | Date | null
  atualizado_em: string | Date | null
  envio_disparo: string | null
  situacao: string | null
  qualificacao: string | null
  interesse_ajuda: string | null
  confirmacao_qualificacao?: boolean | null
  reuniao_agendada?: boolean | null
  vendido?: boolean | null
}

type DateRange = {
  start: string | null
  end: string | null
}

export default function DashboardCharts({ data }: { data: LeadDashboardRecord[] }) {
  const [filterColumn, setFilterColumn] = useState<'envio_disparo' | 'situacao' | 'qualificacao' | 'interesse_ajuda'>('envio_disparo')
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')
  
  // Date Filter State
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })
  const datePickerRef = useRef<HTMLDivElement>(null)

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [datePickerRef])

  // 1. Filter Data by Date
  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (!dateRange.start && !dateRange.end) return true
      if (!row.atualizado_em) return false

      const rowDate = new Date(row.atualizado_em)
      const rowDateStr = rowDate.toISOString().split('T')[0]

      if (dateRange.start && rowDateStr < dateRange.start) return false
      if (dateRange.end && rowDateStr > dateRange.end) return false
      
      return true
    })
  }, [data, dateRange])

  // 2. Aggregate data for the chart
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {}
    
    filteredData.forEach(row => {
      // Get the value for the selected column, default to 'Não informado' if null/empty
      const value = (row[filterColumn] as string) || 'Não informado'
      counts[value] = (counts[value] || 0) + 1
    })

    return (Object.entries(counts)
      .map(([name, value]) => ({ name, value })) as { name: string; value: number }[])
      .sort((a, b) => b.value - a.value) // Sort by count descending
  }, [filteredData, filterColumn])

  // 3. Calculate Summary Metrics (Current vs Previous Period)
  const summaryMetrics = useMemo(() => {
    // Helper to count metrics
    const calculateMetrics = (dataset: LeadDashboardRecord[]) => {
      const totalLeads = dataset.length
      const interested = dataset.filter(d => d.interesse_ajuda === 'Sim').length

      return {
        totalLeads,
        // Envio Pendente: a1, a2, a3 or 'Pendente' (if explicitly marked) or null/undefined
        // User Logic: a1, a2, a3 = pending. 
        // If completed, it should be something else.
        // We assume anything NOT a1, a2, a3, Pendente, error is "Feito" (Sent)
        pendingSends: dataset.filter(d => {
            const status = d.envio_disparo
            return !status || status === 'Pendente' || ['a1', 'a2', 'a3'].includes(status)
        }).length,
        
        sentMessages: dataset.filter(d => {
            const status = d.envio_disparo
            // Sent if status is 'concluido' (case insensitive)
            // or if it's not pending/error/null and explicitly marked as sent in some way?
            // User said: "Se a1, a2, a3 estão ativados que dizer que tem envios pendentes se estiver como concluido ai sim você não precisa marcar envio pendente mais envio concluido"
            // So 'concluido' is the key.
            return status && (status.toLowerCase() === 'concluido' || (!['Pendente', 'error', 'a1', 'a2', 'a3'].includes(status)))
        }).length,

        interested,
        notInterested: dataset.filter(d => d.interesse_ajuda === 'Não').length,
        conversionRate: totalLeads > 0 ? (interested / totalLeads) * 100 : 0
      }
    }

    const current = calculateMetrics(filteredData)
    
    // Previous Period Calculation
    let previous: ReturnType<typeof calculateMetrics> | null = null
    
    if (dateRange.start && dateRange.end) {
      const start = parseISO(dateRange.start)
      const end = parseISO(dateRange.end)
      const daysDiff = differenceInDays(end, start) + 1
      
      const prevStart = subDays(start, daysDiff)
      const prevEnd = subDays(end, daysDiff)
      
      const prevData = data.filter(row => {
        if (!row.atualizado_em) return false
        const rowDate = new Date(row.atualizado_em)
        return isWithinInterval(rowDate, { start: startOfDay(prevStart), end: endOfDay(prevEnd) })
      })
      
      previous = calculateMetrics(prevData)
    }

    return { current, previous }
  }, [filteredData, data, dateRange])

  // Carousel Items
  const carouselItems = [
    {
      title: 'Novos Leads',
      value: summaryMetrics.current.totalLeads,
      prevValue: summaryMetrics.previous?.totalLeads,
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      suffix: ''
    },
    {
      title: 'Envios Feitos',
      value: summaryMetrics.current.sentMessages,
      prevValue: summaryMetrics.previous?.sentMessages,
      icon: Send,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      suffix: ''
    },
    {
      title: 'Com Interesse',
      value: summaryMetrics.current.interested,
      prevValue: summaryMetrics.previous?.interested,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      suffix: ''
    },
    {
      title: 'Sem Interesse',
      value: summaryMetrics.current.notInterested,
      prevValue: summaryMetrics.previous?.notInterested,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      suffix: ''
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)
  }

  const CurrentIcon = carouselItems[currentSlide].icon

  // Chart colors based on value (simplified palette)
  const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#10b981', '#06b6d4']

  const columnLabels = {
    envio_disparo: 'Status de Envio',
    situacao: 'Situação',
    qualificacao: 'Qualificação',
    interesse_ajuda: 'Interesse'
  }

  // 2b. Leads por Horário (usando data_cadastro quando disponível)
  const leadsPorHora = useMemo(() => {
    const horasBase = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2,'0')}:00`,
      count: 0,
    }))

    filteredData.forEach(rec => {
      const raw = rec.data_cadastro ?? rec.atualizado_em
      if (!raw) return
      const date = typeof raw === 'string' ? parseISO(raw) : new Date(raw)
      const h = date.getHours()
      if (h >= 0 && h < 24) horasBase[h].count += 1
    })

    const total = filteredData.length || 1
    return horasBase.map(item => ({
      name: item.label,
      value: item.count,
      percentual: Math.round((item.count / total) * 1000) / 10,
    }))
  }, [filteredData])

  return (
    <div className="space-y-6">
      {/* Header / Analytics Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <span className="truncate">Distribuição por {columnLabels[filterColumn]}</span>
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Visualizando {filteredData.length} registros
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Date Filter Button - Full width on mobile grid row 1 */}
              <div className="relative col-span-2 sm:col-span-1 w-full sm:w-auto" ref={datePickerRef}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`w-full flex items-center justify-center sm:justify-start gap-2 px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateRange.start || dateRange.end 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                      : 'bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  {dateRange.start ? (
                    <span className="truncate">
                      {format(parseISO(dateRange.start), 'dd/MM')} 
                      {dateRange.end ? ` - ${format(parseISO(dateRange.end), 'dd/MM')}` : ''}
                    </span>
                  ) : (
                    'Filtrar Data'
                  )}
                </button>

                {showDatePicker && (
                  <div className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-72 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Data Início</label>
                        <input 
                          type="date" 
                          className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                          value={dateRange.start || ''}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Data Fim</label>
                        <input 
                          type="date" 
                          className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                          value={dateRange.end || ''}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button 
                          onClick={() => {
                            setDateRange({ start: null, end: null })
                            setShowDatePicker(false)
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Limpar Filtros
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart Type Toggle - Half width on mobile grid row 2 */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 h-10 sm:h-auto items-center justify-center">
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex-1 sm:flex-none px-3 sm:px-2 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-all h-full flex items-center justify-center ${
                    chartType === 'bar' 
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Barras
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`flex-1 sm:flex-none px-3 sm:px-2 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-all h-full flex items-center justify-center ${
                    chartType === 'line' 
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Linhas
                </button>
              </div>

              {/* Select - Half width on mobile grid row 2 */}
              <select
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value as typeof filterColumn)}
                className="block w-full sm:w-32 rounded-md border-0 py-1.5 pl-3 pr-8 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 h-10 sm:h-auto"
              >
                <option value="envio_disparo">Envio</option>
                <option value="situacao">Situação</option>
                <option value="qualificacao">Qualif.</option>
                <option value="interesse_ajuda">Interesse</option>
              </select>
            </div>
          </div>

          <div className="h-[280px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} className="dark:opacity-10" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: '#18181b'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} className="dark:opacity-10" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      color: '#18181b'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats / Summary Card (Mini Analytics) */}
        <div className="space-y-6 flex flex-col h-full">
          {/* Quick Summary Carousel */}
          <div className="sm:hidden bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
            <h4 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-3">Resumo Rápido</h4>
            <div className="grid grid-cols-2 gap-3">
              {carouselItems.map((item, idx) => {
                const IconEl = item.icon
                return (
                  <div key={idx} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 flex items-center gap-3">
                    <div className={`p-2 rounded-full ${item.bg} ${item.color}`}>
                      <IconEl className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{item.title}</div>
                      <div className="text-xl font-bold text-zinc-900 dark:text-white">{item.value}{item.suffix}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="hidden sm:flex bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 flex-1 flex-col">
            <div className="flex justify-between items-center mb-4">
               <h4 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Resumo Rápido</h4>
               <div className="hidden sm:flex gap-1">
                 <button 
                   onClick={prevSlide}
                   className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                 >
                   <ChevronLeft className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={nextSlide}
                   className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                 >
                   <ChevronRight className="w-4 h-4" />
                 </button>
               </div>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
               {/* Carousel Content */}
               <div className="w-full animate-in fade-in slide-in-from-right duration-300" key={currentSlide}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-full ${carouselItems[currentSlide].bg} ${carouselItems[currentSlide].color}`}>
                      <CurrentIcon className="w-6 h-6" />
                    </div>
                    <h5 className="text-zinc-600 dark:text-zinc-300 font-medium">{carouselItems[currentSlide].title}</h5>
                    <div className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      {carouselItems[currentSlide].value}{carouselItems[currentSlide].suffix}
                    </div>
                    
                    {/* Comparison Badge */}
                    {summaryMetrics.previous && (
                      <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        (carouselItems[currentSlide].value > (carouselItems[currentSlide].prevValue || 0)) 
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : (carouselItems[currentSlide].value < (carouselItems[currentSlide].prevValue || 0))
                          ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {(carouselItems[currentSlide].value > (carouselItems[currentSlide].prevValue || 0)) ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (carouselItems[currentSlide].value < (carouselItems[currentSlide].prevValue || 0)) ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <span>=</span>
                        )}
                        {carouselItems[currentSlide].prevValue !== undefined && carouselItems[currentSlide].prevValue !== 0 ? (
                          <span>
                            {Math.abs(Math.round(((carouselItems[currentSlide].value - carouselItems[currentSlide].prevValue) / carouselItems[currentSlide].prevValue) * 100))}%
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                        <span className="opacity-60 ml-1">vs anterior</span>
                      </div>
                    )}
                  </div>
               </div>
            </div>
            
            {/* Pagination Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {carouselItems.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentSlide ? 'bg-indigo-500 w-3' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Static Important Stats */}
          <div className="bg-indigo-600 rounded-xl shadow-sm p-4 sm:p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-indigo-100 text-sm font-medium mb-2">Envios Pendentes</h4>
              <div className="text-3xl sm:text-4xl font-bold">
                {summaryMetrics.current.pendingSends}
              </div>
              <div className="mt-2 text-xs text-indigo-200">
                Aguardando disparo (a1, a2, a3)
              </div>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10">
              <Send className="w-24 h-24 sm:w-32 sm:h-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Leads por Horário */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Leads por Horário</h3>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{filteredData.length} registros considerados</span>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadsPorHora} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} className="dark:opacity-10" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#18181b' }} />
              <Bar dataKey="value" radius={[4,4,0,0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funil de Conversão (WhatsApp) - Curvo */}
      {(() => {
        const leads = filteredData.length;
        const telefone = filteredData.filter((d: LeadDashboardRecord) => d.telefone && String(d.telefone).trim() !== "").length;
        const interesse = filteredData.filter((d: LeadDashboardRecord) => String(d.interesse_ajuda || '').toLowerCase() === 'sim').length;
        const qualificacao = filteredData.filter((d: LeadDashboardRecord) => {
          const q = String(d.qualificacao || '').toLowerCase();
          return q.includes('qualificado') || d.confirmacao_qualificacao === true;
        }).length;
        const reuniao_agendada = filteredData.filter((d: LeadDashboardRecord) => d.reuniao_agendada === true).length;
        const vendido = filteredData.filter((d: LeadDashboardRecord) => d.vendido === true).length;

        const stages = [
          { label: 'Leads', value: leads },
          { label: 'Telefone', value: telefone },
          { label: 'Interesse', value: interesse },
          { label: 'Qualificação', value: qualificacao },
          { label: 'Reunião agendada', value: reuniao_agendada },
          { label: 'Vendido', value: vendido },
        ];

        return (
          <MetaAdsFunnel
            title="Funil de Conversão (WhatsApp)"
            stages={stages}
            height={260}
            gradient={["#2e7cf6", "#6b5dfc"]}
            dark
          />
        );
      })()}
    </div>
  )
}
