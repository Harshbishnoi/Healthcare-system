const request = require('supertest');
const app = require('../app');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken, verifyToken } = require('../utils/jwtUtils');

describe('Phase 2: Authentication & Security Unit & Integration Tests', () => {
  describe('Password Hashing & JWT Verification', () => {
    it('should securely hash plaintext password and verify matches', async () => {
      const plain = 'StrongMedicalPassword123!';
      const hash = await hashPassword(plain);
      expect(hash).not.toBe(plain);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt prefix

      const isMatch = await comparePassword(plain, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await comparePassword('WrongPassword', hash);
      expect(isWrongMatch).toBe(false);
    });

    it('should generate and decode valid JWT payload with role', async () => {
      const payload = {
        id: '507f1f77bcf86cd799439011',
        role: 'doctor',
        email: 'doctor@docpulse.com',
        name: 'Dr. Test',
      };

      const token = generateToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const decoded = await verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.role).toBe('doctor');
      expect(decoded.email).toBe(payload.email);
    });
  });

  describe('REST API Authentication Endpoints', () => {
    it('POST /api/auth/register/patient - should reject invalid email format with 422', async () => {
      const res = await request(app)
        .post('/api/auth/register/patient')
        .send({
          name: 'John Doe',
          email: 'invalid-email-format',
          password: 'password123',
          mobile: '1234567890',
          city: 'New York',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login - should return 401 on incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent.user@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid email or password');
    });
  });
});
