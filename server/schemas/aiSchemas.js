const { body } = require('express-validator');

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

module.exports = {
  intakeSummaryValidation,
  searchAssistantValidation,
};
