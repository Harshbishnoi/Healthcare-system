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

module.exports = router;
