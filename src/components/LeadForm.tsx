"use client";

import React, { useState, useEffect } from "react";
import { Send, User, Phone, FileText, MessageSquare, CheckCircle2, Building2, DollarSign, Users, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LeadFormProps {
  phone?: string;
  observacao?: string;
}

export default function LeadForm({ phone, observacao }: LeadFormProps) {
  const [formData, setFormData] = useState({
    nome_completo: "",
    telefone: "",
    cnpj: "",
    tipo_negocio: "",
    possui_divida: "", // "Sim" | "Não"
    tipo_divida: "",
    origem_divida: "",
    valor_divida: "",
    tempo_divida: "",
    faturamento_mensal: "",
    possui_socio: "", // "Sim" | "Não"
    teria_interesse: "", // "Sim" | "Não"
    observacoes: observacao || "",
    calculo_parcelamento: "",
  });

  const [parcelas, setParcelas] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const valor = formData.valor_divida;
    if (!valor) {
        setParcelas([]);
        return;
    }
    const cleanValue = valor.replace(/[^\d,]/g, '').replace(',', '.');
    const numericValue = parseFloat(cleanValue);
    if (isNaN(numericValue) || numericValue <= 0) {
        setParcelas([]);
        return;
    }
    const options = [12, 24, 36, 48, 60].map(months => {
        const installmentValue = numericValue / months;
        return `${months}x de ${installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    });
    setParcelas(options);
  }, [formData.valor_divida]);

  useEffect(() => {
    if (phone) {
      setStatus("loading");
      fetch(`/api/user/${phone}`)
        .then(async (res) => {
            if (!res.ok) {
                if (res.status === 404) throw new Error("Usuário não encontrado");
                throw new Error("Erro ao buscar dados");
            }
            return res.json();
        })
        .then((data) => {
          setFormData((prev) => ({
            ...prev,
            nome_completo: data.nome_completo || "",
            telefone: data.telefone || phone,
            cnpj: data.cnpj || "",
            tipo_negocio: data["tipo_negócio"] || "",
            // We need to infer possui_divida from existing debt data if available
            possui_divida: (data.tipo_divida || data.valor_divida_municipal || data.valor_divida_estadual || data.valor_divida_federal || data.valor_divida_ativa) ? "Sim" : "",
            tipo_divida: data.tipo_divida || "",
            // Logic to determine which debt value is present to set 'origem_divida' and 'valor_divida' would be complex if multiple exist, 
            // but let's try to pick one or leave empty for user to fill if they want to update.
            // For simplicity, we might not pre-fill the debt details perfectly if multiple exist, or we just rely on the user to fill them.
            // But let's try to pre-fill if we can.
            observacoes: observacao || data.observacoes || "",
            calculo_parcelamento: data.calculo_parcelamento || "",
            teria_interesse: data["teria_interesse?"] || "",
            faturamento_mensal: data.faturamento_mensal || "",
            possui_socio: data["possui_sócio"] ? "Sim" : "Não",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    // Prepare payload
    // We map form state to DB columns expected by API
    const payload: any = {
        cnpj: formData.cnpj,
        tipo_negocio: formData.tipo_negocio,
        possui_socio: formData.possui_socio,
        faturamento_mensal: formData.faturamento_mensal,
        observacoes: formData.observacoes,
        teria_interesse: formData.teria_interesse,
        calculo_parcelamento: formData.calculo_parcelamento,
    };

    // Handle Debt logic
    if (formData.possui_divida === "Sim") {
        payload.tipo_divida = formData.tipo_divida;
        
        // Map specific debt value based on origin
        if (formData.origem_divida === "Municipal") payload.valor_divida_municipal = formData.valor_divida;
        if (formData.origem_divida === "Estadual") payload.valor_divida_estadual = formData.valor_divida;
        if (formData.origem_divida === "Federal") payload.valor_divida_federal = formData.valor_divida;
        if (formData.origem_divida === "Ativa") payload.valor_divida_ativa = formData.valor_divida;

        // Append tempo_divida to observacoes as requested since there is no column
        if (formData.tempo_divida) {
            payload.observacoes = `${payload.observacoes ? payload.observacoes + "\n" : ""}Tempo da dívida: ${formData.tempo_divida}`;
        }
    }

    try {
        const res = await fetch(`/api/user/${phone}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || "Erro ao salvar dados");
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
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Clique aqui se não for redirecionado
        </button>
      </div>
    );
  }

  if (status === "loading") {
      return (
          <div className="w-full min-h-[400px] flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Tentar Novamente
            </button>
        </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 p-4 py-12 sm:p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
      <div className="mb-8 text-center">
        <h2 className="text-3xl text-zinc-900 dark:text-white tracking-tight mb-2">
          Seja bem vindo a Haylander Martins Contabilidade!
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          Complete sua qualificação para prosseguirmos com o atendimento.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Dados Pessoais (Read Only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome Completo</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input type="text" value={formData.nome_completo} readOnly className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 cursor-not-allowed" />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Telefone</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input type="text" value={formData.telefone} readOnly className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 cursor-not-allowed" />
                </div>
            </div>
        </div>

        {/* CNPJ */}
        <div className="space-y-2">
          <label htmlFor="cnpj" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">CNPJ</label>
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
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Tipo de Negócio */}
        <div className="space-y-2">
            <label htmlFor="tipo_negocio" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Qual é o tipo de negócio?</label>
            <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <select
                    id="tipo_negocio"
                    name="tipo_negocio"
                    required
                    value={formData.tipo_negocio}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none dark:text-white"
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
        <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">Você possui dívida?</label>
            <div className="flex gap-4">
                {["Sim", "Não"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="possui_divida"
                            value={opt}
                            checked={formData.possui_divida === opt}
                            onChange={() => handleRadioChange("possui_divida", opt)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                    </label>
                ))}
            </div>

            {formData.possui_divida === "Sim" && (
                <div className="space-y-4 mt-4 pl-4 border-l-2 border-blue-200 dark:border-blue-900 animate-in slide-in-from-top-2 duration-300">
                    {/* Tipo de Dívida */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Qual é o tipo de dívida?</label>
                        <select
                            name="tipo_divida"
                            value={formData.tipo_divida}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        >
                            <option value="">Selecione...</option>
                            <option value="Não Ajuizada">Não Ajuizada (Cobrança judicial não iniciada)</option>
                            <option value="Ajuizada">Ajuizada (Execução fiscal iniciada)</option>
                            <option value="Tributaria">Tributária</option>
                            <option value="Não tributaria">Não tributária</option>
                        </select>
                    </div>

                    {/* Origem da Dívida */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ela é:</label>
                        <select
                            name="origem_divida"
                            value={formData.origem_divida}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        >
                            <option value="">Selecione...</option>
                            <option value="Municipal">Municipal</option>
                            <option value="Estadual">Estadual</option>
                            <option value="Federal">Federal</option>
                            <option value="Ativa">Ativa</option>
                        </select>
                    </div>

                    {/* Valor da Dívida */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Qual é o valor da dívida?</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                name="valor_divida"
                                value={formData.valor_divida}
                                onChange={handleChange}
                                placeholder="R$ 0,00"
                                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Tempo da Dívida */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Há quanto tempo você tem essa dívida?</label>
                        <input
                            type="text"
                            name="tempo_divida"
                            value={formData.tempo_divida}
                            onChange={handleChange}
                            placeholder="Ex: 2 anos"
                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
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
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
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
        <div className="space-y-2">
            <label htmlFor="faturamento_mensal" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Qual seu faturamento mensal?</label>
            <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <select
                    id="faturamento_mensal"
                    name="faturamento_mensal"
                    required
                    value={formData.faturamento_mensal}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none dark:text-white"
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
        <div className="space-y-2">
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
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                    </label>
                ))}
            </div>
        </div>

        {/* Interesse em Ajuda */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">Teria interesse em ajuda profissional?</label>
            <div className="flex gap-4">
                {["Sim", "Não"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="teria_interesse"
                            value={opt}
                            checked={formData.teria_interesse === opt}
                            onChange={() => handleRadioChange("teria_interesse", opt)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                    </label>
                ))}
            </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
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
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className={cn(
            "w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200",
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
