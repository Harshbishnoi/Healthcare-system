import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  Users,
  Search,
  XCircle,
  Star,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { AppointmentStatusBadge } from '../../components/appointment/AppointmentStatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ReviewAppointmentModal } from '../../components/appointment/ReviewAppointmentModal';
import { PrescriptionViewerModal } from '../../components/patient/PrescriptionViewerModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatTimeSlot, formatCurrency } from '../../utils/formatters';

export const PatientAppointmentsPage = () => {
  const { showSuccess, showError } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Cancel modal state
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Review modal state
  const [reviewingAppt, setReviewingAppt] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await patientService.getAppointments();
      if (res.success) {
        setAppointments(res.data || []);
      }
    } catch (err) {
      showError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    setIsCancelling(true);
    try {
      const res = await appointmentService.cancelAppointment(
        cancellingAppt._id,
        cancelReason || 'Cancelled by patient'
      );
      if (res.success) {
        showSuccess('Appointment cancelled successfully.');
        setCancellingAppt(null);
        setCancelReason('');
        fetchAppointments();
      }
    } catch (err) {
      showError(err.message || 'Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Booking CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Appointments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your scheduled, past, and completed clinical consultations
          </p>
        </div>

        <Link to="/doctors">
          <Button variant="primary" icon={Calendar} size="sm">
            Book New Appointment
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'all', label: `All (${appointments.length})` },
          {
            key: 'confirmed',
            label: `Confirmed (${appointments.filter((a) => a.status === 'confirmed').length})`,
          },
          {
            key: 'completed',
            label: `Completed (${appointments.filter((a) => a.status === 'completed').length})`,
          },
          {
            key: 'cancelled',
            label: `Cancelled (${appointments.filter((a) => a.status === 'cancelled').length})`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterStatus === tab.key
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <LoadingSpinner fullPage label="Loading appointments..." />
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description={
            filterStatus === 'all'
              ? 'You have not booked any appointments yet.'
              : `No appointments with status "${filterStatus}".`
          }
          actionLabel="Book a Doctor"
          onAction={() => window.location.assign('/doctors')}
        />
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appt) => (
            <div
              key={appt._id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {appt.doctorId?.name || 'Dr. Practitioner'}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    ({appt.doctorId?.city})
                  </span>
                  <AppointmentStatusBadge status={appt.status} />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    {formatDate(appt.appointmentDate)}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatTimeSlot(appt.timeSlot)}
                  </span>
                  <span className="flex items-center gap-1 text-sky-700 uppercase font-semibold">
                    {appt.mode === 'online' ? (
                      <>
                        <Video className="w-3.5 h-3.5" /> Video Call
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" /> In-Clinic
                      </>
                    )}
                  </span>
                  <span>Fee: {formatCurrency(appt.consultationFee || 500)}</span>
                </div>

                <p className="text-xs text-slate-600 truncate">
                  <strong className="text-slate-700">Reason:</strong> {appt.reasonForVisit}
                </p>

                {appt.cancellationReason && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
                    <strong>Cancellation Note:</strong> {appt.cancellationReason}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                {(appt.status === 'confirmed' || appt.status === 'pending') && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setCancellingAppt(appt)}
                    icon={XCircle}
                  >
                    Cancel Slot
                  </Button>
                )}

                {appt.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewingAppt(appt)}
                    icon={Star}
                  >
                    Review Doctor
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancellingAppt && (
        <ConfirmDialog
          isOpen={!!cancellingAppt}
          onClose={() => setCancellingAppt(null)}
          onConfirm={handleConfirmCancel}
          title="Cancel Scheduled Appointment"
          message={`Are you sure you want to cancel your consultation with ${cancellingAppt.doctorId?.name} on ${formatDate(cancellingAppt.appointmentDate)} at ${formatTimeSlot(cancellingAppt.timeSlot)}?`}
          confirmLabel="Yes, Cancel Appointment"
          isLoading={isCancelling}
          isDestructive={true}
        />
      )}

      {/* Review Modal */}
      {reviewingAppt && (
        <ReviewAppointmentModal
          appointment={reviewingAppt}
          isOpen={!!reviewingAppt}
          onClose={() => setReviewingAppt(null)}
          onReviewSubmitted={() => fetchAppointments()}
        />
      )}
    </div>
  );
};
