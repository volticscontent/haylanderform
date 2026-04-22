'use client';

import { useState, useTransition } from 'react';
import { IntegraEmpresa, LeadParaImportar, criarEmpresa, toggleAtivo, excluirEmpresa, atualizarEmpresa, importarLeadComoEmpresa } from './actions';

const REGIMES = ['mei', 'simples', 'presumido', 'real'];
const SERVICOS_DISPONIVEIS = [
  'PGMEI', 'CCMEI_DADOS', 'PGDASD', 'DEFIS',
  'PARCELAMENTO_SN_CONSULTAR', 'CND', 'CAIXAPOSTAL',
  'DCTFWEB', 'SICALC', 'SITFIS',
];

const PRESETS: Record<string, string[]> = {
  mei: ['PGMEI', 'CCMEI_DADOS', 'CAIXAPOSTAL'],
  simples: ['PGDASD', 'DEFIS', 'PARCELAMENTO_SN_CONSULTAR', 'CND', 'CAIXAPOSTAL'],
  presumido: ['DCTFWEB', 'SICALC', 'SITFIS', 'CND', 'CAIXAPOSTAL'],
  real: ['DCTFWEB', 'SICALC', 'SITFIS', 'CND', 'CAIXAPOSTAL'],
};

type FormData = {
  cnpj: string; razao_social: string; regime_tributario: string;
  servicos_habilitados: string[]; certificado_validade: string; observacoes: string;
};

const emptyForm = (): FormData => ({
  cnpj: '', razao_social: '', regime_tributario: 'mei',
  servicos_habilitados: PRESETS.mei, certificado_validade: '', observacoes: '',
});

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  return d.length === 14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : cnpj;
}

export default function EmpresasClient({
  empresas: inicial,
  leadsDisponiveis,
}: {
  empresas: IntegraEmpresa[];
  leadsDisponiveis: LeadParaImportar[];
}) {
  const [empresas, setEmpresas] = useState(inicial);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [error, setError] = useState('');
  const [importSearch, setImportSearch] = useState('');
  const [importSelected, setImportSelected] = useState<Set<number>>(new Set());
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

  function handleImportConfirm() {
    const toImport = leadsDisponiveis.filter(l => importSelected.has(l.id));
    if (toImport.length === 0) return;
    startTransition(async () => {
      const results = await Promise.all(toImport.map(l => importarLeadComoEmpresa(l)));
      const importadas = results.filter(r => r.ok).map(r => r.data as IntegraEmpresa);
      setEmpresas(prev => [...prev, ...importadas]);
      setShowImport(false);
      setImportSelected(new Set());
      setImportSearch('');
    });
  }

  const certVencendo = (val: string | null) => {
    if (!val) return false;
    return (new Date(val).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000;
  };

  const leadsVisiveis = leadsDisponiveis.filter(l =>
    l.nome_completo.toLowerCase().includes(importSearch.toLowerCase()) ||
    l.cnpj.includes(importSearch.replace(/\D/g, ''))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Empresas — Integra Contador</h1>
        <div className="flex gap-2">
          {leadsDisponiveis.length > 0 && (
            <button
              onClick={() => { setShowImport(true); setImportSelected(new Set()); setImportSearch(''); }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              Importar de leads ({leadsDisponiveis.length})
            </button>
          )}
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            + Nova Empresa
          </button>
        </div>
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
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <div className="space-y-2">
                    <div className="text-4xl">🏢</div>
                    <div>Nenhuma empresa cadastrada</div>
                    {leadsDisponiveis.length > 0 && (
                      <button
                        onClick={() => { setShowImport(true); setImportSelected(new Set()); setImportSearch(''); }}
                        className="text-green-600 underline text-sm"
                      >
                        Importar {leadsDisponiveis.length} lead{leadsDisponiveis.length !== 1 ? 's' : ''} com CNPJ
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {empresas.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{e.razao_social}</td>
                <td className="px-4 py-3 font-mono">{formatCnpj(e.cnpj)}</td>
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

      {/* Modal: Importar de leads */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl space-y-4">
            <h2 className="text-lg font-semibold">Importar Leads como Empresas</h2>
            <p className="text-sm text-gray-500">
              Selecione os leads com CNPJ para cadastrar no Integra Contador. O regime será MEI por padrão — edite depois se necessário.
            </p>

            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              value={importSearch}
              onChange={e => setImportSearch(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />

            <div className="max-h-72 overflow-y-auto border rounded divide-y">
              {leadsVisiveis.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">Nenhum lead encontrado</div>
              )}
              {leadsVisiveis.map(l => (
                <label key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importSelected.has(l.id)}
                    onChange={() => setImportSelected(prev => {
                      const next = new Set(prev);
                      next.has(l.id) ? next.delete(l.id) : next.add(l.id);
                      return next;
                    })}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{l.nome_completo}</div>
                    <div className="text-xs text-gray-500 font-mono">{formatCnpj(l.cnpj)}</div>
                  </div>
                  {l.procuracao_ativa && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full shrink-0">
                      Procuração
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setImportSelected(new Set(leadsVisiveis.map(l => l.id)))}
                className="text-xs text-blue-600 hover:underline"
              >
                Selecionar todos
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={handleImportConfirm}
                  disabled={isPending || importSelected.size === 0}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isPending ? 'Importando...' : `Importar ${importSelected.size} empresa${importSelected.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar / Editar empresa */}
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
                <input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value.replace(/\D/g, '') }))}
                  className="w-full border rounded px-3 py-2 text-sm font-mono" placeholder="00000000000000" maxLength={14} />
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
                  <label key={s} className="flex items-center line-clamp-1 gap-2 text-xs cursor-pointer">
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
