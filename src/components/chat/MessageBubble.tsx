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
          className={`hover:underline ${isMe ? 'text-white underline' : 'text-blue-600 dark:text-blue-400'}`}
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
          <div className="relative w-full h-64 rounded-lg overflow-hidden mb-1">
            <Image 
              src={message.mediaUrl} 
              alt="Imagem" 
              fill 
              className="object-cover"
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

    if (message.mediaType === 'sticker' && message.mediaUrl) {
       return (
        <div className="relative w-32 h-32 mb-1">
          <Image 
            src={message.mediaUrl} 
            alt="Sticker" 
            fill 
            className="object-contain"
            unoptimized 
          />
        </div>
      );
    }

    return <div className="whitespace-pre-wrap break-words">{formatText(message.content)}</div>;
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isMe
            ? 'bg-emerald-600 text-white rounded-tr-none'
            : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none border border-zinc-200 dark:border-zinc-700'
        }`}
      >
        {renderContent()}
        <div
          className={`text-[10px] mt-1 text-right ${
            isMe ? 'text-emerald-100' : 'text-zinc-400'
          }`}
        >
          {new Date(message.timestamp * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {message.status === 'pending' && ' 🕒'}
        </div>
      </div>
    </div>
  );
}
