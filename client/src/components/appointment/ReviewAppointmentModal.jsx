import React, { useState } from 'react';
import { Star, MessageSquare, Shield } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { reviewService } from '../../services/reviewService';

export const ReviewAppointmentModal = ({
  appointment,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const { showSuccess, showError } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appointment) return null;

  const doctorName = appointment.doctorId?.name || 'Doctor';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showError('Please write a brief comment describing your consultation experience.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        doctorId: appointment.doctorId?._id || appointment.doctorId,
        appointmentId: appointment._id,
        rating,
        comment,
        isAnonymous,
      };

      const res = await reviewService.createReview(payload);
      if (res.success) {
        showSuccess(`Thank you! Your review for ${doctorName} has been submitted.`);
        onClose();
        if (onReviewSubmitted) onReviewSubmitted(res.data);
      }
    } catch (err) {
      showError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rate & Review Consultation"
      subtitle={`Share feedback for ${doctorName} on ${appointment.appointmentDate}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star Rating Selector */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Rate Your Consultation Experience
          </p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      active
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300 fill-slate-100'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <span className="text-xs font-bold text-slate-700 mt-2">
            {rating === 5 && 'Outstanding • Highly Recommended'}
            {rating === 4 && 'Very Good • Thorough & Helpful'}
            {rating === 3 && 'Average Consultation'}
            {rating === 2 && 'Below Expectations'}
            {rating === 1 && 'Poor Experience'}
          </span>
        </div>

        {/* Review Comment Textarea */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Written Review & Feedback *
          </label>
          <textarea
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about the doctor's communication, treatment clarity, and overall visit experience..."
            className="block w-full rounded-2xl border border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 resize-none"
          />
        </div>

        {/* Anonymous Checkbox */}
        <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            id="anon-check"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 border-slate-300 cursor-pointer"
          />
          <label htmlFor="anon-check" className="text-xs text-slate-700 font-medium cursor-pointer">
            Post review anonymously (hide my full name on doctor profile)
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            icon={MessageSquare}
          >
            Submit Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};
