export type EvolutionIntegration = 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS'

export const evolutionConfig = {
  baseUrl: process.env.EVOLUTION_API_URL || '',
  apiKey: process.env.EVOLUTION_API_KEY || '',
  instance: process.env.EVOLUTION_INSTANCE_NAME || '',
  integration: (process.env.EVOLUTION_INTEGRATION as EvolutionIntegration) || 'WHATSAPP-BAILEYS',
  timeoutMs: Number(process.env.EVOLUTION_TIMEOUT_MS || '15000'),
  waBusiness: {
    token: process.env.WA_BUSINESS_TOKEN || '',
    numberId: process.env.WA_BUSINESS_NUMBER_ID || '',
    businessId: process.env.WA_BUSINESS_ID || '',
    webhookToken: process.env.WA_BUSINESS_TOKEN_WEBHOOK || '',
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`Evolution API timeout after ${ms}ms`)), ms)
    p.then((v) => { clearTimeout(id); resolve(v) }).catch((e) => { clearTimeout(id); reject(e) })
  })
}

export async function evolutionGetInformation() {
  const url = evolutionConfig.baseUrl.replace(/\/$/, '')
  const res = await withTimeout(fetch(url, {
    headers: { apikey: evolutionConfig.apiKey },
  }), evolutionConfig.timeoutMs)
  if (!res.ok) throw new Error(`Evolution info failed: ${res.status}`)
  return res.json()
}

export async function checkWhatsAppNumbers(numbers: string[]) {
  const url = `${evolutionConfig.baseUrl.replace(/\/$/, '')}/chat/whatsappNumbers/${encodeURIComponent(evolutionConfig.instance)}`
  const res = await withTimeout(fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evolutionConfig.apiKey },
    body: JSON.stringify({ numbers })
  }), evolutionConfig.timeoutMs)
  if (!res.ok) throw new Error(`WhatsAppNumbers failed: ${res.status}`)
  return res.json() as Promise<Array<{ exists: boolean; jid: string; number: string }>>
}

export async function evolutionFindChats() {
  const url = `${evolutionConfig.baseUrl.replace(/\/$/, '')}/chat/findChats/${encodeURIComponent(evolutionConfig.instance)}`
  const res = await withTimeout(fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evolutionConfig.apiKey },
  }), evolutionConfig.timeoutMs)
  if (!res.ok) throw new Error(`FindChats failed: ${res.status}`)
  return res.json()
}

export async function evolutionFindMessages(jid: string, limit: number = 20, page: number = 1) {
  if (!jid) {
    console.warn('evolutionFindMessages called without JID');
    return { messages: { records: [] } };
  }

  const url = `${evolutionConfig.baseUrl.replace(/\/$/, '')}/chat/findMessages/${encodeURIComponent(evolutionConfig.instance)}`
  const res = await withTimeout(fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evolutionConfig.apiKey },
    body: JSON.stringify({
      where: {
        key: {
          remoteJid: jid
        }
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        createdAt: 'desc'
      }
    })
  }), evolutionConfig.timeoutMs)
  
  if (!res.ok) throw new Error(`FindMessages failed: ${res.status}`)
  return res.json()
}

export async function evolutionGetBase64FromMediaMessage(message: unknown) {
  const url = `${evolutionConfig.baseUrl.replace(/\/$/, '')}/chat/getBase64FromMediaMessage/${encodeURIComponent(evolutionConfig.instance)}`
  const res = await withTimeout(fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evolutionConfig.apiKey },
    body: JSON.stringify({
      message,
      convertToMp4: false
    })
  }), evolutionConfig.timeoutMs)
  
  if (!res.ok) {
     // Don't throw, just return null so we don't break the whole list
     console.error(`GetBase64 failed: ${res.status}`);
     return null;
  }
  return res.json()
}

export async function evolutionSendTextMessage(jid: string, text: string) {
  const url = `${evolutionConfig.baseUrl.replace(/\/$/, '')}/message/sendText/${encodeURIComponent(evolutionConfig.instance)}`
  const res = await withTimeout(fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evolutionConfig.apiKey },
    body: JSON.stringify({
      number: jid,
      text: text,
      delay: 1200,
      linkPreview: true
    })
  }), evolutionConfig.timeoutMs)

  if (!res.ok) throw new Error(`SendTextMessage failed: ${res.status}`)
  return res.json()
}

export async function evolutionSendMediaMessage(jid: string, media: string, type: 'image' | 'video' | 'audio' | 'document', caption?: string, fileName?: string, mimetype?: string) {
  const url = `${evolutionConfig.baseUrl.replace(/\/$/, '')}/message/sendMedia/${encodeURIComponent(evolutionConfig.instance)}`
  
  const body = {
    number: jid,
    media: media, // Base64 or URL
    mediatype: type,
    mimetype: mimetype,
    caption: caption,
    fileName: fileName
  }

  const res = await withTimeout(fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evolutionConfig.apiKey },
    body: JSON.stringify(body)
  }), evolutionConfig.timeoutMs)

  if (!res.ok) throw new Error(`SendMediaMessage failed: ${res.status}`)
  return res.json()
}

export async function evolutionSendWhatsAppAudio(jid: string, audio: string) {
  const url = `${evolutionConfig.baseUrl.replace(/\/$/, '')}/message/sendWhatsAppAudio/${encodeURIComponent(evolutionConfig.instance)}`
  
  const body = {
    number: jid,
    audio: audio // Base64
  }

  const res = await withTimeout(fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evolutionConfig.apiKey },
    body: JSON.stringify(body)
  }), evolutionConfig.timeoutMs)

  if (!res.ok) throw new Error(`SendWhatsAppAudio failed: ${res.status}`)
  return res.json()
}