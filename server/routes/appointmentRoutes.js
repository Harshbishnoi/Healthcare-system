const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const ConsultationController = require('../controllers/consultationController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
  createAppointmentValidation,
  updateAppointmentStatusValidation,
  cancelAppointmentValidation,
} = require('../schemas/appointmentSchemas');
const { createConsultationValidation } = require('../schemas/consultationSchemas');

// Book Appointment (Patient)
router.post(
  '/',
  verifyAuth,
  requireRole('patient'),
  createAppointmentValidation,
  validateRequest,
  AppointmentController.createAppointment
);

// Get Single Appointment
router.get('/:id', verifyAuth, AppointmentController.getAppointmentById);

// Update Status (Doctor / Admin)
router.patch(
  '/:id/status',
  verifyAuth,
  requireRole('doctor', 'admin'),
  updateAppointmentStatusValidation,
  validateRequest,
  AppointmentController.updateStatus
);

// Cancel Appointment (Patient or Doctor)
router.post(
  '/:id/cancel',
  verifyAuth,
  cancelAppointmentValidation,
  validateRequest,
  AppointmentController.cancelAppointment
);

// Create Consultation (Doctor completes appointment)
router.post(
  '/:id/consultation',
  verifyAuth,
  requireRole('doctor'),
  createConsultationValidation,
  validateRequest,
  ConsultationController.createConsultation
);

module.exports = router;
