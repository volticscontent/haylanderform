
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY; // Chave para autenticar NA Evolution API
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'teste';
const WEBHOOK_URL = 'https://haylanderform.vercel.app/api/webhook/whatsapp'; 

// A chave que o Webhook (Next.js) espera receber no header 'apikey'
// Geralmente é a mesma usada para autenticar na Evolution API, mas confirmamos pelo .env
const WEBHOOK_API_KEY_HEADER = process.env.EVOLUTION_API_KEY; 

async function fixWebhook() {
  console.log('--- Corrigindo Autenticação do Webhook ---');
  console.log(`URL Base Evolution: ${BASE_URL}`);
  console.log(`Instância: ${INSTANCE}`);
  
  if (!BASE_URL || !API_KEY) {
     console.error('❌ Falta configuração no .env');
     return;
  }

  // Endpoint para definir Webhook (v2)
  const url = `${BASE_URL}/webhook/set/${INSTANCE}`;
  
  // Tenta estrutura envelopada em "webhook" (comum na v2)
  const body = {
    "webhook": {
        "enabled": true,
        "url": WEBHOOK_URL,
        "webhookByEvents": false,
        "webhookBase64": true,
        "events": [
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "MESSAGES_DELETE",
        "SEND_MESSAGE",
        "CONNECTION_UPDATE"
        ],
        "headers": {
            "apikey": WEBHOOK_API_KEY_HEADER 
        }
    }
  };

  console.log(`\nEnviando configuração para: ${url}`);
  console.log(`URL do Webhook: ${WEBHOOK_URL}`);
  console.log(`Header apikey: ${WEBHOOK_API_KEY_HEADER?.slice(0,5)}... (Oculto por segurança)`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Webhook atualizado com sucesso!');
      console.log('Agora a Evolution API enviará o header "apikey" correto.');
      console.log('Resposta da API:', JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ Erro: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Detalhes:', text);
    }
  } catch (error: any) {
    console.error('❌ Exceção:', error.message);
  }
}

fixWebhook();
