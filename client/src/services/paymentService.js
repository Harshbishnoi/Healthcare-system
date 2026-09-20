import api from './api';

export const paymentService = {
  createPaymentIntent: (data) => api.post('/payments/create-intent', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  refundPayment: (data) => api.post('/payments/refund', data),
};

export default paymentService;
