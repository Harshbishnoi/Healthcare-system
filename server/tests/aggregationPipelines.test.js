const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const DoctorProfile = require('../models/DoctorProfile');

const Consultation = require('../models/Consultation');
const MedicalRecord = require('../models/MedicalRecord');

describe('NoSQL (Mongo): Mongoose Aggregation Pipelines Tests', () => {
  const mockDoctorId = new mongoose.Types.ObjectId();
  const mockPatientId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    // Clean mock collections if active DB connection exists
  });

  describe('Appointment Schema Aggregation Pipelines', () => {
    it('should calculate doctor appointment metrics via $match, $group, and $project stages', async () => {
      const stats = await Appointment.getDoctorAppointmentStats(mockDoctorId);
      expect(Array.isArray(stats)).toBe(true);
    });

    it('should aggregate appointment distribution by mode via $group and $sort stages', async () => {
      const modeStats = await Appointment.getModeAnalytics();
      expect(Array.isArray(modeStats)).toBe(true);
    });

    it('should perform multi-stage $lookup joins to combine Appointment, Doctor, and Patient details', async () => {
      const details = await Appointment.getAppointmentsWithDetails({ status: 'confirmed' });
      expect(Array.isArray(details)).toBe(true);
    });
  });

  describe('Consultation & MedicalRecord Aggregation Pipelines', () => {
    it('should aggregate clinical diagnosis distribution via $group, $project, and $sort', async () => {
      const diagnosisStats = await Consultation.aggregateDiagnosisStats(mockDoctorId);
      expect(Array.isArray(diagnosisStats)).toBe(true);
      expect(diagnosisStats.length).toBeGreaterThan(0);
      expect(diagnosisStats[0]).toHaveProperty('diagnosis');
      expect(diagnosisStats[0]).toHaveProperty('caseCount');
    });

    it('should aggregate medical records breakdown by recordType with $sum and $round stages', async () => {
      const recordStats = await MedicalRecord.aggregatePatientRecordStats(mockPatientId);
      expect(Array.isArray(recordStats)).toBe(true);
      expect(recordStats.length).toBeGreaterThan(0);
      expect(recordStats[0]).toHaveProperty('recordType');
      expect(recordStats[0]).toHaveProperty('count');
    });
  });

  describe('Review Schema Aggregation Pipelines ($match, $group, $avg)', () => {
    it('should aggregate average rating and total review counts for a doctor', async () => {
      const ratingStats = await Review.calculateAverageRating(mockDoctorId);
      expect(ratingStats).toBeDefined();
      expect(ratingStats).toHaveProperty('doctorId');
      expect(ratingStats).toHaveProperty('averageRating');
      expect(ratingStats).toHaveProperty('totalReviews');
    });
  });

  describe('DoctorProfile Aggregation Pipelines ($match, $group, $sort, $project)', () => {
    it('should aggregate doctor distribution and average consultation fee by specialization', async () => {
      const specializationStats = await DoctorProfile.aggregateSpecializationStats();
      expect(Array.isArray(specializationStats)).toBe(true);
    });
  });

  describe('REST API Aggregation Analytics Endpoint', () => {
    it('GET /api/doctors/analytics/aggregation - should return 200 OK with aggregation metrics', async () => {
      const res = await request(app).get('/api/doctors/analytics/aggregation');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('specializations');
      expect(res.body.data).toHaveProperty('modeAnalytics');
    });
  });
});

