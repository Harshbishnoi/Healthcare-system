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
   * Joins Appointment with Doctor, Patient, Consultation, and PaymentTransaction
   */
  static async getRelationalJoinedConsultations(doctorId = null) {
    try {
      if (!prisma || !prisma.appointment) return [];

      const whereClause = doctorId ? { doctorId } : {};

      // SQL JOIN: Appointment INNER JOIN Doctor INNER JOIN Patient LEFT JOIN Consultation
      const joinedRecords = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          doctor: true,       // SQL JOIN: Appointment -> Doctor
          patient: true,      // SQL JOIN: Appointment -> Patient
          consultation: true, // SQL JOIN: Appointment -> Consultation
          payment: true,      // SQL JOIN: Appointment -> PaymentTransaction
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

  /**
   * Raw SQL JOINs Execution for PostgreSQL Analytics
   * Executes multi-table INNER JOIN, LEFT JOIN, and aggregate GROUP BY query
   */
  static async executeRawSqlDoctorJoins() {
    try {
      if (!prisma || typeof prisma.$queryRaw !== 'function') return [];

      // Raw SQL query with INNER JOIN, LEFT JOIN, and GROUP BY
      const results = await prisma.$queryRaw`
        SELECT 
          d.id AS doctor_id,
          d.name AS doctor_name,
          d.specialization,
          COUNT(a.id) AS total_appointments,
          COALESCE(SUM(a.consultation_fee), 0) AS total_revenue,
          COALESCE(AVG(r.rating), 5.0) AS calculated_rating
        FROM "Doctor" d
        LEFT JOIN "Appointment" a ON d.id = a.doctor_id AND a.status = 'completed'
        LEFT JOIN "DoctorReview" r ON d.id = r.doctor_id
        GROUP BY d.id, d.name, d.specialization
        ORDER BY total_revenue DESC;
      `;

      return results;
    } catch (err) {
      console.warn('[AnalyticsService] Raw SQL JOIN error:', err.message);
      return [];
    }
  }
}

module.exports = AnalyticsService;
