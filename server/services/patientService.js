const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const AppError = require('../utils/appError');

class PatientService {
  static async getPatientProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('Patient account not found.', 404);
    }

    let profile = await PatientProfile.findOne({ userId });
    if (!profile) {
      profile = await PatientProfile.create({ userId });
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
      },
      profile,
    };
  }

  static async updatePatientProfile(userId, updateData) {
    let profile = await PatientProfile.findOne({ userId });
    if (!profile) {
      profile = new PatientProfile({ userId });
    }

    const fields = [
      'dateOfBirth',
      'gender',
      'bloodGroup',
      'primaryHealthConcern',
      'problemDuration',
      'pastMedicalHistory',
      'allergies',
      'chronicConditions',
      'emergencyContact',
      'intakeSummary',
    ];

    fields.forEach((f) => {
      if (updateData[f] !== undefined) {
        profile[f] = updateData[f];
      }
    });

    await profile.save();
    return profile;
  }

  static async getPatientAppointments(userId) {
    const appointments = await Appointment.find({ patientId: userId })
      .populate('doctorId', 'name email mobile city')
      .sort({ appointmentDate: -1, createdAt: -1 });

    return appointments;
  }

  static async getPatientPrescriptions(userId) {
    const prescriptions = await Prescription.find({ patientId: userId })
      .populate('doctorId', 'name email mobile city')
      .populate('appointmentId', 'appointmentDate timeSlot mode')
      .sort({ createdAt: -1 });

    return prescriptions;
  }

  static async getPatientMedicalHistory(userId) {
    const [profile, appointments, consultations, prescriptions] = await Promise.all([
      PatientProfile.findOne({ userId }).populate('userId', 'name email mobile city'),
      Appointment.find({ patientId: userId }).populate('doctorId', 'name city').sort({ appointmentDate: -1 }),
      Consultation.find({ patientId: userId }).populate('doctorId', 'name city').sort({ createdAt: -1 }),
      Prescription.find({ patientId: userId }).populate('doctorId', 'name city').sort({ createdAt: -1 }),
    ]);

    return {
      profile,
      appointments,
      consultations,
      prescriptions,
    };
  }
}

module.exports = PatientService;
