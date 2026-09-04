const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    recordType: {
      type: String,
      enum: ['lab_report', 'prescription', 'radiology_scan', 'discharge_summary', 'other'],
      default: 'lab_report',
      index: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

medicalRecordSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
