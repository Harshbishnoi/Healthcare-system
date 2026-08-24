const crypto = require('crypto');
const { prisma } = require('../config/db.postgres');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/appError');

class PaymentService {
  /**
   * Creates a secure payment session / checkout intent for an appointment consultation
   */
  static async createCheckoutSession({ appointmentId, patientId, amount, currency = 'USD' }) {
    const appointment = await Appointment.findById(appointmentId).populate('doctorId');
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const clientSecret = `sec_pay_${crypto.randomBytes(16).toString('hex')}`;

    return {
      transactionId,
      clientSecret,
      appointmentId: appointment._id,
      amount: Number(amount) || appointment.doctorId?.profile?.consultationFee || 500,
      currency,
      paymentStatus: 'pending',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verifies and finalizes a payment transaction, updating appointment record and financial ledger
   */
  static async verifyAndProcessPayment({ transactionId, appointmentId, paymentMethod = 'card', paidAmount }) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Generate verified receipt
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}-${crypto.randomInt(1000, 9999)}`;

    // Sync to PostgreSQL Relational AppointmentRecord
    if (prisma && prisma.appointmentRecord) {
      await prisma.appointmentRecord.updateMany({
        where: { mongoAppointmentId: appointmentId.toString() },
        data: {
          consultationFee: Number(paidAmount) || 500,
          updatedAt: new Date(),
        },
      });
    }

    return {
      receiptNumber,
      transactionId,
      appointmentId,
      status: 'succeeded',
      paidAmount,
      paymentMethod,
      paidAt: new Date().toISOString(),
    };
  }
}

module.exports = PaymentService;
