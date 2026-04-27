'use client';

import { useState, useTransition, useEffect } from 'react';
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

const REGIME_BADGE: Record<string, string> = {
  mei:       'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  simples:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  presumido: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  real:      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
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

function formatPhone(tel: string | null) {
  if (!tel) return null;
  const d = tel.replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return tel;
}

function ServicePills({ services }: { services: string[] }) {
  const visible = services.slice(0, 3);
  const extra = services.length - 3;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(s => (
        <span key={s} className="text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">
          {s}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-xs text-slate-400 dark:text-slate-500 px-1 py-0.5">+{extra}</span>
      )}
    </div>
  );
}

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${on ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

const inputCls = 'w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500';

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

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  const certVencendo = (val: string | null) =>
    !!val && !!now && (new Date(val).getTime() - now) < 30 * 24 * 60 * 60 * 1000;

  const leadsVisiveis = leadsDisponiveis.filter(l =>
    l.nome_completo.toLowerCase().includes(importSearch.toLowerCase()) ||
    l.cnpj.includes(importSearch.replace(/\D/g, ''))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Empresas — Integra Contador</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{empresas.length} empresa{empresas.length !== 1 ? 's' : ''} cadastrada{empresas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {leadsDisponiveis.length > 0 && (
            <button
              onClick={() => { setShowImport(true); setImportSelected(new Set()); setImportSearch(''); }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              Importar leads ({leadsDisponiveis.length})
            </button>
          )}
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Nova Empresa
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Regime</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Lead Vinculado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Certificado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Serviços</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ativo</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {empresas.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-400 dark:text-slate-500">
                  <div className="space-y-2">
                    <div className="text-4xl">🏢</div>
                    <div className="font-medium">Nenhuma empresa cadastrada</div>
                    {leadsDisponiveis.length > 0 && (
                      <button
                        onClick={() => { setShowImport(true); setImportSelected(new Set()); setImportSearch(''); }}
                        className="text-emerald-600 underline text-sm"
                      >
                        Importar {leadsDisponiveis.length} lead{leadsDisponiveis.length !== 1 ? 's' : ''} com CNPJ
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {empresas.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">{e.razao_social}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{formatCnpj(e.cnpj)}</div>
                </td>

                <td className="px-4 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${REGIME_BADGE[e.regime_tributario] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {e.regime_tributario}
                  </span>
                </td>

                <td className="px-4 py-4">
                  {e.lead_id ? (
                    <div>
                      <div className="font-medium text-slate-700 dark:text-slate-200 leading-snug">{e.lead_nome ?? '—'}</div>
                      {e.lead_telefone && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatPhone(e.lead_telefone)}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 dark:text-slate-600 italic">Sem lead</span>
                  )}
                </td>

                <td className="px-4 py-4">
                  {e.certificado_validade ? (
                    <div className={certVencendo(e.certificado_validade) ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
                      <div className="text-sm">{new Date(e.certificado_validade).toLocaleDateString('pt-BR')}</div>
                      {certVencendo(e.certificado_validade) && (
                        <div className="text-xs text-red-500 dark:text-red-400 mt-0.5">⚠ Vencendo</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                  )}
                </td>

                <td className="px-4 py-4 max-w-[200px]">
                  <ServicePills services={e.servicos_habilitados ?? []} />
                </td>

                <td className="px-4 py-4 text-center">
                  <Toggle on={e.ativo} onClick={() => handleToggle(e.id, e.ativo)} disabled={isPending} />
                </td>

                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => openEdit(e)} className="text-blue-500 hover:text-blue-400 text-xs font-medium">
                      Editar
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-400 text-xs font-medium">
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Importar de leads */}
      {showImport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Importar Leads como Empresas</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Selecione os leads com CNPJ para cadastrar no Integra Contador. O regime será MEI por padrão — edite depois se necessário.
            </p>

            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              value={importSearch}
              onChange={e => setImportSearch(e.target.value)}
              className={inputCls}
            />

            <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700">
              {leadsVisiveis.length === 0 && (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">Nenhum lead encontrado</div>
              )}
              {leadsVisiveis.map(l => {
                const nomeEmpresa = l.razao_social || l.nome_completo;
                const showPessoa = l.razao_social && l.razao_social !== l.nome_completo;
                return (
                  <label key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importSelected.has(l.id)}
                      onChange={() => setImportSelected(prev => {
                        const next = new Set(prev);
                        if (next.has(l.id)) {
                          next.delete(l.id);
                        } else {
                          next.add(l.id);
                        }
                        return next;
                      })}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-700 dark:text-slate-200 truncate">{nomeEmpresa}</div>
                      <div className="flex gap-2 items-center mt-0.5">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{formatCnpj(l.cnpj)}</span>
                        {showPessoa && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 truncate">· {l.nome_completo}</span>
                        )}
                      </div>
                    </div>
                    {l.procuracao_ativa && (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full shrink-0 font-medium">
                        Procuração
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setImportSelected(new Set(leadsVisiveis.map(l => l.id)))}
                className="text-xs text-blue-500 hover:text-blue-400"
              >
                Selecionar todos
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button
                  onClick={handleImportConfirm}
                  disabled={isPending || importSelected.size === 0}
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{editingId ? 'Editar Empresa' : 'Nova Empresa'}</h2>

            {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Razão Social *</label>
                <input value={form.razao_social} onChange={e => setForm(f => ({ ...f, razao_social: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">CNPJ *</label>
                <input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value.replace(/\D/g, '') }))}
                  className={`${inputCls} font-mono`} placeholder="00000000000000" maxLength={14} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Regime Tributário</label>
                <select value={form.regime_tributario} onChange={e => handleRegimeChange(e.target.value)}
                  className={inputCls}>
                  {REGIMES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Validade do Certificado</label>
                <input type="date" value={form.certificado_validade} onChange={e => setForm(f => ({ ...f, certificado_validade: e.target.value }))}
                  className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                  className={inputCls} rows={2} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Serviços Habilitados</label>
              <div className="grid grid-cols-2 gap-1.5">
                {SERVICOS_DISPONIVEIS.map(s => (
                  <label key={s} className="flex items-center gap-2 text-xs cursor-pointer text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={form.servicos_habilitados.includes(s)}
                      onChange={() => toggleServico(s)} className="rounded" />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                Cancelar
              </button>
              <button onClick={handleSubmit} disabled={isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
