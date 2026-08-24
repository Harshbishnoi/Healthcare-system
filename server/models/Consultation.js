const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    consultationNotes: {
      type: String,
      required: [true, 'Clinical consultation notes are required'],
      trim: true,
    },
    diagnosis: {
      type: String,
      required: [true, 'Clinical diagnosis recorded by the physician is required'],
      trim: true,
    },
    treatmentNotes: {
      type: String,
      required: [true, 'Treatment notes & care plan are required'],
      trim: true,
    },
    vitals: {
      bloodPressure: { type: String, default: '' }, // e.g. "120/80"
      pulseRate: { type: String, default: '' },     // e.g. "72 bpm"
      temperature: { type: String, default: '' },   // e.g. "98.6 F"
      weightKg: { type: String, default: '' },      // e.g. "70 kg"
    },
    followUpDate: {
      type: String, // YYYY-MM-DD
      default: '',
    },
    followUpInstructions: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

consultationSchema.index({ patientId: 1, createdAt: -1 });
consultationSchema.index({ doctorId: 1, createdAt: -1 });

const Consultation =
  mongoose.models.Consultation || mongoose.model('Consultation', consultationSchema);

module.exports = Consultation;
