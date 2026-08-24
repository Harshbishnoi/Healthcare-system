import api from './api';

export const aiService = {
  generateIntakeSummary: async (payload) => {
    return api.post('/ai/intake-summary', payload);
  },

  searchDoctorAssistant: async (payload) => {
    return api.post('/ai/search-assistant', payload);
  },
};

export const analyticsService = {
  getPlatformSummary: async () => {
    return api.get('/analytics/platform-summary');
  },

  getDoctorAnalytics: async (doctorId = 'me') => {
    return api.get(`/analytics/doctor/${doctorId}`);
  },
};
