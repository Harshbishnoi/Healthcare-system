const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

/**
 * Recursively cleans XSS characters from objects and strings
 */
function sanitizeXss(obj) {
  if (typeof obj === 'string') {
    return xss(obj.trim());
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeXss(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = sanitizeXss(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

/**
 * SQL Injection Pattern Detection
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
  /(\bOR\b\s+[\d\w]+\s*=\s*[\d\w]+)/i,
  /(--|#|\/\*)/,
];

function checkSqlInjection(value) {
  if (typeof value === 'string') {
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Unified Input Sanitization & Injection Awareness Middleware
 */
const sanitizeInputs = (req, res, next) => {
  // 1. Sanitize NoSQL injection operators (e.g. $gt, $ne, $where)
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body);
    req.body = sanitizeXss(req.body);
  }

  if (req.query) {
    req.query = mongoSanitize.sanitize(req.query);
    req.query = sanitizeXss(req.query);
  }

  if (req.params) {
    req.params = mongoSanitize.sanitize(req.params);
  }

  // 2. Scan query parameters for potential SQL injection patterns
  if (req.query) {
    for (const [key, val] of Object.entries(req.query)) {
      if (typeof val === 'string' && checkSqlInjection(val)) {
        console.warn(`[Security Alert] Potential SQL injection detected on parameter '${key}': ${val}`);
      }
    }
  }

  next();
};

module.exports = {
  sanitizeInputs,
  sanitizeXss,
  checkSqlInjection,
};
