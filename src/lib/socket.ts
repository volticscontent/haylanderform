
import redis from '@/lib/redis';

// Helper to notify Socket Server (Redis Pub/Sub -> HTTP Fallback)
export async function notifySocketServer(channel: string, message: object) {
  try {
    // 1. Try Redis Pub/Sub (Fastest)
    await redis.publish(channel, JSON.stringify(message));
  } catch (redisError: unknown) {
    console.warn('[SocketNotifier] Redis publish failed, trying HTTP fallback:', redisError);

    // 2. HTTP Fallback to Socket Server
    try {
      // Assuming Socket Server runs on localhost:3003 as configured in webhook previously
      // In production, this URL should be in env vars like SOCKET_SERVER_URL
      const socketServerUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:3003/notify';
      
      await fetch(socketServerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      console.log('[SocketNotifier] HTTP notification sent to Socket Server successfully.');
    } catch (httpError: unknown) {
      console.error('[SocketNotifier] Both Redis and HTTP notification failed:', httpError);
    }
  }
}
