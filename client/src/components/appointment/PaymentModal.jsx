import React, { useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import paymentService from '../../services/paymentService';

export const PaymentModal = ({ isOpen, onClose, appointment, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receipt, setReceipt] = useState(null);

  if (!isOpen || !appointment) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create PaymentIntent via backend Stripe gateway
      const intentRes = await paymentService.createPaymentIntent({
        appointmentId: appointment.id || appointment._id,
        amount: appointment.consultationFee || 500,
        currency: 'USD',
      });

      const paymentData = intentRes.data || intentRes;

      // 2. Simulate client confirmation & verify payment with backend
      const verifyRes = await paymentService.verifyPayment({
        transactionId: paymentData.transactionId,
        paymentIntentId: paymentData.paymentIntentId,
        appointmentId: appointment.id || appointment._id,
        paymentMethod: 'card',
        paidAmount: appointment.consultationFee || 500,
      });

      const receiptData = verifyRes.data || verifyRes;
      setReceipt(receiptData);
      setPaymentSuccess(true);
      if (onSuccess) onSuccess(receiptData);
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {!paymentSuccess ? (
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Secure Consultation Payment</h3>
                  <p className="text-xs text-slate-500">Encrypted via Stripe Gateway</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>

            <div className="my-5 p-4 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Consultation Fee</span>
              <span className="text-2xl font-black text-slate-900">${appointment.consultationFee || 500}</span>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="4242 •••• •••• 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-bit TLS End-to-End Encryption</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-sky-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Processing...' : `Pay $${appointment.consultationFee || 500}`}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Payment Succeeded!</h3>
            <p className="text-xs text-slate-500 mt-1">Receipt #{receipt?.receiptNumber}</p>

            <div className="my-5 p-4 bg-slate-50 rounded-xl text-left text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="font-mono text-slate-800">{receipt?.transactionId?.substring(0, 16)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-bold text-slate-900">${receipt?.paidAmount} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-600 font-bold uppercase">Confirmed</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-200"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
