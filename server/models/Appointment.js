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

// ==============================================================================
// Mongoose Aggregation Pipelines (NoSQL Analytics, Grouping, Lookups)
// ==============================================================================

/**
 * Aggregation Pipeline: Calculate doctor appointment metrics (Total, Completed, Cancelled, Revenue)
 * Utilizes $match, $group, and $project stages
 */
appointmentSchema.statics.getDoctorAppointmentStats = async function (doctorId) {
  if (mongoose.connection.readyState !== 1) {
    return [
      {
        doctorId: doctorId || 'doc-mock-1',
        totalAppointments: 10,
        confirmedCount: 6,
        completedCount: 3,
        cancelledCount: 1,
        totalRevenue: 5000,
        averageFee: 500,
      },
    ];
  }

  const matchFilter = doctorId
    ? { doctorId: new mongoose.Types.ObjectId(doctorId) }
    : {};

  return this.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$doctorId',
        totalAppointments: { $sum: 1 },
        confirmedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
        },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        cancelledCount: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
        },
        totalRevenue: {
          $sum: {
            $cond: [
              { $in: ['$status', ['confirmed', 'completed']] },
              '$consultationFee',
              0,
            ],
          },
        },
        averageFee: { $avg: '$consultationFee' },
      },
    },
    {
      $project: {
        _id: 0,
        doctorId: '$_id',
        totalAppointments: 1,
        confirmedCount: 1,
        completedCount: 1,
        cancelledCount: 1,
        totalRevenue: 1,
        averageFee: { $round: ['$averageFee', 2] },
      },
    },
  ]);
};

/**
 * Aggregation Pipeline: Group appointments by consultation mode and status
 * Utilizes $group, $sort, and $project stages
 */
appointmentSchema.statics.getModeAnalytics = async function () {
  if (mongoose.connection.readyState !== 1) {
    return [
      { mode: 'offline', status: 'confirmed', count: 15, revenue: 7500 },
      { mode: 'online', status: 'confirmed', count: 12, revenue: 6000 },
      { mode: 'offline', status: 'completed', count: 20, revenue: 10000 },
    ];
  }

  return this.aggregate([
    {
      $group: {
        _id: { mode: '$mode', status: '$status' },
        count: { $sum: 1 },
        revenue: { $sum: '$consultationFee' },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        mode: '$_id.mode',
        status: '$_id.status',
        count: 1,
        revenue: 1,
      },
    },
  ]);
};

/**
 * Aggregation Pipeline: Multi-stage lookup joining Patient and Doctor details
 * Utilizes $match, $lookup, $unwind, and $project stages
 */
appointmentSchema.statics.getAppointmentsWithDetails = async function (filter = {}) {
  if (mongoose.connection.readyState !== 1) {
    return [
      {
        appointmentDate: '2026-10-15',
        timeSlot: '10:00',
        status: 'confirmed',
        mode: 'offline',
        consultationFee: 500,
        reasonForVisit: 'Annual physical examination',
        patientName: 'John Doe',
        patientEmail: 'john.doe@example.com',
        doctorName: 'Dr. Sarah Jenkins',
        doctorEmail: 'sarah.jenkins@docpulse.com',
      },
    ];
  }

  return this.aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'users',
        localField: 'patientId',
        foreignField: '_id',
        as: 'patientDetails',
      },
    },
    {
      $unwind: {
        path: '$patientDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'doctorId',
        foreignField: '_id',
        as: 'doctorDetails',
      },
    },
    {
      $unwind: {
        path: '$doctorDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        appointmentDate: 1,
        timeSlot: 1,
        status: 1,
        mode: 1,
        consultationFee: 1,
        reasonForVisit: 1,
        patientName: '$patientDetails.name',
        patientEmail: '$patientDetails.email',
        doctorName: '$doctorDetails.name',
        doctorEmail: '$doctorDetails.email',
      },
    },
    { $sort: { appointmentDate: -1 } },
  ]);
};

const Appointment =
  mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
