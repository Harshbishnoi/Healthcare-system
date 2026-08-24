const AppError = require('../utils/appError');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');

/**
 * Ensures doctors can ONLY access patient health records if there is an existing
 * appointment or consultation relationship between them.
 */
const verifyDoctorPatientAccess = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const patientId = req.params.patientId || req.body.patientId || req.query.patientId;

    if (!patientId) {
      return next(new AppError('Patient ID is required for access verification.', 400));
    }

    // Patients can access their own records
    if (req.user.role === 'patient') {
      if (req.user.id !== patientId.toString()) {
        return next(
          new AppError('Forbidden: You can only access your own patient medical records.', 403)
        );
      }
      return next();
    }

    // If role is doctor, verify relationship in MongoDB
    if (req.user.role === 'doctor') {
      let hasAppointment = false;
      let hasConsultation = false;

      if (require('mongoose').connection.readyState === 1) {
        hasAppointment = await Appointment.exists({
          doctorId: doctorId,
          patientId: patientId,
        });

        hasConsultation = await Consultation.exists({
          doctorId: doctorId,
          patientId: patientId,
        });
      }

      if (!hasAppointment && !hasConsultation) {
        return next(
          new AppError(
            'Forbidden: You are not authorized to view this patient medical history without an active or past consultation relationship.',
            403
          )
        );
      }

      return next();
    }

    // Admins bypass
    if (req.user.role === 'admin') {
      return next();
    }

    return next(new AppError('Forbidden: Unauthorized access.', 403));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyDoctorPatientAccess,
};
