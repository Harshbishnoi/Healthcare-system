const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { verifyAuth } = require('../middleware/authMiddleware');

router.post('/create-intent', verifyAuth, PaymentController.createPaymentIntent);
router.post('/verify', verifyAuth, PaymentController.verifyPayment);

module.exports = router;
