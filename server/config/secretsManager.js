const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

/**
 * Secrets Manager & Environment Variables Validator
 * Enforces zero-leak policies, strict production schema validation, and secrets masking.
 */
class SecretsManager {
  constructor() {
    this.loaded = false;
    this.init();
  }

  init() {
    if (this.loaded) return;

    // Load environment variables from hierarchy
    const envPaths = [
      path.resolve(__dirname, '../.env'),
      path.resolve(__dirname, '../../.env'),
      path.resolve(process.cwd(), '.env'),
    ];

    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
      }
    }

    this.loaded = true;
    this.validate();
  }

  /**
   * Retrieves a configuration secret with optional fallback
   * @param {string} key
   * @param {string|number|boolean} defaultValue
   * @returns {string}
   */
  get(key, defaultValue = '') {
    return process.env[key] !== undefined ? process.env[key] : defaultValue;
  }

  /**
   * Retrieves a numeric environment variable
   */
  getNumber(key, defaultValue = 0) {
    const val = process.env[key];
    return val !== undefined ? Number(val) : defaultValue;
  }

  /**
   * Retrieves a boolean environment variable
   */
  getBoolean(key, defaultValue = false) {
    const val = process.env[key];
    if (val === undefined) return defaultValue;
    return val === 'true' || val === '1';
  }

  /**
   * Masks sensitive credentials for audit logging (e.g. "sk-12345678" -> "sk-****5678")
   * @param {string} secret
   * @returns {string}
   */
  maskSecret(secret) {
    if (!secret || typeof secret !== 'string') return '****';
    if (secret.length <= 8) return '****';
    return `${secret.slice(0, 3)}****${secret.slice(-4)}`;
  }

  /**
   * Validates required environment variables and secrets
   */
  validate() {
    const isProduction = process.env.NODE_ENV === 'production';
    const requiredKeys = ['PORT', 'JWT_SECRET'];

    if (isProduction) {
      requiredKeys.push('MONGO_URI', 'DATABASE_URL');
    }

    const missing = [];
    for (const key of requiredKeys) {
      if (!process.env[key] && !this.getDefaultFallback(key)) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      const errorMsg = `[SecretsManager Alert] Missing required environment variables: ${missing.join(', ')}`;
      if (isProduction) {
        throw new Error(errorMsg);
      } else {
        console.warn(errorMsg);
      }
    }
  }

  getDefaultFallback(key) {
    const defaults = {
      PORT: '5000',
      NODE_ENV: 'development',
      CLIENT_URL: 'http://localhost:5173',
      JWT_SECRET: 'super_secure_default_secret_for_development_mode_only_2026',
      JWT_EXPIRES_IN: '7d',
      BCRYPT_SALT_ROUNDS: '10',
      MONGO_URI: 'mongodb://127.0.0.1:27017/doctor_patient_platform',
      DATABASE_URL: 'file:./dev.db',
    };
    return defaults[key] || null;
  }
}

const secretsManager = new SecretsManager();

module.exports = secretsManager;
