'use client';

import React from 'react';
import { Message } from './types';
import { FileText, Download } from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isMe = message.fromMe;
  const [imgError, setImgError] = React.useState(false);
  
  const formatText = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => 
      part.match(urlRegex) ? (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`hover:underline break-all ${isMe ? 'text-blue-600 dark:text-blue-300 underline' : 'text-blue-600 dark:text-blue-400'}`}
        >
          {part}
        </a>
      ) : part
    );
  };

  const renderContent = () => {
    if (message.mediaType === 'image' && message.mediaUrl) {
      if (imgError) {
        return (
          <div className="mb-1">
             <div className="w-full h-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-500 p-4 text-center">
                <span className="text-xs">Imagem indisponível ou expirada</span>
             </div>
             {message.content && <div className="text-sm mt-1">{formatText(message.content)}</div>}
          </div>
        );
      }

      return (
        <div className="mb-1">
          <div className="relative w-full rounded-lg overflow-hidden mb-1">
            <Image 
              src={message.mediaUrl} 
              alt="Imagem" 
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto object-contain max-h-[400px]"
              unoptimized // Allow base64/external
              onError={() => setImgError(true)}
            />
          </div>
          {message.content && <div className="text-sm mt-1">{formatText(message.content)}</div>}
        </div>
      );
    }

    if (message.mediaType === 'audio' && message.mediaUrl) {
      return (
        <div className="flex flex-col gap-1 min-w-[200px]">
          <audio controls src={message.mediaUrl} className="w-full h-8" />
          {message.content && <div className="text-sm">{formatText(message.content)}</div>}
        </div>
      );
    }

    if (message.mediaType === 'video' && message.mediaUrl) {
      return (
        <div className="mb-1">
          <video controls src={message.mediaUrl} className="w-full rounded-lg max-h-64" />
          {message.content && <div className="text-sm mt-1">{formatText(message.content)}</div>}
        </div>
      );
    }

    if (message.mediaType === 'document' && message.mediaUrl) {
      return (
        <div className="flex flex-col gap-1">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${isMe ? 'bg-emerald-700/50' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
            <FileText size={24} />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{message.fileName || 'Documento'}</p>
              <p className="text-xs opacity-70 uppercase">{message.mimetype?.split('/')[1] || 'FILE'}</p>
            </div>
            <a 
              href={message.mediaUrl} 
              download={message.fileName || 'document'} 
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-black/10 transition-colors"
            >
              <Download size={20} />
            </a>
          </div>
          {message.content && <div className="text-sm mt-1">{formatText(message.content)}</div>}
        </div>
      );
    }

    return <div className="text-sm">{formatText(message.content || '')}</div>;
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
      <div 
        className={`max-w-[85%] sm:max-w-[65%] rounded-xl p-3 shadow-sm relative ${
          isMe 
            ? 'bg-[#ffffff] dark:bg-[#005c4b] text-zinc-800 dark:text-zinc-100 rounded-tr-none' 
            : 'bg-white dark:bg-[#202c33] text-zinc-800 dark:text-zinc-100 rounded-tl-none'
        }`}
      >
        {renderContent()}
        <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-zinc-500 dark:text-emerald-100/70' : 'text-zinc-400'}`}>
          <span>
            {new Date(message.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMe && (
            <span className={message.status === 'read' ? 'text-blue-500 dark:text-blue-300' : ''}>
              {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
