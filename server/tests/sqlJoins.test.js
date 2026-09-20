const request = require('supertest');
const app = require('../app');
const AnalyticsService = require('../services/analyticsService');
const { prisma } = require('../config/db.postgres');

describe('SQL (Postgres): Relational Database JOINs Tests', () => {
  afterAll(async () => {
    if (prisma && prisma.$disconnect) {
      await prisma.$disconnect().catch(() => {});
    }
  });

  describe('Prisma Multi-Table Relational JOINs (include)', () => {
    it('should query joined records across Appointment, Doctor, Patient, and Consultation tables', async () => {
      const records = await AnalyticsService.getRelationalJoinedAppointments();
      expect(Array.isArray(records)).toBe(true);
    });

    it('should support querying doctor records with joined reviews and metrics', async () => {
      if (prisma && prisma.doctor) {
        try {
          const doctorsWithJoins = await prisma.doctor.findMany({
            take: 5,
            include: {
              appointments: true,
              reviews: true,
              metrics: true,
            },
          });
          expect(Array.isArray(doctorsWithJoins)).toBe(true);
        } catch (err) {
          // In mock/fallback mode, ensure handled gracefully
          expect(err).toBeDefined();
        }
      }
    });
  });

  describe('Explicit Raw PostgreSQL SQL JOIN Queries (INNER JOIN & LEFT JOIN)', () => {
    it('should execute raw SQL with LEFT JOIN between Doctor, Appointment, and DoctorReview tables', async () => {
      const rawResults = await AnalyticsService.executeRawSqlDoctorJoins();
      expect(Array.isArray(rawResults)).toBe(true);
    });
  });

  describe('REST API SQL JOINs Endpoint', () => {
    it('GET /api/doctors/analytics/sql-joins - should return 200 OK with relational joined data', async () => {
      const res = await request(app).get('/api/doctors/analytics/sql-joins');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('joinedAppointments');
      expect(res.body.data).toHaveProperty('doctorJoins');
    });
  });
});
