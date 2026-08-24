const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    degree: {
      type: String,
      required: [true, 'Degree / Qualifications are required'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    experienceYears: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    city: {
      type: String,
      required: [true, 'Practice city is required'],
      trim: true,
      index: true,
    },
    hospitalClinic: {
      type: String,
      required: [true, 'Hospital or Clinic name is required'],
      trim: true,
    },
    serviceLocation: {
      type: String,
      required: [true, 'Service address / landmark is required'],
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    consultationModes: {
      type: [String],
      enum: ['online', 'offline'],
      default: ['offline', 'online'],
    },
    consultationFee: {
      type: Number,
      default: 500,
      min: 0,
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    profileCompleteness: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for search optimization
doctorProfileSchema.index({ city: 1, specialization: 1 });
doctorProfileSchema.index({ ratingAvg: -1 });
doctorProfileSchema.index({ consultationModes: 1 });

const DoctorProfile =
  mongoose.models.DoctorProfile || mongoose.model('DoctorProfile', doctorProfileSchema);

module.exports = DoctorProfile;
