'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getChats, getMessages, sendMessage, sendMedia, registerLead, massRegisterLeads, getLeadByPhone, triggerBot } from '@/app/admin/atendimento/actions';

import { ChatSidebar, ChatWindow } from '.';
import { LeadSheet, LeadSheetData } from './LeadSheet';
import { Chat, Message } from './types';

import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';

export function ChatInterface() {
  const router = useRouter();
  const { setDesktopSidebarOpen } = useAdmin();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Restore sidebar when leaving chat interface
  useEffect(() => {
    return () => setDesktopSidebarOpen(true);
  }, [setDesktopSidebarOpen]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [leadSheetOpen, setLeadSheetOpen] = useState(false);
  const [currentLeadData, setCurrentLeadData] = useState<LeadSheetData | null>(null);
  const [loadingLeadData, setLoadingLeadData] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleViewLeadSheet = async (chat: Chat) => {
      setLeadSheetOpen(true);
      setDesktopSidebarOpen(false); // Close admin sidebar
      setLoadingLeadData(true);
      setCurrentLeadData(null);

      try {
          const phone = chat.id.split('@')[0];
          const result = await getLeadByPhone(phone);
          if (result.success && result.data) {
              setCurrentLeadData(result.data as LeadSheetData);
          }
      } catch (error) {
          console.error("Error loading lead sheet:", error);
      } finally {
          setLoadingLeadData(false);
      }
  };

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
        timestamp: c.lastMessage?.messageTimestamp || (c.updatedAt ? Math.floor(new Date(c.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000)),
        isRegistered: c.isRegistered,
        leadId: c.leadId,
        leadName: c.leadName,
        leadStatus: c.leadStatus,
        leadDataReuniao: c.leadDataReuniao
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

    // Check for bot commands
    const command = text.trim().split(' ')[0].toLowerCase();
    if (['/apolo', '/hermes', '/icaro'].includes(command)) {
        const botName = command.substring(1); // remove slash
        
        // Optimistic update for system message
        const tempId = 'system-' + Date.now();
        const systemMessage: Message = {
            id: tempId,
            fromMe: true, 
            content: `🤖 Iniciando bot ${botName.charAt(0).toUpperCase() + botName.slice(1)}...`,
            timestamp: Date.now() / 1000,
            type: 'conversation',
            status: 'pending'
        };
        setMessages(prev => [...prev, systemMessage]);

        const res = await triggerBot(selectedChatId, botName);
        
        if (res.success) {
             setMessages(prev => prev.map(m => 
                m.id === tempId 
                ? { ...m, content: `✅ Bot ${botName.charAt(0).toUpperCase() + botName.slice(1)} ativado com sucesso!`, status: 'sent' }
                : m
             ));
        } else {
             setMessages(prev => prev.map(m => 
                m.id === tempId 
                ? { ...m, content: `❌ Falha ao iniciar bot ${botName}: ${res.error}`, status: 'error' }
                : m
             ));
        }
        return;
    }
    
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

  const handleViewLead = (chat: Chat) => {
      // Assuming you want to go to the list and search for this lead, or go to details
      // For now, redirecting to list with query params to find the user
      const params = new URLSearchParams({
        search: chat.leadName || chat.name
      });
      router.push(`/admin/lista?${params.toString()}`);
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

  const handleExport = (chat: Chat, destination: string) => {
      // Logic to handle export - e.g. save to local storage or state management context
      // For now we'll just redirect to the page with query params
      const phone = chat.id.replace(/\D/g, '');
      const name = chat.name;
      
      const params = new URLSearchParams({
        phone,
        name
      });
      
      switch(destination) {
        case 'disparo':
            router.push(`/admin/disparo?${params.toString()}`);
            break;
        case 'consulta':
            router.push(`/admin/serpro?${params.toString()}`);
            break;
        case 'emissao':
            router.push(`/admin/serpro/cnd?${params.toString()}`);
            break;
        case 'divida':
            router.push(`/admin/serpro/divida-ativa?${params.toString()}`);
            break;
      }
  };

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-zinc-900 relative">
      {/* Sidebar Drawer */}
      <div className={`
        absolute inset-y-0 left-0 z-40 w-full md:w-[350px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 
        transform transition-transform duration-300 ease-in-out shadow-xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <ChatSidebar 
          chats={chats} 
          selectedChatId={selectedChatId} 
          onSelectChat={(id) => {
            setSelectedChatId(id);
            setIsSidebarOpen(false);
          }}
          loading={loadingChats}
          onRegister={handleRegister}
          onViewLead={handleViewLead}
          onMassRegister={handleMassRegister}
        />
      </div>

      {/* Overlay for mobile or when sidebar is open over chat */}
      {isSidebarOpen && selectedChatId && (
          <div 
            className="absolute inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}

      {/* Main Content Area */}
      <div className="w-full h-full bg-zinc-50 dark:bg-zinc-900">
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
            onBack={() => setIsSidebarOpen(true)}
            onExportToDisparo={(c) => handleExport(c, 'disparo')}
            onExportToConsulta={(c) => handleExport(c, 'consulta')}
            onExportToEmissao={(c) => handleExport(c, 'emissao')}
            onExportToDivida={(c) => handleExport(c, 'divida')}
            onViewLeadSheet={handleViewLeadSheet}
            onRegister={handleRegister}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-4 h-full">
            <div className="text-center p-8">
              <h3 className="text-xl font-medium text-zinc-800 dark:text-zinc-200 mb-2">WhatsApp Web</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Selecione uma conversa para iniciar o atendimento</p>
            </div>
          </div>
        )}
      </div>

      <LeadSheet 
        lead={currentLeadData}
        isOpen={leadSheetOpen}
        onClose={() => {
            setLeadSheetOpen(false);
            setDesktopSidebarOpen(true); // Re-open admin sidebar when closing lead sheet
        }}
        loading={loadingLeadData}
        mode={isMobile ? "overlay" : "inline"}
      />
    </div>
  );
}
