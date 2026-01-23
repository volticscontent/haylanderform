
const io = require('socket.io-client');
require('dotenv').config();

const EVO_API_URL = process.env.EVOLUTION_API_URL;
const EVO_API_KEY = process.env.EVOLUTION_API_KEY;

console.log('🔍 Testando conexão via Socket.io Client...\n');

const socket = io(EVO_API_URL, {
    transports: ['websocket'],
    path: '/websocket', // Tenta path padrão do Socket.io se falhar, ou customizado
    query: {
        apikey: EVO_API_KEY
    },
    reconnection: false
});

socket.on('connect', () => {
    console.log('✅ [Socket.io] CONECTADO com sucesso!');
    console.log('   ID:', socket.id);
});

socket.on('connect_error', (err) => {
    console.log(`❌ [Socket.io] Erro de conexão: ${err.message}`);
    // Tenta sem path customizado (padrão /socket.io/)
    testStandardPath();
});

socket.on('disconnect', (reason) => {
    console.log(`⚠️ [Socket.io] Desconectado: ${reason}`);
});

function testStandardPath() {
    console.log('\n🔄 Tentando path padrão /socket.io/ ...');
    const socket2 = io(EVO_API_URL, {
        transports: ['websocket'],
        query: {
            apikey: EVO_API_KEY
        },
        reconnection: false
    });

    socket2.on('connect', () => {
        console.log('✅ [Socket.io Padrão] CONECTADO!');
        console.log('   ID:', socket2.id);
    });

    socket2.on('connect_error', (err) => {
        console.log(`❌ [Socket.io Padrão] Erro: ${err.message}`);
    });
}
