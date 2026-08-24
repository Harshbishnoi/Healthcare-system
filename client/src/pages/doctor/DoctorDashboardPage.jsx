import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  Star,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Stethoscope,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { AppointmentStatusBadge } from '../../components/appointment/AppointmentStatusBadge';
import { ConsultationModal } from '../../components/appointment/ConsultationModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { doctorService } from '../../services/doctorService';
import { analyticsService } from '../../services/analyticsService';
import { formatDate, formatTimeSlot, formatCurrency } from '../../utils/formatters';

export const DoctorDashboardPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeConsultationAppt, setActiveConsultationAppt] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchDoctorData = async () => {
    setLoading(true);
    try {
      const [apptsRes, patientsRes, analyticsRes] = await Promise.all([
        doctorService.getDoctorAppointments(),
        doctorService.getDoctorPatients(),
        analyticsService.getDoctorAnalytics('me'),
      ]);

      if (apptsRes.success) setAppointments(apptsRes.data || []);
      if (patientsRes.success) setPatients(patientsRes.data || []);
      if (analyticsRes.success) setAnalytics(analyticsRes.data || {});
    } catch (err) {
      console.warn('Doctor dashboard fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const todayAppointments = appointments.filter((a) => a.appointmentDate === todayStr);
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );
  const completeness = user?.profile?.profileCompleteness || 85;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Doctor Welcome & Completeness Meter */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
            Doctor Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome, {user?.name || 'Dr. Practitioner'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
            {user?.profile?.specialization} • {user?.profile?.hospitalClinic || 'Clinic'} ({user?.city})
          </p>
        </div>

        {/* Completeness Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 w-full lg:w-72 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Profile Completeness</span>
            <span className="text-teal-300">{completeness}%</span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <Link
            to="/doctor/profile"
            className="text-[11px] text-teal-200 hover:text-white block text-right font-medium"
          >
            Update Profile & Bio →
          </Link>
        </div>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{todayAppointments.length}</p>
            <p className="text-xs text-slate-500 font-medium">Today's Visits</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{upcomingAppointments.length}</p>
            <p className="text-xs text-slate-500 font-medium">Upcoming Schedule</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{patients.length}</p>
            <p className="text-xs text-slate-500 font-medium">Total Patient Records</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {user?.profile?.ratingAvg ? user.profile.ratingAvg.toFixed(1) : '5.0'} ★
            </p>
            <p className="text-xs text-slate-500 font-medium">
              {user?.profile?.totalReviews || 0} Patient Reviews
            </p>
          </div>
        </div>
      </div>

      {/* 3. Today's Appointments Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              Today's Schedule ({todayAppointments.length})
            </h2>
          </div>
          <Link to="/doctor/appointments" className="text-xs font-bold text-teal-600 hover:underline">
            View All Schedule ({appointments.length})
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner size="sm" />
        ) : todayAppointments.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No consultations scheduled for today ({formatDate(todayStr)}).
          </p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((appt) => (
              <div
                key={appt._id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {appt.patientId?.name || 'Patient'}
                    </span>
                    <span className="text-slate-400">({appt.patientId?.mobile})</span>
                    <AppointmentStatusBadge status={appt.status} />
                  </div>
                  <p className="text-slate-600">
                    <strong>Time:</strong> {formatTimeSlot(appt.timeSlot)} •{' '}
                    <span className="capitalize font-semibold text-teal-700">{appt.mode}</span>
                  </p>
                  <p className="text-slate-500 truncate">
                    <strong>Chief Complaint:</strong> {appt.reasonForVisit}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                    <Button
                      variant="teal"
                      size="sm"
                      onClick={() => setActiveConsultationAppt(appt)}
                      icon={FileCheck}
                    >
                      Conduct Consultation
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Quick Actions & Availability Link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gradient-to-tr from-sky-50 to-teal-50 rounded-3xl border border-sky-100 space-y-3">
          <h3 className="text-base font-bold text-slate-900">Availability & Time Slots</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Update your weekly practice days, consultation hours, and slot durations to open booking windows for patients.
          </p>
          <Link to="/doctor/availability" className="inline-block">
            <Button variant="primary" size="sm">
              Manage Slot Schedule
            </Button>
          </Link>
        </div>

        <div className="p-6 bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 space-y-3">
          <h3 className="text-base font-bold text-slate-900">Authorized Patient Records</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Access medical histories, prior prescriptions, and consultation logs for patients under your clinical care.
          </p>
          <Link to="/doctor/patients" className="inline-block">
            <Button variant="outline" size="sm">
              Browse Patient Directory
            </Button>
          </Link>
        </div>
      </div>

      {/* Consultation Modal */}
      {activeConsultationAppt && (
        <ConsultationModal
          appointment={activeConsultationAppt}
          isOpen={!!activeConsultationAppt}
          onClose={() => setActiveConsultationAppt(null)}
          onConsultationSaved={() => fetchDoctorData()}
        />
      )}
    </div>
  );
};
