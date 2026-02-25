
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
// Usar a instância que está causando problema, se você quiser deletá-la especificamente.
// Mas para "Natanzin ", precisamos deletar exatamente esse nome.
// Vou criar um script que lista todas e permite deletar uma específica.

async function deleteInstance(instanceName: string) {
  console.log(`--- Deletando Instância: '${instanceName}' ---`);
  
  if (!BASE_URL || !API_KEY) {
    console.error('❌ Configuração incompleta no .env');
    return;
  }

  // 1. Logout primeiro (tenta garantir que pare)
  try {
    await fetch(`${BASE_URL}/instance/logout/${encodeURIComponent(instanceName)}`, {
      method: 'DELETE',
      headers: { 'apikey': API_KEY }
    });
  } catch (e) { /* ignore */ }

  // 2. Delete
  try {
    const url = `${BASE_URL}/instance/delete/${encodeURIComponent(instanceName)}`;
    console.log(`Enviando comando de delete para: ${url}`);
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 
        'apikey': API_KEY 
      }
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Instância '${instanceName}' deletada com sucesso!`);
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ Falha ao deletar '${instanceName}': ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('Response:', text);
    }

  } catch (error) {
    console.error(`❌ Erro na requisição para '${instanceName}':`, error.message);
  }
}

async function run() {
  // Lista de instâncias problemáticas baseada nos seus logs
  // "Natanzin " (com espaço no final, conforme log?) O log mostra [Natanzin ]
  // Vamos tentar variações para garantir
  const targets = ['Natanzin ', 'Natanzin ', 'Joaozin gay', 'haylander'];

  console.log('Iniciando limpeza de instâncias fantasmas...');
  
  for (const target of targets) {
    await deleteInstance(target);
  }
}

run();
