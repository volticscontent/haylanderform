'use client';

import { useEffect, useState, useTransition } from 'react';
import { AlertCircle, Plus, Pencil, Trash2 } from 'lucide-react';

type Service = {
  id: string;
  name: string;
  value: number;
  description: string | null;
  created_at?: string;
  updated_at?: string;
};

const emptyForm = () => ({ name: '', value: '', description: '' });

function fmtValue(n: number) {
  if (n === 0) return null;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ServicoPage() {
  const [items, setItems]         = useState<Service[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState(emptyForm());
  const [editId, setEditId]       = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isPending, start]        = useTransition();

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/services');
      const d = await r.json();
      setItems(Array.isArray(d) ? d : d.services ?? []);
    } catch { setError('Erro ao carregar serviços'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditId(null); setForm(emptyForm()); setShowModal(true); }
  function openEdit(s: Service) {
    setEditId(s.id);
    setForm({ name: s.name, value: String(s.value), description: s.description ?? '' });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.name) { setError('Nome é obrigatório'); return; }
    start(async () => {
      const body = {
        name: form.name,
        value: form.value === '' ? 0 : parseFloat(form.value),
        description: form.description || null,
      };
      const res = editId
        ? await fetch(`/api/services/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { setShowModal(false); setError(''); load(); } else { setError('Erro ao salvar'); }
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este serviço?')) return;
    start(async () => {
      await fetch(`/api/services/${id}`, { method: 'DELETE' });
      load();
    });
  }

  const zeroCount = items.filter(s => s.value === 0).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Serviços</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Catálogo lido pelo bot para precificação e oferta de serviços.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Serviço
        </button>
      </div>

      {zeroCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>{zeroCount} serviço{zeroCount > 1 ? 's' : ''}</strong> com valor R$ 0,00 — o bot exibirá como <em>&quot;Valor sob consulta&quot;</em>.
            Edite para definir um valor fixo, ou mantenha 0 se o preço for negociado caso a caso.
          </p>
        </div>
      )}

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

      {loading ? (
        <p className="text-zinc-400 text-sm">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nome</th>
                <th className="px-4 py-3 text-left font-semibold">Valor</th>
                <th className="px-4 py-3 text-left font-semibold">Descrição</th>
                <th className="px-4 py-3 text-center font-semibold w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-zinc-400 text-sm">
                    Nenhum serviço cadastrado
                  </td>
                </tr>
              )}
              {items.map(s => {
                const valorFmt = fmtValue(s.value);
                return (
                  <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{s.name}</td>
                    <td className="px-4 py-3">
                      {valorFmt ? (
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">{valorFmt}</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Sob consulta
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 max-w-xs">
                      <span className="line-clamp-2">{s.description ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-zinc-400 hover:text-red-500"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-full max-w-lg space-y-4 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {editId ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-orange-500"
                  placeholder="Ex: Plano Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Valor Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-orange-500"
                  placeholder="0 = Valor sob consulta"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Deixe em branco ou 0 para serviços com valor negociado individualmente.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Descrição (lida pelo bot)
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-orange-500 resize-none"
                  placeholder="Descreva o que está incluído, para quem é ideal e quando ofertar. Isso vai direto para o contexto do bot."
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {form.description.length} caracteres. Descreva bem — o bot usa este texto para apresentar o serviço.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setShowModal(false); setError(''); }}
                className="px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 transition-colors font-medium"
              >
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
