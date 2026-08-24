import api from './api';

export const doctorService = {
  getDoctors: async (params = {}) => {
    return api.get('/doctors', { params });
  },

  getDoctorById: async (id, date = null) => {
    return api.get(`/doctors/${id}`, { params: { date } });
  },

  updateProfile: async (payload) => {
    return api.patch('/doctors/me', payload);
  },

  updateAvailability: async (payload) => {
    return api.put('/doctors/me/availability', payload);
  },

  getDoctorAppointments: async (params = {}) => {
    return api.get('/doctors/me/appointments', { params });
  },

  getDoctorPatients: async () => {
    return api.get('/doctors/me/patients');
  },

  getDoctorReviews: async (doctorId) => {
    return api.get(`/doctors/${doctorId}/reviews`);
  },
};
