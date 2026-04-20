'use server';

import { backendGet, backendPost } from '@/lib/backend-proxy';
import { generatePhoneVariations } from '@/lib/phone-utils';

export async function triggerBot(chatId: string, botName: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true, message: `Bot ${botName} iniciado com sucesso` };
}

export async function getChats() {
  try {
    const res = await backendGet('/api/atendimento/chats');
    return res.json();
  } catch (err) {
    return { success: false, error: 'Failed to fetch chats' };
  }
}

export async function getContactProfilePicture(jid: string) {
  try {
    const phone = jid.split('@')[0];
    const params = new URLSearchParams({ jid: phone });
    const res = await backendGet('/api/atendimento/profile-pic', params);
    return res.json();
  } catch {
    return { success: false, url: null };
  }
}

export async function getLeadByPhone(phone: string) {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const res = await backendGet(`/api/atendimento/lead/${encodeURIComponent(cleanPhone)}`);
    return res.json();
  } catch {
    return { success: false, error: 'Failed to fetch lead' };
  }
}

export async function registerLead(name: string, phone: string) {
  try {
    const res = await backendPost('/api/atendimento/leads/register', { name, phone });
    return res.json();
  } catch {
    return { success: false, error: 'Falha ao cadastrar' };
  }
}

export async function massRegisterLeads(leads: { name: string; phone: string }[]) {
  try {
    const res = await backendPost('/api/atendimento/leads/mass-register', { leads });
    return res.json();
  } catch {
    return { success: false, error: 'Falha no cadastro em massa' };
  }
}

export async function getConsultationsByCnpj(cnpj: string) {
  try {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    const res = await backendGet(`/api/atendimento/consultations/${encodeURIComponent(cleanCnpj)}`);
    return res.json();
  } catch {
    return { success: false, error: 'Falha ao buscar consultas' };
  }
}

export async function getMessages(jid: string, page: number = 1) {
  try {
    const params = new URLSearchParams({ jid, page: String(page) });
    const res = await backendGet('/api/atendimento/messages', params);
    return res.json();
  } catch {
    return { success: false, error: 'Failed to fetch messages' };
  }
}

export async function sendMessage(jid: string, text: string) {
  try {
    const res = await backendPost('/api/atendimento/send-message', { jid, text });
    return res.json();
  } catch {
    return { success: false, error: 'Failed to send message' };
  }
}

export async function sendMedia(jid: string, formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'image' | 'video' | 'audio' | 'document';
    const caption = formData.get('caption') as string || undefined;
    const isVoiceNote = formData.get('isVoiceNote') === 'true';

    if (!file) throw new Error('No file provided');

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    const res = await backendPost('/api/atendimento/send-media', {
      jid, base64, type, caption, fileName: file.name, mimeType: file.type, isVoiceNote,
    });
    return res.json();
  } catch {
    return { success: false, error: 'Failed to send media' };
  }
}
