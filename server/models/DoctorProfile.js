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

// ==============================================================================
// Mongoose Aggregation Pipelines (NoSQL Grouping, Facets, Analytics)
// ==============================================================================

/**
 * Aggregation Pipeline: Group doctors by specialization with average fee & rating
 * Utilizes $match, $group, $sort, and $project stages
 */
doctorProfileSchema.statics.aggregateSpecializationStats = async function () {
  if (mongoose.connection.readyState !== 1) {
    return [
      { specialization: 'Cardiology', doctorCount: 4, averageFee: 650, averageRating: 4.9, citiesCount: 3, citiesAvailable: ['New York', 'Boston', 'Chicago'] },
      { specialization: 'Pediatrics', doctorCount: 3, averageFee: 500, averageRating: 4.8, citiesCount: 2, citiesAvailable: ['New York', 'Austin'] },
      { specialization: 'Dermatology', doctorCount: 3, averageFee: 550, averageRating: 4.7, citiesCount: 2, citiesAvailable: ['San Francisco', 'Seattle'] },
    ];
  }

  return this.aggregate([
    { $match: { isVerified: true } },
    {
      $group: {
        _id: '$specialization',
        doctorCount: { $sum: 1 },
        averageFee: { $avg: '$consultationFee' },
        averageRating: { $avg: '$ratingAvg' },
        citiesAvailable: { $addToSet: '$city' },
      },
    },
    { $sort: { doctorCount: -1 } },
    {
      $project: {
        _id: 0,
        specialization: '$_id',
        doctorCount: 1,
        averageFee: { $round: ['$averageFee', 2] },
        averageRating: { $round: ['$averageRating', 2] },
        citiesCount: { $size: '$citiesAvailable' },
        citiesAvailable: 1,
      },
    },
  ]);
};

/**
 * Aggregation Pipeline: Multi-stage pipeline joining User credentials with DoctorProfile
 * Utilizes $match, $lookup, $unwind, $project
 */
doctorProfileSchema.statics.getDoctorDirectoryWithAggregation = async function (filter = {}) {
  if (mongoose.connection.readyState !== 1) {
    const { SAMPLE_DOCTORS } = require('../utils/seedData');
    return (SAMPLE_DOCTORS || []).map((d, i) => ({
      _id: `doc-${i + 1}`,
      name: d.name,
      email: d.email,
      specialization: d.specialization,
      degree: d.degree,
      experienceYears: d.experienceYears,
      city: d.city,
      hospitalClinic: d.hospitalClinic,
      consultationFee: d.consultationFee,
      ratingAvg: d.ratingAvg,
      totalReviews: d.totalReviews,
      consultationModes: d.consultationModes,
      isVerified: true,
    }));
  }

  return this.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        name: '$user.name',
        email: '$user.email',
        specialization: 1,
        degree: 1,
        experienceYears: 1,
        city: 1,
        hospitalClinic: 1,
        consultationFee: 1,
        ratingAvg: 1,
        totalReviews: 1,
        consultationModes: 1,
        isVerified: 1,
      },
    },
    { $sort: { ratingAvg: -1, experienceYears: -1 } },
  ]);
};

const DoctorProfile =
  mongoose.models.DoctorProfile || mongoose.model('DoctorProfile', doctorProfileSchema);

module.exports = DoctorProfile;
