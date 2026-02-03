"use client";

import React, { useState, useEffect } from "react";
import { Send, User, Phone, FileText, MessageSquare, CheckCircle2, Building2, DollarSign, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LeadFormProps {
  phone?: string;
  observacao?: string;
}

interface UpdatePayload {
    nome_completo: string;
    email: string;
    senha_gov: string;
    cnpj: string;
    tipo_negocio: string;
    possui_socio: string;
    faturamento_mensal: string;
    observacoes: string;
    interesse_ajuda: string;
    calculo_parcelamento: string;
    tipo_divida?: string;
    valor_divida_municipal?: string | null;
    valor_divida_estadual?: string | null;
    valor_divida_federal?: string | null;
    valor_divida_ativa?: string | null;
}

export default function LeadForm({ phone, observacao }: LeadFormProps) {
  const [debts, setDebts] = useState<{ id: string; origin: string; value: string }[]>([]);
  const [formData, setFormData] = useState({
    nome_completo: "",
    telefone: "",
    email: "",
    senha_gov: "",
    cnpj: "",
    tipo_negocio: "",
    possui_divida: "", // "Sim" | "Não"
    tipo_divida: "",
    tempo_divida: "",
    faturamento_mensal: "",
    possui_socio: "", // "Sim" | "Não"
    interesse_ajuda: "", // "Sim" | "Não"
    observacoes: observacao || "",
    calculo_parcelamento: "",
  });

  const [parcelas, setParcelas] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

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
    if (phone) {
      setStatus("loading");
      fetch(`/api/user/${phone}`)
        .then(async (res) => {
            if (!res.ok) {
                if (res.status === 404) {
                    // User not found, treat as new user (return null)
                    return null;
                }
                throw new Error("Erro ao buscar dados");
            }
            return res.json();
        })
        .then((data) => {
          if (!data) {
             // Initialize form for new user
             setFormData((prev) => ({
                 ...prev,
                 telefone: phone,
             }));
             setStatus("idle");
             return;
          }

          // Load existing debts
          const loadedDebts = [];
          if (data.valor_divida_municipal) loadedDebts.push({ id: crypto.randomUUID(), origin: 'Municipal', value: data.valor_divida_municipal });
          if (data.valor_divida_estadual) loadedDebts.push({ id: crypto.randomUUID(), origin: 'Estadual', value: data.valor_divida_estadual });
          if (data.valor_divida_federal) loadedDebts.push({ id: crypto.randomUUID(), origin: 'Federal', value: data.valor_divida_federal });
          if (data.valor_divida_ativa) loadedDebts.push({ id: crypto.randomUUID(), origin: 'Ativa', value: data.valor_divida_ativa });

          setDebts(loadedDebts);

          setFormData((prev) => ({
            ...prev,
            nome_completo: data.nome_completo || "",
            telefone: data.telefone || phone,
            email: data.email || "",
            senha_gov: data.senha_gov || "",
            cnpj: data.cnpj || "",
            tipo_negocio: data.tipo_negocio || "",
            possui_divida: (data.tipo_divida || loadedDebts.length > 0) ? "Sim" : "",
            tipo_divida: data.tipo_divida || "",
            observacoes: observacao || data.observacoes || "",
            calculo_parcelamento: data.calculo_parcelamento || "",
            interesse_ajuda: data.interesse_ajuda || "",
            faturamento_mensal: data.faturamento_mensal || "",
            possui_socio: data.possui_socio ? "Sim" : "Não",
          }));
          setStatus("idle");
        })
        .catch((err) => {
          console.error(err);
          setErrorMsg(err.message);
          setStatus("error");
        });
    }
  }, [phone, observacao]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    // Prepare payload
    // We map form state to DB columns expected by API
    const payload: UpdatePayload = {
        nome_completo: formData.nome_completo,
        email: formData.email,
        senha_gov: formData.senha_gov,
        cnpj: formData.cnpj,
        tipo_negocio: formData.tipo_negocio,
        possui_socio: formData.possui_socio,
        faturamento_mensal: formData.faturamento_mensal,
        observacoes: formData.observacoes,
        interesse_ajuda: formData.interesse_ajuda,
        calculo_parcelamento: formData.calculo_parcelamento,
    };

    // Handle Debt logic
    if (formData.possui_divida === "Sim") {
        payload.tipo_divida = formData.tipo_divida;
        
        // Reset debt values first to ensure we overwrite if removed
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

        // Append tempo_divida to observacoes as requested since there is no column
        if (formData.tempo_divida) {
            payload.observacoes = `${payload.observacoes ? payload.observacoes + "\n" : ""}Tempo da dívida: ${formData.tempo_divida}`;
        }
    }

    try {
        const targetPhone = phone || formData.telefone;
        const res = await fetch(`/api/user/${targetPhone}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao salvar dados");
        }

        // Trigger Serpro consultation in background if CNPJ is provided
        if (formData.cnpj) {
             const cleanCnpj = formData.cnpj.replace(/\D/g, '');
             if (cleanCnpj.length === 14) {
                 const service = formData.tipo_negocio === 'MEI' ? 'CCMEI_DADOS' : 'SIT_FISCAL';
                 console.log(`[LeadForm] Triggering background Serpro consultation (${service}) for ${cleanCnpj}`);
                 
                 fetch('/api/serpro', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ 
                        cnpj: cleanCnpj, 
                        service,
                        // Default to current year for PGMEI if needed, but CCMEI_DADOS doesn't need it
                     }) 
                 }).then(async (serproRes) => {
                     if (serproRes.ok) {
                         console.log('[LeadForm] Serpro consultation success');
                     } else {
                         console.error('[LeadForm] Serpro consultation failed', await serproRes.text());
                     }
                 }).catch(err => console.error('[LeadForm] Serpro trigger error:', err));
             }
        }
        
        setStatus("success");
        
        // Redirect to WhatsApp after a short delay to show success message
        setTimeout(() => {
            const message = encodeURIComponent("Formulario preenchido e agora?");
            window.location.href = `https://wa.me/553197599216?text=${message}`;
        }, 1500);

    } catch (err) {
        console.error(err);
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar formulário. Tente novamente.");
    }
  };

  if (status === "success") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Dados Recebidos com Sucesso!
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          Obrigado por fornecer suas informações. Você será redirecionado para o WhatsApp em instantes...
        </p>
        <button
          onClick={() => {
            const message = encodeURIComponent("Formulario preenchido e agora?");
            window.location.href = `https://wa.me/553197599216?text=${message}`;
          }}
          className="text-zinc-600 dark:text-zinc-400 hover:underline font-medium"
        >
          Clique aqui se não for redirecionado
        </button>
      </div>
    );
  }

  if (status === "loading") {
      return (
          <div className="w-full min-h-[400px] flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-zinc-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-zinc-500 dark:text-zinc-400">Carregando suas informações...</p>
          </div>
      );
  }

  if (status === "error") {
    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="flex justify-center mb-4">
                <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Ops! Algo deu errado.</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">{errorMsg || "Não foi possível carregar os dados."}</p>
            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
                Tentar Novamente
            </button>
        </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 sm:px-32 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
      <div className="mb-8 text-center py-8 bg-zinc-100 dark:bg-zinc-800 rounded-b-lg">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
          Seja bem vindo a Haylander Martins Contabilidade!
        </h2>
        <p className="text-zinc-800 dark:text-zinc-400">
          Complete sua qualificação para prosseguirmos com o atendimento.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mb-32">
        
        {/* Dados Pessoais (Read Only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Nome Completo</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                        type="text" 
                        name="nome_completo"
                        value={formData.nome_completo} 
                        onChange={handleChange}
                        readOnly={!!phone} 
                        className={cn(
                            "w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500",
                            !phone && "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white cursor-text",
                            phone && "cursor-not-allowed"
                        )} 
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Telefone</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                        type="text" 
                        name="telefone"
                        value={formData.telefone} 
                        onChange={handleChange}
                        readOnly={!!phone} 
                        className={cn(
                            "w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500",
                            !phone && "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white cursor-text",
                            phone && "cursor-not-allowed"
                        )} 
                    />
                </div>
            </div>
        </div>

        {/* Email e Senha Gov */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Email</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email} 
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white" 
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Senha Gov.br</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                      type="text" 
                      name="senha_gov"
                      required
                      value={formData.senha_gov} 
                      onChange={handleChange}
                      placeholder="Senha do Gov.br"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white" 
                    />
                </div>
            </div>
        </div>


        {/* CNPJ */}
        <div className="space-y-2 px-4">
          <label htmlFor="cnpj" className="text-sm font-bold text-zinc-800 dark:text-zinc-300">CNPJ</label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              id="cnpj"
              name="cnpj"
              required
              value={formData.cnpj}
              onChange={handleChange}
              placeholder="00.000.000/0000-00"
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Tipo de Negócio */}
        <div className="space-y-2 px-4">
            <label htmlFor="tipo_negocio" className="text-sm font-bold text-zinc-800 dark:text-zinc-300">Qual é o tipo de negócio?</label>
            <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <select
                    id="tipo_negocio"
                    name="tipo_negocio"
                    required
                    value={formData.tipo_negocio}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none appearance-none dark:text-white"
                >
                    <option value="">Selecione...</option>
                    <option value="MEI">MEI</option>
                    <option value="Simples Nacional">Simples Nacional</option>
                    <option value="Lucro Presumido">Lucro Presumido</option>
                    <option value="Lucro Real">Lucro Real</option>
                    <option value="Outros">Outros</option>
                </select>
            </div>
        </div>

        {/* Dívida (Conditional) */}
        <div className="space-y-4 p-8 bg-zinc-100 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <label className="text-2xl font-bold text-zinc-800 dark:text-zinc-300 block">Você possui dívida?</label>
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
                    {/* Tipo de Dívida */}
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

                    {/* Lista de Dívidas */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">Dívidas:</label>
                        {debts.map((debt) => (
                            <div key={debt.id} className="flex gap-4 items-start p-4 bg-white dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-2 px-4">  
                                        <label className="text-xs font-bold text-zinc-800 uppercase">Origem</label>
                                        <select
                                            value={debt.origin}
                                            onChange={(e) => handleDebtChange(debt.id, 'origin', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Municipal">Municipal</option>
                                            <option value="Estadual">Estadual</option>
                                            <option value="Federal">Federal</option>
                                            <option value="Ativa">Ativa</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 px-4">
                                        <label className="text-xs font-bold text-zinc-800 uppercase">Valor</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                            <input
                                                type="text"
                                                value={debt.value}
                                                onChange={(e) => handleDebtChange(debt.id, 'value', e.target.value)}
                                                placeholder="R$ 0,00"
                                                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveDebt(debt.id)}
                                    className="mt-8 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Remover dívida"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                </button>
                            </div>
                        ))}
                        
                        <button
                            type="button"
                            onClick={handleAddDebt}
                            className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-400 hover:text-zinc-700 hover:underline"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Adicionar Dívida
                        </button>
                    </div>

                    {/* Tempo da Dívida */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-zinc-100 dark:text-zinc-300">Há quanto tempo você tem essa dívida?</label>
                        <input
                            type="text"
                            name="tempo_divida"
                            value={formData.tempo_divida}
                            onChange={handleChange}
                            placeholder="Ex: 2 anos"
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white"
                        />
                    </div>

                    {/* Simulação de Parcelamento */}
                    {parcelas.length > 0 && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Simulação de Parcelamento (Estimativa)</label>
                            <select
                                name="calculo_parcelamento"
                                value={formData.calculo_parcelamento}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white"
                            >
                                <option value="">Selecione um plano para registrar...</option>
                                {parcelas.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Faturamento Mensal */}
        <div className="space-y-2 px-4">
            <label htmlFor="faturamento_mensal" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Qual seu faturamento mensal?</label>
            <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <select
                    id="faturamento_mensal"
                    name="faturamento_mensal"
                    required
                    value={formData.faturamento_mensal}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none appearance-none dark:text-white"
                >
                    <option value="">Selecione...</option>
                    <option value="Abaixo de R$10.000">Abaixo de R$10.000</option>
                    <option value="R$ 10.000 - R$ 50.000">R$ 10.000 - R$ 50.000</option>
                    <option value="R$ 50.000 - R$ 100.000">R$ 50.000 - R$ 100.000</option>
                    <option value="R$ 100.000 - Acima de R$ 100.000">R$ 100.000 - Acima de R$ 100.000</option>
                </select>
            </div>
        </div>

        {/* Sócios */}
        <div className="space-y-2 px-4">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">Você possui sócios?</label>
            <div className="flex gap-4">
                {["Sim", "Não"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="possui_socio"
                            value={opt}
                            checked={formData.possui_socio === opt}
                            onChange={() => handleRadioChange("possui_socio", opt)}
                            className="w-4 h-4 text-zinc-600 focus:ring-zinc-500"
                        />
                        <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                    </label>
                ))}
            </div>
        </div>

        {/* Interesse em Ajuda */}
        <div className="space-y-2 px-4">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">Teria interesse em ajuda profissional?</label>
            <div className="flex gap-4">
                {["Sim", "Não"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="interesse_ajuda"
                            value={opt}
                            checked={formData.interesse_ajuda === opt}
                            onChange={() => handleRadioChange("interesse_ajuda", opt)}
                            className="w-4 h-4 text-zinc-600 focus:ring-zinc-500"
                        />
                        <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                    </label>
                ))}
            </div>
        </div>

        {/* Observações */}
        <div className="space-y-2 px-4">
          <label htmlFor="observacoes" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Observações (Opcional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={4}
              placeholder="Descreva sua situação atual, dúvidas ou problemas..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-zinc-500 outline-none transition-all dark:text-white resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className={cn(
            "w-full flex items-center justify-center gap-2 bg-zinc-600 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200",
            status === "submitting" && "opacity-70 cursor-not-allowed"
          )}
        >
          {status === "submitting" ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar Formulário
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}


// Tipagem do payload enviado para a API
interface UpdatePayload {
  email: string;
  senha_gov: string;
  cnpj: string;
  tipo_negocio: string;
  possui_socio: string;
  faturamento_mensal: string;
  observacoes: string;
  interesse_ajuda: string;
  calculo_parcelamento: string;
  tipo_divida?: string;
  valor_divida_municipal?: string | null;
  valor_divida_estadual?: string | null;
  valor_divida_federal?: string | null;
  valor_divida_ativa?: string | null;
}
