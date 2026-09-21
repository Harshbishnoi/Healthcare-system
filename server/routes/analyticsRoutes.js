const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analyticsController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// Platform-wide relational metrics (Admin / Public Overview)
router.get('/platform-summary', AnalyticsController.getPlatformSummary);

// Doctor specific analytics
router.get(
  '/doctor/:doctorId',
  verifyAuth,
  requireRole('doctor', 'admin'),
  AnalyticsController.getDoctorAnalytics
);

// Relational SQL JOINs & Aggregation analytics
const DoctorController = require('../controllers/doctorController');
router.get('/sql-joins', DoctorController.getRelationalSqlJoins);
router.get('/aggregation', DoctorController.getSpecializationAggregation);

module.exports = router;
