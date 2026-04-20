'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, CheckCircle, ArrowLeft, User, Building } from 'lucide-react';

type LeadInfo = {
  nome_completo: string | null;
  razao_social: string | null;
  cnpj: string | null;
  telefone: string;
  data_reuniao: string | null;
  status_atendimento: string | null;
  servico: string | null;
};

export default function ReuniaoPage() {
  const params = useParams();
  const router = useRouter();
  const phone = decodeURIComponent(params.phone as string);

  const [lead, setLead] = useState<LeadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/leads/by-phone?phone=${encodeURIComponent(phone)}`)
      .then(r => r.json())
      .then(d => { setLead(d.lead ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [phone]);

  async function handleSave() {
    if (!date) { setError('Selecione uma data'); return; }
    setSaving(true);
    setError('');
    try {
      const isoDate = new Date(date).toISOString();
      const res = await fetch(`/api/leads/update-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, data_reuniao: isoDate }),
      });
      if (res.ok) { setSaved(true); }
      else { setError('Erro ao salvar'); }
    } catch { setError('Erro ao salvar'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-8 text-zinc-400">Carregando...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" /> Agendar Reunião
        </h1>

        {lead && (
          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium text-zinc-900 dark:text-white">{lead.nome_completo || 'Sem nome'}</span>
            </div>
            {lead.razao_social && (
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span>{lead.razao_social} {lead.cnpj ? `· ${lead.cnpj}` : ''}</span>
              </div>
            )}
            {lead.data_reuniao && (
              <div className="flex items-center gap-2 text-purple-600">
                <Clock className="w-4 h-4" />
                <span>Reunião atual: {new Date(lead.data_reuniao).toLocaleString('pt-BR')}</span>
              </div>
            )}
            {lead.servico && (
              <div className="text-xs text-zinc-500">Serviço: {lead.servico}</div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium">Nova data e horário</label>
          <input
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {saved ? (
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <CheckCircle className="w-5 h-5" /> Reunião agendada com sucesso!
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Salvando...' : 'Confirmar Agendamento'}
          </button>
        )}
      </div>
    </div>
  );
}
