const mongoose = require('mongoose');

const medicationItemSchema = new mongoose.Schema({
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required (e.g., 500mg)'],
    trim: true,
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required (e.g., 1-0-1 After Meals)'],
    trim: true,
  },
  duration: {
    type: String,
    required: [true, 'Duration is required (e.g., 5 days)'],
    trim: true,
  },
  instructions: {
    type: String,
    default: '',
    trim: true,
  },
});

const prescriptionSchema = new mongoose.Schema(
  {
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
      required: true,
    },
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
    medications: {
      type: [medicationItemSchema],
      validate: [
        (val) => val && val.length > 0,
        'At least one medication item is required for a prescription',
      ],
    },
    generalAdvice: {
      type: String,
      default: '',
      trim: true,
    },
    dietaryRestrictions: {
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

prescriptionSchema.index({ patientId: 1, createdAt: -1 });

const Prescription =
  mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
