'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getChats, getMessages, sendMessage, sendMedia, registerLead, massRegisterLeads, getLeadByPhone, triggerBot } from '@/app/(admin)/atendimento/actions';

import { ChatSidebar, ChatWindow } from '.';
import { Chat, Message } from './types';

import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import LeadDetailsSidebar from '@/components/LeadDetailsSidebar';
import { LeadRecord } from '@/types/lead';

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

  const [isMobile, setIsMobile] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [isSidebarLeadOpen, setIsSidebarLeadOpen] = useState(false);

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

  const handleViewLead = async (chat: Chat) => {
    const phone = chat.id.split('@')[0];
    try {
      const res = await getLeadByPhone(phone);
      if (res.success && res.data) {
        setSelectedLead(res.data as LeadRecord);
        setIsSidebarLeadOpen(true);
      } else {
        // Fallback to navigation if lead not found or error
        router.push(`/lista?search=${encodeURIComponent(phone)}`);
      }
    } catch (error) {
      console.error("Error loading lead:", error);
      router.push(`/lista?search=${encodeURIComponent(phone)}`);
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
    const safeContent = content || '';
    if (typeof safeContent === 'string' && safeContent.startsWith('\u200B')) {
      let zCount = 0;
      while (safeContent[zCount] === '\u200B') zCount++;
      
      if (zCount === 1) agentName = 'Apolo';
      else if (zCount === 2) agentName = 'Icaro';
      else agentName = 'Apolo'; // default fallback for other bot interactions
      
      content = safeContent.substring(zCount);
    } else {
      content = safeContent;
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
          isRegistered: c.isRegistered ?? !!c.leadId,
          leadId: c.leadId,
          leadName: c.leadName,
          leadStatus: c.leadStatus,
          leadDataReuniao: c.leadDataReuniao,
          lastMessageFromMe: c.lastMessage?.key?.fromMe ?? c.lastMessage?.fromMe,
          lastMessageStatus: c.lastMessage?.status
        };
      });

      // Deduplicate chats based on ID
      const uniqueChats: Chat[] = Array.from(new Map(mappedChats.map((c: Chat) => [c.id, c])).values()) as Chat[];

      // Sort by timestamp descending (future/recent first)
      uniqueChats.sort((a: Chat, b: Chat) => (b.timestamp || 0) - (a.timestamp || 0));

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
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';

    console.log('[Bot Backend WS] Connecting to:', socketUrl);

    // Conectar ao nosso Backend (que gerencia o Dual-JID e padronização)
    const newSocket: any = io(socketUrl, {
      transports: ['websocket', 'polling']
      // Removido apikey pois nosso backend usa auth diferente ou nenhuma em dev
    });

    newSocket.on('connect', () => {
      console.log('[Bot Backend WS] ✅ Connected:', newSocket.id);
      setIsConnected(true);
      
      // Se já houver um chat selecionado ao conectar/reconectar, entrar na sala
      if (selectedChatIdRef.current) {
        console.log('[Bot Backend WS] Re-joining room:', selectedChatIdRef.current);
        newSocket.emit('join-chat', selectedChatIdRef.current);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[Bot Backend WS] ❌ Disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err: Error) => {
      console.warn('[Bot Backend WS] Connection error:', err.message);
    });

    let debounceTimer: NodeJS.Timeout;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleIncomingMessage = (data: any) => {
      console.log('[Bot Backend WS] 📩 nova mensagem:', data);

      // Verifica se é de grupo
      if (data?.data?.key?.remoteJid?.endsWith('@g.us') || data?.key?.remoteJid?.endsWith('@g.us')) return;

      // No nosso backend, o data já vem estruturado ou com chatId direto
      // Na Evolution API, a mensagem nova vem dentro de data.messages[0] ou data.data
      const evolutionDirectMsg = data?.data?.messages?.[0] || data?.data;
      const incomingChatId = data.chatId || data.remoteJid || data.key?.remoteJid || evolutionDirectMsg?.key?.remoteJid;
      
      // Se não temos um ID de chat, não sabemos onde colocar a mensagem
      if (!incomingChatId) return;

      const normalizedMsg = normalizeMessage(evolutionDirectMsg || data);

      // Verifica se a mensagem pertence ao chat atual (pode vir via chatId ou altChatId no socket)
      if (selectedChatIdRef.current && (incomingChatId === selectedChatIdRef.current || data.altChatId === selectedChatIdRef.current)) {
        setMessages(prev => {
          if (prev.some(m => m.id === normalizedMsg.id)) return prev; // deduplicate
          const updated = [...prev, normalizedMsg];
          try { sessionStorage.setItem(`chat_msgs_${selectedChatIdRef.current}`, JSON.stringify(updated)); } catch { /* ignore */ }
          return updated;
        });
      }

      // Recarregar lista de chats para atualizar preview/unread (DEBOUNCED para não explodir a API)
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadChats();
      }, 500);
    };

    // Apenas listamos os eventos emitidos pelo NOSSO backend-socket. Retiramos os redundantes
    newSocket.on('messages.upsert', handleIncomingMessage);
    newSocket.on('new-message', handleIncomingMessage);
    newSocket.on('chat-update-global', handleIncomingMessage);
    newSocket.on('send.message', handleIncomingMessage);

    setSocket(newSocket);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      newSocket.disconnect();
    };
  }, [loadChats]);

  const getCacheKey = (jid: string) => `chat_msgs_${jid.split(',')[0]}`;

  const loadMessages = useCallback(async (jid: string, pageNum = 1, silent = false) => {
    try {
      if (pageNum === 1 && !silent) {
        // Restore from cache immediately so navigation doesn't blank the chat
        try {
          const cached = sessionStorage.getItem(getCacheKey(jid));
          if (cached) setMessages(JSON.parse(cached));
        } catch { /* ignore */ }
        setLoadingMessages(true);
      } else if (pageNum > 1) setLoadingMore(true);

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
          // Cache page-1 messages so they survive navigation
          try {
            sessionStorage.setItem(getCacheKey(jid), JSON.stringify(uniqueMappedMessages));
          } catch { /* ignore quota errors */ }
        } else {
          setMessages(prev => {
            const existingIds = new Set(prev.map(msg => msg.id));
            const newUniqueMessages = uniqueMappedMessages.filter((msg: Message) => !existingIds.has(msg.id));
            return [...newUniqueMessages, ...prev];
          });
        }
        setHasMore(records.length >= 50);
      }
    } catch (error) {
      console.error("Failed to load/parse messages:", error);
    } finally {
      if (pageNum === 1 && !silent) setLoadingMessages(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Verify registration and badges from DB whenever a chat is selected
  useEffect(() => {
    if (!selectedChatId) return;
    let cancelled = false;
    const phone = selectedChatId.split('@')[0];
    getLeadByPhone(phone).then(result => {
      if (cancelled) return;
      setChats(prev => prev.map(c => {
        if (c.id !== selectedChatId) return c;
        if (result.success && result.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const lead = result.data as any;
          return {
            ...c,
            isRegistered: true,
            leadId: lead.id,
            leadName: lead.nome_completo ?? c.leadName,
            leadStatus: lead.status_atendimento ?? c.leadStatus,
            leadDataReuniao: lead.data_reuniao ?? c.leadDataReuniao,
            leadNeedsAttendant: !!lead.needs_attendant,
            leadAttendantRequestedAt: lead.attendant_requested_at ?? null,
          };
        }
        return { ...c, isRegistered: false, leadId: undefined };
      }));
    }).catch(() => {/* ignore network errors */});
    return () => { cancelled = true; };
  }, [selectedChatId]);

  const loadedChatIdRef = React.useRef<string | null>(null);

  // Efetua carregamento da conversa combinando JID normal (base) e JID LID (linked device)
  useEffect(() => {
    if (selectedChatId && chats.length > 0 && selectedChatId !== loadedChatIdRef.current) {
      if (loadedChatIdRef.current && socket) {
        socket.emit('leave-chat', loadedChatIdRef.current);
      }

      loadedChatIdRef.current = selectedChatId;
      setPage(1);

      if (socket) {
        socket.emit('join-chat', selectedChatId);
      }

      const chat = chats.find(c => c.id === selectedChatId);
      const jidsToFetch = Array.from(new Set([selectedChatId, chat?.evolutionJid])).filter(Boolean).join(',');
      loadMessages(jidsToFetch, 1);
    }
  }, [selectedChatId, chats, loadMessages, socket]);

  const handleLoadMore = async () => {
    if (!selectedChatId || !hasMore || loadingMessages || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    const chat = chats.find(c => c.id === selectedChatId);
    const jidsToFetch = Array.from(new Set([selectedChatId, chat?.evolutionJid])).filter(Boolean).join(',');
    await loadMessages(jidsToFetch, nextPage);
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
            ? { ...m, content: `❌ Falha ao iniciar bot ${botName}`, status: 'error' }
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
        router.push(`?${params.toString()}`);
        break;
      case 'consulta':
        router.push(`?${params.toString()}`);
        break;
      case 'emissao':
        router.push(`/cnd?${params.toString()}`);
        break;
      case 'divida':
        router.push(`/divida-ativa?${params.toString()}`);
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
            onViewLeadSheet={handleViewLead}
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

      {isSidebarLeadOpen && selectedLead && (
        <LeadDetailsSidebar
          lead={selectedLead}
          onClose={() => setIsSidebarLeadOpen(false)}
          onUpdate={(updatedLead) => {
            setSelectedLead(updatedLead);
            // Optionally update the chat list name/status
            setChats(prev => prev.map(c => {
              if (c.leadId === updatedLead.id || c.id.includes(updatedLead.telefone || '')) {
                return {
                  ...c,
                  leadName: updatedLead.nome_completo ?? c.leadName,
                  leadStatus: updatedLead.status_atendimento ?? c.leadStatus,
                  isRegistered: true,
                  leadId: updatedLead.id
                };
              }
              return c;
            }));
          }}
        />
      )}
    </div>
  );
}
