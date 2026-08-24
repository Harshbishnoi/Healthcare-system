const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User');
const AppError = require('../utils/appError');
const AuditService = require('./auditService');
const { prisma } = require('../config/db.postgres');

class ConsultationService {
  static async createConsultation({
    appointmentId,
    doctorId,
    consultationNotes,
    diagnosis,
    treatmentNotes,
    vitals,
    followUpDate,
    followUpInstructions,
    prescriptionData,
  }, reqContext = {}) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    if (appointment.doctorId.toString() !== doctorId.toString()) {
      throw new AppError('Forbidden: You can only conduct consultations for your own appointments.', 403);
    }

    // Check if consultation already recorded
    let consultation = await Consultation.findOne({ appointmentId });
    if (consultation) {
      throw new AppError('A consultation record has already been submitted for this appointment.', 409);
    }

    // Create consultation
    consultation = await Consultation.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId,
      consultationNotes,
      diagnosis,
      treatmentNotes,
      vitals: vitals || {},
      followUpDate: followUpDate || '',
      followUpInstructions: followUpInstructions || '',
    });

    let prescription = null;
    if (prescriptionData && prescriptionData.medications && prescriptionData.medications.length > 0) {
      prescription = await Prescription.create({
        consultationId: consultation._id,
        appointmentId,
        patientId: appointment.patientId,
        doctorId,
        medications: prescriptionData.medications,
        generalAdvice: prescriptionData.generalAdvice || '',
        dietaryRestrictions: prescriptionData.dietaryRestrictions || '',
      });
    }

    // Mark appointment as completed
    appointment.status = 'completed';
    await appointment.save();

    // Sync appointment completion to PostgreSQL
    await AuditService.syncAppointmentRecord({
      mongoAppointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      timeSlot: appointment.timeSlot,
      status: 'completed',
      mode: appointment.mode,
      consultationFee: appointment.consultationFee,
    });

    // Record in relational PostgreSQL ConsultationAudit
    try {
      if (prisma && prisma.consultationAudit) {
        const appointmentRel = await prisma.appointmentRecord.findUnique({
          where: { mongoAppointmentId: appointment._id.toString() },
        });

        if (appointmentRel) {
          await prisma.consultationAudit.create({
            data: {
              mongoConsultationId: consultation._id.toString(),
              appointmentRecordId: appointmentRel.id,
              doctorId: doctorId.toString(),
              patientId: appointment.patientId.toString(),
              diagnosisCategory: diagnosis.substring(0, 50),
              prescriptionCount: prescription?.medications?.length || 0,
              hasFollowUp: Boolean(followUpDate),
            },
          });
        }
      }
    } catch (auditErr) {
      console.warn('[ConsultationService] Prisma consultation audit note:', auditErr.message);
    }

    await AuditService.logUserAction({
      userId: doctorId,
      role: 'doctor',
      action: 'CREATE_CONSULTATION',
      ipAddress: reqContext.ip,
      userAgent: reqContext.userAgent,
      metadata: { consultationId: consultation._id, appointmentId },
    });

    return {
      consultation,
      prescription,
      appointment,
    };
  }

  static async createPrescription({
    appointmentId,
    patientId,
    doctorId,
    medications,
    generalAdvice,
    dietaryRestrictions,
  }) {
    const consultation = await Consultation.findOne({ appointmentId });
    if (!consultation) {
      throw new AppError('Consultation record required before issuing a standalone prescription.', 400);
    }

    if (consultation.doctorId.toString() !== doctorId.toString()) {
      throw new AppError('Forbidden: Only the consulting doctor can issue prescriptions.', 403);
    }

    const prescription = await Prescription.create({
      consultationId: consultation._id,
      appointmentId,
      patientId,
      doctorId,
      medications,
      generalAdvice: generalAdvice || '',
      dietaryRestrictions: dietaryRestrictions || '',
    });

    return prescription;
  }

  static async getPatientMedicalHistoryForDoctor(patientId) {
    const patientUser = await User.findById(patientId).select('-password');
    if (!patientUser) {
      throw new AppError('Patient not found.', 404);
    }

    const [profile, previousConsultations, previousPrescriptions] = await Promise.all([
      PatientProfile.findOne({ userId: patientId }),
      Consultation.find({ patientId }).populate('doctorId', 'name email city').sort({ createdAt: -1 }),
      Prescription.find({ patientId }).populate('doctorId', 'name email city').sort({ createdAt: -1 }),
    ]);

    return {
      patient: patientUser,
      profile,
      previousConsultations,
      previousPrescriptions,
    };
  }
}

module.exports = ConsultationService;
