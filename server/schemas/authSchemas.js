const { body } = require('express-validator');

const patientRegisterValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email address is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('primaryHealthConcern').optional().trim(),
  body('problemDuration').optional().trim(),
  body('pastMedicalHistory').optional().trim(),
];

const doctorRegisterValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email address is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('city').trim().notEmpty().withMessage('Practice city is required'),
  body('degree').trim().notEmpty().withMessage('Degree / Qualifications are required'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('experienceYears')
    .isInt({ min: 0 })
    .withMessage('Experience in years must be a positive integer'),
  body('hospitalClinic').trim().notEmpty().withMessage('Hospital/Clinic name is required'),
  body('serviceLocation').trim().notEmpty().withMessage('Service location address is required'),
  body('bio').optional().trim(),
  body('consultationModes')
    .optional()
    .isArray()
    .withMessage('Consultation modes must be an array of "online" or "offline"'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = {
  patientRegisterValidation,
  doctorRegisterValidation,
  loginValidation,
};
