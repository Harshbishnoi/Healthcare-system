const ReviewService = require('../services/reviewService');
const ApiResponse = require('../utils/apiResponse');

class ReviewController {
  static async createReview(req, res, next) {
    try {
      const { doctorId, appointmentId, rating, comment, isAnonymous } = req.body;
      const review = await ReviewService.createReview({
        patientId: req.user.id,
        doctorId,
        appointmentId,
        rating,
        comment,
        isAnonymous,
      });

      return ApiResponse.created(res, review, 'Doctor review submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getDoctorReviews(req, res, next) {
    try {
      const { id: doctorId } = req.params;
      const reviews = await ReviewService.getDoctorReviews(doctorId);
      return ApiResponse.success(res, reviews, 'Doctor reviews retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;
