const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Availability = require('../models/Availability');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Consultation = require('../models/Consultation');
const PatientProfile = require('../models/PatientProfile');
const AppError = require('../utils/appError');
const { generateAvailableSlots } = require('../utils/slotCalculator');

class DoctorService {
  static async searchDoctors({
    city,
    specialization,
    mode,
    search,
    page = 1,
    limit = 20,
  }) {
    const query = {};

    if (city && city.trim() !== '') {
      query.city = { $regex: new RegExp(city.trim(), 'i') };
    }

    if (specialization && specialization.trim() !== '') {
      query.specialization = { $regex: new RegExp(specialization.trim(), 'i') };
    }

    if (mode && mode !== 'all') {
      query.consultationModes = mode;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { specialization: searchRegex },
        { hospitalClinic: searchRegex },
        { city: searchRegex },
        { bio: searchRegex },
      ];
    }

    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      const { SAMPLE_DOCTORS } = require('../utils/seedData');
      let filtered = [...SAMPLE_DOCTORS];
      if (city) filtered = filtered.filter((d) => d.city.toLowerCase().includes(city.toLowerCase()));
      if (specialization) filtered = filtered.filter((d) => d.specialization.toLowerCase().includes(specialization.toLowerCase()));
      if (mode && mode !== 'all') filtered = filtered.filter((d) => (d.consultationModes || []).includes(mode));

      return {
        doctors: filtered.map((d, idx) => ({
          id: `doc_${idx + 1}`,
          doctorId: `doc_${idx + 1}`,
          name: d.name,
          email: d.email,
          mobile: d.mobile,
          degree: d.degree,
          specialization: d.specialization,
          experienceYears: d.experienceYears,
          city: d.city,
          hospitalClinic: d.hospitalClinic,
          serviceLocation: d.serviceLocation,
          bio: d.bio,
          consultationModes: d.consultationModes,
          consultationFee: d.consultationFee,
          ratingAvg: d.ratingAvg,
          totalReviews: d.totalReviews,
          availability: {
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            workingHours: { start: '09:00', end: '17:00' },
            slotDurationMinutes: 30,
          },
        })),
        pagination: {
          total: filtered.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(filtered.length / Number(limit)) || 1,
        },
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [profiles, total] = await Promise.all([
      DoctorProfile.find(query)
        .populate('userId', 'name email mobile city avatar')
        .sort({ ratingAvg: -1, experienceYears: -1 })
        .skip(skip)
        .limit(Number(limit)),
      DoctorProfile.countDocuments(query),
    ]);

    // Attach availability summary to doctors
    const doctorIds = profiles.map((p) => p.userId?._id).filter(Boolean);
    const availabilities = await Availability.find({ doctorId: { $in: doctorIds } });

    const availabilityMap = new Map();
    availabilities.forEach((a) => availabilityMap.set(a.doctorId.toString(), a));

    const enrichedDoctors = profiles.map((profile) => {
      const doctorUser = profile.userId;
      const avail = availabilityMap.get(doctorUser?._id?.toString());
      return {
        id: profile._id,
        doctorId: doctorUser?._id,
        name: doctorUser?.name || 'Dr. Practitioner',
        email: doctorUser?.email,
        mobile: doctorUser?.mobile,
        degree: profile.degree,
        specialization: profile.specialization,
        experienceYears: profile.experienceYears,
        city: profile.city || doctorUser?.city,
        hospitalClinic: profile.hospitalClinic,
        serviceLocation: profile.serviceLocation,
        bio: profile.bio,
        consultationModes: profile.consultationModes,
        consultationFee: profile.consultationFee,
        ratingAvg: profile.ratingAvg,
        totalReviews: profile.totalReviews,
        availability: avail || null,
      };
    });

    return {
      doctors: enrichedDoctors,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  static async getDoctorById(id, targetDate = null) {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      const { SAMPLE_DOCTORS } = require('../utils/seedData');
      const doc = SAMPLE_DOCTORS[0];
      return {
        id: id || 'doc_1',
        doctorId: id || 'doc_1',
        name: doc.name,
        email: doc.email,
        mobile: doc.mobile,
        degree: doc.degree,
        specialization: doc.specialization,
        experienceYears: doc.experienceYears,
        city: doc.city,
        hospitalClinic: doc.hospitalClinic,
        serviceLocation: doc.serviceLocation,
        bio: doc.bio,
        consultationModes: doc.consultationModes,
        consultationFee: doc.consultationFee,
        ratingAvg: doc.ratingAvg,
        totalReviews: doc.totalReviews,
        availability: {
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          workingHours: { start: '09:00', end: '17:00' },
          slotDurationMinutes: 30,
        },
        calculatedSlots: targetDate
          ? generateAvailableSlots({
              workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              workingHours: { start: '09:00', end: '17:00' },
              slotDurationMinutes: 30,
              targetDateStr: targetDate,
              bookedSlots: [],
            })
          : null,
        reviews: [],
      };
    }

    // Search by doctor profile ID or user ID
    profile = await DoctorProfile.findOne({
      $or: [{ _id: id }, { userId: id }],
    }).populate('userId', 'name email mobile city avatar');

    if (!profile) {
      throw new AppError('Doctor profile not found.', 404);
    }

    const doctorUserId = profile.userId?._id;
    const availability = await Availability.findOne({ doctorId: doctorUserId });
    const reviews = await Review.find({ doctorId: doctorUserId })
      .populate('patientId', 'name city')
      .sort({ createdAt: -1 })
      .limit(10);

    // Compute slots if targetDate is provided
    let calculatedSlots = null;
    if (targetDate && availability) {
      const bookedAppointments = await Appointment.find({
        doctorId: doctorUserId,
        appointmentDate: targetDate,
        status: { $in: ['pending', 'confirmed'] },
      }).select('timeSlot');

      const bookedSlotTimes = bookedAppointments.map((a) => a.timeSlot);
      calculatedSlots = generateAvailableSlots({
        workingDays: availability.workingDays,
        workingHours: availability.workingHours,
        slotDurationMinutes: availability.slotDurationMinutes,
        targetDateStr: targetDate,
        bookedSlots: bookedSlotTimes,
      });
    }

    return {
      id: profile._id,
      doctorId: doctorUserId,
      name: profile.userId?.name,
      email: profile.userId?.email,
      mobile: profile.userId?.mobile,
      degree: profile.degree,
      specialization: profile.specialization,
      experienceYears: profile.experienceYears,
      city: profile.city || profile.userId?.city,
      hospitalClinic: profile.hospitalClinic,
      serviceLocation: profile.serviceLocation,
      bio: profile.bio,
      consultationModes: profile.consultationModes,
      consultationFee: profile.consultationFee,
      ratingAvg: profile.ratingAvg,
      totalReviews: profile.totalReviews,
      profileCompleteness: profile.profileCompleteness,
      availability,
      reviews,
      calculatedSlots,
    };
  }

  static async updateDoctorProfile(userId, updateData) {
    const profile = await DoctorProfile.findOne({ userId });
    if (!profile) {
      throw new AppError('Doctor profile not found for this user.', 404);
    }

    const allowedFields = [
      'degree',
      'specialization',
      'experienceYears',
      'city',
      'hospitalClinic',
      'serviceLocation',
      'bio',
      'consultationModes',
      'consultationFee',
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        profile[field] = updateData[field];
      }
    });

    // Calculate completeness
    let filledCount = 0;
    const keyFields = ['degree', 'specialization', 'experienceYears', 'city', 'hospitalClinic', 'serviceLocation', 'bio'];
    keyFields.forEach((k) => {
      if (profile[k] && `${profile[k]}`.trim() !== '') filledCount++;
    });
    profile.profileCompleteness = Math.round((filledCount / keyFields.length) * 100);

    await profile.save();
    return profile;
  }

  static async updateAvailability(userId, availabilityData) {
    let availability = await Availability.findOne({ doctorId: userId });
    if (!availability) {
      availability = new Availability({ doctorId: userId });
    }

    if (availabilityData.workingDays) availability.workingDays = availabilityData.workingDays;
    if (availabilityData.workingHours) availability.workingHours = availabilityData.workingHours;
    if (availabilityData.slotDurationMinutes) {
      availability.slotDurationMinutes = Number(availabilityData.slotDurationMinutes);
    }
    if (availabilityData.onlineAvailable !== undefined) {
      availability.onlineAvailable = Boolean(availabilityData.onlineAvailable);
    }
    if (availabilityData.offlineAvailable !== undefined) {
      availability.offlineAvailable = Boolean(availabilityData.offlineAvailable);
    }
    if (availabilityData.vacationDates) {
      availability.vacationDates = availabilityData.vacationDates;
    }

    await availability.save();
    return availability;
  }

  static async getDoctorAppointments(userId, { status, date } = {}) {
    const query = { doctorId: userId };
    if (status) query.status = status;
    if (date) query.appointmentDate = date;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email mobile city')
      .sort({ appointmentDate: 1, timeSlot: 1 });

    return appointments;
  }

  static async getDoctorPatients(userId) {
    const appointments = await Appointment.find({ doctorId: userId })
      .populate('patientId', 'name email mobile city')
      .sort({ createdAt: -1 });

    const patientMap = new Map();
    for (const appt of appointments) {
      if (appt.patientId && !patientMap.has(appt.patientId._id.toString())) {
        const patientProfile = await PatientProfile.findOne({ userId: appt.patientId._id });
        patientMap.set(appt.patientId._id.toString(), {
          patient: appt.patientId,
          profile: patientProfile,
          lastAppointmentDate: appt.appointmentDate,
          totalAppointments: 1,
        });
      } else if (appt.patientId) {
        const existing = patientMap.get(appt.patientId._id.toString());
        existing.totalAppointments += 1;
      }
    }

    return Array.from(patientMap.values());
  }
}

module.exports = DoctorService;
