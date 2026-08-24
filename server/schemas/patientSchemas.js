const { body } = require('express-validator');

const updatePatientProfileValidation = [
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date format is required (YYYY-MM-DD)'),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']),
  body('primaryHealthConcern').optional().trim(),
  body('problemDuration').optional().trim(),
  body('pastMedicalHistory').optional().trim(),
  body('allergies').optional().isArray(),
  body('chronicConditions').optional().isArray(),
  body('emergencyContact.name').optional().trim(),
  body('emergencyContact.mobile').optional().trim(),
  body('emergencyContact.relation').optional().trim(),
];

module.exports = {
  updatePatientProfileValidation,
};
