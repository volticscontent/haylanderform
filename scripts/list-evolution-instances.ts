
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;

async function listInstances() {
  console.log('--- Listando Instâncias Ativas na Evolution API ---');
  console.log(`URL: ${BASE_URL}`);

  if (!BASE_URL || !API_KEY) {
    console.error('❌ Configuração incompleta no .env');
    return;
  }

  try {
    const url = `${BASE_URL}/instance/fetchInstances`;
    console.log(`Buscando instâncias em: ${url}`);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: { 
        'apikey': API_KEY 
      }
    });

    if (res.ok) {
      const instances = await res.json();
      console.log(`✅ Total de instâncias encontradas: ${instances.length}`);
      console.log(JSON.stringify(instances, null, 2)); // Debug total structure
      
    } else {
      console.error(`❌ Falha ao listar: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response:', text);
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', (error as Error).message);
  }
}

listInstances();
