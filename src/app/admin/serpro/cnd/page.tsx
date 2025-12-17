'use client';

import { useState } from 'react';
import { DataViewer } from '@/components/serpro/DataViewer';
import LastConsultedClients from '@/components/serpro/LastConsultedClients';

interface SerproMessage {
  codigo?: string;
  texto?: string;
}

interface SerproResponse {
  mensagens?: SerproMessage[];
  primary?: unknown;
  fallback?: unknown;
  [key: string]: unknown;
}

export default function CndPage() {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SerproResponse | null>(null);
  const [error, setError] = useState('');

  const handleConsultar = async () => {
    if (!cnpj) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/serpro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cnpj, 
          service: 'CND'
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao buscar dados');
      }

      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha inesperada';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Emissão de CND</h1>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              CNPJ
            </label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleConsultar}
            disabled={loading || !cnpj}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Emitindo...
              </>
            ) : (
              'Emitir Certidão'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {result && (
        (() => {
          const r = result as SerproResponse;
          const mensagens = Array.isArray(r.mensagens) ? r.mensagens : [];
          const primaryData = r.primary ? r.primary : r;
          const fallbackData = r.fallback;

          return (
            <div className="space-y-6">
              {mensagens.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Mensagens do Sistema</h3>
                  <div className="space-y-2">
                    {mensagens.map((m, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                        <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 min-w-[120px]">{m.codigo || 'AVISO'}</div>
                        <div className="text-sm text-blue-800 dark:text-blue-200">{m.texto || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                <DataViewer data={primaryData} title="Resultado da CND" />
                
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    Ver JSON Bruto
                  </summary>
                  <pre className="mt-2 bg-zinc-100 dark:bg-zinc-950 p-4 rounded overflow-auto text-xs text-zinc-600 dark:text-zinc-400 max-h-[200px] border border-zinc-200 dark:border-zinc-800">
                    {JSON.stringify(primaryData, null, 2)}
                  </pre>
                </details>
              </div>

              {!!fallbackData && (
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 border-l-4 border-l-emerald-500">
                  <DataViewer data={fallbackData} title="Dados Complementares" />
                </div>
              )}
            </div>
          );
        })()
      )}

      <LastConsultedClients />
    </div>
  );
}
