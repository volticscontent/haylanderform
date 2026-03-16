import { io } from 'socket.io-client';
import 'dotenv/config';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'https://evolutionapi.landcriativa.com';
const apiKey = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY;

console.log('Connecting to:', socketUrl);

const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  auth: { apikey: apiKey }
});

socket.on('connect', () => {
  console.log('✅ Connected. WebSocket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});

socket.on('messages.upsert', (data) => {
  console.log('📩 messages.upsert received in script!');
  console.log(JSON.stringify(data, null, 2));
});

socket.on('chat-update-global', (data) => {
    console.log('📩 chat-update-global received!');
    console.log(JSON.stringify(data, null, 2));
});

setTimeout(() => {
    console.log('Time is up (30s), closing socket.');
    socket.disconnect();
    process.exit(0);
}, 30000);
