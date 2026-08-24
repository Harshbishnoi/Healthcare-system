const AiService = require('../services/aiService');
const ApiResponse = require('../utils/apiResponse');

class AiController {
  static async generateIntakeSummary(req, res, next) {
    try {
      const { healthConcern, duration, medicalHistory } = req.body;
      const summary = await AiService.generateIntakeSummary({
        healthConcern,
        duration,
        medicalHistory,
      });

      return ApiResponse.success(res, summary, 'Patient intake summary organized by AI');
    } catch (error) {
      next(error);
    }
  }

  static async searchDoctorAssistant(req, res, next) {
    try {
      const { query, city } = req.body;
      const result = await AiService.searchDoctorAssistant({
        query,
        city,
      });

      return ApiResponse.success(res, result, 'Doctor search recommendations generated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AiController;
