const PaymentService = require('../services/paymentService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

class PaymentController {
  /**
   * 1. Generate Stripe Payment Intent / Checkout Session (Returns 201 Created)
   */
  static createPaymentIntent = catchAsync(async (req, res) => {
    const { appointmentId, amount, currency } = req.body;
    const result = await PaymentService.createCheckoutSession({
      appointmentId,
      patientId: req.user?.id || '507f1f77bcf86cd799439001',
      amount,
      currency,
    });

    return ApiResponse.success(res, result, 'Payment intent generated successfully', 201);
  });

  /**
   * 2. Verify and Settle Payment (Returns 200 OK)
   */
  static verifyPayment = catchAsync(async (req, res) => {
    const { transactionId, paymentIntentId, appointmentId, paymentMethod, paidAmount } = req.body;
    const receipt = await PaymentService.verifyAndProcessPayment({
      transactionId,
      paymentIntentId,
      appointmentId,
      paymentMethod,
      paidAmount,
    });

    return ApiResponse.success(res, receipt, 'Payment verified and processed successfully', 200);
  });

  /**
   * 3. Handle Stripe Webhook Events
   */
  static handleWebhook = catchAsync(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const result = await PaymentService.handleStripeWebhook(req.body, signature);
    return res.status(200).json(result);
  });

  /**
   * 4. Process Refund
   */
  static refundPayment = catchAsync(async (req, res) => {
    const { paymentIntentId, reason } = req.body;
    const result = await PaymentService.refundPayment({
      paymentIntentId,
      reason,
    });

    return ApiResponse.success(res, result, 'Refund processed successfully', 200);
  });
}

module.exports = PaymentController;
