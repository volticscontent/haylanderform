'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getChats, getMessages, sendMessage, sendMedia, registerLead, massRegisterLeads } from '@/app/admin/atendimento/actions';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { Chat, Message } from './types';

export function ChatInterface() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Helper to extract text for preview
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function extractMessagePreview(msg: any): string {
    if (!msg) return '';
    if (typeof msg === 'string') return msg;
    
    const m = msg.message || msg;
    const content = m.viewOnceMessage?.message || 
                    m.viewOnceMessageV2?.message || 
                    m.ephemeralMessage?.message || 
                    m.documentWithCaptionMessage?.message || 
                    m;

    // Direct text
    if (content.conversation) return content.conversation;
    
    // Extended text
    if (content.extendedTextMessage?.text) return content.extendedTextMessage.text;
    
    // Image
    if (content.imageMessage) return '📷 [Imagem] ' + (content.imageMessage.caption || '');
    
    // Audio
    if (content.audioMessage) return '🎵 [Áudio]';
    
    // Video
    if (content.videoMessage) return '🎥 [Vídeo]';
    
    // Document
    if (content.documentMessage) return 'Vk [Documento] ' + (content.documentMessage.fileName || '');
    
    // Sticker
    if (content.stickerMessage) return '💟 [Figurinha]';

    // Protocol (deleted, edited)
    if (content.protocolMessage) return '🚫 [Mensagem apagada/editada]';

    return '[Mensagem]';
  }

  // Helper to normalize message data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function normalizeMessage(m: any): Message {
    const originalContent = m.message || m;
    
    // Unwrap wrappers
    const contentObj = originalContent.viewOnceMessage?.message || 
                       originalContent.viewOnceMessageV2?.message || 
                       originalContent.ephemeralMessage?.message || 
                       originalContent.documentWithCaptionMessage?.message || 
                       originalContent;

    let content = '';
    let mediaType: Message['mediaType'] = null;
    let mediaUrl: string | null = null;
    let fileName: string | null = null;
    let mimetype: string | null = null;

    // Extract content and media info
    if (contentObj.conversation) {
      content = contentObj.conversation;
    } else if (contentObj.extendedTextMessage?.text) {
      content = contentObj.extendedTextMessage.text;
    } else if (contentObj.imageMessage) {
      mediaType = 'image';
      content = contentObj.imageMessage.caption || '';
      // Evolution often provides base64 in the message object if configured, or we use the thumbnail
      mediaUrl = m.base64 ? `data:${contentObj.imageMessage.mimetype};base64,${m.base64}` : null;
      // Fallback to url if available (often internal docker url, might not work)
      if (!mediaUrl && contentObj.imageMessage.url) mediaUrl = contentObj.imageMessage.url;
      mimetype = contentObj.imageMessage.mimetype;
    } else if (contentObj.audioMessage) {
      mediaType = 'audio';
      mediaUrl = m.base64 ? `data:${contentObj.audioMessage.mimetype};base64,${m.base64}` : null;
      if (!mediaUrl && contentObj.audioMessage.url) mediaUrl = contentObj.audioMessage.url;
      mimetype = contentObj.audioMessage.mimetype;
    } else if (contentObj.videoMessage) {
      mediaType = 'video';
      content = contentObj.videoMessage.caption || '';
      mediaUrl = m.base64 ? `data:${contentObj.videoMessage.mimetype};base64,${m.base64}` : null;
      if (!mediaUrl && contentObj.videoMessage.url) mediaUrl = contentObj.videoMessage.url;
      mimetype = contentObj.videoMessage.mimetype;
    } else if (contentObj.documentMessage) {
      mediaType = 'document';
      content = contentObj.documentMessage.caption || '';
      fileName = contentObj.documentMessage.fileName || 'document';
      mediaUrl = m.base64 ? `data:${contentObj.documentMessage.mimetype};base64,${m.base64}` : null;
      if (!mediaUrl && contentObj.documentMessage.url) mediaUrl = contentObj.documentMessage.url;
      mimetype = contentObj.documentMessage.mimetype;
    } else if (contentObj.stickerMessage) {
      mediaType = 'sticker';
      mediaUrl = m.base64 ? `data:${contentObj.stickerMessage.mimetype};base64,${m.base64}` : null;
      if (!mediaUrl && contentObj.stickerMessage.url) mediaUrl = contentObj.stickerMessage.url;
      mimetype = contentObj.stickerMessage.mimetype;
    }

    return {
      id: m.key?.id || m.id,
      fromMe: m.key?.fromMe || false,
      content,
      timestamp: m.messageTimestamp,
      type: m.messageType,
      status: m.status,
      mediaUrl,
      mediaType,
      fileName,
      mimetype
    };
  }

  const loadChats = useCallback(async () => {
    setLoadingChats(true);
    const res = await getChats();
    if (res.success && Array.isArray(res.data)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedChats = res.data.map((c: any) => ({
        id: c.remoteJid || c.id || c.conversationId,
        name: c.pushName || c.name || c.id?.split('@')[0] || 'Desconhecido',
        image: c.profilePicUrl || c.profilePictureUrl,
        unreadCount: c.unreadCount || 0,
        lastMessage: extractMessagePreview(c.lastMessage || c),
        timestamp: c.lastMessage?.messageTimestamp || (c.updatedAt ? Math.floor(new Date(c.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000))
      }));
      setChats(mappedChats);
    }
    setLoadingChats(false);
  }, []);

  const loadMessages = useCallback(async (jid: string, pageNum = 1) => {
    if (pageNum === 1) setLoadingMessages(true);
    else setLoadingMore(true);

    const res = await getMessages(jid, pageNum);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = (res.data as any)?.messages?.records || (Array.isArray(res.data) ? res.data : []);

    if (res.success && Array.isArray(records)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedMessages = records.map((m: any) => normalizeMessage(m)).reverse();
      
      if (pageNum === 1) {
        setMessages(mappedMessages);
      } else {
        // Filter out duplicates based on ID
        setMessages(prev => {
            const existingIds = new Set(prev.map(msg => msg.id));
            const newUniqueMessages = mappedMessages.filter(msg => !existingIds.has(msg.id));
            return [...newUniqueMessages, ...prev];
        });
      }
      setHasMore(records.length >= 20);
    }
    
    if (pageNum === 1) setLoadingMessages(false);
    else setLoadingMore(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadChats();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadChats]);

  useEffect(() => {
    if (selectedChatId) {
      setTimeout(() => setPage(1), 0);
      const timer = setTimeout(() => {
        loadMessages(selectedChatId, 1);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedChatId, loadMessages]);

  const handleLoadMore = async () => {
    if (!selectedChatId || !hasMore || loadingMessages || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadMessages(selectedChatId, nextPage);
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChatId) return;
    
    // Optimistic update
    const tempId = 'temp-' + Date.now();
    const newMessage: Message = {
      id: tempId,
      fromMe: true,
      content: text,
      timestamp: Date.now() / 1000,
      type: 'conversation',
      status: 'pending'
    };
    
    setMessages(prev => [...prev, newMessage]);

    const res = await sendMessage(selectedChatId, text);
    if (res.success) {
      loadMessages(selectedChatId);
    } else {
      alert('Erro ao enviar mensagem');
    }
  };

  const handleSendMedia = async (file: File, type: 'image' | 'video' | 'audio' | 'document', caption?: string, isVoiceNote: boolean = false) => {
    if (!selectedChatId) return;

    // Optimistic update (simplified for media)
    const tempId = 'temp-' + Date.now();
    const newMessage: Message = {
      id: tempId,
      fromMe: true,
      content: caption || '',
      timestamp: Date.now() / 1000,
      type: type === 'audio' && isVoiceNote ? 'audioMessage' : type,
      status: 'pending',
      mediaType: type,
      mediaUrl: URL.createObjectURL(file), // Preview
      fileName: file.name,
      mimetype: file.type
    };

    setMessages(prev => [...prev, newMessage]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (caption) formData.append('caption', caption);
    if (isVoiceNote) formData.append('isVoiceNote', 'true');

    const res = await sendMedia(selectedChatId, formData);
    
    if (res.success) {
      loadMessages(selectedChatId);
    } else {
      alert('Erro ao enviar mídia');
      // Remove optimistic message on failure if needed
    }
  };

  const handleRegister = async (chat: Chat) => {
    if (confirm(`Deseja cadastrar ${chat.name}?`)) {
        const res = await registerLead(chat.name, chat.id);
        if (res.success) {
            setChats(prev => prev.map(c => c.id === chat.id ? { ...c, isRegistered: true, leadId: res.data.id } : c));
            alert('Cadastrado com sucesso!');
        } else {
            alert('Erro ao cadastrar: ' + res.error);
        }
    }
  };

  const handleMassRegister = async (selectedChats: Chat[]) => {
      if (confirm(`Deseja cadastrar ${selectedChats.length} contatos?`)) {
          const leadsToRegister = selectedChats.map(c => ({ name: c.name, phone: c.id }));
          const res = await massRegisterLeads(leadsToRegister);
          if (res.success) {
              setChats(prev => {
                  const registeredIds = new Set(selectedChats.map(c => c.id));
                  return prev.map(c => registeredIds.has(c.id) ? { ...c, isRegistered: true } : c);
              });
              alert(`${res.count} contatos cadastrados com sucesso!`);
          } else {
              alert('Erro ao cadastrar em massa: ' + res.error);
          }
      }
  };

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-zinc-900 rounded-[12px] shadow-sm">
      <div className="w-1/3 border-r border-black dark:bg-black flex flex-col">
        <ChatSidebar 
          chats={chats} 
          selectedChatId={selectedChatId} 
          onSelectChat={setSelectedChatId}
          loading={loadingChats}
          onRegister={handleRegister}
          onMassRegister={handleMassRegister}
        />
      </div>
      <div className="w-2/3 flex flex-col">
        {selectedChatId ? (
          <ChatWindow 
          chat={chats.find(c => c.id === selectedChatId)} 
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendMedia={handleSendMedia}
          loading={loadingMessages}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Selecione uma conversa para iniciar o atendimento
          </div>
        )}
      </div>
    </div>
  );
}
