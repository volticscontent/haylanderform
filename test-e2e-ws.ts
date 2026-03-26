import { io } from 'socket.io-client';

const socketUrl = 'http://localhost:3001';
console.log(`Connecting to ${socketUrl}...`);

const socket = io(socketUrl, {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected to backend socket server! ID:', socket.id);
  // Emit join-chat for a test number if we want to test room-specific events (new-message)
  // socket.emit('join-chat', '553182354127@s.whatsapp.net');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

socket.onAny((eventName, ...args) => {
  console.log(`\n============================`);
  console.log(`📡 EVENT RECEIVED: ${eventName}`);
  console.log(`📦 PAYLOAD:`, JSON.stringify(args, null, 2));
  console.log(`============================\n`);
});

// Mantém o processo rodando por 60 segundos
setTimeout(() => {
    console.log("Teste finalizado por tempo limite (60s).");
    process.exit(0);
}, 60000);
