const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const AnalyticsService = require('../services/analyticsService');
const { prisma } = require('../config/db.postgres');

/**
 * Scheduled Jobs / Background Cron Services
 */
function initializeCronJobs() {
  console.log('[Cron] Initializing scheduled healthcare background tasks...');

  // 1. Daily Appointment Reminder Job (Runs every day at 08:00 AM)
  cron.schedule('0 8 * * *', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointmentsToday = await Appointment.find({
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: 'confirmed',
      }).populate('patientId doctorId');

      console.log(`[Cron] Executed daily appointment notification check: ${appointmentsToday.length} consultation(s) scheduled for today.`);
    } catch (err) {
      console.warn('[Cron] Daily reminder error:', err.message);
    }
  });

  // 2. Nightly Relational Analytics Rollup Job (Runs every midnight at 00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      const summary = await AnalyticsService.getPlatformSummary();
      if (prisma && prisma.platformMetric) {
        const todayStr = new Date().toISOString().split('T')[0];
        await prisma.platformMetric.upsert({
          where: { metricDate: todayStr },
          update: {
            totalAppointments: summary.metrics.totalBookings,
            activeDoctors: summary.metrics.activeDoctors,
            activePatients: summary.metrics.activePatients,
          },
          create: {
            metricDate: todayStr,
            totalAppointments: summary.metrics.totalBookings,
            activeDoctors: summary.metrics.activeDoctors,
            activePatients: summary.metrics.activePatients,
          },
        });
        console.log(`[Cron] Nightly platform analytics rollup completed for ${todayStr}.`);
      }
    } catch (err) {
      console.warn('[Cron] Analytics rollup error:', err.message);
    }
  });

  // 3. Stale Appointment Slot Cleanup (Runs every 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await Appointment.updateMany(
        {
          appointmentDate: { $lt: yesterday },
          status: 'pending',
        },
        {
          $set: { status: 'cancelled', cancellationReason: 'Auto-expired pending slot' },
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Cron] Auto-expired ${result.modifiedCount} overdue unconfirmed appointments.`);
      }
    } catch (err) {
      console.warn('[Cron] Stale slot cleanup error:', err.message);
    }
  });
}

module.exports = {
  initializeCronJobs,
};
