const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const {
  patientRegisterValidation,
  doctorRegisterValidation,
  loginValidation,
} = require('../schemas/authSchemas');

// Public Auth Endpoints
router.post(
  '/register/patient',
  authLimiter,
  patientRegisterValidation,
  validateRequest,
  AuthController.registerPatient
);

router.post(
  '/register/doctor',
  authLimiter,
  doctorRegisterValidation,
  validateRequest,
  AuthController.registerDoctor
);

router.post(
  '/login',
  authLimiter,
  loginValidation,
  validateRequest,
  AuthController.login
);

// Authenticated Endpoints
router.get('/me', verifyAuth, AuthController.getMe);
router.post('/logout', verifyAuth, AuthController.logout);

module.exports = router;
