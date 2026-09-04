const { body, query } = require('express-validator');

const intakeSummaryValidation = [
  body('healthConcern')
    .trim()
    .notEmpty()
    .withMessage('Health concern or symptoms description is required'),
  body('duration').optional().trim(),
  body('medicalHistory').optional().trim(),
];

const searchAssistantValidation = [
  body('query')
    .trim()
    .notEmpty()
    .withMessage('Search query / symptoms description is required'),
  body('city').optional().trim(),
];

const streamTriageValidation = [
  body('symptoms')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Symptoms description cannot be empty if provided'),
];

const ragQueryValidation = [
  body('query')
    .trim()
    .notEmpty()
    .withMessage('A medical query is required for knowledge retrieval')
    .isLength({ min: 3 })
    .withMessage('Medical query must be at least 3 characters long'),
  body('topK')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('topK must be an integer between 1 and 10'),
];

const agentExecuteValidation = [
  body('goal')
    .trim()
    .notEmpty()
    .withMessage('Patient goal or symptom inquiry is required for agent execution')
    .isLength({ min: 5 })
    .withMessage('Goal must be at least 5 characters long'),
  body('patientId').optional().trim(),
  body('maxSteps')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('maxSteps must be between 1 and 10'),
];

module.exports = {
  intakeSummaryValidation,
  searchAssistantValidation,
  streamTriageValidation,
  ragQueryValidation,
  agentExecuteValidation,
};
