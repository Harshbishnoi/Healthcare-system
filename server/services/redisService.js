const { redisClient, isRedisConnected, inMemoryCache } = require('../config/redis');

class RedisService {
  /**
   * Get cached value by key
   * @param {string} key
   * @returns {Promise<any|null>}
   */
  static async get(key) {
    try {
      if (isRedisConnected() && redisClient) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      }

      // In-Memory Fallback Cache
      const memoryItem = inMemoryCache.get(key);
      if (memoryItem) {
        if (memoryItem.expiresAt && Date.now() > memoryItem.expiresAt) {
          inMemoryCache.delete(key);
          return null;
        }
        return memoryItem.value;
      }

      return null;
    } catch (err) {
      console.warn('[Cache] Get error:', err.message);
      return null;
    }
  }

  /**
   * Set value in cache with TTL (Time To Live in seconds)
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds
   */
  static async set(key, value, ttlSeconds = 300) {
    try {
      if (isRedisConnected() && redisClient) {
        await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
        return;
      }

      // In-Memory Fallback Cache
      inMemoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    } catch (err) {
      console.warn('[Cache] Set error:', err.message);
    }
  }

  /**
   * Invalidate / Delete a cached key or pattern
   * @param {string} keyOrPattern
   */
  static async del(keyOrPattern) {
    try {
      if (isRedisConnected() && redisClient) {
        if (keyOrPattern.includes('*')) {
          const keys = await redisClient.keys(keyOrPattern);
          if (keys.length > 0) {
            await redisClient.del(...keys);
          }
        } else {
          await redisClient.del(keyOrPattern);
        }
      }

      // Clear matching in-memory keys
      for (const k of inMemoryCache.keys()) {
        if (k === keyOrPattern || (keyOrPattern.includes('*') && k.startsWith(keyOrPattern.replace('*', '')))) {
          inMemoryCache.delete(k);
        }
      }
    } catch (err) {
      console.warn('[Cache] Invalidation error:', err.message);
    }
  }
}

module.exports = RedisService;
