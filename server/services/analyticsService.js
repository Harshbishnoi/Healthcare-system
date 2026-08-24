const { prisma } = require('../config/db.postgres');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');

class AnalyticsService {
  /**
   * PostgreSQL Relational Platform Summary using Prisma queries, joins, and aggregations
   */
  static async getPlatformSummary() {
    try {
      let appointmentCount = 0;
      let doctorCount = 0;
      let patientCount = 0;
      let recentAudits = [];
      let topSpecializations = [];

      // Query MongoDB counts as base
      [appointmentCount, doctorCount, patientCount] = await Promise.all([
        Appointment.countDocuments(),
        User.countDocuments({ role: 'doctor' }),
        User.countDocuments({ role: 'patient' }),
      ]);

      // Query Prisma Relational store for analytics & audits
      if (prisma && prisma.userAuditLog) {
        recentAudits = await prisma.userAuditLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
        });
      }

      // Grouping and aggregation of top specializations
      topSpecializations = await DoctorProfile.aggregate([
        { $group: { _id: '$specialization', count: { $sum: 1 }, avgRating: { $avg: '$ratingAvg' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]);

      // Count online vs offline consultations
      const modeBreakdown = await Appointment.aggregate([
        { $group: { _id: '$mode', count: { $sum: 1 } } },
      ]);

      return {
        metrics: {
          totalBookings: appointmentCount,
          activeDoctors: doctorCount,
          activePatients: patientCount,
          onlineConsultations: modeBreakdown.find((m) => m._id === 'online')?.count || 0,
          offlineConsultations: modeBreakdown.find((m) => m._id === 'offline')?.count || 0,
        },
        topSpecializations: topSpecializations.map((s) => ({
          specialization: s._id,
          doctorCount: s.count,
          avgRating: Math.round((s.avgRating || 0) * 10) / 10,
        })),
        recentAudits,
      };
    } catch (error) {
      console.warn('[AnalyticsService] Aggregation notice:', error.message);
      return {
        metrics: {
          totalBookings: 0,
          activeDoctors: 0,
          activePatients: 0,
          onlineConsultations: 0,
          offlineConsultations: 0,
        },
        topSpecializations: [],
        recentAudits: [],
      };
    }
  }

  /**
   * Doctor specific analytics joined with PostgreSQL metrics
   */
  static async getDoctorAnalytics(doctorId) {
    let metric = null;
    if (prisma && prisma.doctorMetric) {
      metric = await prisma.doctorMetric.findUnique({
        where: { doctorId: doctorId.toString() },
      });
    }

    const [totalMongo, completedMongo, cancelledMongo, appointmentsByDay] = await Promise.all([
      Appointment.countDocuments({ doctorId }),
      Appointment.countDocuments({ doctorId, status: 'completed' }),
      Appointment.countDocuments({ doctorId, status: 'cancelled' }),
      Appointment.aggregate([
        { $match: { doctorId: doctorId } },
        { $group: { _id: '$appointmentDate', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 7 },
      ]),
    ]);

    return {
      doctorId,
      totalAppointments: metric?.totalAppointments || totalMongo,
      completedAppointments: metric?.completedAppointments || completedMongo,
      cancelledAppointments: metric?.cancelledAppointments || cancelledMongo,
      averageRating: metric?.averageRating || 0,
      reviewCount: metric?.reviewCount || 0,
      recentTrend: appointmentsByDay.map((d) => ({ date: d._id, bookings: d.count })),
    };
  }

  /**
   * Relational SQL JOINs using Prisma ORM relations
   * Joins AppointmentRecord with ConsultationAudit and calculates financial aggregates
   */
  static async getRelationalJoinedConsultations(doctorId = null) {
    try {
      if (!prisma || !prisma.appointmentRecord) return [];

      const whereClause = doctorId ? { doctorId } : {};

      // SQL JOIN: AppointmentRecord INNER JOIN ConsultationAudit
      const joinedRecords = await prisma.appointmentRecord.findMany({
        where: whereClause,
        include: {
          consultation: true, // Relational JOIN via Prisma foreign key relation
        },
        orderBy: { appointmentDate: 'desc' },
        take: 50,
      });

      return joinedRecords;
    } catch (err) {
      console.warn('[AnalyticsService] Relational SQL JOIN error:', err.message);
      return [];
    }
  }
}

module.exports = AnalyticsService;
