const PaymentService = require('../services/paymentService');
const { sendSuccess } = require('../utils/apiResponse');

class PaymentController {
  static async createPaymentIntent(req, res, next) {
    try {
      const { appointmentId, amount, currency } = req.body;
      const result = await PaymentService.createCheckoutSession({
        appointmentId,
        patientId: req.user.id,
        amount,
        currency,
      });

      sendSuccess(res, result, 'Payment intent generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(req, res, next) {
    try {
      const { transactionId, appointmentId, paymentMethod, paidAmount } = req.body;
      const receipt = await PaymentService.verifyAndProcessPayment({
        transactionId,
        appointmentId,
        paymentMethod,
        paidAmount,
      });

      sendSuccess(res, receipt, 'Payment verified and processed successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PaymentController;
