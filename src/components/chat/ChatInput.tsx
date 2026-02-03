
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onFileSelect: (file: File) => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  isRecording: boolean;
  recordingTime: number;
  disabled?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  onFileSelect, 
  onStopRecording, 
  onCancelRecording,
  isRecording,
  recordingTime,
  disabled 
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Only show drag state for text, not files
    if (!disabled && e.dataTransfer.types.includes('text/plain') && !e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const text = e.dataTransfer.getData('text/plain');
    if (text) {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newText = inputText.substring(0, start) + text + inputText.substring(end);
            setInputText(newText);
            
            // Focus and set cursor position
            setTimeout(() => {
                if(textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + text.length;
                }
            }, 0);
        } else {
            setInputText(prev => prev + text);
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                e.preventDefault();
                onFileSelect(file);
                return;
            }
        }
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-200">
        <div className="flex-1 flex items-center gap-3 text-red-500 animate-pulse">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="font-mono font-medium">{formatTime(recordingTime)}</span>
          <span className="text-zinc-400 text-sm ml-2">Gravando áudio...</span>
        </div>
        
        <button 
          onClick={onCancelRecording}
          className="p-3 text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          title="Cancelar"
        >
          <X size={24} />
        </button>
        
        <button 
          onClick={onStopRecording}
          className="p-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-full shadow-lg transition-all transform active:scale-95"
          title="Enviar áudio"
        >
          <Send size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Media upload disabled for now */}
        {/* <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,video/*,audio/*,application/*"
        />
        
        <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors mb-0.5"
            title="Anexar arquivo"
        >
            <Paperclip size={22} />
        </button> */}

        <div 
            className={`flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center border transition-colors ${
            isDragging 
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/10' 
            : 'border-transparent focus-within:border-zinc-300 dark:focus-within:border-zinc-700'
            }`}
            // Drag and drop restored (but filtered in handlers)
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Digite uma mensagem..."
                aria-label="Digite sua mensagem"
                disabled={disabled}
                rows={1}
                className={`w-full px-4 py-3 bg-transparent border-none rounded-2xl outline-none resize-none max-h-32 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 ${isDragging ? 'pointer-events-none' : ''}`}
            />
        </div>

        {inputText.trim() ? (
            <button 
                onClick={handleSubmit}
                disabled={disabled}
                aria-label="Enviar mensagem"
                className="p-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow-md transition-all transform active:scale-95 mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send size={22} />
            </button>
        ) : (
            // Voice recording disabled for now
            /* <button 
                onClick={onStartRecording}
                disabled={disabled}
                className="p-3 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors mb-0.5"
                title="Gravar áudio"
            >
                <Mic size={22} />
            </button> */
            <div className="w-[46px]"></div> // Placeholder to keep layout stable if needed, or remove
        )}
      </div>
    </div>
  );
}
