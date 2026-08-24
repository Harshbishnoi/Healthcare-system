const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');
const ReviewController = require('../controllers/reviewController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const {
  updateDoctorProfileValidation,
  updateAvailabilityValidation,
  searchDoctorsValidation,
} = require('../schemas/doctorSchemas');
const { getDoctorReviewsValidation } = require('../schemas/reviewSchemas');

const { cacheResponse } = require('../middleware/cacheMiddleware');

// Public Doctor Discovery
router.get('/', searchDoctorsValidation, validateRequest, cacheResponse(60), DoctorController.getDoctors);
router.get('/:id', DoctorController.getDoctorById);
router.get('/:id/reviews', getDoctorReviewsValidation, validateRequest, ReviewController.getDoctorReviews);

// Doctor Authenticated Routes
router.patch(
  '/me',
  verifyAuth,
  requireRole('doctor'),
  updateDoctorProfileValidation,
  validateRequest,
  DoctorController.updateProfile
);

router.put(
  '/me/availability',
  verifyAuth,
  requireRole('doctor'),
  updateAvailabilityValidation,
  validateRequest,
  DoctorController.updateAvailability
);

router.get(
  '/me/appointments',
  verifyAuth,
  requireRole('doctor'),
  DoctorController.getDoctorAppointments
);

router.get(
  '/me/patients',
  verifyAuth,
  requireRole('doctor'),
  DoctorController.getDoctorPatients
);

module.exports = router;
