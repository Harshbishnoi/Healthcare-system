const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const doctorRoutes = require('./doctorRoutes');
const patientRoutes = require('./patientRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const reviewRoutes = require('./reviewRoutes');
const aiRoutes = require('./aiRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const paymentRoutes = require('./paymentRoutes');
const uploadRoutes = require('./uploadRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DocPulse Healthcare API',
  });
});

// Modular REST Mounts
router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/payments', paymentRoutes);
router.use('/uploads', uploadRoutes);

module.exports = router;
