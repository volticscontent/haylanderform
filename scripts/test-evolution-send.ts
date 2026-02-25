
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;
// Usando o número que apareceu nos logs anteriores
const TEST_NUMBER = '553182354127'; 

async function sendTestMessage() {
  console.log('--- Testando Envio de Mensagem Evolution API ---');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Instance: ${INSTANCE}`);
  console.log(`Target: ${TEST_NUMBER}`);

  if (!BASE_URL || !API_KEY || !INSTANCE) {
    console.error('❌ Configuração incompleta no .env');
    return;
  }

  const startTime = Date.now();
  
  try {
    const url = `${BASE_URL}/message/sendText/${INSTANCE}`;
    console.log(`\nEnviando requisição para: ${url}`);
    
    const body = {
      number: TEST_NUMBER,
      text: "🤖 Teste de envio direto via script (Evolution API Check)",
      delay: 1200,
      linkPreview: false
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'apikey': API_KEY 
      },
      body: JSON.stringify(body)
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Tempo de resposta: ${duration}ms`);

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ Falha no envio: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response:', text);
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`⏱️ Tempo até o erro: ${duration}ms`);
    console.error('❌ Erro na requisição:', error.message);
  }
}

sendTestMessage();
