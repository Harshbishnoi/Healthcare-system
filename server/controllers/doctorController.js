const DoctorService = require('../services/doctorService');
const ApiResponse = require('../utils/apiResponse');

class DoctorController {
  static async getDoctors(req, res, next) {
    try {
      const { city, specialization, mode, search, page, limit } = req.query;
      const result = await DoctorService.searchDoctors({
        city,
        specialization,
        mode,
        search,
        page,
        limit,
      });
      return ApiResponse.success(res, result.doctors, 'Doctors retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getDoctorById(req, res, next) {
    try {
      const { id } = req.params;
      const { date } = req.query;
      const doctor = await DoctorService.getDoctorById(id, date);
      return ApiResponse.success(res, doctor, 'Doctor profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const updatedProfile = await DoctorService.updateDoctorProfile(req.user.id, req.body);
      return ApiResponse.success(res, updatedProfile, 'Doctor profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateAvailability(req, res, next) {
    try {
      const updatedAvailability = await DoctorService.updateAvailability(req.user.id, req.body);
      return ApiResponse.success(res, updatedAvailability, 'Doctor availability updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getDoctorAppointments(req, res, next) {
    try {
      const { status, date } = req.query;
      const appointments = await DoctorService.getDoctorAppointments(req.user.id, { status, date });
      return ApiResponse.success(res, appointments, 'Appointments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getDoctorPatients(req, res, next) {
    try {
      const patients = await DoctorService.getDoctorPatients(req.user.id);
      return ApiResponse.success(res, patients, 'Doctor patients list retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DoctorController;
