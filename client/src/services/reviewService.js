import api from './api';

export const reviewService = {
  createReview: async (payload) => {
    return api.post('/reviews', payload);
  },

  getDoctorReviews: async (doctorId) => {
    return api.get(`/reviews/doctor/${doctorId}`);
  },
};
