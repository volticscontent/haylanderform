'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar, List, User, Building, Phone, Clock, ChevronLeft, ChevronRight, Video, CalendarDays } from 'lucide-react'
import { ChatAvatar } from '@/components/chat/ChatAvatar'

export interface Reuniao {
  id: string
  telefone: string | null
  nome_completo: string | null
  razao_social: string | null
  cnpj: string | null
  data_reuniao: string
  status_atendimento: string | null
  servico: string | null
}

function ReuniaoCard({ reuniao, upcoming }: { reuniao: Reuniao; upcoming: boolean }) {
  const dt = new Date(reuniao.data_reuniao)
  return (
    <div className={`group bg-white dark:bg-zinc-900 rounded-2xl border p-4 flex items-start justify-between gap-4 transition-all hover:shadow-md ${upcoming 
        ? 'border-zinc-200 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-orange-500/50' 
        : 'border-zinc-100 dark:border-zinc-800/50 opacity-60'
      }`}>
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-3 font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-orange-500 transition-colors">
          <ChatAvatar
            chatId={reuniao.telefone || ''}
            name={reuniao.nome_completo || ''}
            size={36}
            className="text-[10px]"
          />
          {reuniao.nome_completo || 'Sem nome'}
        </div>
        {reuniao.razao_social && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Building className="w-3 h-3" /> {reuniao.razao_social}
            {reuniao.cnpj && <span className="font-mono text-xs">· {reuniao.cnpj}</span>}
          </div>
        )}
        {reuniao.telefone && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Phone className="w-3 h-3" /> {reuniao.telefone}
          </div>
        )}
        {reuniao.servico && (
          <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 dark:bg-orange-950/20 dark:text-orange-400 px-2.5 py-1 rounded-lg mt-2 font-medium border border-purple-100 dark:border-orange-500/10">
            <Video className="w-3 h-3" />
            {reuniao.servico}
          </span>
        )}
      </div>
      <div className="text-right shrink-0 space-y-3">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-sm font-bold text-purple-600 dark:text-orange-500">
            <Clock className="w-4 h-4" />
            {dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-white">
            {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        {reuniao.telefone && (
          <Link href={`/reuniao/${reuniao.telefone}`} className="inline-flex items-center px-3 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-purple-600 dark:hover:bg-orange-500 hover:text-white dark:hover:text-white transition-all">
            Reagendar
          </Link>
        )}
      </div>
    </div>
  )
}

function CalendarView({ reunioes }: { reunioes: Reuniao[] }) {
  const hoje = new Date()
  const [viewDate, setViewDate] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<number | null>(hoje.getDate())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const byDay = new Map<string, Reuniao[]>()
  for (const r of reunioes) {
    const d = new Date(r.data_reuniao)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(r)
  }

  const selectedKey = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null
  const selectedReunions = selectedKey ? (byDay.get(selectedKey) ?? []) : []

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-zinc-500" />
          </button>
          <span className="font-semibold text-zinc-900 dark:text-white">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ChevronRight className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
          {DAYS.map(d => <div key={d} className="py-2">{d}</div>)}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-12 border-b border-r border-zinc-50 dark:border-zinc-800/50 last:border-r-0" />
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayReunions = byDay.get(key) ?? []
            const isToday = day === hoje.getDate() && month === hoje.getMonth() && year === hoje.getFullYear()
            const isSelected = day === selectedDay
            const hasFuture = dayReunions.some(r => new Date(r.data_reuniao) >= hoje)
            const hasPast = dayReunions.some(r => new Date(r.data_reuniao) < hoje)

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`h-16 flex flex-col items-center justify-center gap-0.5 border-b border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 transition-all relative
                  ${isSelected ? 'bg-purple-50 dark:bg-orange-950/20' : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'}
                `}
              >
                <span className={`text-sm w-8 h-8 flex items-center justify-center rounded-xl font-bold transition-all
                  ${isToday ? 'bg-purple-600 dark:bg-orange-500 text-white shadow-lg shadow-purple-200 dark:shadow-orange-900/20' : isSelected ? 'text-purple-700 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'}
                `}>
                  {day}
                </span>
                {dayReunions.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {hasFuture && <span className="w-1 h-1 rounded-full bg-purple-500 dark:bg-orange-500" />}
                    {hasPast && <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <CalendarDays className="w-4 h-4 text-purple-600 dark:text-orange-500" />
            {selectedDay} de {MONTHS[month]}
            {selectedReunions.length === 0 && <span className="ml-2 font-normal text-zinc-400">— sem reuniões</span>}
          </h3>
          {selectedReunions
            .sort((a, b) => new Date(a.data_reuniao).getTime() - new Date(b.data_reuniao).getTime())
            .map(r => (
              <ReuniaoCard key={r.id} reuniao={r} upcoming={new Date(r.data_reuniao) >= hoje} />
            ))}
        </div>
      )}
    </div>
  )
}

export function ReuniaoView({ reunioes }: { reunioes: Reuniao[] }) {
  const [view, setView] = useState<'lista' | 'calendario'>('lista')
  const agora = new Date()
  const futuras = reunioes.filter(r => new Date(r.data_reuniao) >= agora)
  const passadas = reunioes.filter(r => new Date(r.data_reuniao) < agora)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-orange-950/30 rounded-2xl">
              <Calendar className="w-7 h-7 text-purple-600 dark:text-orange-500" />
            </div> 
            Reuniões
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Gerencie sua agenda de atendimentos e compromissos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{futuras.length} próximas</span>
            <span className="text-xs text-zinc-500">{passadas.length} realizadas</span>
          </div>
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setView('lista')}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${view === 'lista'
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-orange-500 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
            >
              <List className="w-4 h-4" /> Lista
            </button>
            <button
              onClick={() => setView('calendario')}
              className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${view === 'calendario'
                ? 'bg-white dark:bg-zinc-900 text-purple-600 dark:text-orange-500 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
            >
              <Calendar className="w-4 h-4" /> Calendário
            </button>
          </div>
        </div>
      </div>

      {reunioes.length === 0 && (
        <p className="text-zinc-400 text-sm">Nenhuma reunião agendada.</p>
      )}

      {view === 'lista' ? (
        <div className="space-y-6">
          {futuras.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Próximas</h2>
              {futuras.map(r => <ReuniaoCard key={r.id} reuniao={r} upcoming />)}
            </section>
          )}
          {passadas.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Realizadas / Passadas</h2>
              {passadas.map(r => <ReuniaoCard key={r.id} reuniao={r} upcoming={false} />)}
            </section>
          )}
        </div>
      ) : (
        <CalendarView reunioes={reunioes} />
      )}
    </div>
  )
}
