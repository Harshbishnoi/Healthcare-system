const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
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
    appointmentDate: {
      type: String, // Stored as ISO YYYY-MM-DD for deterministic indexing and timezone neutrality
      required: [true, 'Appointment date is required'],
      index: true,
    },
    timeSlot: {
      type: String, // e.g. "10:00"
      required: [true, 'Time slot is required'],
    },
    mode: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    reasonForVisit: {
      type: String,
      required: [true, 'Reason for visit is required'],
      trim: true,
    },
    intakeSummary: {
      healthConcern: String,
      duration: String,
      historySummary: String,
      questionsForDoctor: [String],
      safetyNotice: String,
    },
    consultationFee: {
      type: Number,
      default: 500,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledBy: {
      type: String,
      enum: ['patient', 'doctor', 'system', ''],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for querying doctor schedule & double-booking prevention
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, timeSlot: 1 });
appointmentSchema.index({ patientId: 1, createdAt: -1 });

const Appointment =
  mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
