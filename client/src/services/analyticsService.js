import api from './api';

export const analyticsService = {
  getPlatformSummary: async () => {
    return api.get('/analytics/platform-summary');
  },

  getDoctorAnalytics: async (doctorId = 'me') => {
    return api.get(`/analytics/doctor/${doctorId}`);
  },
};
