import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Users,
  CheckCircle,
  FileCheck,
  XCircle,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { AppointmentStatusBadge } from '../../components/appointment/AppointmentStatusBadge';
import { ConsultationModal } from '../../components/appointment/ConsultationModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatTimeSlot } from '../../utils/formatters';

export const DoctorAppointmentsPage = () => {
  const { showSuccess, showError } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Modals state
  const [activeConsultationAppt, setActiveConsultationAppt] = useState(null);
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterDate) params.date = filterDate;

      const res = await doctorService.getDoctorAppointments(params);
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
  }, [filterStatus, filterDate]);

  const handleConfirmStatus = async (appointmentId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await appointmentService.updateStatus(appointmentId, newStatus);
      if (res.success) {
        showSuccess(`Appointment marked as ${newStatus}`);
        fetchAppointments();
      }
    } catch (err) {
      showError(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingAppt) return;
    try {
      const res = await appointmentService.cancelAppointment(
        cancellingAppt._id,
        'Cancelled by Doctor / Schedule Adjustment'
      );
      if (res.success) {
        showSuccess('Appointment cancelled.');
        setCancellingAppt(null);
        fetchAppointments();
      }
    } catch (err) {
      showError(err.message || 'Failed to cancel appointment');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Patient Appointments Schedule</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review incoming booking requests, verify patient concerns, and issue consultation records
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Date Filter Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-xl border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {filterDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterDate('')}
              className="text-xs"
            >
              Clear Date
            </Button>
          )}
        </div>
      </div>

      {/* Appointment Cards */}
      {loading ? (
        <LoadingSpinner fullPage label="Loading doctor appointments..." />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments scheduled"
          description="There are no appointments matching your active date or status filters."
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div
              key={appt._id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">
                    {appt.patientId?.name || 'Patient'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Mobile: {appt.patientId?.mobile || 'N/A'} • City: {appt.patientId?.city || 'N/A'}
                  </span>
                  <AppointmentStatusBadge status={appt.status} />
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700 flex-wrap">
                  <span className="font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                    {formatDate(appt.appointmentDate)}
                  </span>
                  <span className="font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                    {formatTimeSlot(appt.timeSlot)}
                  </span>
                  <span className="capitalize font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60">
                    {appt.mode === 'online' ? 'Video Telehealth' : 'In-Person Clinic'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900 mb-0.5">Reported Concern & Symptoms:</p>
                  <p>{appt.reasonForVisit}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                {appt.status === 'pending' && (
                  <Button
                    variant="teal"
                    size="sm"
                    onClick={() => handleConfirmStatus(appt._id, 'confirmed')}
                    icon={CheckCircle}
                  >
                    Accept Slot
                  </Button>
                )}

                {appt.status === 'confirmed' && (
                  <Button
                    variant="teal"
                    size="sm"
                    onClick={() => setActiveConsultationAppt(appt)}
                    icon={FileCheck}
                  >
                    Conduct Consultation
                  </Button>
                )}

                {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancellingAppt(appt)}
                    icon={XCircle}
                    className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Consultation Modal */}
      {activeConsultationAppt && (
        <ConsultationModal
          appointment={activeConsultationAppt}
          isOpen={!!activeConsultationAppt}
          onClose={() => setActiveConsultationAppt(null)}
          onConsultationSaved={() => fetchAppointments()}
        />
      )}

      {/* Cancel Dialog */}
      {cancellingAppt && (
        <ConfirmDialog
          isOpen={!!cancellingAppt}
          onClose={() => setCancellingAppt(null)}
          onConfirm={handleConfirmCancel}
          title="Cancel Patient Consultation"
          message={`Are you sure you want to cancel the appointment with ${cancellingAppt.patientId?.name} on ${formatDate(cancellingAppt.appointmentDate)} at ${formatTimeSlot(cancellingAppt.timeSlot)}?`}
          confirmLabel="Cancel Appointment"
          isDestructive={true}
        />
      )}
    </div>
  );
};
