import api from './api';

export const authService = {
  registerPatient: async (payload) => {
    return api.post('/auth/register/patient', payload);
  },

  registerDoctor: async (payload) => {
    return api.post('/auth/register/doctor', payload);
  },

  login: async (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  getMe: async () => {
    return api.get('/auth/me');
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('docpulse_token');
      localStorage.removeItem('docpulse_user');
    }
  },
};
