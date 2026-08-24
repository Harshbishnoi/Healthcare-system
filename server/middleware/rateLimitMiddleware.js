const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 minutes for sensitive auth routes
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20, // 20 requests per 5 minutes for AI endpoints
  message: {
    success: false,
    statusCode: 429,
    message: 'AI request limit reached. Please wait a few minutes before trying again.',
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  aiLimiter,
};
