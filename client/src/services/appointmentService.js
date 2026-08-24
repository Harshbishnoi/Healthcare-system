import api from './api';

export const appointmentService = {
  bookAppointment: async (payload) => {
    return api.post('/appointments', payload);
  },

  getAppointmentById: async (id) => {
    return api.get(`/appointments/${id}`);
  },

  updateStatus: async (id, status) => {
    return api.patch(`/appointments/${id}/status`, { status });
  },

  cancelAppointment: async (id, reason) => {
    return api.post(`/appointments/${id}/cancel`, { reason });
  },

  createConsultation: async (appointmentId, payload) => {
    return api.post(`/appointments/${appointmentId}/consultation`, payload);
  },
};
