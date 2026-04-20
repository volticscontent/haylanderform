'use client';

import { useState, useEffect, useCallback } from 'react';

interface SerproDocumento {
  id: string;
  cnpj: string;
  tipo_servico: string;
  protocolo: string | null;
  r2_url: string;
  tamanho_bytes: number | null;
  valido_ate: string | null;
  gerado_por: string;
  lead_nome: string | null;
  created_at: string;
}

interface Props {
  refreshTrigger?: number;
  onSelectCnpj?: (cnpj: string) => void;
}

function ValidadeBadge({ validoAte }: { validoAte: string | null }) {
  if (!validoAte) {
    return <span className="text-xs text-zinc-400">—</span>;
  }
  const expiry = new Date(validoAte);
  const now = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000);
  const expired = daysLeft < 0;
  const warning = !expired && daysLeft <= 14;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      expired
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : warning
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${expired ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      {expired ? 'Expirado' : `${daysLeft}d`}
    </span>
  );
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function SerproDocumentosTab({ refreshTrigger = 0, onSelectCnpj }: Props) {
  const [docs, setDocs] = useState<SerproDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCnpj, setFilterCnpj] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterGeradoPor, setFilterGeradoPor] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCnpj) params.set('cnpj', filterCnpj.replace(/\D/g, ''));
      if (filterTipo) params.set('tipo_servico', filterTipo);
      if (filterGeradoPor) params.set('gerado_por', filterGeradoPor);
      const res = await fetch(`/api/serpro/documentos?${params}`);
      if (res.ok) setDocs(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filterCnpj, filterTipo, filterGeradoPor]);

  useEffect(() => { fetchDocs(); }, [fetchDocs, refreshTrigger]);

  const handleOpenPdf = async (id: string) => {
    setOpeningId(id);
    try {
      const res = await fetch(`/api/serpro/documentos/${id}/download`);
      if (!res.ok) { alert('Erro ao gerar link de download'); return; }
      const { url } = await res.json() as { url: string };
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este documento do registro? O arquivo no R2 será mantido.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/serpro/documentos/${id}`, { method: 'DELETE' });
      if (res.ok) setDocs((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const tiposUnicos = Array.from(new Set(docs.map((d) => d.tipo_servico)));

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filtrar por CNPJ"
          value={filterCnpj}
          onChange={(e) => setFilterCnpj(e.target.value)}
          className="px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos os tipos</option>
          {tiposUnicos.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterGeradoPor}
          onChange={(e) => setFilterGeradoPor(e.target.value)}
          className="px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Origem: Todos</option>
          <option value="admin">Admin</option>
          <option value="bot">Bot</option>
        </select>
        <button
          onClick={fetchDocs}
          className="px-3 py-1.5 text-sm rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          Atualizar
        </button>
        <span className="ml-auto text-xs text-zinc-400 self-center">{docs.length} documento{docs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              {['Cliente / CNPJ', 'Tipo', 'Protocolo', 'Gerado em', 'Válido até', 'Tamanho', 'Origem', 'Ações'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-400 text-sm">Carregando...</td>
              </tr>
            ) : docs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-400 text-sm">
                  Nenhum documento fiscal armazenado ainda.
                </td>
              </tr>
            ) : docs.map((doc) => (
              <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-white">
                    {doc.lead_nome || '—'}
                  </div>
                  <button
                    onClick={() => onSelectCnpj?.(doc.cnpj)}
                    className="text-xs text-blue-500 hover:underline font-mono"
                  >
                    {formatCnpj(doc.cnpj)}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                    {doc.tipo_servico}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 font-mono max-w-[120px] truncate" title={doc.protocolo ?? ''}>
                  {doc.protocolo || '—'}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {new Date(doc.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3">
                  <ValidadeBadge validoAte={doc.valido_ate} />
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatBytes(doc.tamanho_bytes)}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    doc.gerado_por === 'admin'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}>
                    {doc.gerado_por}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPdf(doc.id)}
                      disabled={openingId === doc.id}
                      className="text-xs px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-50"
                    >
                      {openingId === doc.id ? '...' : 'PDF'}
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-xs px-2 py-1 rounded border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    >
                      {deletingId === doc.id ? '...' : 'Remover'}
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
