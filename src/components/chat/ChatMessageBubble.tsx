'use client';

import React from 'react';
import { Message } from './types';
import { FileText, Download, Check, CheckCheck } from 'lucide-react';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
  isFirst?: boolean;
  isLast?: boolean;
}

export function MessageBubble({ message, isFirst = true, isLast = true }: MessageBubbleProps) {
  const isMe = message.fromMe;
  const [imgError, setImgError] = React.useState(false);
  
  // Define border radius based on position in group
  const borderRadiusClass = isMe
    ? `${isFirst ? 'rounded-tr-xl' : 'rounded-tr-sm'} ${isLast ? 'rounded-br-xl' : 'rounded-br-sm'} rounded-l-xl`
    : `${isFirst ? 'rounded-tl-xl' : 'rounded-tl-sm'} ${isLast ? 'rounded-bl-xl' : 'rounded-bl-sm'} rounded-r-xl`;

  // Margin bottom logic
  const marginBottom = isLast ? 'mb-2' : 'mb-0.5';

  const formatText = (text: string) => {
    if (!text) return null;

    // Split by newlines first to handle line breaks
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      // For each line, parse markdown-like syntax
      // Regex matches: *bold*, _italic_, ~strike~, `code`, and URLs
      const parts = line.split(/(\*+[^*]+\*+|_+.+?_+|~+[^~]+~+|`+[^`]+`+|https?:\/\/[^\s]+)/g);

      const renderedParts = parts.map((part, partIndex) => {
        if (!part) return null;

        // Bold (*text*)
        if (part.match(/^\*([^*]+)\*$/)) {
          return <strong key={partIndex}>{part.slice(1, -1)}</strong>;
        }
        
        // Italic (_text_)
        if (part.match(/^_(.+)_$/)) {
          return <em key={partIndex}>{part.slice(1, -1)}</em>;
        }

        // Strike (~text~)
        if (part.match(/^~([^~]+)~$/)) {
          return <del key={partIndex}>{part.slice(1, -1)}</del>;
        }

        // Code (`text`)
        if (part.match(/^`([^`]+)`$/)) {
          return (
            <code key={partIndex} className="bg-black/10 dark:bg-white/10 px-1 rounded font-mono text-[0.9em]">
              {part.slice(1, -1)}
            </code>
          );
        }

        // URL
        if (part.match(/^https?:\/\/[^\s]+$/)) {
          return (
            <a 
              key={partIndex} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`hover:underline break-all ${isMe ? 'text-blue-600 dark:text-blue-300 underline' : 'text-blue-600 dark:text-blue-400'}`}
            >
              {part}
            </a>
          );
        }

        return <span key={partIndex}>{part}</span>;
      });

      return (
        <React.Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {renderedParts}
        </React.Fragment>
      );
    });
  };

  const renderContent = () => {
    // IMAGE
    if (message.mediaType === 'image' && message.mediaUrl) {
      if (imgError) {
        return (
          <div className="mb-1">
             <div className="w-full h-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-500 p-4 text-center">
                <span className="text-xs">Imagem indisponível</span>
             </div>
             {message.content && <div className="text-sm mt-1">{formatText(message.content)}</div>}
          </div>
        );
      }

      return (
        <div className="mb-1">
          <div className="relative w-full rounded-lg overflow-hidden bg-black/5 dark:bg-white/5">
            <Image 
              src={message.mediaUrl} 
              alt="Imagem" 
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto object-contain max-h-[400px] min-w-[150px]"
              unoptimized // Allow base64/external
              onError={() => setImgError(true)}
            />
          </div>
          {message.content && <div className="text-sm mt-1.5 px-1">{formatText(message.content)}</div>}
        </div>
      );
    }

    // AUDIO
    if (message.mediaType === 'audio' && message.mediaUrl) {
      return (
        <div className="flex flex-col gap-1 min-w-[240px]">
          <div className="flex items-center gap-2">
             <audio controls src={message.mediaUrl} className="w-full h-8" />
          </div>
          {message.content && <div className="text-sm px-1">{formatText(message.content)}</div>}
        </div>
      );
    }

    // VIDEO
    if (message.mediaType === 'video' && message.mediaUrl) {
      return (
        <div className="mb-1 min-w-[200px] sm:min-w-[280px]">
          <div className="relative bg-black/10 dark:bg-white/5 rounded-lg overflow-hidden">
            <video 
                controls 
                src={message.mediaUrl} 
                className="w-full rounded-lg max-h-[320px] object-contain bg-black" 
            />
          </div>
          {message.content && <div className="text-sm mt-1.5 px-1">{formatText(message.content)}</div>}
        </div>
      );
    }

    // DOCUMENT
    if (message.mediaType === 'document' && message.mediaUrl) {
        const fileExt = message.fileName?.split('.').pop()?.toUpperCase() || 'FILE';
        const isPdf = fileExt === 'PDF';
        
        return (
          <div className="flex flex-col gap-1 min-w-[220px]">
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                isMe 
                ? 'bg-emerald-100/50 dark:bg-emerald-900/30 border-emerald-200/50 dark:border-emerald-800/50' 
                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isPdf 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                <FileText size={20} />
              </div>
              
              <div className="flex-1 overflow-hidden min-w-0">
                <p className="truncate text-sm font-semibold leading-tight mb-0.5" title={message.fileName || undefined}>
                    {message.fileName || 'Documento'}
                </p>
                <p className="text-[10px] opacity-70 uppercase font-medium tracking-wider">
                    {fileExt} • {message.mimetype?.split('/')[1] || 'FILE'}
                </p>
              </div>
              
              <a 
                href={message.mediaUrl} 
                download={message.fileName || 'document'} 
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-full transition-colors shrink-0 ${
                    isMe
                    ? 'hover:bg-emerald-200/50 dark:hover:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300'
                    : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}
                title="Baixar arquivo"
              >
                <Download size={18} />
              </a>
            </div>
            {message.content && <div className="text-sm mt-1 px-1">{formatText(message.content)}</div>}
          </div>
        );
    }

    return <div className="text-sm leading-relaxed">{formatText(message.content || '')}</div>;
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${marginBottom} group select-none`}>
      <div 
        className={`max-w-[85%] sm:max-w-[65%] p-2 shadow-sm relative transition-all break-words ${borderRadiusClass} ${
          isMe 
            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-zinc-900 dark:text-zinc-100 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]' 
            : 'bg-white dark:bg-[#202c33] text-zinc-900 dark:text-zinc-100 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]'
        }`}
      >
        {renderContent()}
        
        <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 select-none min-h-[16px] ${
            isMe ? 'text-emerald-900/40 dark:text-emerald-100/50' : 'text-zinc-400 dark:text-zinc-500'
        }`}>
          <span>
            {new Date(message.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isMe && (
            <span className={
                message.status === 'read' 
                ? 'text-blue-500 dark:text-blue-400' 
                : message.status === 'delivered' 
                    ? 'text-zinc-400 dark:text-zinc-500' // Delivered is gray usually
                    : 'text-zinc-400 dark:text-zinc-500'
            }>
              {message.status === 'read' ? <CheckCheck size={14} /> : message.status === 'delivered' ? <CheckCheck size={14} /> : <Check size={14} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
