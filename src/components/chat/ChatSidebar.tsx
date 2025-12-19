'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Chat } from './types';
import { CheckSquare, Square, UserPlus, Search, MessageSquare, UserX, Clock, ExternalLink, Menu } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

interface ChatSidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
  loading: boolean;
  onRegister: (chat: Chat) => void;
  onViewLead: (chat: Chat) => void;
  onMassRegister: (chats: Chat[]) => void;
}

type TabType = 'all' | 'unread' | 'unregistered';

export function ChatSidebar({ chats, selectedChatId, onSelectChat, loading, onRegister, onViewLead, onMassRegister }: ChatSidebarProps) {
  const { setSidebarOpen } = useAdmin();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedForMassAction, setSelectedForMassAction] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filteredChats = useMemo(() => {
    let filtered = chats;

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(c => (c.unreadCount || 0) > 0);
    } else if (activeTab === 'unregistered') {
      filtered = filtered.filter(c => !c.isRegistered);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(lowerTerm) || 
        c.id.includes(lowerTerm)
      );
    }

    return filtered;
  }, [chats, activeTab, searchTerm]);

  // For mass selection, we only consider unregistered chats from the current view
  const unregisteredInView = filteredChats.filter(chat => !chat.isRegistered);

  if (loading) {
    return (
        <div className="flex flex-col h-full items-center justify-center p-4 text-zinc-500 gap-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Carregando conversas...</span>
        </div>
    );
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedForMassAction(new Set()); 
  };

  const toggleChatSelection = (e: React.SyntheticEvent, chatId: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedForMassAction);
    if (newSet.has(chatId)) {
      newSet.delete(chatId);
    } else {
      newSet.add(chatId);
    }
    setSelectedForMassAction(newSet);
  };

  const selectAllUnregisteredInView = () => {
    const idsInView = unregisteredInView.map(c => c.id);
    // If all currently visible are selected, deselect them. Otherwise, select all visible.
    const allSelected = idsInView.every(id => selectedForMassAction.has(id));
    
    if (allSelected) {
        setSelectedForMassAction(new Set());
    } else {
        setSelectedForMassAction(new Set(idsInView));
    }
  };

  const handleMassRegisterClick = () => {
    const selectedChats = chats.filter(c => selectedForMassAction.has(c.id));
    onMassRegister(selectedChats);
    setIsSelectionMode(false);
    setSelectedForMassAction(new Set());
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                >
                    <Menu size={20} />
                </button>
                <h2 className="hidden md:block font-semibold text-zinc-800 dark:text-zinc-100 text-lg">Conversas</h2>
            </div>
            <div className="flex gap-1">
                <button 
                    onClick={toggleSelectionMode}
                    className={`p-2 rounded-lg transition-colors ${
                    isSelectionMode 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title={isSelectionMode ? "Cancelar seleção" : "Selecionar contatos"}
                >
                    <CheckSquare size={18} />
                </button>
            </div>
        </div>

        {/* Search */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
                type="text" 
                placeholder="Buscar conversa..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-black border focus:border-emerald-500 rounded-lg text-sm transition-all outline-none"
            />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('all')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'all' 
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
                <MessageSquare size={12} />
                Todas
            </button>
            <button 
                onClick={() => setActiveTab('unread')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'unread' 
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
                <Clock size={12} />
                Não lidos
            </button>
            <button 
                onClick={() => setActiveTab('unregistered')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'unregistered' 
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
                <UserX size={12} />
                Novos
            </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {isSelectionMode && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <button 
                    onClick={selectAllUnregisteredInView}
                    className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1.5 hover:underline"
                >
                    {unregisteredInView.length > 0 && unregisteredInView.every(c => selectedForMassAction.has(c.id)) ? (
                        <CheckSquare size={14} />
                    ) : (
                        <Square size={14} />
                    )}
                    Selecionar visíveis ({unregisteredInView.length})
                </button>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {selectedForMassAction.size} selecionados
                </span>
            </div>
            
            <button 
                onClick={handleMassRegisterClick}
                disabled={selectedForMassAction.size === 0}
                className={`w-full text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                    selectedForMassAction.size > 0 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow' 
                        : 'bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600'
                }`}
            >
                <UserPlus size={14} />
                CADASTRAR SELECIONADOS
            </button>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 flex flex-col items-center gap-2">
                <Search size={32} className="opacity-20" />
                <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
        ) : (
            filteredChats.map((chat) => {
                const isUnregistered = !chat.isRegistered;
                const isSelected = selectedForMassAction.has(chat.id);
                
                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                        if (isSelectionMode && isUnregistered) {
                            const syntheticEvent = { stopPropagation: () => {} } as React.SyntheticEvent;
                            toggleChatSelection(syntheticEvent, chat.id);
                        } else {
                            onSelectChat(chat.id);
                        }
                    }}
                    className={`p-3 border-b border-zinc-50 dark:border-zinc-800/50 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors relative group
                      ${selectedChatId === chat.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
                      ${isUnregistered ? 'border-l-4 border-l-green-400 pl-2' : 'pl-3'}
    
                    `}
                  >
                    <div className="flex items-center gap-3 p-2">
                      {/* Checkbox in Selection Mode */}
                      {isSelectionMode && isUnregistered && (
                        <div className="shrink-0 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                            <div 
                                onClick={(e) => toggleChatSelection(e, chat.id)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                    isSelected 
                                        ? 'bg-blue-600 border-blue-600 text-white' 
                                        : 'border-zinc-300 dark:border-zinc-600 hover:border-blue-400'
                                }`}
                            >
                                {isSelected && <CheckSquare size={14} />}
                            </div>
                        </div>
                      )}
    
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 font-bold overflow-hidden relative shrink-0 border border-zinc-100 dark:border-zinc-700">
                        {chat.image ? (
                          <Image src={chat.image} alt={chat.name} fill className="object-cover" unoptimized />
                        ) : (
                          chat.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
    
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-2">
                            {chat.leadName ? (
                                <div className="flex flex-col">
                                    <span>{chat.leadName}</span>
                                    {chat.name !== chat.leadName && (
                                        <span className="text-[10px] text-zinc-400 font-normal">{chat.name}</span>
                                    )}
                                </div>
                            ) : (
                                chat.name
                            )}
                          </h3>
                          <span className="text-[10px] text-zinc-400 shrink-0">
                            {new Date((chat.timestamp || 0) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center h-5">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[85%]">
                            {chat.lastMessage}
                          </p>
                          {chat.unreadCount ? (
                            <span className="bg-emerald-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full">
                              {chat.unreadCount}
                            </span>
                          ) : null}
                        </div>

                        {/* Registered User Action */}
                        {!isSelectionMode && chat.isRegistered && (
                             <div className="mt-2 flex justify-start">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onViewLead(chat); }}
                                  className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-300/10 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 transition-colors font-medium"
                                  title="Ver detalhes"
                                >
                                    <ExternalLink size={12} />
                                    {chat.leadStatus === 'qualificado' && chat.leadDataReuniao ? 'Call' : (chat.leadStatus === 'cliente' ? 'Ver Cliente' : 'Ver Lead')}
                                </button>
                             </div>
                        )}
    
                        {/* Individual Action (only when NOT in selection mode) */}
                        {!isSelectionMode && isUnregistered && (
                            <div className="mt-2 flex gap-2 justify-start flex-wrap">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onRegister(chat); }}
                                  className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 border border-blue-200 px-2 py-1 rounded-md hover:bg-green-100 dark:hover:bg-orange-300/10 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 transition-colors font-medium"
                                  title="Apenas cadastrar"
                                >
                                    <UserPlus size={12} />
                                    Cadastrar
                                </button>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
            })
        )}
      </div>
    </div>
  );
}
