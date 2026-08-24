const { body, query } = require('express-validator');

const updateDoctorProfileValidation = [
  body('degree').optional().trim().notEmpty().withMessage('Degree cannot be empty'),
  body('specialization').optional().trim().notEmpty().withMessage('Specialization cannot be empty'),
  body('experienceYears').optional().isInt({ min: 0 }).withMessage('Experience must be >= 0'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('hospitalClinic').optional().trim().notEmpty().withMessage('Hospital/clinic cannot be empty'),
  body('serviceLocation').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('bio').optional().trim(),
  body('consultationModes').optional().isArray().withMessage('Consultation modes must be an array'),
  body('consultationFee').optional().isFloat({ min: 0 }).withMessage('Fee must be >= 0'),
];

const updateAvailabilityValidation = [
  body('workingDays')
    .isArray({ min: 1 })
    .withMessage('At least one working day must be selected'),
  body('workingHours.start')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('workingHours.end')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('slotDurationMinutes')
    .optional()
    .isInt({ min: 10, max: 120 })
    .withMessage('Slot duration must be between 10 and 120 minutes'),
  body('onlineAvailable').optional().isBoolean(),
  body('offlineAvailable').optional().isBoolean(),
];

const searchDoctorsValidation = [
  query('city').optional().trim(),
  query('specialization').optional().trim(),
  query('mode').optional().isIn(['online', 'offline', 'all']),
  query('concern').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
];

module.exports = {
  updateDoctorProfileValidation,
  updateAvailabilityValidation,
  searchDoctorsValidation,
};
