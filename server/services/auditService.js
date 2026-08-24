const { prisma } = require('../config/db.postgres');

/**
 * Service to log system and user actions to relational PostgreSQL store
 */
class AuditService {
  static async logUserAction({ userId, role, action, ipAddress = null, userAgent = null, metadata = null }) {
    try {
      if (prisma && prisma.userAuditLog) {
        await prisma.userAuditLog.create({
          data: {
            userId: userId ? userId.toString() : 'anonymous',
            role: role || 'unknown',
            action,
            ipAddress,
            userAgent,
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });
      }
    } catch (err) {
      console.warn('[AuditService] Failed to record audit log:', err.message);
    }
  }

  static async syncAppointmentRecord({
    mongoAppointmentId,
    patientId,
    doctorId,
    appointmentDate,
    timeSlot,
    status,
    mode,
    consultationFee = 500,
  }) {
    try {
      if (prisma && prisma.appointmentRecord) {
        await prisma.appointmentRecord.upsert({
          where: { mongoAppointmentId: mongoAppointmentId.toString() },
          update: {
            status,
            mode,
            updatedAt: new Date(),
          },
          create: {
            mongoAppointmentId: mongoAppointmentId.toString(),
            patientId: patientId.toString(),
            doctorId: doctorId.toString(),
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            status,
            mode,
            consultationFee: Number(consultationFee) || 0,
          },
        });

        // Update Doctor Metrics in PostgreSQL
        await this.recalculateDoctorMetrics(doctorId.toString());
      }
    } catch (err) {
      console.warn('[AuditService] Failed to sync appointment record:', err.message);
    }
  }

  static async recalculateDoctorMetrics(doctorId) {
    try {
      if (!prisma || !prisma.appointmentRecord) return;

      const total = await prisma.appointmentRecord.count({ where: { doctorId } });
      const completed = await prisma.appointmentRecord.count({
        where: { doctorId, status: 'completed' },
      });
      const cancelled = await prisma.appointmentRecord.count({
        where: { doctorId, status: 'cancelled' },
      });

      await prisma.doctorMetric.upsert({
        where: { doctorId },
        update: {
          totalAppointments: total,
          completedAppointments: completed,
          cancelledAppointments: cancelled,
        },
        create: {
          doctorId,
          totalAppointments: total,
          completedAppointments: completed,
          cancelledAppointments: cancelled,
        },
      });
    } catch (err) {
      console.warn('[AuditService] Failed to recalculate doctor metrics:', err.message);
    }
  }
}

module.exports = AuditService;
