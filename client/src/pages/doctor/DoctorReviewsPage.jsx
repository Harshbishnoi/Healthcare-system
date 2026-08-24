import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ShieldCheck } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { doctorService } from '../../services/doctorService';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';

export const DoctorReviewsPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await doctorService.getDoctorReviews(user.id || user._id);
        if (res.success) {
          setReviews(res.data || []);
        }
      } catch (err) {
        console.warn('Reviews fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [user]);

  const avgRating = user?.profile?.ratingAvg || 5.0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Rating Metric Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Patient Reviews & Feedback</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified patient ratings and feedback from completed consultations
          </p>
        </div>

        <div className="flex items-center gap-4 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80">
          <div className="text-center">
            <p className="text-3xl font-black text-amber-600">
              {avgRating.toFixed(1)}
            </p>
            <div className="flex items-center gap-0.5 justify-center mt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.round(avgRating)
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-xs text-amber-900 font-medium">
            <p className="font-bold">Overall Practice Rating</p>
            <p className="text-[11px] text-amber-800/80">{reviews.length} Verified Reviews</p>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <LoadingSpinner fullPage label="Loading patient reviews..." />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No patient reviews yet"
          description="Patients can submit reviews and 1-5 star ratings after their consultations are marked as completed."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id || rev._id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {rev.patientName || 'Verified Patient'}
                  </h3>
                  {rev.patientCity && (
                    <p className="text-slate-400 text-[11px]">{rev.patientCity}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 font-bold text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{rev.rating}.0</span>
                </div>
              </div>

              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                "{rev.comment}"
              </p>

              <span className="text-[11px] text-slate-400 block text-right">
                {formatDate(rev.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
