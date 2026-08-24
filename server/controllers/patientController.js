const PatientService = require('../services/patientService');
const ApiResponse = require('../utils/apiResponse');

class PatientController {
  static async getMe(req, res, next) {
    try {
      const data = await PatientService.getPatientProfile(req.user.id);
      return ApiResponse.success(res, data, 'Patient profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const updated = await PatientService.updatePatientProfile(req.user.id, req.body);
      return ApiResponse.success(res, updated, 'Patient health profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAppointments(req, res, next) {
    try {
      const appointments = await PatientService.getPatientAppointments(req.user.id);
      return ApiResponse.success(res, appointments, 'Appointments retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getPrescriptions(req, res, next) {
    try {
      const prescriptions = await PatientService.getPatientPrescriptions(req.user.id);
      return ApiResponse.success(res, prescriptions, 'Prescriptions retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getMedicalHistory(req, res, next) {
    try {
      const history = await PatientService.getPatientMedicalHistory(req.user.id);
      return ApiResponse.success(res, history, 'Medical history retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientController;
