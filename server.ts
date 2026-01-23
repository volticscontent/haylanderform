
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import Redis from 'ioredis';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    // Optional: Configure CORS if needed, but for same-origin it's fine
    // cors: { origin: "*" }
  });

  io.on('connection', (socket) => {
    // console.log('Client connected:', socket.id);
    
    // Allow clients to join specific chat rooms
    socket.on('join-chat', (chatId) => {
        // console.log(`Socket ${socket.id} joined chat ${chatId}`);
        socket.join(chatId);
    });

    socket.on('leave-chat', (chatId) => {
        socket.leave(chatId);
    });

    socket.on('disconnect', () => {
      // console.log('Client disconnected');
    });
  });

  // Redis Subscriber Setup
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    const subscriber = new Redis(redisUrl);
    
    // Subscribe to Redis channel
    subscriber.subscribe('chat-updates', (err) => {
        if (err) {
            console.error('Failed to subscribe to chat-updates:', err.message);
        } else {
            console.log('✅ [Socket Server] Subscribed to Redis chat-updates channel');
        }
    });

    // Listen for messages from Redis
    subscriber.on('message', (channel, message) => {
        if (channel === 'chat-updates') {
            try {
                const data = JSON.parse(message);
                
                // 1. Emit to the specific chat room (for open chat window)
                if (data.chatId) {
                    io.to(data.chatId).emit('new-message', data);
                }
                
                // 2. Emit global event (for sidebar updates)
                io.emit('chat-update-global', data);
                
            } catch (e) {
                console.error('Error processing Redis message:', e);
            }
        }
    });
    
    subscriber.on('error', (err) => {
         // Suppress connection refused logs in dev if likely local
         if (err.message.includes('ECONNREFUSED')) {
             console.warn('⚠️ Redis Connection Failed (Pub/Sub). Skipping...');
             subscriber.disconnect();
         } else {
             console.error('Redis Subscriber Error:', err);
         }
    });

  } else {
    console.warn('⚠️ REDIS_URL not provided. Internal Redis Pub/Sub disabled.');
  }

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log('> Socket.io server running');
  });
});
