const { body, param } = require('express-validator');

const createAppointmentValidation = [
  body('doctorId').isMongoId().withMessage('Valid Doctor ID is required'),
  body('appointmentDate')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Appointment date must be in YYYY-MM-DD format'),
  body('timeSlot')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time slot must be in HH:MM format (e.g., 09:30)'),
  body('mode')
    .isIn(['online', 'offline'])
    .withMessage('Consultation mode must be either online or offline'),
  body('reasonForVisit')
    .trim()
    .notEmpty()
    .withMessage('Reason for visit / health concern is required'),
];

const updateAppointmentStatusValidation = [
  param('id').isMongoId().withMessage('Valid Appointment ID is required'),
  body('status')
    .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Status must be pending, confirmed, completed, or cancelled'),
];

const cancelAppointmentValidation = [
  param('id').isMongoId().withMessage('Valid Appointment ID is required'),
  body('reason').optional().trim(),
];

module.exports = {
  createAppointmentValidation,
  updateAppointmentStatusValidation,
  cancelAppointmentValidation,
};
