'use client';

import { useState, useTransition } from 'react';
import { IntegraEmpresa, criarEmpresa, toggleAtivo, excluirEmpresa, atualizarEmpresa } from './actions';

const REGIMES = ['mei', 'simples', 'presumido', 'real'];
const SERVICOS_DISPONIVEIS = [
  'PGMEI', 'CCMEI_DADOS', 'PGDASD', 'DEFIS',
  'PARCELAMENTO_SN_CONSULTAR', 'CND', 'CAIXAPOSTAL',
  'DCTFWEB', 'SICALC', 'SITFIS',
];

const PRESETS: Record<string, string[]> = {
  mei:       ['PGMEI', 'CCMEI_DADOS', 'CAIXAPOSTAL'],
  simples:   ['PGDASD', 'DEFIS', 'PARCELAMENTO_SN_CONSULTAR', 'CND', 'CAIXAPOSTAL'],
  presumido: ['DCTFWEB', 'SICALC', 'SITFIS', 'CND', 'CAIXAPOSTAL'],
  real:      ['DCTFWEB', 'SICALC', 'SITFIS', 'CND', 'CAIXAPOSTAL'],
};

type FormData = {
  cnpj: string; razao_social: string; regime_tributario: string;
  servicos_habilitados: string[]; certificado_validade: string; observacoes: string;
};

const emptyForm = (): FormData => ({
  cnpj: '', razao_social: '', regime_tributario: 'mei',
  servicos_habilitados: PRESETS.mei, certificado_validade: '', observacoes: '',
});

export default function EmpresasClient({ empresas: inicial }: { empresas: IntegraEmpresa[] }) {
  const [empresas, setEmpresas] = useState(inicial);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setError('');
    setShowModal(true);
  }

  function openEdit(e: IntegraEmpresa) {
    setEditingId(e.id);
    setForm({
      cnpj: e.cnpj, razao_social: e.razao_social,
      regime_tributario: e.regime_tributario,
      servicos_habilitados: e.servicos_habilitados ?? [],
      certificado_validade: e.certificado_validade ?? '',
      observacoes: e.observacoes ?? '',
    });
    setError('');
    setShowModal(true);
  }

  function handleRegimeChange(regime: string) {
    setForm(f => ({ ...f, regime_tributario: regime, servicos_habilitados: PRESETS[regime] ?? [] }));
  }

  function toggleServico(s: string) {
    setForm(f => ({
      ...f,
      servicos_habilitados: f.servicos_habilitados.includes(s)
        ? f.servicos_habilitados.filter(x => x !== s)
        : [...f.servicos_habilitados, s],
    }));
  }

  function handleSubmit() {
    if (!form.cnpj || !form.razao_social) { setError('CNPJ e Razão Social são obrigatórios'); return; }
    startTransition(async () => {
      if (editingId) {
        const res = await atualizarEmpresa(editingId, form);
        if (!res.ok) { setError(res.data?.error ?? 'Erro ao atualizar'); return; }
        setEmpresas(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e));
      } else {
        const res = await criarEmpresa(form);
        if (!res.ok) { setError(res.data?.error ?? 'Erro ao criar'); return; }
        setEmpresas(prev => [...prev, res.data]);
      }
      setShowModal(false);
    });
  }

  function handleToggle(id: number, ativo: boolean) {
    startTransition(async () => {
      await toggleAtivo(id, !ativo);
      setEmpresas(prev => prev.map(e => e.id === id ? { ...e, ativo: !ativo } : e));
    });
  }

  function handleDelete(id: number) {
    if (!confirm('Excluir esta empresa do Integra?')) return;
    startTransition(async () => {
      await excluirEmpresa(id);
      setEmpresas(prev => prev.filter(e => e.id !== id));
    });
  }

  const certVencendo = (val: string | null) => {
    if (!val) return false;
    return (new Date(val).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Empresas — Integra Contador</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Nova Empresa
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Razão Social</th>
              <th className="px-4 py-3 text-left">CNPJ</th>
              <th className="px-4 py-3 text-left">Regime</th>
              <th className="px-4 py-3 text-left">Certificado</th>
              <th className="px-4 py-3 text-left">Serviços</th>
              <th className="px-4 py-3 text-center">Ativo</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empresas.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma empresa cadastrada</td></tr>
            )}
            {empresas.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{e.razao_social}</td>
                <td className="px-4 py-3 font-mono">{e.cnpj}</td>
                <td className="px-4 py-3 capitalize">{e.regime_tributario}</td>
                <td className="px-4 py-3">
                  {e.certificado_validade ? (
                    <span className={certVencendo(e.certificado_validade) ? 'text-red-600 font-semibold' : ''}>
                      {new Date(e.certificado_validade).toLocaleDateString('pt-BR')}
                      {certVencendo(e.certificado_validade) && ' ⚠'}
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-500">{(e.servicos_habilitados ?? []).join(', ')}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggle(e.id, e.ativo)}
                    disabled={isPending}
                    className={`w-10 h-6 rounded-full transition-colors ${e.ativo ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full mx-auto transition-transform ${e.ativo ? 'translate-x-2' : '-translate-x-2'}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-center space-x-2">
                  <button onClick={() => openEdit(e)} className="text-blue-600 hover:underline text-xs">Editar</button>
                  <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:underline text-xs">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Editar Empresa' : 'Nova Empresa'}</h2>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Razão Social *</label>
                <input value={form.razao_social} onChange={e => setForm(f => ({ ...f, razao_social: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">CNPJ *</label>
                <input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm font-mono" placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Regime Tributário</label>
                <select value={form.regime_tributario} onChange={e => handleRegimeChange(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm">
                  {REGIMES.map(r => <option key={r} value={r} className="capitalize">{r.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Validade do Certificado</label>
                <input type="date" value={form.certificado_validade} onChange={e => setForm(f => ({ ...f, certificado_validade: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" rows={2} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2">Serviços Habilitados</label>
              <div className="grid grid-cols-2 gap-1">
                {SERVICOS_DISPONIVEIS.map(s => (
                  <label key={s} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={form.servicos_habilitados.includes(s)}
                      onChange={() => toggleServico(s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={isPending}
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
