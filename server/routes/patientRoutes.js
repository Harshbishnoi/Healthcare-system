const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patientController');
const ConsultationController = require('../controllers/consultationController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { verifyDoctorPatientAccess } = require('../middleware/authorizationMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { updatePatientProfileValidation } = require('../schemas/patientSchemas');
const { createPrescriptionValidation } = require('../schemas/consultationSchemas');

// Patient Authenticated Routes
router.get('/me', verifyAuth, requireRole('patient'), PatientController.getMe);

router.patch(
  '/me',
  verifyAuth,
  requireRole('patient'),
  updatePatientProfileValidation,
  validateRequest,
  PatientController.updateProfile
);

router.get('/me/appointments', verifyAuth, requireRole('patient'), PatientController.getAppointments);
router.get('/me/prescriptions', verifyAuth, requireRole('patient'), PatientController.getPrescriptions);
router.get('/me/medical-history', verifyAuth, requireRole('patient'), PatientController.getMedicalHistory);

// Doctor-Authorized Patient History Access
router.get(
  '/:patientId/medical-history',
  verifyAuth,
  verifyDoctorPatientAccess,
  ConsultationController.getPatientMedicalHistory
);

router.post(
  '/:patientId/prescriptions',
  verifyAuth,
  requireRole('doctor'),
  createPrescriptionValidation,
  validateRequest,
  ConsultationController.createPrescription
);

module.exports = router;
