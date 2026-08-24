const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const Availability = require('../models/Availability');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwtUtils');
const AppError = require('../utils/appError');
const AuditService = require('./auditService');

class AuthService {
  static async registerPatient(data, reqContext = {}) {
    const { name, email, password, mobile, city, primaryHealthConcern, problemDuration, pastMedicalHistory } = data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email address is already registered.', 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      mobile,
      city,
      role: 'patient',
    });

    const profile = await PatientProfile.create({
      userId: user._id,
      primaryHealthConcern: primaryHealthConcern || '',
      problemDuration: problemDuration || '',
      pastMedicalHistory: pastMedicalHistory || '',
    });

    await AuditService.logUserAction({
      userId: user._id,
      role: 'patient',
      action: 'USER_REGISTER_PATIENT',
      ipAddress: reqContext.ip,
      userAgent: reqContext.userAgent,
    });

    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      city: user.city,
    });

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
      token,
    };
  }

  static async registerDoctor(data, reqContext = {}) {
    const {
      name,
      email,
      password,
      mobile,
      city,
      degree,
      specialization,
      experienceYears,
      hospitalClinic,
      serviceLocation,
      bio,
      consultationModes,
      consultationFee,
    } = data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email address is already registered.', 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      mobile,
      city,
      role: 'doctor',
    });

    const doctorProfile = await DoctorProfile.create({
      userId: user._id,
      degree,
      specialization,
      experienceYears: Number(experienceYears) || 0,
      city,
      hospitalClinic,
      serviceLocation,
      bio: bio || '',
      consultationModes: consultationModes || ['offline', 'online'],
      consultationFee: Number(consultationFee) || 500,
    });

    // Create default availability
    await Availability.create({
      doctorId: user._id,
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 30,
      onlineAvailable: (consultationModes || []).includes('online'),
      offlineAvailable: (consultationModes || []).includes('offline'),
    });

    await AuditService.logUserAction({
      userId: user._id,
      role: 'doctor',
      action: 'USER_REGISTER_DOCTOR',
      ipAddress: reqContext.ip,
      userAgent: reqContext.userAgent,
    });

    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      city: user.city,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
      },
      doctorProfile,
      token,
    };
  }

  static async login(email, password, reqContext = {}) {
    if (require('mongoose').connection.readyState !== 1) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials.', 401);
    }

    let profile = null;
    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ userId: user._id });
    }

    await AuditService.logUserAction({
      userId: user._id,
      role: user.role,
      action: 'USER_LOGIN',
      ipAddress: reqContext.ip,
      userAgent: reqContext.userAgent,
    });

    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      city: user.city,
    });

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
      token,
    };
  }

  static async getMe(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User account not found.', 404);
    }

    let profile = null;
    let availability = null;
    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ userId: user._id });
      availability = await Availability.findOne({ doctorId: user._id });
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
      ...(availability && { availability }),
    };
  }
}

module.exports = AuthService;
