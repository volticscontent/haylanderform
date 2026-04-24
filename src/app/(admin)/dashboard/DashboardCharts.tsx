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
  Cell,
  LabelList
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
  Users,
  TrendingUp
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { format, subDays, differenceInDays, isWithinInterval, parseISO, startOfDay, endOfDay, startOfMonth } from 'date-fns'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'

const MetaAdsFunnel = dynamic(() => import('../../../components/MetaAdsFunnel'), { ssr: false })

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
  cliente?: boolean | null
}

type DateRange = {
  start: string | null
  end: string | null
}

export default function DashboardCharts({ data }: { data: LeadDashboardRecord[] }) {
  const [filterColumn, setFilterColumn] = useState<'situacao' | 'qualificacao' | 'interesse_ajuda'>('situacao')
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

  // Date Filter State
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })
  const datePickerRef = useRef<HTMLDivElement>(null)

  // Theme Detection for Recharts
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Initial check
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    // Observe class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0)

  // Close date picker when clicking outside
  useOnClickOutside(datePickerRef, () => {
    setShowDatePicker(false)
  })

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
      const interested = dataset.filter(d => {
        const val = String(d.interesse_ajuda || '').toLowerCase();
        return val === 'sim' || val === 'true';
      }).length

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
          return String(d.envio_disparo || '').toLowerCase() === 'concluido'
        }).length,

        interested,
        notInterested: dataset.filter(d => String(d.interesse_ajuda || '').toLowerCase() === 'não').length,
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
      color: 'text-purple-600 dark:text-orange-500',
      bg: 'bg-purple-50 dark:bg-orange-900/20',
      suffix: ''
    },
    {
      title: 'Envios Feitos',
      value: summaryMetrics.current.sentMessages,
      prevValue: summaryMetrics.previous?.sentMessages,
      icon: Send,
      color: 'text-purple-500 dark:text-orange-400',
      bg: 'bg-purple-50 dark:bg-orange-900/10',
      suffix: ''
    },
    {
      title: 'Com Interesse',
      value: summaryMetrics.current.interested,
      prevValue: summaryMetrics.previous?.interested,
      icon: CheckCircle2,
      color: 'text-purple-600 dark:text-orange-500',
      bg: 'bg-purple-100 dark:bg-orange-900/30',
      suffix: ''
    },
    {
      title: 'Sem Interesse',
      value: summaryMetrics.current.notInterested,
      prevValue: summaryMetrics.previous?.notInterested,
      icon: XCircle,
      color: 'text-purple-400 dark:text-orange-300',
      bg: 'bg-purple-50 dark:bg-orange-900/10',
      suffix: ''
    },
    {
      title: 'Conversão',
      value: summaryMetrics.current.conversionRate.toFixed(1),
      prevValue: summaryMetrics.previous?.conversionRate,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-orange-500',
      bg: 'bg-purple-100 dark:bg-orange-900/40',
      suffix: '%'
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
  // Chart colors: Purple for light mode, Orange for dark mode
  const COLORS = isDarkMode
    ? ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#c2410c'] // Orange palette (Dark)
    : ['#8b5cf6', '#7c3aed', '#a78bfa', '#c4b5fd', '#6d28d9']; // Purple palette (Light)

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
      label: `${String(h).padStart(2, '0')}:00`,
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

  // 2c. Leads por Dia (para gráfico de linhas com filtro multi-dia)
  const leadsPorDia = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return []
    const start = parseISO(dateRange.start)
    const end = parseISO(dateRange.end)
    const days = differenceInDays(end, start) + 1
    const counts: Record<string, number> = {}

    filteredData.forEach(rec => {
      const raw = rec.data_cadastro ?? rec.atualizado_em
      if (!raw) return
      const date = typeof raw === 'string' ? parseISO(raw) : new Date(raw)
      const key = format(date, 'dd/MM')
      counts[key] = (counts[key] || 0) + 1
    })

    return Array.from({ length: days }, (_, i) => {
      const day = subDays(end, days - 1 - i)
      const key = format(day, 'dd/MM')
      return { name: key, value: counts[key] || 0 }
    })
  }, [filteredData, dateRange])

  const isMultiDay = !!(
    dateRange.start && dateRange.end &&
    differenceInDays(parseISO(dateRange.end), parseISO(dateRange.start)) > 0
  )
  const lineChartData = isMultiDay ? leadsPorDia : leadsPorHora
  const lineChartTitle = isMultiDay ? 'Leads por Dia' : 'Leads por Horário do Dia'

  return (
    <div className="space-y-6">
      {/* Header / Analytics Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-black dark:text-orange-500" />
                <span className="truncate">
                  {chartType === 'line' ? lineChartTitle : `Distribuição por ${columnLabels[filterColumn]}`}
                </span>
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
                  className={`w-full flex items-center justify-center sm:justify-start gap-2 px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-colors ${dateRange.start || dateRange.end
                    ? 'bg-indigo-50 text-indigo-700 dark:text-orange-500 dark:hover:bg-gray-900 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                    }`}
                >
                  <CalendarIcon className="w-4 h-4 text-indigo-700 dark:text-orange-500" />
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
                  <div className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-[480px] bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col sm:flex-row">
                    {/* Presets Sidebar */}
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-700 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:min-w-[140px]">
                      {[
                        {
                          label: 'Hoje', action: () => {
                            const today = new Date();
                            setDateRange({ start: format(today, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') });
                          }
                        },
                        {
                          label: 'Ontem', action: () => {
                            const yesterday = subDays(new Date(), 1);
                            setDateRange({ start: format(yesterday, 'yyyy-MM-dd'), end: format(yesterday, 'yyyy-MM-dd') });
                          }
                        },
                        {
                          label: 'Últimos 7 dias', action: () => {
                            const end = new Date();
                            const start = subDays(end, 6);
                            setDateRange({ start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') });
                          }
                        },
                        {
                          label: 'Este Mês', action: () => {
                            const today = new Date();
                            const start = startOfMonth(today);
                            setDateRange({ start: format(start, 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') });
                          }
                        },
                        {
                          label: 'Últimos 30 dias', action: () => {
                            const end = new Date();
                            const start = subDays(end, 29);
                            setDateRange({ start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') });
                          }
                        },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={preset.action}
                          className="px-3 py-1.5 text-xs sm:text-sm font-medium text-left rounded-md hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors whitespace-nowrap"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Range Area */}
                    <div className="p-4 flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="date-start" className="block text-xs font-medium text-zinc-500 mb-1">Data Início</label>
                          <input
                            id="date-start"
                            name="date-start"
                            type="date"
                            className="block w-full px-1 rounded-md border-zinc-300 shadow-sm sm:text-sm dark:bg-zinc-800 dark:text-white"
                            value={dateRange.start || ''}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label htmlFor="date-end" className="block text-xs font-medium text-zinc-500 mb-1">Data Fim</label>
                          <input
                            id="date-end"
                            name="date-end"
                            type="date"
                            className="block w-full px-1 rounded-md border-zinc-300 shadow-sm sm:text-sm dark:bg-zinc-800 dark:text-white"
                            value={dateRange.end || ''}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 mt-4">
                        <span className="text-xs text-zinc-400">
                          {dateRange.start && dateRange.end ? (
                            `${differenceInDays(parseISO(dateRange.end), parseISO(dateRange.start)) + 1} dias selecionados`
                          ) : 'Selecione um período'}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setDateRange({ start: null, end: null })
                              // Don't close, just clear
                            }}
                            className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
                          >
                            Limpar
                          </button>
                          <button
                            onClick={() => setShowDatePicker(false)}
                            className="px-3 py-1.5 text-xs bg-indigo-600 dark:bg-orange-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-orange-600 font-medium transition-colors"
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart Type Toggle - Half width on mobile grid row 2 */}
              <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 h-10 sm:h-auto items-center justify-center">
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex-1 sm:flex-none px-3 sm:px-2 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-all h-full flex items-center justify-center ${chartType === 'bar'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                  Barras
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`flex-1 sm:flex-none px-3 sm:px-2 py-1.5 sm:py-1 rounded-md text-xs font-medium transition-all h-full flex items-center justify-center ${chartType === 'line'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                >
                  Linhas
                </button>
              </div>

              {/* Select - Half width on mobile grid row 2 */}
              <select
                id="filter-column"
                name="filter-column"
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value as typeof filterColumn)}
                className="block w-full sm:w-32 rounded-md border-0 py-1.5 pl-3 pr-8 text-zinc-900 ring-1 ring-inset ring-zinc-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:focus:ring-orange-500 sm:text-sm sm:leading-6 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700 h-10 sm:h-auto"
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
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-3">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{label}</p>
                            <div className="flex flex-col">
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-orange-500' : 'text-purple-600'}`}>
                                {payload[0].value} registros
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {filteredData.length > 0 ? ((Number(payload[0].value) / filteredData.length) * 100).toFixed(1) : 0}% do total
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(val: any) => filteredData.length > 0 ? `${((Number(val) / filteredData.length) * 100).toFixed(1)}%` : ''}
                      fontSize={10}
                      fill={isDarkMode ? '#a1a1aa' : '#71717a'}
                    />
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-3">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{label}</p>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-orange-500' : 'text-purple-600'}`}>
                              {payload[0].value} leads
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="linear"
                    dataKey="value"
                    stroke={isDarkMode ? '#f97316' : '#8b5cf6'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: isDarkMode ? '#f97316' : '#8b5cf6', strokeWidth: 0 }}
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
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${(carouselItems[currentSlide].value > (carouselItems[currentSlide].prevValue || 0))
                      ? 'bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400'
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
                  className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-indigo-500 dark:bg-orange-500 w-3' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Static Important Stats */}
          <div className={`${isDarkMode ? 'bg-orange-600' : 'bg-purple-600'} rounded-xl shadow-sm p-4 sm:p-6 text-white relative overflow-hidden`}>
            <div className="relative z-10">
              <h4 className={`${isDarkMode ? 'text-orange-100' : 'text-purple-100'} text-sm font-medium mb-2`}>Envios Pendentes</h4>
              <div className="text-3xl sm:text-4xl font-bold">
                {summaryMetrics.current.pendingSends}
              </div>
              <div className={`mt-2 text-xs ${isDarkMode ? 'text-orange-200' : 'text-purple-200'}`}>
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
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
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
              <Tooltip
                cursor={{ fill: 'transparent' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{label}</p>
                        <div className="flex flex-col">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-orange-500' : 'text-purple-600'}`}>
                            {payload[0].value} leads
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {payload[0].payload.percentual}% do total
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={isDarkMode ? '#f97316' : '#8b5cf6'}>
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(val: any) => (val > 0 && filteredData.length > 0) ? `${((Number(val) / filteredData.length) * 100).toFixed(1)}%` : ''}
                  fontSize={10}
                  fill={isDarkMode ? '#a1a1aa' : '#71717a'}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funil de Conversão (WhatsApp) - Curvo */}
      {(() => {
        const leads = filteredData.length;
        const telefone = filteredData.filter((d: LeadDashboardRecord) => d.telefone && String(d.telefone).trim() !== "").length;
        const interesse = filteredData.filter((d: LeadDashboardRecord) => {
          const val = String(d.interesse_ajuda || '').toLowerCase();
          return val === 'sim' || val === 'true' || !!d.situacao;
        }).length;
        const qualificacao = filteredData.filter((d: LeadDashboardRecord) => {
          const q = String(d.qualificacao || '').toLowerCase();
          const s = String(d.situacao || '').toLowerCase();
          return q.includes('qualificado') || q === 'mql' || q === 'sql' || s === 'qualificado' || d.confirmacao_qualificacao === true;
        }).length;
        const reuniao_agendada = filteredData.filter((d: LeadDashboardRecord) => d.reuniao_agendada === true).length;
        const cliente = filteredData.filter((d: LeadDashboardRecord) => d.cliente === true).length;

        const stages = [
          { label: 'Leads', value: leads },
          { label: 'Telefone', value: telefone },
          { label: 'Interesse', value: interesse },
          { label: 'Qualificação', value: qualificacao },
          { label: 'Reunião agendada', value: reuniao_agendada },
          { label: 'Cliente', value: cliente },
        ];

        return (
          <MetaAdsFunnel
            title="Funil de Conversão (WhatsApp)"
            stages={stages}
            height={260}
            isDarkMode={isDarkMode}
            gradient={isDarkMode ? ["#fb923c", "#ea580c"] : ["#a78bfa", "#7c3aed"]}
          />
        );
      })()}
    </div>
  )
}
