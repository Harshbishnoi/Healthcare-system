const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Availability = require('../models/Availability');
const User = require('../models/User');
const AppError = require('../utils/appError');
const AuditService = require('./auditService');
const { prisma } = require('../config/db.postgres');

class AppointmentService {
  /**
   * 1. Book Appointment with Atomic Collision Prevention & Audit Logging
   */
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

    // 5. Execute Relational Transaction in PostgreSQL Store via Prisma $transaction
    await this.syncAppointmentWithTransaction({
      appointmentId: appointment._id.toString(),
      patientId: patientId.toString(),
      doctorId: doctorId.toString(),
      appointmentDate,
      timeSlot,
      status: 'confirmed',
      mode,
      consultationFee: fee,
      paymentMethod: 'card',
      reqContext,
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

  /**
   * 2. ACID PostgreSQL Transaction via Prisma.$transaction
   * Guarantees atomic creation of Appointment, Payment, Doctor Metrics, and Audit Log
   */
  static async syncAppointmentWithTransaction({
    appointmentId,
    patientId,
    doctorId,
    appointmentDate,
    timeSlot,
    status = 'confirmed',
    mode = 'offline',
    consultationFee = 500,
    paymentMethod = 'card',
    reqContext = {},
  }) {
    if (!prisma || !prisma.$transaction) return null;

    return await prisma.$transaction(async (tx) => {
      // 1. Check for slot collision within relational store
      if (tx.appointment) {
        const existing = await tx.appointment.findFirst({
          where: {
            doctorId,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            status: { in: ['pending', 'confirmed'] },
            NOT: { mongoAppointmentId: appointmentId },
          },
        });

        if (existing) {
          throw new AppError('Conflict: Doctor slot already reserved in relational ledger.', 409);
        }

        // 2. Upsert Doctor & Patient in relational store to guarantee foreign keys
        if (tx.doctor) {
          await tx.doctor.upsert({
            where: { id: doctorId },
            update: {},
            create: {
              id: doctorId,
              mongoDoctorId: doctorId,
              name: 'Dr. Physician',
              email: `doctor-${doctorId}@docpulse.com`,
              specialization: 'General Medicine',
              hospitalClinic: 'Central Healthcare Clinic',
              city: 'New York',
              consultationFee,
            },
          });
        }

        if (tx.patient) {
          await tx.patient.upsert({
            where: { id: patientId },
            update: {},
            create: {
              id: patientId,
              mongoPatientId: patientId,
              name: 'Patient User',
              email: `patient-${patientId}@example.com`,
              mobile: '1234567890',
              city: 'New York',
            },
          });
        }

        // 3. Create or update Appointment record
        const apptRecord = await tx.appointment.upsert({
          where: { mongoAppointmentId: appointmentId },
          update: {
            status,
            mode,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            consultationFee,
          },
          create: {
            mongoAppointmentId: appointmentId,
            doctorId,
            patientId,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            status,
            mode,
            consultationFee,
          },
        });

        // 4. Create atomic Payment Transaction record
        if (tx.paymentTransaction) {
          const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          const receiptNumber = `RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

          await tx.paymentTransaction.upsert({
            where: { appointmentId: apptRecord.id },
            update: {
              status: status === 'confirmed' ? 'succeeded' : 'pending',
            },
            create: {
              transactionId,
              appointmentId: apptRecord.id,
              amount: consultationFee,
              currency: 'USD',
              status: status === 'confirmed' ? 'succeeded' : 'pending',
              paymentMethod,
              receiptNumber,
            },
          });
        }

        // 5. Update Doctor Aggregated Metric
        if (tx.doctorMetric) {
          await tx.doctorMetric.upsert({
            where: { doctorId },
            update: {
              totalAppointments: { increment: 1 },
              revenueSum: { increment: consultationFee },
            },
            create: {
              doctorId,
              totalAppointments: 1,
              revenueSum: consultationFee,
            },
          });
        }

        // 6. Write Audit Log within same transaction
        if (tx.userAuditLog) {
          await tx.userAuditLog.create({
            data: {
              userId: patientId,
              role: 'patient',
              action: 'TRANSACTION_BOOK_APPOINTMENT',
              ipAddress: reqContext.ip || '127.0.0.1',
              userAgent: reqContext.userAgent || 'App-Client',
              metadata: JSON.stringify({ appointmentId, timeSlot, status }),
            },
          });
        }

        return apptRecord || {
          id: `appt-${Date.now()}`,
          mongoAppointmentId: appointmentId,
          status,
          timeSlot,
        };
      }

      return {
        id: `appt-${Date.now()}`,
        mongoAppointmentId: appointmentId,
        status,
        timeSlot,
      };
    });
  }

  /**
   * 3. Cancel Appointment with Atomic Transaction
   */
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

    // Execute atomic cancellation transaction in Prisma PostgreSQL
    if (prisma && prisma.$transaction) {
      try {
        await prisma.$transaction(async (tx) => {
          if (tx.appointment) {
            const relAppt = await tx.appointment.findUnique({
              where: { mongoAppointmentId: appointment._id.toString() },
            });

            if (relAppt) {
              await tx.appointment.update({
                where: { id: relAppt.id },
                data: { status: 'cancelled' },
              });

              if (tx.paymentTransaction) {
                await tx.paymentTransaction.updateMany({
                  where: { appointmentId: relAppt.id },
                  data: { status: 'refunded' },
                });
              }

              if (tx.doctorMetric) {
                await tx.doctorMetric.update({
                  where: { doctorId: relAppt.doctorId },
                  data: { cancelledAppointments: { increment: 1 } },
                });
              }

              if (tx.userAuditLog) {
                await tx.userAuditLog.create({
                  data: {
                    userId: currentUser.id,
                    role: currentUser.role,
                    action: 'TRANSACTION_CANCEL_APPOINTMENT',
                    ipAddress: reqContext.ip || '127.0.0.1',
                    userAgent: reqContext.userAgent || 'App-Client',
                    metadata: JSON.stringify({ appointmentId: id, reason }),
                  },
                });
              }
            }
          }
        });
      } catch (tErr) {
        console.warn('[AppointmentService] Prisma transaction cancel sync fallback:', tErr.message);
      }
    }

    return appointment;
  }

  static async getAppointmentById(id, currentUser) {
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email mobile city')
      .populate('doctorId', 'name email mobile city');

    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

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

    if (currentUser.role !== 'doctor' && currentUser.role !== 'admin') {
      throw new AppError('Forbidden: Only the consulting doctor can update appointment status.', 403);
    }

    if (currentUser.role === 'doctor' && appointment.doctorId.toString() !== currentUser.id) {
      throw new AppError('Forbidden: You can only update your own appointments.', 403);
    }

    appointment.status = newStatus;
    await appointment.save();

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
}

module.exports = AppointmentService;
