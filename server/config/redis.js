const Redis = require('ioredis');
const config = require('./env');

let redisClient = null;
let isRedisConnected = false;

// In-Memory Fallback Cache when Redis is offline or not configured
const inMemoryCache = new Map();

if (config.redis.enabled) {
  try {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy(times) {
        if (times > 2) return null; // stop retry after 2 attempts in local dev
        return 1000;
      },
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log('[Redis] Connected successfully to Redis Cache.');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      console.warn('[Redis] Redis notice: using resilient in-memory cache layer.');
    });
  } catch (err) {
    console.warn('[Redis] Initialization notice:', err.message);
  }
}

module.exports = {
  redisClient,
  isRedisConnected: () => isRedisConnected,
  inMemoryCache,
};
