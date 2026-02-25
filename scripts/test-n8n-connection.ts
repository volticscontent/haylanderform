
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const N8N_WEBHOOK_URL = (process.env.N8N_WEBHOOK_URL || 'https://n8n.haylander.com.br/webhook').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY;

const targetPhone = process.argv[2] || '5511999999999';

console.log('--- Configuração ---');
console.log(`URL Base: ${N8N_WEBHOOK_URL}`);
console.log(`API Key: ${N8N_API_KEY ? 'Definida' : 'Não definida'}`);
console.log(`Telefone Alvo: ${targetPhone}`);
console.log('--------------------');

async function tryEndpoint(url: string, description: string) {
  console.log(`\nTentando enviar para: ${url} (${description})`);
  
  const payload = {
    phone: targetPhone,
    messages: [
      {
        content: "🔔 Teste de conexão n8n enviado via script.",
        type: "text"
      }
    ],
    context: "teste-script"
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { 'X-N8n-Api-Key': N8N_API_KEY } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.log(`❌ Falha (${response.status}): ${text}`);
      return false;
    }

    console.log('✅ Sucesso! Mensagem enviada.');
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    return false;
  }
}

async function runTests() {
  // Teste 1: Padrão do código (URL Base + /system-message)
  const success1 = await tryEndpoint(`${N8N_WEBHOOK_URL}/system-message`, 'Com sufixo /system-message');
  
  if (!success1) {
    // Teste 2: URL Base pura (caso a env var já seja o webhook completo)
    await tryEndpoint(N8N_WEBHOOK_URL, 'URL Base pura');
  }
}

runTests();
