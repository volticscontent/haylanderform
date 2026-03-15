'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
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
  const selectedChatIdRef = React.useRef(selectedChatId);

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

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
    if (content.extendedTextMessage?.text) return content.extendedTextMessage.text.replace(/^\u200B+/, '');

    // Image
    if (content.imageMessage) return '📷 [Imagem] ' + (content.imageMessage.caption?.replace(/^\u200B+/, '') || '');

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

    let agentName: string | undefined = undefined;
    if (content.startsWith('\u200B')) {
      let zCount = 0;
      while (content[zCount] === '\u200B') zCount++;
      
      if (zCount === 1) agentName = 'Apolo';
      else if (zCount === 2) agentName = 'Icaro';
      else agentName = 'Apolo'; // default fallback for other bot interactions
      
      content = content.substring(zCount);
    }

    return {
      id: m.key?.id || m.keyId || m.id,
      fromMe: m.key?.fromMe !== undefined ? m.key.fromMe : (m.fromMe || false),
      content,
      timestamp: typeof m.messageTimestamp === 'number' ? m.messageTimestamp : (m.messageTimestamp instanceof Date ? Math.floor(m.messageTimestamp.getTime() / 1000) : (Number(m.messageTimestamp) || Math.floor(Date.now() / 1000))),
      type: m.messageType,
      status: m.status,
      mediaUrl,
      mediaType,
      fileName,
      mimetype,
      agentName
    };
  }

  const loadChats = useCallback(async () => {
    setLoadingChats(true);
    const res = await getChats();
    if (res.success && Array.isArray(res.data)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedChats = res.data.map((c: any) => {
        let displayName = c.leadName || c.name || c.pushName;
        if (!displayName || displayName === 'Você') displayName = c.id?.split('@')[0] || 'Desconhecido';

        return {
          id: c.remoteJid || c.id || c.conversationId,
          evolutionJid: c.evolutionJid || c.remoteJid || c.id || c.conversationId,
          name: displayName,
          image: c.profilePicUrl || c.profilePictureUrl,
          unreadCount: c.unreadCount || 0,
          lastMessage: extractMessagePreview(c.lastMessage || c),
          timestamp: c.lastMessage?.messageTimestamp || c.conversationTimestamp || (c.updatedAt ? Math.floor(new Date(c.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000)),
          isRegistered: c.isRegistered,
          leadId: c.leadId,
          leadName: c.leadName,
          leadStatus: c.leadStatus,
          leadDataReuniao: c.leadDataReuniao
        };
      });

      // Deduplicate chats based on ID
      const uniqueChats = Array.from(new Map(mappedChats.map((c: Chat) => [c.id, c])).values());

      // Sort by timestamp descending (future/recent first)
      uniqueChats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setChats(uniqueChats);
    }
    setLoadingChats(false);
  }, []);

  // --- BOT BACKEND WEBSOCKET (via nosso socket server na porta 3001) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [socket, setSocket] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Conectar direto na Evolution API
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'https://evolutionapi.landcriativa.com';
    const apiKey = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY;

    console.log('[Evolution WS] Connecting to:', socketUrl);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newSocket: any = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { apikey: apiKey }
    });

    newSocket.on('connect', () => {
      console.log('[Evolution WS] ✅ Connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Evolution WS] ❌ Disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err: Error) => {
      console.warn('[Evolution WS] Connection error:', err.message);
    });

    // Evolution API v2: events are standard strings when Global Events is enabled
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleIncomingMessage = (data: any) => {
      console.log('[Evolution WS] 📩 nova mensagem (event):', data);

      // Verifica se é de grupo
      if (data?.data?.key?.remoteJid?.endsWith('@g.us') || data?.key?.remoteJid?.endsWith('@g.us')) return;

      let senderId = data?.data?.key?.senderPn || data?.senderpn || data?.data?.senderpn || data?.senderPhone || data?.data?.senderPhone || data?.data?.key?.participant || data?.data?.participant || data?.data?.key?.remoteJid || data?.key?.remoteJid || data?.chatId;
      if (!senderId) return;

      // Drop LID (Linked Devices) messages completely to avoid phantom chats
      if (String(senderId).includes('@lid') || String(data?.data?.key?.remoteJid).includes('@lid') || String(data?.key?.remoteJid).includes('@lid')) {
        return;
      }

      // Força a usar PhoneNumber explicitamente igual ao Backend actions.ts e ignora LIDs onde possível
      const isFromMe = data?.data?.key?.fromMe ?? data?.key?.fromMe ?? data?.fromMe ?? false;
      let phone = String(senderId).split('@')[0].replace(/\D/g, '');
      
      if (isFromMe) {
         const rJid = data?.data?.key?.remoteJid || data?.key?.remoteJid || data?.chatId;
         if (rJid) phone = String(rJid).split('@')[0].replace(/\D/g, '');
      } else if (data?.data?.key?.senderPn || data?.key?.senderPn) {
        phone = String(data?.data?.key?.senderPn || data?.key?.senderPn).replace(/\D/g, '');
      }
      senderId = phone ? `${phone}@s.whatsapp.net` : senderId;

      const normalizedMsg = normalizeMessage(data?.data || data);

      if (selectedChatIdRef.current && senderId === selectedChatIdRef.current) {
        setMessages(prev => {
          if (prev.some(m => m.id === normalizedMsg.id)) return prev; // deduplicate
          return [...prev, normalizedMsg];
        });
      }

      // Recarregar lista de chats para atualizar preview/unread
      loadChats();
    };

    newSocket.on('messages.upsert', handleIncomingMessage);
    newSocket.on('new-message', handleIncomingMessage);
    newSocket.on('chat-update-global', handleIncomingMessage);
    newSocket.on('send.message', handleIncomingMessage);

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [loadChats]);

  const loadMessages = useCallback(async (jid: string, pageNum = 1, silent = false) => {
    if (pageNum === 1 && !silent) setLoadingMessages(true);
    else if (pageNum > 1) setLoadingMore(true);

    const res = await getMessages(jid, pageNum);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = (res.data as any)?.messages?.records || (Array.isArray(res.data) ? res.data : []);

    if (res.success && Array.isArray(records)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedMessages = records.map((m: any) => normalizeMessage(m)).reverse();

      // Deduplicate mappedMessages itself (just in case API returns duplicates)
      const uniqueMappedMessages = Array.from(new Map(mappedMessages.map((m: Message) => [m.id, m])).values());

      if (pageNum === 1) {
        setMessages(uniqueMappedMessages);
      } else {
        // Filter out duplicates based on ID
        setMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id));
          const newUniqueMessages = uniqueMappedMessages.filter((msg: Message) => !existingIds.has(msg.id));
          return [...newUniqueMessages, ...prev];
        });
      }
      setHasMore(records.length >= 50);
    }

    if (pageNum === 1 && !silent) setLoadingMessages(false);
    else setLoadingMore(false);
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Efetua carregamento da conversa (usando sempre o JID padronizado @s.whatsapp.net para não perder mensagens do bot ligadas ao número principal e não ao LID)
  useEffect(() => {
    if (selectedChatId && chats.length > 0) {
      setPage(1);
      loadMessages(selectedChatId, 1);
    }
  }, [selectedChatId, chats, loadMessages]);

  const handleLoadMore = async () => {
    if (!selectedChatId || !hasMore || loadingMessages || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    const chat = chats.find(c => c.id === selectedChatId);
    await loadMessages(chat?.evolutionJid || selectedChatId, nextPage);
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChatId) return;
    const currentChat = chats.find(c => c.id === selectedChatId);

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

    const res = await sendMessage(currentChat?.evolutionJid || selectedChatId, text);
    if (res.success) {
      setMessages(prev => prev.map(m => {
        if (m.id === tempId) {
          // If we have the real message data, use it
          if (res.data && res.data.key) {
            return normalizeMessage(res.data);
          }
          // Otherwise just update status
          return { ...m, status: 'sent', id: res.data?.key?.id || m.id };
        }
        return m;
      }));
    } else {
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: 'error' } : m
      ));
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

    const chat = chats.find(c => c.id === selectedChatId);
    const res = await sendMedia(chat?.evolutionJid || selectedChatId, formData);

    if (res.success) {
      setMessages(prev => prev.map(m => {
        if (m.id === tempId) {
          if (res.data && res.data.key) {
            return normalizeMessage(res.data);
          }
          return { ...m, status: 'sent', id: res.data?.key?.id || m.id };
        }
        return m;
      }));

      // Update sidebar
      setChats(prev => {
        const newChats = [...prev];
        const idx = newChats.findIndex(c => c.id === selectedChatId);
        if (idx !== -1) {
          const chat = { ...newChats[idx] };
          if (type === 'image') chat.lastMessage = '📷 [Imagem] ' + (caption || '');
          else if (type === 'video') chat.lastMessage = '🎥 [Vídeo]';
          else if (type === 'audio') chat.lastMessage = '🎵 [Áudio]';
          else if (type === 'document') chat.lastMessage = 'Vk [Documento]';
          else chat.lastMessage = '[Arquivo]';

          chat.timestamp = Math.floor(Date.now() / 1000);
          newChats.splice(idx, 1);
          newChats.unshift(chat);
        }
        return newChats;
      });
    } else {
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: 'error' } : m
      ));
      alert('Erro ao enviar mídia');
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

    switch (destination) {
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
