const request = require('supertest');
const app = require('../app');
const { generateToken } = require('../utils/jwtUtils');

describe('Phase 6: Doctor-Patient ACL & Protected Medical Records Access Tests', () => {
  it('GET /api/patients/me - should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/patients/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/patients/me - should reject doctor token attempting to access patient /me with 403', async () => {
    const doctorToken = generateToken({
      id: '507f1f77bcf86cd799439011',
      role: 'doctor',
      email: 'dr.sarah@example.com',
      name: 'Dr. Sarah',
    });

    const res = await request(app)
      .get('/api/patients/me')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });

  it('GET /api/patients/:patientId/medical-history - should reject patient accessing another patient history with 403', async () => {
    const patientToken = generateToken({
      id: '507f1f77bcf86cd799439099',
      role: 'patient',
      email: 'patient1@example.com',
      name: 'Patient One',
    });

    // Patient trying to access another patient's records
    const res = await request(app)
      .get('/api/patients/507f1f77bcf86cd799439088/medical-history')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Forbidden');
  });
});
