"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from 'next/link';
import { Calendar as CalendarIcon, AlertCircle, ArrowRight, ShieldCheck, TrendingUp, DollarSign, ChevronLeft, ChevronRight, Building2, MessageSquare } from "lucide-react";
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
  cnpj?: string;
  tipo_negocio?: string;
  possui_divida?: string;
  tipo_divida?: string;
  valor_divida_municipal?: string;
  valor_divida_estadual?: string;
  valor_divida_federal?: string;
  valor_divida_ativa?: string;
  faturamento_mensal?: string;
  possui_socio?: boolean;
  interesse_ajuda?: string;
  observacoes?: string;
  calculo_parcelamento?: string;
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
  const [debts, setDebts] = useState<{ id: string; origin: string; value: string }[]>([]);
  const [parcelas, setParcelas] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    cnpj: "",
    tipo_negocio: "",
    possui_divida: "",
    tipo_divida: "",
    tempo_divida: "",
    faturamento_mensal: "",
    possui_socio: "",
    interesse_ajuda: "",
    observacoes: "",
    calculo_parcelamento: "",
  });

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
      
      const loadedDebts = [];
      if (data.valor_divida_municipal) loadedDebts.push({ id: crypto.randomUUID(), origin: 'Municipal', value: data.valor_divida_municipal });
      if (data.valor_divida_estadual) loadedDebts.push({ id: crypto.randomUUID(), origin: 'Estadual', value: data.valor_divida_estadual });
      if (data.valor_divida_federal) loadedDebts.push({ id: crypto.randomUUID(), origin: 'Federal', value: data.valor_divida_federal });
      if (data.valor_divida_ativa) loadedDebts.push({ id: crypto.randomUUID(), origin: 'Ativa', value: data.valor_divida_ativa });
      setDebts(loadedDebts);

      setFormData(prev => ({
        ...prev,
        cnpj: data.cnpj || "",
        tipo_negocio: data.tipo_negocio || "",
        possui_divida: (data.tipo_divida || loadedDebts.length > 0) ? "Sim" : "",
        tipo_divida: data.tipo_divida || "",
        faturamento_mensal: data.faturamento_mensal || "",
        possui_socio: data.possui_socio === true ? "Sim" : (data.possui_socio === false ? "Não" : ""),
        interesse_ajuda: data.interesse_ajuda || "",
        observacoes: data.observacoes || "",
        calculo_parcelamento: data.calculo_parcelamento || "",
      }));
    } catch {
      setError("Não foi possível carregar os dados do usuário.");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  // Calculate total debt and installments
  useEffect(() => {
    const totalValue = debts.reduce((acc, debt) => {
      if (!debt.value) return acc;
      const cleanValue = debt.value.replace(/[^\d,]/g, '').replace(',', '.');
      const numericValue = parseFloat(cleanValue);
      return acc + (isNaN(numericValue) ? 0 : numericValue);
    }, 0);

    if (totalValue <= 0) {
      setParcelas([]);
      return;
    }

    const options = [12, 24, 36, 48, 60].map(months => {
      const installmentValue = totalValue / months;
      return `${months}x de ${installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    });
    setParcelas(options);
  }, [debts]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDebt = () => {
    setDebts([...debts, { id: crypto.randomUUID(), origin: "", value: "" }]);
  };

  const handleRemoveDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  const handleDebtChange = (id: string, field: 'origin' | 'value', value: string) => {
    setDebts(debts.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

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
        const decodedPhone = decodeURIComponent(String(phone));
        const dateStr = format(selectedDate, "dd/MM/yyyy");
        const fullDate = `${dateStr} ${selectedTime}`;
        
        let obsFinal = formData.observacoes;
        if (formData.possui_divida === "Sim" && formData.tempo_divida) {
            obsFinal = `${obsFinal ? obsFinal + "\n" : ""}Tempo da dívida: ${formData.tempo_divida}`;
        }

        const payload: Record<string, any> = {
            email,
            data_reuniao: fullDate,
            cnpj: formData.cnpj,
            tipo_negocio: formData.tipo_negocio,
            faturamento_mensal: formData.faturamento_mensal,
            possui_socio: formData.possui_socio === "Sim" ? true : (formData.possui_socio === "Não" ? false : null),
            interesse_ajuda: formData.interesse_ajuda,
            observacoes: obsFinal,
            calculo_parcelamento: formData.calculo_parcelamento
        };

        if (formData.possui_divida === "Sim") {
            payload.tipo_divida = formData.tipo_divida;
            payload.valor_divida_municipal = null;
            payload.valor_divida_estadual = null;
            payload.valor_divida_federal = null;
            payload.valor_divida_ativa = null;

            debts.forEach(debt => {
                if (debt.origin === "Municipal") payload.valor_divida_municipal = debt.value;
                if (debt.origin === "Estadual") payload.valor_divida_estadual = debt.value;
                if (debt.origin === "Federal") payload.valor_divida_federal = debt.value;
                if (debt.origin === "Ativa") payload.valor_divida_ativa = debt.value;
            });
        }
        
        await fetch(`/api/user/${decodedPhone}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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

                    {/* Qualification Fields */}
                    {selectedDate && selectedTime && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6 mt-6">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                                3. Qualifique seu negócio
                            </label>

                            {/* CNPJ */}
                            <div className="space-y-2">
                                <label htmlFor="cnpj" className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">CNPJ</label>
                                <input
                                    type="text"
                                    id="cnpj"
                                    name="cnpj"
                                    required={!userData?.cnpj}
                                    value={formData.cnpj}
                                    onChange={handleChange}
                                    placeholder="00.000.000/0000-00"
                                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            {/* Tipo de Negócio */}
                            <div className="space-y-2">
                                <label htmlFor="tipo_negocio" className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">Qual é o tipo de negócio?</label>
                                <select
                                    id="tipo_negocio"
                                    name="tipo_negocio"
                                    required={!userData?.tipo_negocio}
                                    value={formData.tipo_negocio}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none appearance-none dark:text-white"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="MEI">MEI</option>
                                    <option value="Simples Nacional">Simples Nacional</option>
                                    <option value="Lucro Presumido">Lucro Presumido</option>
                                    <option value="Lucro Real">Lucro Real</option>
                                    <option value="Outros">Outros</option>
                                </select>
                            </div>

                            {/* Dívida */}
                            <div className="space-y-4 p-4 lg:p-6 bg-zinc-100 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <label className="text-lg font-bold text-zinc-800 dark:text-zinc-300 block">Você possui dívida?</label>
                                <div className="flex gap-4">
                                    {["Sim", "Não"].map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                        type="radio"
                                        name="possui_divida"
                                        value={opt}
                                        checked={formData.possui_divida === opt}
                                        onChange={() => handleRadioChange("possui_divida", opt)}
                                        className="w-4 h-4 text-zinc-800 focus:ring-zinc-100"
                                        />
                                        <span className="text-zinc-800 dark:text-zinc-300">{opt}</span>
                                    </label>
                                    ))}
                                </div>

                                {formData.possui_divida === "Sim" && (
                                    <div className="space-y-4 mt-4 pl-4 border-l-2 border-red-500 dark:border-zinc-900 animate-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">Qual é o tipo de dívida?</label>
                                        <select
                                            name="tipo_divida"
                                            value={formData.tipo_divida}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Não Ajuizada">Não Ajuizada (Cobrança judicial não iniciada)</option>
                                            <option value="Ajuizada">Ajuizada (Execução fiscal iniciada)</option>
                                            <option value="Tributaria">Tributária</option>
                                            <option value="Não tributaria">Não tributária</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">Dívidas:</label>
                                        {debts.map((debt) => (
                                        <div key={debt.id} className="flex gap-4 items-start p-4 bg-white dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                            <div className="flex-1 space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-zinc-800 uppercase">Origem</label>
                                                <select
                                                value={debt.origin}
                                                onChange={(e) => handleDebtChange(debt.id, 'origin', e.target.value)}
                                                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none dark:text-white"
                                                >
                                                <option value="">Selecione...</option>
                                                <option value="Municipal">Municipal</option>
                                                <option value="Estadual">Estadual</option>
                                                <option value="Federal">Federal</option>
                                                <option value="Ativa">Ativa</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-zinc-800 uppercase">Valor</label>
                                                <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                <input
                                                    type="text"
                                                    value={debt.value}
                                                    onChange={(e) => handleDebtChange(debt.id, 'value', e.target.value)}
                                                    placeholder="R$ 0,00"
                                                    className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none dark:text-white"
                                                />
                                                </div>
                                            </div>
                                            </div>
                                            <button
                                            type="button"
                                            onClick={() => handleRemoveDebt(debt.id)}
                                            className="mt-6 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                            </button>
                                        </div>
                                        ))}

                                        <button
                                        type="button"
                                        onClick={handleAddDebt}
                                        className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-400 hover:text-zinc-700 hover:underline mt-2"
                                        >
                                            Adicionar Dívida
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">Tempo da dívida?</label>
                                        <input
                                            type="text"
                                            name="tempo_divida"
                                            value={formData.tempo_divida}
                                            onChange={handleChange}
                                            placeholder="Ex: 2 anos"
                                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white"
                                        />
                                    </div>

                                    {parcelas.length > 0 && (
                                        <div className="space-y-2 animate-in fade-in duration-300">
                                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Simulação de Parcelamento</label>
                                            <select
                                            name="calculo_parcelamento"
                                            value={formData.calculo_parcelamento}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none transition-all dark:text-white"
                                            >
                                            <option value="">Selecione um plano...</option>
                                            {parcelas.map((p) => (
                                                <option key={p} value={p}>{p}</option>
                                            ))}
                                            </select>
                                        </div>
                                    )}
                                    </div>
                                )}
                            </div>

                            {/* Info Extras */}
                            <div className="space-y-2">
                                <label htmlFor="faturamento_mensal" className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">Qual seu faturamento mensal?</label>
                                <select
                                    id="faturamento_mensal"
                                    name="faturamento_mensal"
                                    required={!userData?.faturamento_mensal}
                                    value={formData.faturamento_mensal}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none appearance-none dark:text-white"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Abaixo de R$10.000">Abaixo de R$10.000</option>
                                    <option value="R$ 10.000 - R$ 50.000">R$ 10.000 - R$ 50.000</option>
                                    <option value="R$ 50.000 - R$ 100.000">R$ 50.000 - R$ 100.000</option>
                                    <option value="R$ 100.000 - Acima de R$ 100.000">R$ 100.000 - Acima de R$ 100.000</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block">Sócio?</label>
                                    <div className="flex gap-4">
                                        {["Sim", "Não"].map((opt) => (
                                        <label key={`socio-${opt}`} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="possui_socio" value={opt} checked={formData.possui_socio === opt} onChange={() => handleRadioChange("possui_socio", opt)} className="w-4 h-4" />
                                            <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                                        </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block">Precisa ajuda?</label>
                                    <div className="flex gap-4">
                                        {["Sim", "Não"].map((opt) => (
                                        <label key={`ajuda-${opt}`} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="interesse_ajuda" value={opt} checked={formData.interesse_ajuda === opt} onChange={() => handleRadioChange("interesse_ajuda", opt)} className="w-4 h-4" />
                                            <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                                        </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="observacoes" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Observações Extras</label>
                                <textarea
                                    id="observacoes"
                                    name="observacoes"
                                    value={formData.observacoes}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Descreva sua situação atual ou dúvidas..."
                                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none dark:text-white resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Email Input */}
                    {selectedDate && selectedTime && (
                    <div className="pt-6">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                            4. Confirme seu E-mail
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
                    )}

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
