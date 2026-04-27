'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, RefreshCw, FileText, AlertTriangle, ShieldCheck, ShieldOff } from 'lucide-react';
import { savePdfToR2 } from '../actions';
import { fetchSitfisRelatorio } from '@/lib/sitfis-flow';

const SERVICOS = ['SIT_FISCAL_RELATORIO', 'CND', 'PGMEI_EXTRATO'] as const;
type Servico = typeof SERVICOS[number];

const SERVICO_LABEL: Record<Servico, string> = {
  SIT_FISCAL_RELATORIO: 'SITFIS',
  CND: 'CND',
  PGMEI_EXTRATO: 'DAS-MEI',
};

interface DocStatus {
  status: 'GERADO' | 'EXPIRADO' | 'NAO_GERADO';
  r2_url?: string;
  valido_ate?: string;
  created_at?: string;
  id?: string;
}

interface CarteiraLead {
  lead_id: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  cnpj: string;
  procuracao_ativa: boolean;
  procuracao_validade: string | null;
  documentos: Record<Servico, DocStatus>;
}

function StatusBadge({ doc, onGerar, onOpenPdf, gerando, opening }: {
  doc: DocStatus;
  onGerar: () => void;
  onOpenPdf: () => void;
  gerando: boolean;
  opening: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  if (doc.status === 'GERADO') {
    const daysLeft = (doc.valido_ate && now)
      ? Math.ceil((new Date(doc.valido_ate).getTime() - now) / 86_400_000)
      : null;
    return (
      <div className="flex flex-col items-center gap-1">
        <button onClick={onOpenPdf} disabled={opening}
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:opacity-80 transition-opacity disabled:opacity-50">
          {opening ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
          {opening ? '...' : 'Gerado'}
        </button>
        {daysLeft !== null && (
          <span className={`text-[10px] ${daysLeft <= 14 ? 'text-amber-500' : 'text-zinc-400'}`}>
            {daysLeft}d restantes
          </span>
        )}
      </div>
    );
  }

  if (doc.status === 'EXPIRADO') {
    return (
      <div className="flex flex-col items-center gap-1">
        <button onClick={onGerar} disabled={gerando}
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 transition-colors disabled:opacity-50">
          {gerando ? <RefreshCw className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
          Expirado
        </button>
        <span className="text-[10px] text-zinc-400">Clique para renovar</span>
      </div>
    );
  }

  return (
    <button onClick={onGerar} disabled={gerando}
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors disabled:opacity-50">
      {gerando ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
      Gerar
    </button>
  );
}

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export default function CarteiraPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<CarteiraLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'ok'>('todos');
  const [gerandoMap, setGerandoMap] = useState<Record<string, boolean>>({});
  const [openingMap, setOpeningMap] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [togglingProc, setTogglingProc] = useState<Set<number>>(new Set());

  const fetchCarteira = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/serpro/carteira');
      if (res.ok) setLeads(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCarteira(); }, [fetchCarteira]);

  const gerarDocumento = async (lead: CarteiraLead, servico: Servico) => {
    const key = `${lead.cnpj}-${servico}`;
    setGerandoMap((m) => ({ ...m, [key]: true }));
    try {
      if (servico === 'SIT_FISCAL_RELATORIO') {
        const { pdfBase64, protocolo } = await fetchSitfisRelatorio(lead.cnpj);
        await savePdfToR2(pdfBase64, lead.cnpj, protocolo, 'SIT_FISCAL_RELATORIO');
      } else {
        const res = await fetch('/api/serpro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cnpj: lead.cnpj, service: servico }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha');
        // Para PGMEI_EXTRATO o PDF vem na resposta
        const parsedData = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
        const pdfBase64 = String(parsedData?.pdf || data.pdf || '').trim();
        if (pdfBase64) {
          await savePdfToR2(pdfBase64, lead.cnpj, `${servico}-${Date.now()}`, servico);
        }
      }
      await fetchCarteira();
    } catch (err) {
      console.error(`Erro ao gerar ${servico} para ${lead.cnpj}:`, err);
    } finally {
      setGerandoMap((m) => ({ ...m, [key]: false }));
    }
  };

  const handleOpenPdf = async (docId: string, key: string) => {
    setOpeningMap((m) => ({ ...m, [key]: true }));
    try {
      const res = await fetch(`/api/serpro/documentos/${docId}/download`);
      if (!res.ok) { alert('Erro ao gerar link de download'); return; }
      const { url } = await res.json() as { url: string };
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setOpeningMap((m) => ({ ...m, [key]: false }));
    }
  };

  const gerarParaSelecionados = async (servico: Servico) => {
    const targets = leads.filter((l) => selected.has(l.lead_id));
    for (const lead of targets) {
      await gerarDocumento(lead, servico);
    }
  };

  const filtered = leads.filter((l) => {
    const matchSearch = !search ||
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.cnpj.includes(search.replace(/\D/g, ''));

    const hasPendente = SERVICOS.some((s) => l.documentos[s]?.status !== 'GERADO');
    const matchStatus =
      filterStatus === 'todos' ||
      (filterStatus === 'pendente' && hasPendente) ||
      (filterStatus === 'ok' && !hasPendente);

    return matchSearch && matchStatus;
  });

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.lead_id)));
    }
  };

  const toggleProcuracao = async (lead: CarteiraLead) => {
    setTogglingProc((s) => new Set(s).add(lead.lead_id));
    try {
      const novoStatus = !lead.procuracao_ativa;
      const res = await fetch(`/api/serpro/procuracao/${lead.lead_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar procuração');
      await fetchCarteira();
    } catch (err) {
      console.error('Erro ao alternar procuração:', err);
    } finally {
      setTogglingProc((s) => { const ns = new Set(s); ns.delete(lead.lead_id); return ns; });
    }
  };

  const pendentes = leads.filter((l) => SERVICOS.some((s) => l.documentos[s]?.status !== 'GERADO')).length;

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Carteira de Clientes</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {leads.length} cliente{leads.length !== 1 ? 's' : ''} com CNPJ
            {pendentes > 0 && <span className="ml-2 text-amber-500 font-medium">· {pendentes} com pendências</span>}
          </p>
        </div>
        <button onClick={fetchCarteira} className="flex items-center gap-2 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Filtros + Ações em lote */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-64"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'todos' | 'pendente' | 'ok')}
          className="px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="todos">Todos</option>
          <option value="pendente">Com pendências</option>
          <option value="ok">Todos em dia</option>
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
            <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">{selected.size} selecionados</span>
            {SERVICOS.map((s) => (
              <button key={s} onClick={() => gerarParaSelecionados(s)}
                className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                Gerar {SERVICO_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Procuração</th>
              {SERVICOS.map((s) => (
                <th key={s} className="px-4 py-3 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">
                  {SERVICO_LABEL[s]}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={3 + SERVICOS.length + 2} className="px-4 py-10 text-center text-zinc-400 text-sm">
                  Carregando carteira...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3 + SERVICOS.length + 2} className="px-4 py-10 text-center text-zinc-400 text-sm">
                  Nenhum cliente com CNPJ cadastrado.
                </td>
              </tr>
            ) : filtered.map((lead) => (
              <tr key={lead.lead_id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${selected.has(lead.lead_id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox"
                    checked={selected.has(lead.lead_id)}
                    onChange={(e) => {
                      const s = new Set(selected);
                      e.target.checked ? s.add(lead.lead_id) : s.delete(lead.lead_id);
                      setSelected(s);
                    }}
                    className="rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500" />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-white">{lead.nome}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{formatCnpj(lead.cnpj)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {lead.procuracao_ativa ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Ativa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <XCircle className="w-3 h-3" /> Sem proc.
                      </span>
                    )}
                    <button
                      onClick={() => toggleProcuracao(lead)}
                      disabled={togglingProc.has(lead.lead_id)}
                      title={lead.procuracao_ativa ? 'Revogar procuração' : 'Marcar procuração como ativa'}
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {togglingProc.has(lead.lead_id)
                        ? <RefreshCw className="w-3 h-3 animate-spin" />
                        : lead.procuracao_ativa
                          ? <><ShieldOff className="w-3 h-3" /> Revogar</>
                          : <><ShieldCheck className="w-3 h-3" /> Confirmar</>
                      }
                    </button>
                  </div>
                </td>
                {SERVICOS.map((s) => (
                  <td key={s} className="px-4 py-3 text-center">
                    <StatusBadge
                      doc={lead.documentos[s] || { status: 'NAO_GERADO' }}
                      gerando={!!gerandoMap[`${lead.cnpj}-${s}`]}
                      opening={!!openingMap[`${lead.cnpj}-${s}-open`]}
                      onGerar={() => gerarDocumento(lead, s)}
                      onOpenPdf={() => {
                        const doc = lead.documentos[s];
                        if (doc?.id) handleOpenPdf(doc.id, `${lead.cnpj}-${s}-open`);
                      }}
                    />
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/serpro?cnpj=${lead.cnpj}`)}
                      className="text-xs flex items-center gap-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      <FileText className="w-3 h-3" /> Consultar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
