const { prisma } = require('../config/db.postgres');
const TransactionService = require('../services/transactionService');
const AppointmentService = require('../services/appointmentService');

describe('SQL (Postgres): Relational Transactions & Concurrency Tests', () => {
  const doctorId = 'sql-doc-transact-001';
  const patientId = 'sql-pat-transact-001';

  beforeEach(async () => {
    // Clean / reset test state if needed
  });

  describe('PostgreSQL Interactive ACID Transactions (prisma.$transaction)', () => {
    it('should atomically commit multi-table booking (Appointment, Payment, Metric, Audit)', async () => {
      const runId = Date.now();
      const testDoctorId = `doc-tx-${runId}`;
      const appointmentId = `sql-appt-${runId}`;
      const result = await TransactionService.executeAtomicBooking({
        appointmentId,
        patientId,
        doctorId: testDoctorId,
        appointmentDate: '2026-10-15',
        timeSlot: '14:00',
        consultationFee: 600,
        paymentMethod: 'card',
        mode: 'offline',
      });

      expect(result.success).toBe(true);
      expect(result.transactionStatus).toBe('COMMITTED');
      expect(result.appointment).toBeDefined();
      expect(result.appointment.appointmentMongoId || result.appointment.mongoAppointmentId).toBe(appointmentId);
      expect(result.payment).toBeDefined();
      expect(result.payment.status).toBe('succeeded');
      expect(result.auditLog).toBeDefined();
    });

    it('should rollback entire transaction and persist NO changes when a failure occurs', async () => {
      const apptModel = prisma.appointmentRecord || prisma.appointment;
      const initialAppointments = await apptModel.findMany();
      const initialCount = initialAppointments.length;

      const failingApptId = `sql-fail-appt-${Date.now()}`;

      await expect(
        TransactionService.executePostgresTransaction(async (tx) => {
          if (tx.appointmentRecord) {
            await tx.appointmentRecord.create({
              data: {
                appointmentMongoId: failingApptId,
                doctorId: 'fail-doc-1',
                doctorName: 'Dr. Fail',
                doctorSpecialty: 'General',
                patientId: 'fail-pat-1',
                patientName: 'Fail Patient',
                patientEmail: 'fail@example.com',
                appointmentDate: new Date('2026-11-01'),
                timeSlot: '09:00',
                status: 'pending',
                mode: 'offline',
                feeAmount: 500,
              },
            });
          } else if (tx.appointment) {
            await tx.appointment.create({
              data: {
                mongoAppointmentId: failingApptId,
                doctorId: 'fail-doc-1',
                patientId: 'fail-pat-1',
                appointmentDate: new Date('2026-11-01'),
                timeSlot: '09:00',
                status: 'pending',
                consultationFee: 500,
              },
            });
          }

          // Operation 2: Simulate failure / constraint violation
          throw new Error('Simulated database constraint violation or payment gateway failure');
        })
      ).rejects.toThrow('Simulated database constraint violation');

      // Verify rollback: count of appointments must NOT have increased
      const afterAppointments = await apptModel.findMany();
      expect(afterAppointments.length).toBe(initialCount);

      // Verify specific record was rolled back
      const rolledBack = await apptModel.findFirst({
        where: {
          appointmentMongoId: failingApptId,
        },
      });
      expect(rolledBack).toBeNull();
    });

    it('should prevent double-booking slot collision inside PostgreSQL transaction isolation', async () => {
      const runId = Date.now();
      const date = '2026-12-01';
      const slot = '10:30';
      const conflictDocId = `doc-col-${runId}`;
      const appt1 = `col-appt-1-${runId}`;
      const appt2 = `col-appt-2-${runId}`;

      // First booking succeeds
      const booking1 = await TransactionService.executeAtomicBooking({
        appointmentId: appt1,
        patientId: 'pat-col-1',
        doctorId: conflictDocId,
        appointmentDate: date,
        timeSlot: slot,
        consultationFee: 500,
      });
      expect(booking1.success).toBe(true);

      // Second booking for identical slot must be rejected with 409 Conflict
      await expect(
        TransactionService.executeAtomicBooking({
          appointmentId: appt2,
          patientId: 'pat-col-2',
          doctorId: conflictDocId, // Same doctor!
          appointmentDate: date,  // Same date!
          timeSlot: slot,        // Same time slot!
          consultationFee: 500,
        })
      ).rejects.toThrow(/Conflict.*Slot already booked/i);
    });
  });

  describe('Explicit Raw SQL Transactions (BEGIN, COMMIT, ROLLBACK)', () => {
    it('should execute raw SQL statements within BEGIN and COMMIT blocks', async () => {
      const auditId = `audit-tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const sqlQueries = [
        `INSERT INTO "UserAuditLog" ("id", "userId", "userEmail", "role", "action", "timestamp") VALUES ('${auditId}', 'user-1', 'user1@example.com', 'patient', 'RAW_SQL_TX_TEST', CURRENT_TIMESTAMP)`,
        `UPDATE "DoctorMetric" SET "totalAppointments" = "totalAppointments" + 1 WHERE "doctorId" = 'doc-1'`,
      ];

      const result = await TransactionService.executeSqlTransaction(sqlQueries);

      expect(result.success).toBe(true);
      expect(result.committed).toBe(true);
      expect(result.executionLog).toContain('BEGIN');
      expect(result.executionLog).toContain('COMMIT');
    });

    it('should execute ROLLBACK when any raw SQL query fails in the transaction batch', async () => {
      const sqlQueriesWithFailure = [
        `INSERT INTO "UserAuditLog" ("id", "userId", "userEmail", "role", "action", "timestamp") VALUES ('audit-tx-2', 'user-2', 'user2@example.com', 'doctor', 'SQL_FAIL_TEST', CURRENT_TIMESTAMP)`,
        null, // Will cause error when executing
      ];

      await expect(
        TransactionService.executeSqlTransaction(sqlQueriesWithFailure)
      ).rejects.toThrow(/SQL Transaction failed and was rolled back/);
    });
  });
});
