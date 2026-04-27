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
  return typeof str === 'string' && str.startsWith('JVBERi0');
};

export const downloadPdf = (base64: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = `data:application/pdf;base64,${base64}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

import { Download, FileText, CheckCircle2, AlertCircle, Clock, MapPin, Building2, User, Phone, Mail, Hash, ShieldCheck } from 'lucide-react';

// Chaves técnicas que o contador não precisa ver
const IGNORED_KEYS = [
  'responseId', 'contratante', 'pedidoDados', 'autorPedidoDados',
  'responseDateTime', 'idSistema', 'idServico', 'versaoSistema'
];

// Função auxiliar para exportar CSV
const exportToCSV = (data: any[], fileName: string) => {
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
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
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

// Função auxiliar para obter ícone baseado no título
const getIconForKey = (key: string) => {
  const k = key.toLowerCase();
  if (k.includes('endereço') || k.includes('logradouro') || k.includes('municipio') || k.includes('uf') || k.includes('cep')) return <MapPin className="w-4 h-4" />;
  if (k.includes('razão social') || k.includes('nome empresarial') || k.includes('nome fantasia')) return <Building2 className="w-4 h-4" />;
  if (k.includes('nome') || k.includes('sócio') || k.includes('qsa')) return <User className="w-4 h-4" />;
  if (k.includes('telefone') || k.includes('ddd')) return <Phone className="w-4 h-4" />;
  if (k.includes('email')) return <Mail className="w-4 h-4" />;
  if (k.includes('cnpj') || k.includes('cpf') || k.includes('ni') || k.includes('numero')) return <Hash className="w-4 h-4" />;
  if (k.includes('situação') || k.includes('status')) return <ShieldCheck className="w-4 h-4" />;
  if (k.includes('data') || k.includes('vencimento') || k.includes('criado')) return <Clock className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

// Componente recursivo para exibir dados
export const DataViewer = ({ data, title, level = 0 }: { data: unknown; title?: string; level?: number }) => {
  if (data === null || data === undefined) return null;

  // Se for uma chave ignorada, não renderiza
  if (title && (IGNORED_KEYS.includes(title.toLowerCase()) || IGNORED_KEYS.some(k => formatKey(k) === title))) {
    return null;
  }

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
        <div className="flex justify-between p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 items-center bg-zinc-50/30 dark:bg-zinc-800/10 rounded-lg mb-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
          </div>
          <button
            onClick={() => downloadPdf(data, `${title || 'documento'}.pdf`)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white dark:bg-red-500 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-sm text-sm font-bold active:scale-95"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </button>
        </div>
      );
    }
  }

  // Tipos primitivos
  if (typeof data !== 'object') {
    let displayValue = String(data);
    let badgeClass = "text-zinc-900 dark:text-zinc-200 font-medium";

    if (typeof data === 'boolean') {
      displayValue = data ? 'Sim' : 'Não';
      badgeClass = data 
        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-bold"
        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded text-xs font-bold";
    } else if (title && /situa[çc][ãa]o/i.test(title)) {
        // Lógica de cores para status
        const val = displayValue.toUpperCase();
        if (val === 'ATIVA' || val === 'HABILITADO' || val === 'OK') {
          badgeClass = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1";
          displayValue = `● ${displayValue}`;
        }
        else if (val === 'BAIXADA' || val === 'CANCELADA' || val === 'INAPTA' || val === 'ERRO') {
          badgeClass = "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1";
          displayValue = `× ${displayValue}`;
        }
        else if (val === 'SUSPENSA' || val === 'NULA' || val === 'PENDENTE' || val === 'ALERTA') {
          badgeClass = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1";
          displayValue = `! ${displayValue}`;
        }
    }

    return (
      <div className="group flex justify-between p-2.5 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors rounded-md">
        <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
          {title && getIconForKey(title)}
          <span className="text-sm font-semibold">{title}:</span>
        </div>
        <span className={`text-sm text-right break-all ml-4 max-w-[60%] ${badgeClass}`}>
          {displayValue}
        </span>
      </div>
    );
  }

  // Arrays
  if (Array.isArray(data)) {
    if (data.length === 0) return <div className="text-zinc-400 dark:text-zinc-600 text-sm italic py-3 flex items-center gap-2 px-2"><AlertCircle className="w-4 h-4" /> Lista vazia</div>;

    // Tenta renderizar como tabela se forem objetos simples
    const isSimpleObject = data.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
    if (isSimpleObject && data.length > 0) {
      // Filtra as chaves para a tabela também
      const keys = Object.keys(data[0]).filter(k => !IGNORED_KEYS.includes(k));

      if (keys.length === 0) return null;


      return (
        <div className="mt-4 mb-6">
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
              {title && <h4 className={`font-bold text-zinc-900 dark:text-zinc-100 tracking-tight ${level === 0 ? 'text-xl' : 'text-lg'}`}>{title}</h4>}
              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full font-bold">{data.length}</span>
            </div>
            <button
              onClick={() => exportToCSV(data, title || 'dados_tabela')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/30 transition-all shadow-sm active:scale-95"
              title="Exportar tabela para CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
          <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm bg-white dark:bg-zinc-950">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                <thead className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <tr>
                    {keys.map(k => (
                      <th key={k} className="px-4 py-3 text-left text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                        {formatKey(k)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      {keys.map(k => {
                        const val = item[k];
                        let displayVal = String(val);
                        if (typeof val === 'object') displayVal = JSON.stringify(val);
                        if (typeof val === 'boolean') displayVal = val ? 'Sim' : 'Não';

                        return (
                          <td key={k} className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap font-medium">
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
          {title && <h4 className={`font-bold text-zinc-900 dark:text-zinc-100 tracking-tight ${level === 0 ? 'text-xl' : 'text-lg'}`}>{title}</h4>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((item, idx) => (
            <div key={idx} className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
              <DataViewer data={item} level={level + 1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Objetos
  const allKeys = Object.keys(data);
  const filteredKeys = allKeys.filter(key => !IGNORED_KEYS.includes(key));

  if (filteredKeys.length === 0) return null;

  return (
    <div className={`space-y-2 ${level > 0 ? 'mt-4' : ''}`}>
      {title && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className={`w-1.5 h-5 rounded-full ${level === 0 ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
          <h4 className={`font-bold text-zinc-900 dark:text-zinc-100 tracking-tight ${level === 0 ? 'text-xl' : 'text-lg'}`}>{title}</h4>
        </div>
      )}
      <div className={`${level === 0 ? 'bg-white dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm' : ''}`}>
        <div className="grid grid-cols-1 gap-1">
          {filteredKeys.map(key => {
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
    </div>
  );
};
