const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    primaryHealthConcern: {
      type: String,
      trim: true,
      default: '',
    },
    problemDuration: {
      type: String,
      trim: true,
      default: '',
    },
    pastMedicalHistory: {
      type: String,
      trim: true,
      default: '',
    },
    allergies: {
      type: [String],
      default: [],
    },
    chronicConditions: {
      type: [String],
      default: [],
    },
    emergencyContact: {
      name: { type: String, default: '' },
      mobile: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    intakeSummary: {
      healthConcern: { type: String, default: '' },
      duration: { type: String, default: '' },
      historySummary: { type: String, default: '' },
      questionsForDoctor: { type: [String], default: [] },
      safetyNotice: { type: String, default: '' },
      generatedAt: { type: Date },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const PatientProfile =
  mongoose.models.PatientProfile || mongoose.model('PatientProfile', patientProfileSchema);

module.exports = PatientProfile;
