const ConsultationService = require('../services/consultationService');
const ApiResponse = require('../utils/apiResponse');

class ConsultationController {
  static async createConsultation(req, res, next) {
    try {
      const { id: appointmentId } = req.params;
      const {
        consultationNotes,
        diagnosis,
        treatmentNotes,
        vitals,
        followUpDate,
        followUpInstructions,
        prescription,
      } = req.body;

      const result = await ConsultationService.createConsultation(
        {
          appointmentId,
          doctorId: req.user.id,
          consultationNotes,
          diagnosis,
          treatmentNotes,
          vitals,
          followUpDate,
          followUpInstructions,
          prescriptionData: prescription,
        },
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      return ApiResponse.created(res, result, 'Consultation record created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createPrescription(req, res, next) {
    try {
      const { patientId } = req.params;
      const { appointmentId, medications, generalAdvice, dietaryRestrictions } = req.body;

      const prescription = await ConsultationService.createPrescription({
        appointmentId,
        patientId,
        doctorId: req.user.id,
        medications,
        generalAdvice,
        dietaryRestrictions,
      });

      return ApiResponse.created(res, prescription, 'Prescription issued successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getPatientMedicalHistory(req, res, next) {
    try {
      const { patientId } = req.params;
      const history = await ConsultationService.getPatientMedicalHistoryForDoctor(patientId);
      return ApiResponse.success(res, history, 'Authorized patient medical history retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ConsultationController;
