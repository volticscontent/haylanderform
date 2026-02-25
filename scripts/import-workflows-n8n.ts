import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Tenta inferir o host a partir da URL do webhook se N8N_HOST não estiver definido
const getBaseUrl = () => {
  if (process.env.N8N_HOST) return process.env.N8N_HOST.replace(/\/$/, '');
  if (process.env.N8N_WEBHOOK_URL) {
    try {
      const url = new URL(process.env.N8N_WEBHOOK_URL);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      return 'http://localhost:5678';
    }
  }
  return 'http://localhost:5678';
};

const N8N_HOST = getBaseUrl();
const N8N_API_KEY = process.env.N8N_API_KEY;

const WORKFLOWS_DIR = path.resolve(process.cwd(), 'workflows');

async function importWorkflow(filePath: string) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const workflow = JSON.parse(content);
    
    console.log(`📦 Importando: ${workflow.name || path.basename(filePath)}...`);

    // Verifica se o workflow já existe (opcional, por simplicidade vamos tentar criar novo)
    // Se quiser atualizar, precisaríamos buscar por nome primeiro.
    
    const response = await fetch(`${N8N_HOST}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY || ''
      },
      body: JSON.stringify({
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings,
        staticData: workflow.staticData
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Falha ao importar ${workflow.name}: ${response.status} - ${errorText}`);
      
      if (response.status === 401) {
        console.error('💡 Dica: Verifique se N8N_API_KEY está correta no .env');
      }
      return;
    }

    const result = await response.json();
    console.log(`✅ Sucesso! Workflow criado com ID: ${result.id}`);
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error);
  }
}

async function run() {
  console.log('--- Importador de Workflows n8n ---');
  console.log(`Host: ${N8N_HOST}`);
  console.log(`API Key: ${N8N_API_KEY ? '******' + N8N_API_KEY.slice(-4) : 'Não definida'}`);
  
  if (!N8N_API_KEY) {
    console.error('❌ Erro: N8N_API_KEY não definida no .env');
    process.exit(1);
  }

  if (!fs.existsSync(WORKFLOWS_DIR)) {
    console.error(`❌ Diretório não encontrado: ${WORKFLOWS_DIR}`);
    return;
  }

  const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('⚠️ Nenhum workflow encontrado para importar em:', WORKFLOWS_DIR);
    return;
  }

  console.log(`🔍 Encontrados ${files.length} arquivos de workflow.`);
  
  for (const file of files) {
    await importWorkflow(path.join(WORKFLOWS_DIR, file));
  }
}

run();
