'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Chat } from './types';

interface ChatSidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (id: string) => void;
  loading: boolean;
  onRegister: (chat: Chat) => void;
  onMassRegister: (chats: Chat[]) => void;
}

export function ChatSidebar({ chats, selectedChatId, onSelectChat, loading, onRegister, onMassRegister }: ChatSidebarProps) {
  const [selectedForMassAction, setSelectedForMassAction] = useState<Set<string>>(new Set());

  if (loading) {
    return <div className="p-4 text-center text-zinc-500">Carregando conversas...</div>;
  }

  if (chats.length === 0) {
    return <div className="p-4 text-center text-zinc-500">Nenhuma conversa encontrada.</div>;
  }

  const toggleMassSelection = (e: React.SyntheticEvent, chatId: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedForMassAction);
    if (newSet.has(chatId)) {
      newSet.delete(chatId);
    } else {
      newSet.add(chatId);
    }
    setSelectedForMassAction(newSet);
  };

  const handleMassRegisterClick = () => {
    const selectedChats = chats.filter(c => selectedForMassAction.has(c.id));
    onMassRegister(selectedChats);
    setSelectedForMassAction(new Set());
  };

  const unregisteredCount = selectedForMassAction.size;

  return (
    <div className="flex flex-col h-full">
      {unregisteredCount > 0 && (
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center shrink-0">
                <span className="text-sm text-blue-700 dark:text-blue-300">{unregisteredCount} selecionados</span>
                <button 
                    onClick={handleMassRegisterClick}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                    Cadastrar em massa
                </button>
            </div>
        )}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors relative group ${
              selectedChatId === chat.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''
            } ${!chat.isRegistered ? 'border-l-4 border-l-orange-400 pl-3' : ''}`}
          >
             {/* Checkbox for unregistered users */}
             {!chat.isRegistered && (
                  <div className="absolute left-2 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedForMassAction.has(chat.id)}
                        onChange={(e) => toggleMassSelection(e, chat.id)}
                        className="rounded border-zinc-300 cursor-pointer w-4 h-4"
                      />
                  </div>
              )}
             {/* Show checkbox always if selected */}
             {selectedForMassAction.has(chat.id) && !chat.isRegistered && (
                 <div className="absolute left-2 top-4 z-10" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={true}
                        onChange={(e) => toggleMassSelection(e, chat.id)}
                        className="rounded border-zinc-300 cursor-pointer w-4 h-4"
                      />
                  </div>
             )}

            <div className={`flex items-center gap-3 ${!chat.isRegistered ? 'pl-4' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 font-bold overflow-hidden relative shrink-0">
                {chat.image ? (
                  <Image src={chat.image} alt={chat.name} fill className="object-cover" unoptimized />
                ) : (
                  chat.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {new Date((chat.timestamp || 0) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[80%]">
                    {chat.lastMessage}
                  </p>
                  {chat.unreadCount ? (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {chat.unreadCount}
                    </span>
                  ) : null}
                </div>
                {!chat.isRegistered && (
                    <div className="mt-2 flex justify-end">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRegister(chat); }}
                          className="text-[10px] bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 transition-colors"
                        >
                            Cadastrar
                        </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
