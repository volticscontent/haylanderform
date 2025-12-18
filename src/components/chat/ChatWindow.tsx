'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Paperclip, Mic, Send, X } from 'lucide-react';
import { Chat, Message } from './types';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  chat?: Chat;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onSendMedia: (file: File, type: 'image' | 'video' | 'audio' | 'document', caption?: string, isVoiceNote?: boolean) => void;
  loading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export function ChatWindow({ chat, messages, onSendMessage, onSendMedia, loading, onLoadMore, hasMore, loadingMore }: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevLoadingMoreRef = useRef(loadingMore);
  const prevScrollHeightRef = useRef(0);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

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
      // Only scroll to bottom if we are not looking at history?
      // For now, simple behavior: always scroll to bottom on new messages (unless loading more)
      scrollToBottom();
    }
    
    prevLoadingMoreRef.current = loadingMore;
  }, [messages, loadingMore]);

  // Capture scroll height before loading more
  useEffect(() => {
    if (loadingMore && messagesContainerRef.current) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
    }
  }, [loadingMore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine type
    let type: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    // Simple confirm for now (could be a modal)
    const caption = type === 'image' || type === 'video' ? prompt('Legenda (opcional):') || undefined : undefined;
    
    onSendMedia(file, type, caption);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' }); // WhatsApp usually likes mp4/aac or ogg
        const audioFile = new File([audioBlob], 'audio.mp4', { type: 'audio/mp4' });
        onSendMedia(audioFile, 'audio', undefined, true);
        
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
      alert('Erro ao acessar microfone');
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
      // Just stop and don't send (overwrite onstop or handle logic)
      // Simplest: stop but set flag to ignore
      mediaRecorderRef.current.onstop = null; 
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur">
        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 font-bold overflow-hidden relative">
           {chat.image ? (
            <Image src={chat.image} alt={chat.name} fill className="object-cover" unoptimized />
          ) : (
            chat.name.substring(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{chat.name}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{chat.id.replace('@s.whatsapp.net', '')}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-100 dark:bg-black/20" ref={messagesContainerRef}>
        {loading ? (
          <div className="flex justify-center p-4">
            <span className="text-zinc-500 text-sm">Carregando mensagens...</span>
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
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {isRecording ? (
          <div className="flex items-center gap-4 p-2">
            <div className="flex-1 flex items-center gap-2 text-red-500 animate-pulse">
              <Mic size={20} />
              <span className="text-sm font-medium">Gravando {formatTime(recordingTime)}</span>
            </div>
            <button 
              onClick={cancelRecording}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500"
            >
              <X size={20} />
            </button>
            <button 
              onClick={stopRecording}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-full text-white"
            >
              <Send size={20} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleFileClick}
              className="p-3 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              title="Anexar arquivo"
            >
              <Paperclip size={20} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            
            {inputText.trim() ? (
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg transition-colors"
              >
                <Send size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="p-3 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                title="Gravar áudio"
              >
                <Mic size={20} />
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
