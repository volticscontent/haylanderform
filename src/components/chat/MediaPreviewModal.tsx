
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Send, FileText, Music } from 'lucide-react';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (file: File, caption?: string) => void;
  file: File | null;
  type: 'image' | 'video' | 'audio' | 'document';
}

export function MediaPreviewModal({ isOpen, onClose, onSend, file, type }: MediaPreviewModalProps) {
  const [caption, setCaption] = useState('');

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (!isOpen || !file) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(file, caption);
    setCaption('');
    onClose();
  };

  const handleClose = () => {
    setCaption('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="media-preview-modal-title">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 id="media-preview-modal-title" className="font-semibold text-zinc-900 dark:text-zinc-100">
            Enviar {type === 'image' ? 'Imagem' : type === 'video' ? 'Vídeo' : type === 'audio' ? 'Áudio' : 'Arquivo'}
          </h3>
          <button onClick={handleClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-zinc-50 dark:bg-black/20">
          {type === 'image' && previewUrl && (
            <div className="relative w-full h-64 sm:h-80">
              <Image 
                src={previewUrl} 
                alt="Preview" 
                fill 
                className="object-contain rounded-lg"
                unoptimized
              />
            </div>
          )}
          
          {type === 'video' && previewUrl && (
            <video src={previewUrl} controls className="max-w-full max-h-80 rounded-lg" />
          )}

          {type === 'audio' && (
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Music size={32} />
              </div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              {previewUrl && <audio controls src={previewUrl} className="w-full mt-2" />}
            </div>
          )}

          {type === 'document' && (
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                <FileText size={32} />
              </div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>

        {/* Footer / Caption */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {(type === 'image' || type === 'video') && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Adicione uma legenda..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-black border focus:border-emerald-500 rounded-xl outline-none transition-all text-sm"
                autoFocus
              />
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <button 
                type="button" 
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
                Cancelar
            </button>
            <button 
                type="submit"
                className="px-6 py-2 text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
                <Send size={16} />
                Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
