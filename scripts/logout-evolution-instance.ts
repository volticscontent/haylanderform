
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;

async function logoutInstance() {
  console.log('--- Logout Instância Evolution API ---');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Instance: ${INSTANCE}`);

  if (!BASE_URL || !API_KEY || !INSTANCE) {
    console.error('❌ Configuração incompleta no .env');
    return;
  }

  try {
    const url = `${BASE_URL}/instance/logout/${INSTANCE}`;
    console.log(`\nEnviando comando de logout para: ${url}`);
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 
        'apikey': API_KEY 
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Logout enviado com sucesso!');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('⚠️  Aguarde alguns segundos e acesse o painel para escanear o QR Code novamente.');
    } else {
      console.error(`❌ Falha ao fazer logout: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response:', text);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

logoutInstance();
