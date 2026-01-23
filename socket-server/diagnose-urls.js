
const WebSocket = require('ws');
require('dotenv').config();

const EVO_API_URL = process.env.EVOLUTION_API_URL;
const EVO_API_KEY = process.env.EVOLUTION_API_KEY;
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;

if (!EVO_API_URL || !EVO_API_KEY || !EVO_INSTANCE) {
    console.error('❌ Configuração incompleta no .env');
    process.exit(1);
}

const baseUrl = EVO_API_URL.replace('http://', 'ws://').replace('https://', 'wss://').replace(/\/$/, '');

const variants = [
    { name: 'Global /websocket (Header Auth)', url: `${baseUrl}/websocket`, headers: { apikey: EVO_API_KEY } },
    { name: 'Global /websocket (Query Auth)', url: `${baseUrl}/websocket?apikey=${EVO_API_KEY}` },
    { name: 'Instance Direct (Header Auth)', url: `${baseUrl}/${EVO_INSTANCE}`, headers: { apikey: EVO_API_KEY } },
    { name: 'Instance Direct (Query Auth)', url: `${baseUrl}/${EVO_INSTANCE}?apikey=${EVO_API_KEY}` },
    { name: 'Instance /websocket (Header Auth)', url: `${baseUrl}/${EVO_INSTANCE}/websocket`, headers: { apikey: EVO_API_KEY } },
    { name: 'Legacy /instance/.../websocket', url: `${baseUrl}/instance/${EVO_INSTANCE}/websocket`, headers: { apikey: EVO_API_KEY } }
];

console.log('🔍 Iniciando diagnóstico de conexão WebSocket...\n');

variants.forEach((variant, index) => {
    console.log(`[${index + 1}] Testando: ${variant.name}`);
    console.log(`    URL: ${variant.url}`);
    
    try {
        const ws = new WebSocket(variant.url, {
            headers: variant.headers || {}
        });

        ws.on('open', () => {
            console.log(`✅ [${variant.name}] CONECTADO com sucesso!`);
            // Espera um pouco para ver se cai
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    console.log(`🌟 [${variant.name}] Conexão ESTÁVEL após 3s.`);
                    ws.close();
                }
            }, 3000);
        });

        ws.on('error', (err) => {
            console.log(`❌ [${variant.name}] ERRO: ${err.message}`);
        });

        ws.on('close', (code, reason) => {
            console.log(`⚠️ [${variant.name}] FECHADO. Código: ${code}, Razão: ${reason.toString()}`);
        });

    } catch (e) {
        console.log(`❌ [${variant.name}] Exceção: ${e.message}`);
    }
});
