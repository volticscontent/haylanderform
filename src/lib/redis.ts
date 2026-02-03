import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('⚠️ REDIS_URL not defined. Redis features will be disabled.');
}

// Mock Redis client for development without Redis
const createClient = () => {
    if (!redisUrl && process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Using Mock Redis (No connection).');
        const mockRedis = new Redis({ lazyConnect: true });
        // Override methods to do nothing
        mockRedis.connect = async () => {};
        mockRedis.publish = async () => 0;
        mockRedis.subscribe = async () => {};
        mockRedis.lpush = async () => 0;
        mockRedis.lrange = async () => [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        mockRedis.on = (_event, _callback) => mockRedis; // Chainable
        return mockRedis;
    }
    
    return new Redis(redisUrl || 'redis://localhost:6379', {
        lazyConnect: true,
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            // Stop retrying after 3 attempts in dev if localhost
            if (!redisUrl && times > 3) return null;
            return Math.min(times * 50, 2000);
        },
    });
};

const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || createClient();

redis.on('connect', () => console.log('🔴 [Redis] Connecting...'));
redis.on('ready', () => console.log('🟢 [Redis] Connected and ready!'));
redis.on('error', (err) => {
    // Suppress connection refused logs in dev
    if (err.message.includes('ECONNREFUSED') && !redisUrl) return;
    console.error('❌ [Redis] Error:', err.message);
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;
