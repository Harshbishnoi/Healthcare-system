const request = require('supertest');
const app = require('../app');
const { generateToken } = require('../utils/jwtUtils');
const PaymentService = require('../services/paymentService');

describe('System & Integration: Payment Gateway Integration (Stripe)', () => {
  let patientToken;
  let doctorToken;

  beforeAll(() => {
    patientToken = generateToken({
      id: '507f1f77bcf86cd799439001',
      role: 'patient',
      email: 'patient.payment@example.com',
      name: 'Payment Test Patient',
    });

    doctorToken = generateToken({
      id: '507f1f77bcf86cd799439003',
      role: 'doctor',
      email: 'doctor.payment@docpulse.com',
      name: 'Dr. Payment Specialist',
    });
  });

  describe('Payment Intent Creation (Stripe)', () => {
    it('POST /api/payments/create-intent - should create a Stripe PaymentIntent and return 201 Created', async () => {
      const res = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: 'mock-appt-99001',
          amount: 500,
          currency: 'USD',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('transactionId');
      expect(res.body.data).toHaveProperty('clientSecret');
      expect(res.body.data.amount).toBe(500);
      expect(res.body.data.currency).toBe('USD');
      expect(res.body.data.paymentStatus).toBe('pending');
    });

    it('POST /api/payments/create-checkout-session - alias route should also return 201 Created', async () => {
      const res = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: 'mock-appt-99002',
          amount: 750,
          currency: 'USD',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(750);
    });

    it('should reject payment intent generation when unauthenticated with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/payments/create-intent')
        .send({
          appointmentId: 'mock-appt-99001',
          amount: 500,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Payment Verification & Receipt Settlement', () => {
    it('POST /api/payments/verify - should verify successful payment and generate receipt with 200 OK', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: 'mock-appt-99001',
          transactionId: 'pi_mock_12345_test',
          paidAmount: 500,
          paymentMethod: 'card',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('receiptNumber');
      expect(res.body.data.status).toBe('succeeded');
      expect(res.body.data.paidAmount).toBe(500);
    });

    it('should return 404 when verifying payment for a non-existent appointment', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: '507f1f77bcf86cd799439999', // Non-existent mongo ID
          transactionId: 'pi_mock_invalid',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Stripe Webhooks & Refunds', () => {
    it('POST /api/payments/webhook - should handle payment_intent.succeeded event with 200 OK', async () => {
      const mockEvent = {
        id: 'evt_test_webhook_1',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_intent_succ',
            amount: 50000,
            metadata: {
              appointmentId: 'mock-appt-99001',
            },
          },
        },
      };

      const res = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'valid_test_signature')
        .send(mockEvent);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      expect(res.body.eventType).toBe('payment_intent.succeeded');
    });

    it('POST /api/payments/refund - should process payment refund with 200 OK', async () => {
      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          paymentIntentId: 'pi_mock_refund_target',
          reason: 'customer_requested_cancellation',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('refundId');
      expect(res.body.data.status).toBe('succeeded');
    });
  });
});
