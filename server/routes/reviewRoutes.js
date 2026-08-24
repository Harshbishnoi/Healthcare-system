const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
  createReviewValidation,
  getDoctorReviewsValidation,
} = require('../schemas/reviewSchemas');

// Post Review (Patient for completed appointment)
router.post(
  '/',
  verifyAuth,
  requireRole('patient'),
  createReviewValidation,
  validateRequest,
  ReviewController.createReview
);

// Get Reviews for Doctor
router.get(
  '/doctor/:id',
  getDoctorReviewsValidation,
  validateRequest,
  ReviewController.getDoctorReviews
);

module.exports = router;
