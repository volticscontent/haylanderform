"use client";

import React, { useState } from "react";
import { User, Phone, Mail, IdCard, Calendar, MapPin, Building2, Briefcase, CheckCircle2, AlertCircle } from "lucide-react";

interface MEIFormData {
  nome_completo: string;
  cpf: string;
  data_nascimento: string; // YYYY-MM-DD
  nome_mae: string;
  telefone: string;
  email: string;
  senha_gov: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  nome_fantasia: string;
  atividade_principal: string; // CNAE principal (texto ou código)
  atividades_secundarias: string; // opcional, separado por vírgulas
  local_atividade: string; // Residencial | Comercial
  titulo_eleitor_ou_recibo_ir?: string; // opcional
}

export default function MEIForm() {
  const [formData, setFormData] = useState<MEIFormData>({
    nome_completo: "",
    cpf: "",
    data_nascimento: "",
    nome_mae: "",
    telefone: "",
    email: "",
    senha_gov: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    nome_fantasia: "",
    atividade_principal: "",
    atividades_secundarias: "",
    local_atividade: "Residencial",
    titulo_eleitor_ou_recibo_ir: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const requiredFields: (keyof MEIFormData)[] = [
    "nome_completo",
    "cpf",
    "data_nascimento",
    "nome_mae",
    "telefone",
    "email",
    "cep",
    "endereco",
    "numero",
    "bairro",
    "cidade",
    "estado",
    "nome_fantasia",
    "atividade_principal",
    "local_atividade",
  ];

  const validate = (): string | null => {
    for (const field of requiredFields) {
      const value = formData[field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return `Preencha o campo obrigatório: ${String(field).replace(/_/g, " ")}`;
      }
    }
    // Validações simples
    if (!/^\d{11}$/.test(formData.cpf.replace(/\D/g, ""))) {
      return "CPF deve conter 11 dígitos";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "E-mail inválido";
    }
    if (!/^\d{8}$/.test(formData.cep.replace(/\D/g, ""))) {
      return "CEP deve conter 8 dígitos";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const validationError = validate();
    if (validationError) {
      setStatus("error");
      setErrorMsg(validationError);
      return;
    }

    try {
      // Persistir no backend antes de redirecionar
      const resp = await fetch('/api/mei/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form: formData, userPhone: formData.telefone })
      })
      if (!resp.ok) {
        const msg = await resp.text()
        console.error('Falha ao salvar dados do MEI:', msg)
      }

      // Neste momento, vamos apenas redirecionar para WhatsApp com um resumo
      const resumo = [
        `Nome: ${formData.nome_completo}`,
        `CPF: ${formData.cpf}`,
        `Nascimento: ${formData.data_nascimento}`,
        `Mãe: ${formData.nome_mae}`,
        `Telefone: ${formData.telefone}`,
        `E-mail: ${formData.email}`,
        `Senha Gov.br: ${formData.senha_gov}`,
        `Endereço: ${formData.endereco}, ${formData.numero} - ${formData.bairro}`,
        `Cidade/UF: ${formData.cidade}/${formData.estado}`,
        `CEP: ${formData.cep}`,
        `Nome Fantasia: ${formData.nome_fantasia}`,
        `Atividade Principal: ${formData.atividade_principal}`,
        formData.atividades_secundarias
          ? `Atividades Secundárias: ${formData.atividades_secundarias}`
          : undefined,
        `Local da Atividade: ${formData.local_atividade}`,
        formData.titulo_eleitor_ou_recibo_ir
          ? `Título Eleitor/Recibo IR: ${formData.titulo_eleitor_ou_recibo_ir}`
          : undefined,
      ]
        .filter(Boolean)
        .join("\n");

      const message = encodeURIComponent(
        `Solicitação de abertura de MEI:\n\n${resumo}`
      );
      window.location.href = `https://wa.me/553197599216?text=${message}`;

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Erro ao enviar formulário. Tente novamente."
      );
    }
  };

  if (status === "success") {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
          Dados enviados com sucesso
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          Obrigado! Você será redirecionado para o WhatsApp com o resumo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-zinc-900 p-4 py-8 sm:p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
      <div className="mb-8 text-center">
        <h2 className="text-3xl text-zinc-900 dark:text-white tracking-tight mb-2">
          Abertura de MEI
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Preencha os dados abaixo para iniciarmos seu MEI.
        </p>
      </div>

      {status === "error" && (
        <div className="mb-6 flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dados pessoais */}
        <div className="col-span-1 md:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome completo</label>
          <div className="mt-2 flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-500" />
            <input name="nome_completo" value={formData.nome_completo} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Seu nome" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">CPF</label>
          <div className="mt-2 flex items-center gap-2">
            <IdCard className="w-4 h-4 text-zinc-500" />
            <input name="cpf" value={formData.cpf} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Somente números" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data de nascimento</label>
          <div className="mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-transparent" />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome da mãe</label>
          <div className="mt-2 flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-500" />
            <input name="nome_mae" value={formData.nome_mae} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Nome completo" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Telefone</label>
          <div className="mt-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-zinc-500" />
            <input name="telefone" value={formData.telefone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="DDD + número" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">E-mail</label>
          <div className="mt-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-zinc-500" />
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="seu@email.com" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha Gov.br (Opcional)</label>
          <div className="mt-2 flex items-center gap-2">
            <IdCard className="w-4 h-4 text-zinc-500" />
            <input type="text" name="senha_gov" value={formData.senha_gov} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Senha do Gov.br" />
          </div>
        </div>


        {/* Endereço */}
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">CEP</label>
          <div className="mt-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-zinc-500" />
            <input name="cep" value={formData.cep} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Somente números" />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Endereço</label>
          <div className="mt-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-zinc-500" />
            <input name="endereco" value={formData.endereco} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Rua, Avenida..." />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Número</label>
          <input name="numero" value={formData.numero} onChange={handleChange} className="mt-2 w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Nº" />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Complemento</label>
          <input name="complemento" value={formData.complemento} onChange={handleChange} className="mt-2 w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Apto, Casa, Loja..." />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Bairro</label>
          <input name="bairro" value={formData.bairro} onChange={handleChange} className="mt-2 w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Bairro" />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cidade</label>
          <input name="cidade" value={formData.cidade} onChange={handleChange} className="mt-2 w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Cidade" />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Estado (UF)</label>
          <input name="estado" value={formData.estado} onChange={handleChange} className="mt-2 w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Ex.: MG" />
        </div>

        {/* Dados do MEI */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome fantasia</label>
          <div className="mt-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-zinc-500" />
            <input name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Como seu negócio será conhecido" />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Atividade principal (CNAE)</label>
          <input name="atividade_principal" value={formData.atividade_principal} onChange={handleChange} className="mt-2 w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Descreva ou informe o código CNAE" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Atividades secundárias (opcional)</label>
          <textarea name="atividades_secundarias" value={formData.atividades_secundarias} onChange={handleChange} className="mt-2 w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Separe por vírgulas" rows={3} />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Local da atividade</label>
          <select name="local_atividade" value={formData.local_atividade} onChange={handleChange} className="mt-2 w-full px-3 py-2 border rounded-lg bg-transparent">
            <option value="Residencial">Residencial</option>
            <option value="Comercial">Comercial</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Título de eleitor ou Recibo de IR (opcional)</label>
          <input name="titulo_eleitor_ou_recibo_ir" value={formData.titulo_eleitor_ou_recibo_ir} onChange={handleChange} className="mt-2 w-full px-3 py-2 border rounded-lg bg-transparent" placeholder="Número do título ou recibo" />
        </div>
      </div>

      <div className="mt-8">
        <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Enviar dados
        </button>
      </div>
    </form>
  );
}