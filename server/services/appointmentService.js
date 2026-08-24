const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Availability = require('../models/Availability');
const User = require('../models/User');
const AppError = require('../utils/appError');
const AuditService = require('./auditService');

class AppointmentService {
  static async bookAppointment({
    patientId,
    doctorId,
    appointmentDate, // YYYY-MM-DD
    timeSlot,        // e.g. "10:00"
    mode = 'offline',
    reasonForVisit,
    intakeSummary = null,
  }, reqContext = {}) {
    // 1. Verify doctor exists and has doctor role
    const doctorUser = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctorUser) {
      throw new AppError('Doctor not found or invalid doctor ID.', 404);
    }

    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    const fee = doctorProfile?.consultationFee || 500;

    // 2. Verify doctor availability schedule
    const availability = await Availability.findOne({ doctorId });
    if (availability) {
      const dateObj = new Date(appointmentDate);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[dateObj.getDay()];

      if (!availability.workingDays.includes(dayName)) {
        throw new AppError(`Doctor is not available on ${dayName}s.`, 400);
      }

      if (mode === 'online' && !availability.onlineAvailable) {
        throw new AppError('Doctor does not offer online consultations.', 400);
      }
      if (mode === 'offline' && !availability.offlineAvailable) {
        throw new AppError('Doctor does not offer in-person/offline consultations.', 400);
      }
    }

    // 3. ATOMIC DOUBLE-BOOKING PREVENTION
    // Check if slot is already occupied by a non-cancelled appointment
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate,
      timeSlot,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (conflictingAppointment) {
      throw new AppError(
        'This appointment slot is already booked. Please choose another time slot or date.',
        409 // 409 Conflict
      );
    }

    // 4. Create appointment document in MongoDB
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate,
      timeSlot,
      mode,
      status: 'confirmed',
      reasonForVisit,
      intakeSummary,
      consultationFee: fee,
    });

    // 5. Synchronize with Relational PostgreSQL Store via Prisma
    await AuditService.syncAppointmentRecord({
      mongoAppointmentId: appointment._id,
      patientId,
      doctorId,
      appointmentDate,
      timeSlot,
      status: appointment.status,
      mode,
      consultationFee: fee,
    });

    // 6. Log audit entry
    await AuditService.logUserAction({
      userId: patientId,
      role: 'patient',
      action: 'BOOK_APPOINTMENT',
      ipAddress: reqContext.ip,
      userAgent: reqContext.userAgent,
      metadata: { appointmentId: appointment._id, doctorId, appointmentDate, timeSlot },
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email mobile city')
      .populate('doctorId', 'name email mobile city');

    return populatedAppointment;
  }

  static async getAppointmentById(id, currentUser) {
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email mobile city')
      .populate('doctorId', 'name email mobile city');

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    // Authorization check: only the patient, doctor, or admin can access
    const isPatient = currentUser.id === appointment.patientId?._id?.toString();
    const isDoctor = currentUser.id === appointment.doctorId?._id?.toString();
    const isAdmin = currentUser.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new AppError('Forbidden: You are not authorized to view this appointment.', 403);
    }

    return appointment;
  }

  static async updateStatus(id, newStatus, currentUser, reqContext = {}) {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    // Only doctor or admin can change status directly
    if (currentUser.role !== 'doctor' && currentUser.role !== 'admin') {
      throw new AppError('Forbidden: Only the consulting doctor can update appointment status.', 403);
    }

    if (currentUser.role === 'doctor' && appointment.doctorId.toString() !== currentUser.id) {
      throw new AppError('Forbidden: You can only update your own appointments.', 403);
    }

    appointment.status = newStatus;
    await appointment.save();

    // Sync status to PostgreSQL
    await AuditService.syncAppointmentRecord({
      mongoAppointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      timeSlot: appointment.timeSlot,
      status: newStatus,
      mode: appointment.mode,
      consultationFee: appointment.consultationFee,
    });

    await AuditService.logUserAction({
      userId: currentUser.id,
      role: currentUser.role,
      action: `APPOINTMENT_STATUS_${newStatus.toUpperCase()}`,
      ipAddress: reqContext.ip,
      userAgent: reqContext.userAgent,
      metadata: { appointmentId: appointment._id, newStatus },
    });

    return appointment;
  }

  static async cancelAppointment(id, reason, currentUser, reqContext = {}) {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    const isPatient = currentUser.id === appointment.patientId.toString();
    const isDoctor = currentUser.id === appointment.doctorId.toString();

    if (!isPatient && !isDoctor && currentUser.role !== 'admin') {
      throw new AppError('Forbidden: You do not have permission to cancel this appointment.', 403);
    }

    if (appointment.status === 'completed') {
      throw new AppError('Cannot cancel an already completed appointment.', 400);
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || 'Cancelled by user';
    appointment.cancelledBy = isPatient ? 'patient' : 'doctor';
    await appointment.save();

    // Sync to PostgreSQL
    await AuditService.syncAppointmentRecord({
      mongoAppointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      timeSlot: appointment.timeSlot,
      status: 'cancelled',
      mode: appointment.mode,
      consultationFee: appointment.consultationFee,
    });

    return appointment;
  }
}

module.exports = AppointmentService;
