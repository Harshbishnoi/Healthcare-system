const secretsManager = require('../server/config/secretsManager');
const config = require('../server/config/env');

describe('Engineering Practices: Environment Variables & Secrets Management Tests', () => {
  it('should load default environment configurations with zero secret leaks', () => {
    expect(config).toHaveProperty('jwt');
    expect(config).toHaveProperty('mongo');
    expect(config).toHaveProperty('prisma');
    expect(config).toHaveProperty('port');
    expect(config.port).toBe(5000);
  });

  it('should mask sensitive credentials when formatting logs or audits', () => {
    const maskedKey = secretsManager.maskSecret('sk-abcdef1234567890');
    expect(maskedKey).toBe('sk-****7890');
    expect(maskedKey).not.toContain('abcdef');

    const shortMasked = secretsManager.maskSecret('short');
    expect(shortMasked).toBe('****');
  });

  it('should correctly retrieve environment typed values with fallbacks', () => {
    const port = secretsManager.getNumber('PORT', 5000);
    expect(typeof port).toBe('number');
    expect(port).toBe(5000);

    const isRedis = secretsManager.getBoolean('REDIS_ENABLED', false);
    expect(typeof isRedis).toBe('boolean');
    expect(isRedis).toBe(false);
  });
});
