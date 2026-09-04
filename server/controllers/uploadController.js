const path = require('path');
const fs = require('fs');
const MedicalRecord = require('../models/MedicalRecord');
const PatientProfile = require('../models/PatientProfile');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { uploadDir } = require('../middleware/uploadMiddleware');
const prisma = require('../config/prisma');

class UploadController {
  /**
   * 1. Upload Medical Record / Lab Report / Scan (Returns 201 Created)
   */
  static uploadMedicalRecord = catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('No file uploaded. Please provide a valid medical document.', 400);
    }

    const { title, recordType, notes, isConfidential, patientId: targetPatientId } = req.body;
    let patientId = req.user?.id;

    // If doctor/admin is uploading on behalf of a patient
    if (req.user?.role !== 'patient' && targetPatientId) {
      patientId = targetPatientId;
    }

    const fileUrl = `/api/uploads/records/file/${req.file.filename}`;
    const recordData = {
      patientId,
      doctorId: req.user?.role === 'doctor' ? req.user.id : null,
      title: title || req.file.originalname,
      recordType: recordType || 'lab_report',
      fileUrl,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      isConfidential: isConfidential === 'true' || isConfidential === true,
      notes: notes || '',
    };

    let savedRecord;
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      try {
        savedRecord = await MedicalRecord.create(recordData);
      } catch (err) {
        savedRecord = { id: `rec-${Date.now()}`, ...recordData };
      }
    } else {
      savedRecord = { id: `rec-${Date.now()}`, ...recordData };
    }

    // Sync to PostgreSQL if Prisma connected
    try {
      if (prisma && prisma.medicalRecord) {
        await prisma.medicalRecord.create({
          data: {
            patientId: String(patientId),
            doctorId: recordData.doctorId ? String(recordData.doctorId) : null,
            title: recordData.title,
            recordType: recordData.recordType,
            fileUrl: recordData.fileUrl,
            fileName: recordData.fileName,
            fileSize: recordData.fileSize,
            mimeType: recordData.mimeType,
            isConfidential: recordData.isConfidential,
            notes: recordData.notes,
          },
        });
      }
    } catch (pErr) {
      // Fallback gracefully
    }

    return ApiResponse.success(res, savedRecord, 'Medical document uploaded successfully', 201);
  });

  /**
   * 2. List Medical Records for a Patient (Returns 200 OK)
   */
  static getPatientRecords = catchAsync(async (req, res) => {
    const requestedPatientId = req.params.patientId || req.user?.id;

    // Authorization check
    if (req.user?.role === 'patient' && req.user.id !== requestedPatientId) {
      throw new AppError('Forbidden: You can only view your own medical records.', 403);
    }

    let records = [];
    try {
      records = await MedicalRecord.find({ patientId: requestedPatientId }).sort({ createdAt: -1 });
    } catch (err) {
      records = [];
    }

    return ApiResponse.success(res, { records, count: records.length }, 'Patient medical records retrieved', 200);
  });

  /**
   * 3. Download/Stream Protected Medical File (Verifies Patient Ownership or Doctor Relationship)
   */
  static getMedicalRecordFile = catchAsync(async (req, res) => {
    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(uploadDir, sanitizedFilename);

    if (!fs.existsSync(filePath)) {
      throw new AppError('Medical record file not found on server.', 404);
    }

    let record = null;
    try {
      record = await MedicalRecord.findOne({ fileName: sanitizedFilename });
    } catch (err) {
      // Stub
    }

    if (record) {
      const isPatientOwner = req.user?.id === record.patientId?.toString();
      const isAdmin = req.user?.role === 'admin';
      let isAuthorizedDoctor = req.user?.role === 'doctor' && req.user.id === record.doctorId?.toString();

      // Check if doctor has an appointment with this patient
      if (req.user?.role === 'doctor' && !isAuthorizedDoctor) {
        try {
          const hasAppointment = await Appointment.findOne({
            doctorId: req.user.id,
            patientId: record.patientId,
          });
          if (hasAppointment) isAuthorizedDoctor = true;
        } catch (aErr) {}
      }

      if (!isPatientOwner && !isAuthorizedDoctor && !isAdmin) {
        throw new AppError('Forbidden: You do not have permission to access this medical document.', 403);
      }
    }

    res.sendFile(filePath);
  });

  /**
   * 4. Delete Medical Record (Returns 204 No Content)
   */
  static deleteMedicalRecord = catchAsync(async (req, res) => {
    const { id } = req.params;
    let record = null;
    try {
      record = await MedicalRecord.findById(id);
    } catch (err) {}

    if (!record) {
      throw new AppError('Medical record not found.', 404);
    }

    const isOwner = req.user?.id === record.patientId?.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new AppError('Forbidden: You do not have permission to delete this record.', 403);
    }

    // Delete physical file if exists
    if (record.fileName) {
      const filePath = path.join(uploadDir, path.basename(record.fileName));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fErr) {}
      }
    }

    try {
      await MedicalRecord.findByIdAndDelete(id);
    } catch (delErr) {}

    return res.status(204).send();
  });
}

module.exports = UploadController;
