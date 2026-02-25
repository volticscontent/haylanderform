
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;

async function testConnection() {
  console.log('--- Testando Conexão Evolution API ---');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Instance: ${INSTANCE}`);
  console.log(`API Key (4 chars): ${API_KEY ? API_KEY.slice(0, 4) + '****' : 'MISSING'}`);

  if (!BASE_URL || !API_KEY || !INSTANCE) {
    console.error('❌ Configuração incompleta no .env');
    return;
  }

  // 1. Check Version/Global Status
  try {
    console.log('\n1. Verificando Status Global...');
    const res = await fetch(`${BASE_URL}/`, {
      headers: { 'apikey': API_KEY }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Global Status OK:', data);
    } else {
      console.error(`❌ Global Status Falhou: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response:', text);
    }
  } catch (error) {
    console.error('❌ Erro de conexão Global:', error.message);
  }

  // 2. Check Instance State
  try {
    console.log(`\n2. Verificando Estado da Instância '${INSTANCE}'...`);
    const res = await fetch(`${BASE_URL}/instance/connectionState/${INSTANCE}`, {
      headers: { 'apikey': API_KEY }
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Instance State:', JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ Instance State Falhou: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response:', text);
    }
  } catch (error) {
    console.error('❌ Erro de conexão Instance:', error.message);
  }
}

testConnection();
