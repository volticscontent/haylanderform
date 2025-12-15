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