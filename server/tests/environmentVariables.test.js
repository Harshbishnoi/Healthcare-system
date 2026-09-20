const fs = require('fs');
const path = require('path');
const secretsManager = require('../config/secretsManager');
const config = require('../config/env');

describe('Engineering Practices: Environment Variables & Secrets Management (.env.example)', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const serverDir = path.resolve(__dirname, '../');
  const clientDir = path.resolve(__dirname, '../../client');

  const rootEnvExample = path.join(rootDir, '.env.example');
  const serverEnvExample = path.join(serverDir, '.env.example');
  const clientEnvExample = path.join(clientDir, '.env.example');
  const gitignoreFile = path.join(rootDir, '.gitignore');

  // 1. Verification of .env.example files existence across workspace
  describe('File Presence & Structure', () => {
    it('should have a root .env.example with comprehensive variable documentation', () => {
      expect(fs.existsSync(rootEnvExample)).toBe(true);
      const content = fs.readFileSync(rootEnvExample, 'utf8');
      expect(content).toContain('PORT=');
      expect(content).toContain('JWT_SECRET=');
      expect(content).toContain('MONGO_URI=');
      expect(content).toContain('DATABASE_URL=');
      expect(content).toContain('STRIPE_SECRET_KEY=');
      expect(content).toContain('STRIPE_PUBLISHABLE_KEY=');
      expect(content).toContain('STRIPE_WEBHOOK_SECRET=');
      expect(content).toContain('GEMINI_API_KEY=');
    });

    it('should have a server/.env.example with backend secrets and payment keys', () => {
      expect(fs.existsSync(serverEnvExample)).toBe(true);
      const content = fs.readFileSync(serverEnvExample, 'utf8');
      expect(content).toContain('STRIPE_SECRET_KEY=');
      expect(content).toContain('DATABASE_URL=');
      expect(content).toContain('JWT_SECRET=');
    });

    it('should have a client/.env.example with safe public Vite variables only', () => {
      expect(fs.existsSync(clientEnvExample)).toBe(true);
      const content = fs.readFileSync(clientEnvExample, 'utf8');
      expect(content).toContain('VITE_API_URL=');
      expect(content).toContain('VITE_STRIPE_PUBLISHABLE_KEY=');
      // Must NOT contain backend private secrets
      expect(content).not.toContain('STRIPE_SECRET_KEY');
      expect(content).not.toContain('JWT_SECRET');
    });
  });

  // 2. Secret Protection & Git Hygiene
  describe('Secret Leakage Prevention & .gitignore Rules', () => {
    it('should ensure .gitignore ignores all local .env credential files', () => {
      expect(fs.existsSync(gitignoreFile)).toBe(true);
      const gitignore = fs.readFileSync(gitignoreFile, 'utf8');
      expect(gitignore).toMatch(/^\.env$/m);
      expect(gitignore).toContain('.env.local');
    });

    it('should verify .env.example contains only mock/placeholder secrets, never live credentials', () => {
      const rootContent = fs.readFileSync(rootEnvExample, 'utf8');
      // Verify no live production keys are committed
      expect(rootContent).not.toMatch(/sk_live_[0-9a-zA-Z]{24}/);
      expect(rootContent).not.toMatch(/AIzaSy[0-9a-zA-Z_-]{33}/);
      expect(rootContent).toContain('your_super_secret_jwt_key');
    });
  });

  // 3. Secrets Manager & Runtime Config Loading
  describe('Secrets Manager & Safe Environment Parsing', () => {
    it('should load default environment configurations with type safety', () => {
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('jwt');
      expect(config).toHaveProperty('stripe');
      expect(config).toHaveProperty('prisma');
      expect(typeof config.port).toBe('number');
    });

    it('should mask sensitive credentials when formatting audit logs', () => {
      const maskedKey = secretsManager.maskSecret('mock_healthcare_secret_token_value_0000');
      expect(maskedKey).toContain('****');
      expect(maskedKey).not.toContain('secret_token_value');
    });

    it('should correctly parse booleans and numbers with robust fallbacks', () => {
      const port = secretsManager.getNumber('NON_EXISTENT_PORT', 5000);
      expect(port).toBe(5000);

      const redisEnabled = secretsManager.getBoolean('NON_EXISTENT_FLAG', false);
      expect(redisEnabled).toBe(false);
    });
  });
});
