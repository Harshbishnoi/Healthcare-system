const AnalyticsService = require('../services/analyticsService');
const ApiResponse = require('../utils/apiResponse');

class AnalyticsController {
  static async getPlatformSummary(req, res, next) {
    try {
      const summary = await AnalyticsService.getPlatformSummary();
      return ApiResponse.success(res, summary, 'Relational platform analytics retrieved');
    } catch (error) {
      next(error);
    }
  }

  static async getDoctorAnalytics(req, res, next) {
    try {
      const { doctorId } = req.params;
      const targetId = doctorId === 'me' ? req.user.id : doctorId;
      const stats = await AnalyticsService.getDoctorAnalytics(targetId);
      return ApiResponse.success(res, stats, 'Doctor practice analytics retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AnalyticsController;
