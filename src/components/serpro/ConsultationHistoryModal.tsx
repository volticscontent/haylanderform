'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Search, FileText, Bot, User } from 'lucide-react';
import { DataViewer } from './DataViewer';

interface Consultation {
  id: number;
  tipo_servico: string;
  resultado: unknown;
  status: number;
  source: string;
  created_at: string;
}

interface ConsultationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cnpj: string;
  clientName: string;
}

export default function ConsultationHistoryModal({
  isOpen,
  onClose,
  cnpj,
  clientName,
}: ConsultationHistoryModalProps) {
  const [history, setHistory] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  useEffect(() => {
    if (isOpen && cnpj) {
      fetchHistory();
    }
  }, [isOpen, cnpj]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/serpro/history?cnpj=${cnpj}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
        if (data.length > 0) {
          setSelectedConsultation(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMM, HH:mm", { locale: ptBR });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[80vh] rounded-xl shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div>
            <h2 id="history-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Histórico de Consultas
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {clientName} • {cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar List */}
          <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/50">
            {loading ? (
              <div className="p-4 text-center text-sm text-zinc-500 animate-pulse">
                Carregando histórico...
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
                <Search className="w-8 h-8 opacity-50" />
                <p>Nenhuma consulta encontrada.</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedConsultation(item)}
                    className={`w-full text-left p-4 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col gap-1 ${
                      selectedConsultation?.id === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500'
                        : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                        {item.tipo_servico}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        item.status >= 200 && item.status < 300 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span>{formatDate(item.created_at)}</span>
                      <div className="flex items-center gap-1" title={`Origem: ${item.source}`}>
                        {item.source === 'bot' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span className="capitalize">{item.source}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content (DataViewer) */}
          <div className="w-2/3 overflow-y-auto p-6 bg-white dark:bg-zinc-900">
            {selectedConsultation ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Detalhes da Consulta
                  </h3>
                  <div className="text-xs text-zinc-500 font-mono">
                    ID: {selectedConsultation.id}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-lg px-2 border border-zinc-200 dark:border-zinc-800">
                   <DataViewer data={selectedConsultation.resultado} />
                </div>

                <details>
                  <summary className="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors mt-4">
                    Ver JSON Bruto
                  </summary>
                  <pre className="mt-2 bg-zinc-100 dark:bg-zinc-950 p-4 rounded overflow-auto text-xs text-zinc-600 dark:text-zinc-400 max-h-[300px] border border-zinc-200 dark:border-zinc-800">
                    {JSON.stringify(selectedConsultation.resultado, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <FileText className="w-12 h-12 mb-2 opacity-20" />
                <p>Selecione uma consulta para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
