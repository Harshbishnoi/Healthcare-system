const { body, param } = require('express-validator');

const createReviewValidation = [
  body('doctorId').isMongoId().withMessage('Valid Doctor ID is required'),
  body('appointmentId').isMongoId().withMessage('Valid Appointment ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('isAnonymous').optional().isBoolean(),
];

const getDoctorReviewsValidation = [
  param('id').isMongoId().withMessage('Valid Doctor ID is required'),
];

module.exports = {
  createReviewValidation,
  getDoctorReviewsValidation,
};
