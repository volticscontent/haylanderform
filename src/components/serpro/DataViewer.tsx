'use client';

import React from 'react';

// Função auxiliar para formatar chaves (camelCase -> Title Case)
export const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1') // Adiciona espaço antes de maiúsculas
    .replace(/^./, (str) => str.toUpperCase()) // Capitaliza a primeira letra
    .trim();
};

export const isPdfBase64 = (str: string) => {
  // Verifica assinatura de PDF (JVBERi0...) ou se parece um base64 longo e o campo tem nome de documento
  return typeof str === 'string' && (str.startsWith('JVBERi0') || (str.length > 500 && /^[A-Za-z0-9+/=]+$/.test(str)));
};

export const downloadPdf = (base64: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = `data:application/pdf;base64,${base64}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

import { Download } from 'lucide-react';

// Função auxiliar para  exportar CSV
const exportToCSV = (data: Record<string, unknown>[], fileName: string) => {
  if (!data || data.length === 0) return;

  // Pega as chaves do primeiro objeto para o cabeçalho
  const headers = Object.keys(data[0]);
  
  // Cria o conteúdo do CSV
  const csvContent = [
    headers.join(','), // Cabeçalho
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Trata valores para CSV (escapa aspas, converte objetos para string, etc)
        if (value === null || value === undefined) return '';
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        // Se tiver vírgula ou aspas, envolve em aspas e escapa aspas internas
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Cria o blob e faz o download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName || 'exportacao'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Componente recursivo para exibir dados
export const DataViewer = ({ data, title, level = 0 }: { data: unknown; title?: string; level?: number }) => {
  if (data === null || data === undefined) return null;

  // Se for string que parece JSON, tenta parsear
  if (typeof data === 'string') {
    let parsed: unknown = null;
    try {
      if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
        parsed = JSON.parse(data);
      }
    } catch {
      // Se falhar, exibe como string normal
    }
    if (parsed) {
      return <DataViewer data={parsed} title={title} level={level} />;
    }
    
    // Verifica se é PDF
    if (isPdfBase64(data)) {
      return (
        <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0 items-center">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">{title}:</span>
          <button 
            onClick={() => downloadPdf(data, `${title || 'documento'}.pdf`)}
            className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Baixar PDF
          </button>
        </div>
      );
    }
  }

  // Tipos primitivos
  if (typeof data !== 'object') {
    let displayValue = String(data);
    if (typeof data === 'boolean') {
      displayValue = data ? 'Sim' : 'Não';
    }
    return (
      <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
        <span className="font-medium text-zinc-600 dark:text-zinc-400">{title}:</span>
        <span className="text-zinc-900 dark:text-zinc-200 text-right break-all ml-4">{displayValue}</span>
      </div>
    );
  }

  // Arrays
  if (Array.isArray(data)) {
    if (data.length === 0) return <div className="text-zinc-500 italic py-2">Lista vazia</div>;
    
    // Tenta renderizar como tabela se forem objetos simples
    const isSimpleObject = data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
    if (isSimpleObject && data.length > 0) {
      const keys = Object.keys(data[0]);
      return (
        <div className="mt-2 overflow-x-auto">
          <div className="flex justify-between items-center mb-2">
            {title && <h4 className={`font-semibold text-zinc-800 dark:text-zinc-200 ${level === 0 ? 'text-lg' : 'text-md'}`}>{title}</h4>}
            <button
              onClick={() => exportToCSV(data, title || 'dados_tabela')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30 transition-colors"
              title="Exportar tabela para CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                {keys.map(k => (
                  <th key={k} className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    {formatKey(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
              {data.map((item, idx) => (
                <tr key={idx}>
                  {keys.map(k => {
                    const val = item[k];
                    let displayVal = String(val);
                    if (typeof val === 'object') displayVal = JSON.stringify(val);
                    if (typeof val === 'boolean') displayVal = val ? 'Sim' : 'Não';
                    
                    return (
                      <td key={k} className="px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="space-y-4 mt-2">
        {title && <h4 className={`font-semibold text-zinc-800 dark:text-zinc-200 ${level === 0 ? 'text-lg' : 'text-md'}`}>{title}</h4>}
        {data.map((item, idx) => (
          <div key={idx} className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
            <DataViewer data={item} level={level + 1} />
          </div>
        ))}
      </div>
    );
  }

  // Objetos
  const keys = Object.keys(data);
  if (keys.length === 0) return null;

  return (
    <div className={`space-y-1 ${level > 0 ? 'mt-2' : ''}`}>
      {title && <h4 className={`font-semibold text-zinc-800 dark:text-zinc-200 mb-2 ${level === 0 ? 'text-lg' : 'text-md'}`}>{title}</h4>}
      <div className={`${level === 0 ? 'bg-white dark:bg-zinc-900 rounded-lg' : ''}`}>
        {keys.map(key => {
          const val = (data as Record<string, unknown>)[key];
          return (
            <div key={key}>
               {typeof val === 'object' && val !== null ? (
                 <div className="py-2">
                   <DataViewer data={val} title={formatKey(key)} level={level + 1} />
                 </div>
               ) : (
                 <DataViewer data={val} title={formatKey(key)} level={level + 1} />
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
