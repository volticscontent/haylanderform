'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar, List, User, Building, Phone, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

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
    <div className={`bg-white dark:bg-zinc-900 rounded-xl border p-4 flex items-start justify-between gap-4 ${
      upcoming ? 'border-indigo-200 dark:border-indigo-800' : 'border-zinc-200 dark:border-zinc-800 opacity-60'
    }`}>
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-white">
          <User className="w-4 h-4 text-zinc-400" />
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
          <span className="inline-block text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-0.5 rounded-full mt-1">
            {reuniao.servico}
          </span>
        )}
      </div>
      <div className="text-right shrink-0 space-y-2">
        <div className="flex items-center gap-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">
          <Clock className="w-4 h-4" />
          <div>
            <div>{dt.toLocaleDateString('pt-BR')}</div>
            <div className="text-xs text-zinc-500">{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        {reuniao.telefone && (
          <Link href={`/reuniao/${reuniao.telefone}`} className="block text-xs text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 underline">
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
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

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
                className={`h-12 flex flex-col items-center justify-center gap-0.5 border-b border-r border-zinc-50 dark:border-zinc-800/50 last:border-r-0 transition-colors relative
                  ${isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
                `}
              >
                <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium
                  ${isToday ? 'bg-indigo-600 text-white' : isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}
                `}>
                  {day}
                </span>
                {dayReunions.length > 0 && (
                  <div className="flex gap-0.5">
                    {hasFuture && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    {hasPast && <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />}
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
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
            {selectedDay} de {MONTHS[month]}
            {selectedReunions.length === 0 && <span className="ml-2 font-normal normal-case text-zinc-400">— sem reuniões</span>}
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" /> Reuniões
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{futuras.length} próximas · {passadas.length} realizadas</span>
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <button
              onClick={() => setView('lista')}
              className={`px-3 py-1.5 flex items-center gap-1.5 text-sm transition-colors ${
                view === 'lista'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <List className="w-4 h-4" /> Lista
            </button>
            <button
              onClick={() => setView('calendario')}
              className={`px-3 py-1.5 flex items-center gap-1.5 text-sm transition-colors ${
                view === 'calendario'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
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
