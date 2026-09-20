const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { verifyAuth } = require('../middleware/authMiddleware');

// Generate Stripe Payment Intent (Returns 201 Created)
router.post('/create-intent', verifyAuth, PaymentController.createPaymentIntent);
router.post('/create-checkout-session', verifyAuth, PaymentController.createPaymentIntent);

// Verify and Settle Payment (Returns 200 OK)
router.post('/verify', verifyAuth, PaymentController.verifyPayment);

// Stripe Webhook Endpoint (Receives asynchronous events)
router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook);

// Process Refund (Authorized Doctor or Admin)
router.post('/refund', verifyAuth, PaymentController.refundPayment);

module.exports = router;
