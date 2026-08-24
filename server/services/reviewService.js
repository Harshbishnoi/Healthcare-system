const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const AppError = require('../utils/appError');
const { prisma } = require('../config/db.postgres');

class ReviewService {
  static async createReview({
    patientId,
    doctorId,
    appointmentId,
    rating,
    comment,
    isAnonymous = false,
  }) {
    // 1. Verify appointment exists and is completed
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found.', 404);
    }

    if (appointment.patientId.toString() !== patientId.toString()) {
      throw new AppError('Forbidden: You can only review appointments you attended.', 403);
    }

    if (appointment.status !== 'completed') {
      throw new AppError('Reviews can only be submitted for completed consultations.', 400);
    }

    // 2. Check if already reviewed
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      throw new AppError('You have already submitted a review for this appointment.', 409);
    }

    // 3. Create review
    const review = await Review.create({
      doctorId,
      patientId,
      appointmentId,
      rating: Number(rating),
      comment,
      isAnonymous,
    });

    // 4. Recalculate doctor rating and total reviews in MongoDB
    const allReviews = await Review.find({ doctorId });
    const totalReviews = allReviews.length;
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await DoctorProfile.findOneAndUpdate(
      { userId: doctorId },
      {
        ratingAvg: Math.round(avgRating * 10) / 10,
        totalReviews,
      }
    );

    // 5. Update PostgreSQL DoctorMetric
    try {
      if (prisma && prisma.doctorMetric) {
        await prisma.doctorMetric.upsert({
          where: { doctorId: doctorId.toString() },
          update: {
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: totalReviews,
          },
          create: {
            doctorId: doctorId.toString(),
            averageRating: Math.round(avgRating * 10) / 10,
            reviewCount: totalReviews,
          },
        });
      }
    } catch (e) {
      console.warn('[ReviewService] Prisma metric update notice:', e.message);
    }

    return review;
  }

  static async getDoctorReviews(doctorId) {
    const reviews = await Review.find({ doctorId })
      .populate('patientId', 'name city avatar')
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      patientName: r.isAnonymous ? 'Verified Patient' : (r.patientId?.name || 'Patient'),
      patientCity: r.isAnonymous ? '' : (r.patientId?.city || ''),
    }));

    return formattedReviews;
  }
}

module.exports = ReviewService;
