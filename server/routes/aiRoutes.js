const express = require('express');
const router = express.Router();
const AiController = require('../controllers/aiController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { aiLimiter } = require('../middleware/rateLimitMiddleware');
const {
  intakeSummaryValidation,
  searchAssistantValidation,
} = require('../schemas/aiSchemas');

// Feature 1: Patient Intake Summary Generator (Authenticated Patients)
router.post(
  '/intake-summary',
  verifyAuth,
  aiLimiter,
  intakeSummaryValidation,
  validateRequest,
  AiController.generateIntakeSummary
);

// Feature 2: Doctor Search Assistant (Public / All Users)
router.post(
  '/search-assistant',
  aiLimiter,
  searchAssistantValidation,
  validateRequest,
  AiController.searchDoctorAssistant
);

module.exports = router;
