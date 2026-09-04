const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const { verifyAuth } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Upload medical document / lab report (Patients, Doctors, Admins)
router.post(
  '/medical-records',
  verifyAuth,
  upload.single('file'),
  UploadController.uploadMedicalRecord
);

// Get medical records list for patient
router.get(
  '/records/patient/:patientId',
  verifyAuth,
  UploadController.getPatientRecords
);

router.get(
  '/records/my',
  verifyAuth,
  UploadController.getPatientRecords
);

// Download protected medical file (Access Controlled)
router.get(
  '/records/file/:filename',
  verifyAuth,
  UploadController.getMedicalRecordFile
);

// Delete medical record (204 No Content)
router.delete(
  '/records/:id',
  verifyAuth,
  UploadController.deleteMedicalRecord
);

module.exports = router;
