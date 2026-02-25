
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'teste';

async function checkWebhookConfig() {
  console.log('--- Verificando Configuração de Webhook na Evolution API ---');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Instance: ${INSTANCE}`);

  if (!BASE_URL || !API_KEY) {
    console.error('❌ Configuração incompleta no .env');
    return;
  }

  try {
    // Tenta buscar as configurações do Webhook
    // Endpoint v2: /webhook/find/:instance
    const url = `${BASE_URL}/webhook/find/${INSTANCE}`;
    console.log(`\nBuscando config em: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: { 
        'apikey': API_KEY 
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log('✅ Configuração encontrada:');
      console.log(JSON.stringify(data, null, 2));
      
      // Verifica se a URL bate com o esperado
      if (data.url && data.url.includes('haylanderform.vercel.app')) {
        console.log('\n⚠️  O Webhook está apontando para PRODUÇÃO (Vercel).');
        console.log('    Se você estiver testando localmente, os eventos NÃO chegarão aqui.');
      }

      // Tenta verificar headers (se expostos)
      // Nota: Evolution API pode não retornar os headers completos por segurança, mas vamos ver.
      if (data.headers) {
          console.log('\nHeaders configurados:');
          console.log(JSON.stringify(data.headers, null, 2));
      }

    } else {
      console.error(`❌ Falha ao buscar webhook: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response:', text);
    }

  } catch (error: any) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

checkWebhookConfig();
