const AppointmentService = require('../services/appointmentService');
const ApiResponse = require('../utils/apiResponse');

class AppointmentController {
  static async createAppointment(req, res, next) {
    try {
      const { doctorId, appointmentDate, timeSlot, mode, reasonForVisit, intakeSummary } = req.body;
      const appointment = await AppointmentService.bookAppointment(
        {
          patientId: req.user.id,
          doctorId,
          appointmentDate,
          timeSlot,
          mode,
          reasonForVisit,
          intakeSummary,
        },
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      return ApiResponse.created(res, appointment, 'Appointment booked successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAppointmentById(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = await AppointmentService.getAppointmentById(id, req.user);
      return ApiResponse.success(res, appointment, 'Appointment retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await AppointmentService.updateStatus(id, status, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return ApiResponse.success(res, updated, `Appointment marked as ${status}`);
    } catch (error) {
      next(error);
    }
  }

  static async cancelAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const cancelled = await AppointmentService.cancelAppointment(id, reason, req.user, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return ApiResponse.success(res, cancelled, 'Appointment cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AppointmentController;
