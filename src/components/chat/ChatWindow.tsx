'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Chat, Message } from './types';
import { MessageBubble } from './ChatMessageBubble';
import { ChatInput } from './ChatInput';
import { MediaPreviewModal } from './MediaPreviewModal';
import { ChevronDown, ArrowLeft, MoreVertical, FileText, UserPlus } from 'lucide-react';

interface ChatWindowProps {
  chat?: Chat;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onSendMedia: (file: File, type: 'image' | 'video' | 'audio' | 'document', caption?: string, isVoiceNote?: boolean) => void;
  loading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onBack?: () => void;
  onExportToDisparo?: (chat: Chat) => void;
  onExportToConsulta?: (chat: Chat) => void;
  onExportToEmissao?: (chat: Chat) => void;
  onExportToDivida?: (chat: Chat) => void;
  onViewLeadSheet?: (chat: Chat) => void;
  onRegister?: (chat: Chat) => void;
}

export function ChatWindow({ 
    chat, 
    messages, 
    onSendMessage, 
    onSendMedia, 
    loading, 
    onLoadMore, 
    hasMore, 
    loadingMore, 
    onBack,
    onExportToDisparo,
    onExportToConsulta,
    onExportToEmissao,
    onExportToDivida,
    onViewLeadSheet,
    onRegister
}: ChatWindowProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaPreview, setMediaPreview] = useState<{file: File, type: 'image' | 'video' | 'audio' | 'document'} | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevLoadingMoreRef = useRef(loadingMore);
  const prevScrollHeightRef = useRef(0);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isNearBottomRef = useRef(true); // Default to true so it scrolls down initially

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // Track scroll for "Scroll to bottom" button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      isNearBottomRef.current = isNearBottom;
      setShowScrollBottom(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check if we just finished loading more messages
    if (prevLoadingMoreRef.current && !loadingMore && messagesContainerRef.current) {
      // We finished loading more. Restore scroll position relative to bottom.
      const newScrollHeight = messagesContainerRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      
      // If we were at top (scrollTop = 0), we want to be at `diff`
      messagesContainerRef.current.scrollTop = diff;
    } else if (!loadingMore) {
      // Normal update (new message sent/received or initial load)
      // Only scroll to bottom if we are near the bottom or it's a new message from me
      const isNewMessageFromMe = messages.length > 0 && messages[messages.length - 1].fromMe;
      
      if (isNewMessageFromMe || isNearBottomRef.current) {
         scrollToBottom();
      }
    }
    
    prevLoadingMoreRef.current = loadingMore;
  }, [messages, loadingMore]); // Removed showScrollBottom from dependencies

  // Capture scroll height before loading more
  useEffect(() => {
    if (loadingMore && messagesContainerRef.current) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    }
  }, [loadingMore]);

  const handleFileSelect = (file: File) => {
    let type: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    setMediaPreview({ file, type });
  };

  const handleSendMediaPreview = (file: File, caption?: string) => {
    if (mediaPreview) {
        onSendMedia(file, mediaPreview.type, caption);
        setMediaPreview(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' }); 
        const audioFile = new File([audioBlob], 'audio.mp4', { type: 'audio/mp4' });
        
        // Check if we should send (if track wasn't just stopped by cancel)
        if (audioChunksRef.current.length > 0) {
            onSendMedia(audioFile, 'audio', undefined, true);
        }
        
        // Stop tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Clear chunks so onstop knows to ignore
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full bg-[#EFE7DD] dark:bg-[#0b141a] relative">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.06] pointer-events-none" 
           style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
      </div>

      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 z-10 shadow-sm">
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 font-bold overflow-hidden relative border border-zinc-300 dark:border-zinc-600">
           {chat.image ? (
            <Image src={chat.image} alt={chat.name} fill className="object-cover" unoptimized />
          ) : (
            chat.name.substring(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {chat.leadName || chat.name}
            </h2>
            {chat.isRegistered && chat.leadStatus && (
                <span className="text-[5px] line-clamp-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-0.5 rounded border border-indigo-200 dark:border-indigo-800 font-medium">
                    {chat.leadStatus === 'qualificado' && chat.leadDataReuniao 
                        ? 'CALL' 
                        : chat.leadStatus.replace(/_/g, ' ').toUpperCase()}
                </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {chat.leadName && chat.name !== chat.leadName ? `${chat.name} • ` : ''}
            {chat.id.replace('@s.whatsapp.net', '')}
          </p>
        </div>
        
        {/* Actions Menu */}
        <div className="ml-auto flex items-center gap-2">
            {chat.isRegistered ? (
                onViewLeadSheet && (
                    <button 
                        onClick={() => onViewLeadSheet(chat)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-md text-xs font-medium transition-colors border border-indigo-200 dark:border-indigo-800 whitespace-nowrap"
                    >
                        <FileText size={14} />
                        <span className="hidden sm:inline">Ver Ficha</span>
                    </button>
                )
            ) : (
                onRegister && (
                    <button 
                        onClick={() => onRegister(chat)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-md text-xs font-medium transition-colors border border-emerald-200 dark:border-emerald-800 whitespace-nowrap"
                    >
                        <UserPlus size={14} />
                        <span className="hidden sm:inline">Cadastrar</span>
                    </button>
                )
            )}

            <div className="relative">
            <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-600 dark:text-zinc-400 transition-colors"
            >
                <MoreVertical size={20} />
            </button>
            
            {showMenu && (
                <>
                    <div 
                        className="fixed inset-0 z-20" 
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-10 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 z-30 py-1 animate-in fade-in zoom-in duration-200">
                        <button 
                            onClick={() => { onExportToDisparo?.(chat); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                            Exportar para Disparo
                        </button>
                        <button 
                            onClick={() => { onExportToConsulta?.(chat); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                            Exportar para Consulta
                        </button>
                        <button 
                            onClick={() => { onExportToEmissao?.(chat); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                            Exportar para Emissão
                        </button>
                        <button 
                            onClick={() => { onExportToDivida?.(chat); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                            Exportar para Dívida Ativa
                        </button>
                    </div>
                </>
            )}
        </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 relative z-0" ref={messagesContainerRef}>
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-zinc-300 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-4 w-full">
                <button 
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-4 py-2 rounded-full shadow-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-all flex items-center gap-2 z-10"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <span>Carregar mensagens antigas</span>
                  )}
                </button>
              </div>
            )}
            
            {/* Group messages by date? For now just list */}
            <div className="ml-7 flex flex-col gap-2">
                {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
                ))}
            </div>

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll Bottom Button */}
      {showScrollBottom && (
        <button 
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-6 p-2 bg-zinc-600/80 hover:bg-zinc-600 text-white rounded-full shadow-lg backdrop-blur transition-all z-20 animate-in fade-in zoom-in"
        >
            <ChevronDown size={20} />
        </button>
      )}

      {/* Input Area */}
      <div className="z-10 relative">
        <ChatInput 
            onSendMessage={onSendMessage}
            onFileSelect={handleFileSelect}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onCancelRecording={cancelRecording}
            isRecording={isRecording}
            recordingTime={recordingTime}
            disabled={loading}
        />
      </div>

      {/* Media Preview Modal */}
      <MediaPreviewModal 
        isOpen={!!mediaPreview}
        onClose={() => setMediaPreview(null)}
        onSend={handleSendMediaPreview}
        file={mediaPreview?.file || null}
        type={mediaPreview?.type || 'document'}
      />
    </div>
  );
}
