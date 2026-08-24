const { body, param } = require('express-validator');

const createConsultationValidation = [
  param('id').isMongoId().withMessage('Valid Appointment ID is required'),
  body('consultationNotes')
    .trim()
    .notEmpty()
    .withMessage('Clinical consultation notes are required'),
  body('diagnosis')
    .trim()
    .notEmpty()
    .withMessage('Physician clinical diagnosis is required'),
  body('treatmentNotes')
    .trim()
    .notEmpty()
    .withMessage('Treatment notes / plan are required'),
  body('vitals').optional().isObject(),
  body('followUpDate')
    .optional()
    .matches(/^(\d{4}-\d{2}-\d{2})?$/)
    .withMessage('Follow-up date must be YYYY-MM-DD format'),
  body('followUpInstructions').optional().trim(),
  body('prescription').optional().isObject(),
  body('prescription.medications')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Prescription must contain at least one medication'),
  body('prescription.medications.*.medicineName')
    .optional()
    .notEmpty()
    .withMessage('Medicine name is required'),
  body('prescription.medications.*.dosage')
    .optional()
    .notEmpty()
    .withMessage('Dosage is required'),
  body('prescription.medications.*.frequency')
    .optional()
    .notEmpty()
    .withMessage('Frequency is required'),
  body('prescription.medications.*.duration')
    .optional()
    .notEmpty()
    .withMessage('Duration is required'),
];

const createPrescriptionValidation = [
  param('patientId').isMongoId().withMessage('Valid Patient ID is required'),
  body('appointmentId').isMongoId().withMessage('Valid Appointment ID is required'),
  body('medications')
    .isArray({ min: 1 })
    .withMessage('At least one medication is required'),
  body('medications.*.medicineName')
    .trim()
    .notEmpty()
    .withMessage('Medicine name is required'),
  body('medications.*.dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('medications.*.frequency').trim().notEmpty().withMessage('Frequency is required'),
  body('medications.*.duration').trim().notEmpty().withMessage('Duration is required'),
  body('generalAdvice').optional().trim(),
  body('dietaryRestrictions').optional().trim(),
];

module.exports = {
  createConsultationValidation,
  createPrescriptionValidation,
};
