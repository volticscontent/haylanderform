'use client'

import { useState, useMemo } from 'react'
import { Meeting } from './actions'
import { 
  format, 
  parse, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Phone, FileText } from 'lucide-react'

interface MeetingsViewProps {
  initialMeetings: Meeting[]
}

export function MeetingsView({ initialMeetings }: MeetingsViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Parse meetings with valid dates
  const parsedMeetings = useMemo(() => {
    return initialMeetings.map(meeting => {
      try {
        // Format stored is "dd/MM/yyyy HH:mm"
        const parsedDate = parse(meeting.data_reuniao, 'dd/MM/yyyy HH:mm', new Date())
        return {
          ...meeting,
          parsedDate
        }
      } catch {
        return null
      }
    }).filter((m): m is (Meeting & { parsedDate: Date }) => m !== null)
  }, [initialMeetings])

  // Calendar generation
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    return eachDayOfInterval({
      start: startDate,
      end: endDate
    })
  }, [currentDate])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  // Filter meetings for selected day
  const selectedDayMeetings = parsedMeetings.filter(m => 
    isSameDay(m.parsedDate, selectedDate)
  ).sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())

  // Group meetings by day for indicators
  const meetingsByDay = useMemo(() => {
    const groups: Record<string, number> = {}
    parsedMeetings.forEach(m => {
      const key = format(m.parsedDate, 'yyyy-MM-dd')
      groups[key] = (groups[key] || 0) + 1
    })
    return groups
  }, [parsedMeetings])

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-6 px-5 pt-15">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <CalendarIcon className="w-8 h-8" />
          Atendimentos Agendados
        </h1>
        <button 
          onClick={goToToday}
          className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
        >
          Hoje
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        {/* Calendar Section */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
          {/* Calendar Header */}
          <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <div className="flex items-center gap-1">
              <button 
                onClick={prevMonth}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-zinc-200 dark:bg-zinc-800 gap-px">
            {days.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd')
              const meetingCount = meetingsByDay[dayStr] || 0
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isTodayDate = isToday(day)

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative p-2 flex flex-col items-start justify-start transition-colors
                    ${isCurrentMonth ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-950/50 text-zinc-400'}
                    ${isSelected ? '!bg-indigo-50 dark:!bg-indigo-900/20 ring-1 ring-inset ring-indigo-500 z-10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
                  `}
                >
                  <span className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${isTodayDate ? 'bg-indigo-600 text-white' : 'text-zinc-700 dark:text-zinc-300'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {meetingCount > 0 && (
                    <div className="mt-auto w-full flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {meetingCount} {meetingCount === 1 ? 'reunião' : 'reuniões'}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="w-full lg:w-96 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {selectedDayMeetings.length} agendamentos
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedDayMeetings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
                <CalendarIcon size={48} className="opacity-20" />
                <p>Nenhum agendamento para este dia</p>
              </div>
            ) : (
              selectedDayMeetings.map((meeting) => (
                <div 
                  key={meeting.id}
                  className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                      <Clock size={16} />
                      {format(meeting.parsedDate, 'HH:mm')}
                    </div>
                    {/* Link to chat? */}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-100 font-medium">
                      <User size={16} className="text-zinc-400" />
                      {meeting.nome_completo || 'Sem nome'}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <Phone size={16} className="text-zinc-400" />
                      {meeting.telefone}
                    </div>

                    {meeting.observacoes && (
                      <div className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
                        <FileText size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                        <p className="line-clamp-2">{meeting.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
