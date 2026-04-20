'use client';

import { useEffect, useState, useTransition } from 'react';

type Service = {
  id: string;
  name: string;
  value: number;
  description: string | null;
  created_at?: string;
  updated_at?: string;
};

const emptyForm = () => ({ name: '', value: '', description: '' });

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ServicoPage() {
  const [items, setItems]     = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState(emptyForm());
  const [editId, setEditId]   = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isPending, start]    = useTransition();

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
    if (!form.name || !form.value) { setError('Nome e valor são obrigatórios'); return; }
    start(async () => {
      const body = { name: form.name, value: parseFloat(form.value), description: form.description || null };
      const res = editId
        ? await fetch(`/api/services/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { setShowModal(false); load(); } else { setError('Erro ao salvar'); }
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Excluir este serviço?')) return;
    start(async () => {
      await fetch(`/api/services/${id}`, { method: 'DELETE' });
      load();
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          + Novo Serviço
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? <p className="text-gray-400">Carregando...</p> : (
        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Valor</th>
                <th className="px-4 py-3 text-left">Descrição</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nenhum serviço cadastrado</td></tr>
              )}
              {items.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{fmt(s.value)}</td>
                  <td className="px-4 py-3 text-gray-500">{s.description ?? '—'}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline text-xs">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">{editId ? 'Editar Serviço' : 'Novo Serviço'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Nome *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Valor (R$) *</label>
                <input type="number" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
