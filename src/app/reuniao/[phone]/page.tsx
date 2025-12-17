"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from 'next/link';
import { Calendar as CalendarIcon, AlertCircle, ArrowRight, ShieldCheck, TrendingUp, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isBefore,
  startOfDay,
  isWeekend
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserData {
  nome_completo: string;
  telefone: string;
  email?: string;
  situacao?: string;
}

const healthData = [
  { subject: 'Regularidade', A: 120, fullMark: 150 },
  { subject: 'Impostos', A: 98, fullMark: 150 },
  { subject: 'Benefícios', A: 86, fullMark: 150 },
  { subject: 'Crédito', A: 99, fullMark: 150 },
  { subject: 'Segurança', A: 85, fullMark: 150 },
  { subject: 'Faturamento', A: 65, fullMark: 150 },
];

// Gerar horários das 08:00 às 19:00
const ALL_TIME_SLOTS = [
  "08:00", "08:30", 
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00"
];

// Horários permitidos (Baseado na regra original + proibição após 18:00)
const isTimeAvailable = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  const timeValue = hour + minute / 60;
  
  // Regras:
  // - Banido após 18:00 (>= 18:00)
  // - Banido antes das 09:00 (< 09:00)
  // - Banido horário de almoço (12:00 - 14:00) - mantendo lógica original
  
  if (timeValue >= 18) return false;
  if (timeValue < 9) return false;
  if (timeValue >= 12 && timeValue < 14) return false;
  
  return true;
};

export default function ReuniaoPage() {
  const { phone } = useParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState("");
  
  // Form state
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const fetchUser = React.useCallback(async () => {
    if (!phone) return;

    try {
      const decodedPhone = decodeURIComponent(String(phone));
      const res = await fetch(`/api/user/${decodedPhone}`);
      if (!res.ok) throw new Error("Usuário não encontrado");
      const data = await res.json();
      setUserData(data);
      if (data.email) setEmail(data.email);
    } catch {
      setError("Não foi possível carregar os dados do usuário.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isWeekendDay = isWeekend(day);
        const isPast = isBefore(day, startOfDay(new Date()));
        const isDisabled = isPast || isWeekendDay;
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <button
            key={day.toString()}
            type="button"
            disabled={isDisabled}
            onClick={() => {
                setSelectedDate(cloneDay);
                setSelectedTime(null); // Reset time when date changes
            }}
            className={`
              relative w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all
              ${!isCurrentMonth ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-700 dark:text-zinc-300"}
              ${isDisabled 
                ? "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-600 cursor-not-allowed" 
                : "hover:bg-indigo-50 dark:hover:bg-indigo-900/30"}
              ${isSelected ? "!bg-indigo-600 !text-white hover:!bg-indigo-700 shadow-lg shadow-indigo-500/30" : ""}
            `}
          >
            {formattedDate}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="flex justify-between mb-2" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <span className="font-bold text-zinc-900 dark:text-white capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
        </div>

        {/* Week Days */}
        <div className="flex justify-between mb-2">
            {weekDays.map((d) => (
                <div key={d} className="w-10 text-center text-xs font-medium text-zinc-400 uppercase">
                    {d}
                </div>
            ))}
        </div>

        {/* Calendar Grid */}
        <div>{rows}</div>
      </div>
    );
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !selectedDate || !selectedTime) return;
    
    setSubmitting(true);
    
    try {
        // Update user data if changed
        const decodedPhone = decodeURIComponent(String(phone));
        const dateStr = format(selectedDate, "dd/MM/yyyy");
        const fullDate = `${dateStr} ${selectedTime}`;
        
        await fetch(`/api/user/${decodedPhone}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email,
                data_reuniao: fullDate
            })
        });

        // Redirect to WhatsApp
        const message = encodeURIComponent(
          `Olá, sou ${userData.nome_completo} (${userData.telefone}).\n` +
          `Gostaria de confirmar meu agendamento para:\n` +
          `📅 *${dateStr}* às *${selectedTime}*\n\n` +
          `Email para contato: ${email}`
        );
        window.location.href = `https://wa.me/553197599216?text=${message}`;
    } catch (error) {
        console.error("Erro ao atualizar dados:", error);
        // Fallback
        const message = encodeURIComponent(
            `Olá, sou ${userData.nome_completo} (${userData.telefone}) e gostaria de agendar uma reunião.`
        );
        window.location.href = `https://wa.me/553197599216?text=${message}`;
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-zinc-500 animate-pulse">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="text-center max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Ops! Algo deu errado</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">{error || "Usuário não encontrado"}</p>
          <Link href="/" className="inline-flex items-center justify-center w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col lg:flex-row">
      
      {/* Left Column - Visuals & Stats */}
      <div className="lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 order-2 lg:order-1">
        <div className="max-w-xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Olá, <span className="text-indigo-600 dark:text-indigo-400">{userData.nome_completo.split(' ')[0]}</span>!
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Analisamos seu perfil e identificamos grandes oportunidades para o seu negócio.
              Agende sua reunião técnica para desbloquear todo o potencial do seu MEI.
            </p>
          </div>

          {/* Chart Card */}
          <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl p-3 border border-zinc-100 dark:border-zinc-800 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Potencial de Crescimento
                </h3>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full uppercase tracking-wide">
                    Alto
                </span>
            </div>
            
            <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={healthData}>
                    <PolarGrid stroke="#e4e4e7" strokeOpacity={0.5} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar
                        name="Seu Negócio"
                        dataKey="A"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fill="#6366f1"
                        fillOpacity={0.3}
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
                    />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-zinc-400 mt-2">
                *Simulação baseada em perfis similares regularizados
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h4 className="font-bold text-zinc-900 dark:text-white">Blindagem</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Evite multas e bloqueios da Receita Federal.</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-3" />
                <h4 className="font-bold text-zinc-900 dark:text-white">Crédito</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Acesso facilitado a empréstimos bancários.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Action Form */}
      <div className="lg:w-1/2 bg-zinc-50 dark:bg-zinc-950 lg:p-12 flex flex-col justify-center order-1 lg:order-2 overflow-y-auto">
        <div className="max-w-full w-full">
            <div className="bg-white dark:bg-zinc-900 shadow-xl p-8 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Agendamento rápido</h2>
                        <p className="text-sm text-zinc-500">Selecione o melhor horário para você</p>
                    </div>
                </div>

                <form onSubmit={handleSchedule} className="space-y-6">
                    {/* Calendar Section */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                            1. Escolha a Data
                        </label>
                        {renderCalendar()}
                    </div>

                    {/* Time Slots Section */}
                    {selectedDate && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                                2. Escolha o Horário
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {ALL_TIME_SLOTS.map((time) => {
                                    const isAvailable = isTimeAvailable(time);
                                    const isSelected = selectedTime === time;
                                    
                                    return (
                                        <button
                                            key={time}
                                            type="button"
                                            disabled={!isAvailable}
                                            onClick={() => setSelectedTime(time)}
                                            className={`
                                                py-2 px-2 rounded-lg text-xs font-medium transition-all border
                                                ${isSelected 
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                                                    : isAvailable
                                                        ? "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                        : "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"}
                                            `}
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                            3. Confirme seu E-mail
                        </label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                            placeholder="exemplo@email.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !selectedDate || !selectedTime || !email}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Agendando...
                            </>
                        ) : (
                            <>
                                Confirmar Agendamento
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-xs text-zinc-400 mt-4">
                        O link da reunião será enviado para seu WhatsApp.
                    </p>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
