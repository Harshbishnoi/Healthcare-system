import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Pill,
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  FileText,
  ArrowRight,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { AppointmentStatusBadge } from '../../components/appointment/AppointmentStatusBadge';
import { PrescriptionViewerModal } from '../../components/patient/PrescriptionViewerModal';
import { ReviewAppointmentModal } from '../../components/appointment/ReviewAppointmentModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { patientService } from '../../services/patientService';
import { formatDate, formatTimeSlot } from '../../utils/formatters';

export const PatientDashboardPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [apptsRes, rxRes] = await Promise.all([
        patientService.getAppointments(),
        patientService.getPrescriptions(),
      ]);
      if (apptsRes.success) setAppointments(apptsRes.data || []);
      if (rxRes.success) setPrescriptions(rxRes.data || []);
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled'
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Welcome & Quick Stats Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
            DocPulse Health Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome back, {user?.name || 'Patient'}
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl leading-relaxed">
            {user?.profile?.primaryHealthConcern
              ? `Primary Concern on File: "${user.profile.primaryHealthConcern}"`
              : 'Complete your health intake profile to help doctors review your background prior to appointments.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/doctors">
            <Button variant="teal" size="md" icon={Search} className="shadow-lg">
              Book a Doctor
            </Button>
          </Link>
          <Link to="/patient/profile">
            <Button variant="outline" size="md" className="bg-white/10 text-white hover:bg-white/20 border-white/20">
              Edit Health Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{upcomingAppointments.length}</p>
            <p className="text-xs text-slate-500 font-medium">Upcoming Visits</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{prescriptions.length}</p>
            <p className="text-xs text-slate-500 font-medium">Active Prescriptions</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{pastAppointments.length}</p>
            <p className="text-xs text-slate-500 font-medium">Completed Consultations</p>
          </div>
        </div>
      </div>

      {/* 2. Upcoming Appointments Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">Upcoming Appointments</h2>
          </div>
          <Link to="/patient/appointments" className="text-xs font-bold text-sky-600 hover:underline">
            View All ({appointments.length})
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner size="sm" />
        ) : upcomingAppointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming visits scheduled"
            description="Find a specialist and book your in-person or video consultation in seconds."
            actionLabel="Find a Doctor Now"
            onAction={() => window.location.assign('/doctors')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAppointments.map((appt) => (
              <div
                key={appt._id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {appt.doctorId?.name || 'Dr. Physician'}
                    </h3>
                    <p className="text-xs text-slate-500">{appt.doctorId?.city}</p>
                  </div>
                  <AppointmentStatusBadge status={appt.status} />
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="font-semibold">{formatDate(appt.appointmentDate)}</span>
                  <span>•</span>
                  <span>{formatTimeSlot(appt.timeSlot)}</span>
                  <span>•</span>
                  <span className="capitalize font-medium text-sky-700">{appt.mode}</span>
                </div>

                <p className="text-xs text-slate-500 truncate">
                  <strong className="text-slate-700">Reason:</strong> {appt.reasonForVisit}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Recent Prescriptions & Medical Records */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">Recent Digital Prescriptions</h2>
          </div>
          <Link to="/patient/prescriptions" className="text-xs font-bold text-teal-600 hover:underline">
            View All ({prescriptions.length})
          </Link>
        </div>

        {prescriptions.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No prescriptions on file yet. Prescriptions issued by doctors after consultations will appear here.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.slice(0, 4).map((rx) => (
              <div
                key={rx._id}
                className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {rx.doctorId?.name || 'Dr. Physician'}
                    </h3>
                    <p className="text-[11px] text-teal-800 font-semibold">
                      Issued: {formatDate(rx.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPrescription(rx)}
                    icon={FileText}
                  >
                    View Rx
                  </Button>
                </div>

                <div className="text-xs text-slate-600">
                  <p className="font-semibold text-slate-700">Medications:</p>
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-600">
                    {rx.medications?.map((m, idx) => (
                      <li key={idx}>
                        <strong>{m.medicineName}</strong> - {m.dosage} ({m.frequency})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Past Appointments & Review CTA */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Past Consultations & Reviews</h2>
          </div>
        </div>

        {pastAppointments.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No completed past appointments yet.
          </p>
        ) : (
          <div className="space-y-3">
            {pastAppointments.slice(0, 5).map((appt) => (
              <div
                key={appt._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 gap-3 text-xs"
              >
                <div>
                  <h3 className="font-bold text-slate-900">
                    {appt.doctorId?.name || 'Practitioner'} •{' '}
                    <span className="text-slate-500 font-normal">{formatDate(appt.appointmentDate)}</span>
                  </h3>
                  <p className="text-slate-500 mt-0.5">Reason: {appt.reasonForVisit}</p>
                </div>

                <div className="flex items-center gap-2">
                  <AppointmentStatusBadge status={appt.status} />
                  {appt.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAppointmentForReview(appt)}
                      icon={Star}
                    >
                      Rate & Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prescription Viewer Modal */}
      {selectedPrescription && (
        <PrescriptionViewerModal
          prescription={selectedPrescription}
          isOpen={!!selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}

      {/* Review Modal */}
      {selectedAppointmentForReview && (
        <ReviewAppointmentModal
          appointment={selectedAppointmentForReview}
          isOpen={!!selectedAppointmentForReview}
          onClose={() => setSelectedAppointmentForReview(null)}
          onReviewSubmitted={() => fetchDashboardData()}
        />
      )}
    </div>
  );
};
