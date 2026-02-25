
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;

async function restartInstance() {
  console.log('--- Reiniciando Instância Evolution API ---');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Instance: ${INSTANCE}`);

  if (!BASE_URL || !API_KEY || !INSTANCE) {
    console.error('❌ Configuração incompleta no .env');
    return;
  }

  try {
    const url = `${BASE_URL}/instance/restart/${INSTANCE}`;
    console.log(`\nEnviando comando de restart para: ${url}`);
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'apikey': API_KEY 
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Comando de restart enviado com sucesso!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ Falha ao reiniciar: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response:', text);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

restartInstance();
