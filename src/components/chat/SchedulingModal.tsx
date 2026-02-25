'use client';

import React, { useState, useEffect } from 'react';
import { Search, Send, X, Calendar, Building, User, Phone, FileText } from 'lucide-react';
import { searchLeadsForScheduling, sendSchedulingLink, SchedulingLead } from '@/app/admin/atendimento/agendamento-actions';

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SchedulingModal({ isOpen, onClose }: SchedulingModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState<SchedulingLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<SchedulingLead | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [schedulingLink, setSchedulingLink] = useState('https://calendly.com/seu-link-aqui'); // Default link

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setLoading(true);
        const res = await searchLeadsForScheduling(searchTerm);
        if (res.success && res.data) {
          setLeads(res.data);
        }
        setLoading(false);
      } else {
        setLeads([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSend = async () => {
    if (!selectedLead || !schedulingLink) return;

    setSending(true);
    const res = await sendSchedulingLink(selectedLead.telefone, schedulingLink);
    setSending(false);

    if (res.success) {
      alert('Link enviado com sucesso!');
      handleClose();
    } else {
      alert(`Erro ao enviar: ${res.error}`);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setLeads([]);
    setSelectedLead(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="scheduling-modal-title">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-100 font-semibold">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <h3 id="scheduling-modal-title">Enviar Agendamento</h3>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Buscar Cliente</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text"
                placeholder="Nome, CNPJ ou Telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Results List */}
          {searchTerm.length >= 3 && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {loading ? (
                 <div className="flex justify-center p-4">
                   <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
              ) : leads.length > 0 ? (
                leads.map((lead) => (
                  <div 
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedLead?.id === lead.id 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500' 
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-100">
                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                {lead.nome_completo || 'Sem nome'}
                            </div>
                            {(lead.razao_social || lead.nome_fantasia) && (
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                                    <Building className="w-3.5 h-3.5 text-zinc-400" />
                                    {lead.nome_fantasia || lead.razao_social}
                                </div>
                            )}
                        </div>
                        {selectedLead?.id === lead.id && (
                            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Selecionado
                            </span>
                        )}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {lead.cnpj && (
                            <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700/50 px-1.5 py-0.5 rounded">
                                <FileText className="w-3 h-3" />
                                {lead.cnpj}
                            </span>
                        )}
                        <span className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700/50 px-1.5 py-0.5 rounded">
                            <Phone className="w-3 h-3" />
                            {lead.telefone}
                        </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-zinc-500 text-sm">
                  Nenhum cliente encontrado.
                </div>
              )}
            </div>
          )}

          {/* Selected Lead Confirmation & Link Input */}
          {selectedLead && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-bottom-2">
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Link de Agendamento</label>
                        <input 
                            type="text"
                            value={schedulingLink}
                            onChange={(e) => setSchedulingLink(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-xs border border-yellow-200 dark:border-yellow-800/30">
                        Será enviada uma mensagem para <strong>{selectedLead.telefone}</strong> com este link.
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 rounded-b-xl flex justify-end gap-2">
          <button 
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSend}
            disabled={!selectedLead || !schedulingLink || sending}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {sending ? (
                <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                </>
            ) : (
                <>
                    <Send className="w-4 h-4" />
                    Enviar Link
                </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
