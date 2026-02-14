export interface Chat {
  id: string;
  name: string;
  image?: string;
  unreadCount?: number;
  lastMessage?: string;
  timestamp?: number;
  isRegistered?: boolean;
  leadId?: number;
  leadName?: string;
  leadStatus?: string;
  leadDataReuniao?: string;
  leadNeedsAttendant?: boolean;
  leadAttendantRequestedAt?: string;
}

export interface Message {
  id: string;
  fromMe: boolean;
  content: string;
  timestamp: number;
  type: string;
  status?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'sticker' | null;
  fileName?: string | null;
  mimetype?: string | null;
}
