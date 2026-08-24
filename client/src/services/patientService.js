import api from './api';

export const patientService = {
  getProfile: async () => {
    return api.get('/patients/me');
  },

  updateProfile: async (payload) => {
    return api.patch('/patients/me', payload);
  },

  getAppointments: async () => {
    return api.get('/patients/me/appointments');
  },

  getPrescriptions: async () => {
    return api.get('/patients/me/prescriptions');
  },

  getMedicalHistory: async () => {
    return api.get('/patients/me/medical-history');
  },

  getPatientHistoryForDoctor: async (patientId) => {
    return api.get(`/patients/${patientId}/medical-history`);
  },
};
