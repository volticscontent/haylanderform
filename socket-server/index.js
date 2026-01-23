
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
const redisSub = new Redis(REDIS_URL || 'redis://localhost:6379');

redisSub.subscribe('chat-updates', (err, count) => {
    if (err) {
        console.error('❌ Falha ao se inscrever no Redis:', err);
    } else {
        console.log(`✅ Inscrito no canal 'chat-updates' do Redis. Contagem: ${count}`);
    }
});

redisSub.on('message', (channel, message) => {
    if (channel === 'chat-updates') {
        try {
            const data = JSON.parse(message);
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
    evoSocket.onAny((eventName, ...args) => {
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
            
            const socketMsg = {
                chatId: msgData.key?.remoteJid,
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
