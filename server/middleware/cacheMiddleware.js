const RedisService = require('../services/redisService');

/**
 * Route level caching middleware with customizable TTL
 * @param {number} ttlSeconds
 */
const cacheResponse = (ttlSeconds = 120) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await RedisService.get(cacheKey);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedData);
      }

      // Intercept res.json to store into cache before sending
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          RedisService.set(cacheKey, body, ttlSeconds);
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      next();
    } catch (err) {
      next();
    }
  };
};

module.exports = {
  cacheResponse,
};
