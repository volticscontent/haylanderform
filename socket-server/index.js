
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const Redis = require('ioredis');

// Configurações
const PORT = process.env.PORT || 3002;
const EVO_API_URL = process.env.EVOLUTION_API_URL;
const EVO_API_KEY = process.env.EVOLUTION_API_KEY;
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;
const REDIS_URL = process.env.REDIS_URL;

const app = express();
const server = http.createServer(app);

app.use(express.json()); // Habilitar JSON body parser

// Servidor Socket.io para o Frontend (Next.js)
const io = new Server(server, {
    cors: {
        origin: "*", // Em produção, restrinja para o domínio do frontend
        methods: ["GET", "POST"],
        credentials: true
    }
});

// --- Redis Subscriber (Para mensagens enviadas pelo Backend/Webhook) ---
// Isso garante que o frontend receba as mensagens que o PRÓPRIO BOT enviou
// sem depender do round-trip da Evolution API
const redisSub = new Redis(REDIS_URL || 'redis://localhost:6379', {
    // Configuração de resiliência para quando o Redis não estiver rodando
    retryStrategy(times) {
        // Aumenta o tempo de espera entre tentativas (max 30s) para não spammar logs
        const delay = Math.min(times * 2000, 30000);
        return delay;
    },
    // Evita crash por maxRetriesPerRequest quando a conexão cai
    maxRetriesPerRequest: null
});

// Conexão Redis separada para queries (GET/SET) — subscriber não pode executar comandos normais
const redisClient = new Redis(REDIS_URL || 'redis://localhost:6379', {
    retryStrategy(times) {
        const delay = Math.min(times * 2000, 30000);
        return delay;
    },
    maxRetriesPerRequest: null
});

// Tratamento de erro para evitar crash da aplicação (Unhandled error event)
redisClient.on('error', (err) => {
    if (err.code !== 'ECONNREFUSED') {
        console.error('❌ Erro no Redis Client:', err.message);
    }
});

redisSub.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        // Log menos alarmante para ambiente local sem Redis
        // console.warn apenas na primeira tentativa ou periodicamente seria ideal, 
        // mas aqui evitamos o spam do stack trace completo
        if (redisSub.status === 'reconnecting') {
            // Silêncio durante tentativas de reconexão normais
        } else {
            console.warn(`⚠️ Redis indisponível (${err.address}:${err.port}). Usando Fallback HTTP.`);
        }
    } else {
        console.error('❌ Erro no Redis:', err.message);
    }
});

redisSub.subscribe('chat-updates', (err, count) => {
    if (err) {
        console.error('❌ Falha ao se inscrever no Redis:', err);
    } else {
        console.log(`✅ Inscrito no canal 'chat-updates' do Redis. Contagem: ${count}`);
    }
});

redisSub.on('message', async (channel, message) => {
    if (channel === 'chat-updates') {
        try {
            const data = JSON.parse(message);

            // Resolver LID → telefone real se necessário
            let chatId = data.chatId;
            if (chatId && chatId.includes('@lid')) {
                try {
                    const phone = chatId.split('@')[0];
                    const realPhone = await redisClient.get(`lid_map:${chatId}`);
                    if (realPhone) {
                        chatId = `${realPhone}@s.whatsapp.net`;
                        data.chatId = chatId;
                        data.senderPn = chatId;
                        console.log(`🗺️ [Redis PubSub] LID resolvido: ${phone} → ${realPhone}`);
                    }
                } catch (e) { /* ignore Redis errors */ }
            }

            console.log(`📥 Redis Message Received -> Emitindo para Frontend: ${data.chatId}`);
            io.emit('chat-update-global', data);
            io.emit('new-message', data);
        } catch (e) {
            console.error('Erro ao processar mensagem do Redis:', e);
        }
    }
});

io.on('connection', (socket) => {
    console.log('👤 Frontend conectado:', socket.id);

    socket.on('disconnect', () => {
        console.log('👋 Frontend desconectado:', socket.id);
    });
});

// --- Conexão com Evolution API (Socket.io Client) ---

function connectToEvolution() {
    if (!EVO_API_URL) {
        console.log('⚠️ Configuração da Evolution API incompleta.');
        return;
    }

    // Tenta conectar no namespace da instância se não for global
    // Se a Evolution API não estiver com WEBSOCKET_GLOBAL_EVENTS=true, 
    // precisamos conectar em /<instance_name>

    // Conexão por Namespace (Recomendado se GLOBAL_EVENTS=false)
    // Tenta conectar especificamente no namespace da instância: /<instance_name>
    const instanceNamespaceUrl = `${EVO_API_URL}/${EVO_INSTANCE}`;

    console.log(`🔗 Conectando ao Socket.io da Evolution API (Namespace): ${instanceNamespaceUrl}`);

    const evoSocket = ioClient(instanceNamespaceUrl, {
        transports: ['websocket', 'polling'],
        query: {
            apikey: EVO_API_KEY,
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        forceNew: true
    });

    evoSocket.on('connect', () => {
        console.log('✅ Conectado ao Socket.io da Evolution API!');
        console.log('   ID:', evoSocket.id);
    });

    evoSocket.on('connect_error', (err) => {
        console.log(`❌ Erro de conexão Evolution: ${err.message}`);
    });

    evoSocket.on('disconnect', (reason) => {
        console.log(`⚠️ Desconectado da Evolution: ${reason}`);
    });

    // Escuta TODOS os eventos para debug e repasse
    evoSocket.onAny(async (eventName, ...args) => {
        // args[0] geralmente é o payload
        const data = args[0] || {};

        // Filtra por instância se necessário (alguns eventos vêm com instanceId)
        // Se a Evolution manda tudo, filtramos aqui.
        // Verifique a estrutura do payload nos logs.

        // Log detalhado para entender a estrutura
        if (eventName === 'messages.upsert') {
            console.log('📨 Nova mensagem recebida (messages.upsert)');
            // console.log('Payload Full:', JSON.stringify(data, null, 2));

            const msgData = data.data || data;
            let chatId = msgData.key?.remoteJid;

            // Tentar resolver LID → telefone real via Redis
            if (chatId && chatId.includes('@lid')) {
                try {
                    const realPhone = await redisClient.get(`lid_map:${chatId}`);
                    if (realPhone) {
                        console.log(`🗺️ LID resolvido: ${chatId} → ${realPhone}@s.whatsapp.net`);
                        chatId = `${realPhone}@s.whatsapp.net`;
                    }
                } catch (e) { /* ignore Redis errors */ }
            }

            const socketMsg = {
                chatId,
                senderPn: chatId,
                ...msgData
            };

            console.log(`📤 Emitindo para frontend - ChatID: ${socketMsg.chatId}`);

            // Emite para o frontend
            io.emit('chat-update-global', socketMsg);
            io.emit('new-message', socketMsg);
        } else if (eventName === 'messages.update') {
            console.log('📝 Atualização de mensagem (messages.update)');
            // Tratamento similar se necessário
        } else {
            // Opcional: Logar outros eventos para conhecer
            console.log(`ℹ️ Evento recebido: ${eventName}`);
        }
    });
}

// Inicia conexão
connectToEvolution();

// Health Check
app.get('/', (req, res) => {
    res.send('Socket Server is running and connected to Evolution API');
});

// Endpoint de Notificação (Webhook -> Socket Server)
// Substituto do Redis Pub/Sub quando Redis não está disponível
app.post('/notify', (req, res) => {
    const data = req.body;
    console.log(`📨 Notificação HTTP recebida -> Emitindo para Frontend: ${data.chatId}`);

    io.emit('chat-update-global', data);
    io.emit('new-message', data);

    res.json({ success: true });
});

server.listen(PORT, () => {
    console.log(`🚀 Socket Server rodando na porta ${PORT}`);
});
