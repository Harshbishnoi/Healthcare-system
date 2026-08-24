import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  GraduationCap,
  Briefcase,
  Star,
  Video,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  MessageSquare,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BookAppointmentModal } from '../../components/appointment/BookAppointmentModal';
import { doctorService } from '../../services/doctorService';
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters';

export const DoctorDetailPage = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const res = await doctorService.getDoctorById(id);
        if (res.success && res.data) {
          setDoctor(res.data);
        } else {
          setError('Doctor profile not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load doctor profile');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) return <LoadingSpinner fullPage label="Loading practitioner profile..." />;

  if (error || !doctor) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Doctor Profile Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'The requested doctor is unavailable.'}</p>
        <Link to="/doctors">
          <Button variant="primary" size="sm">
            Back to Doctor Directory
          </Button>
        </Link>
      </div>
    );
  }

  const hasOnline = doctor.consultationModes?.includes('online');
  const hasOffline = doctor.consultationModes?.includes('offline');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back Link */}
      <Link
        to="/doctors"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Doctors</span>
      </Link>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shrink-0 shadow-lg shadow-sky-600/20">
              {getInitials(doctor.name)}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {doctor.name}
                </h1>
                <CheckCircle className="w-5 h-5 text-sky-500 shrink-0" title="Verified Doctor" />
              </div>
              <p className="text-sm font-bold text-sky-600">{doctor.specialization}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/60">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  {doctor.ratingAvg > 0 ? doctor.ratingAvg.toFixed(1) : 'New'} ({doctor.totalReviews} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {doctor.experienceYears} Years Clinical Experience
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {doctor.city}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:items-end gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-400 font-medium">Consultation Fee</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(doctor.consultationFee || 500)}
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-md shadow-sky-600/20"
              onClick={() => setBookingModalOpen(true)}
              icon={Calendar}
            >
              Book Appointment
            </Button>
          </div>
        </div>

        {/* Doctor Badges & Modes */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 flex-wrap">
          {hasOffline && (
            <Badge variant="teal" size="md">
              <Users className="w-3.5 h-3.5" /> In-Person Clinic Visits Available
            </Badge>
          )}
          {hasOnline && (
            <Badge variant="sky" size="md">
              <Video className="w-3.5 h-3.5" /> Video Consultations Available
            </Badge>
          )}
          <Badge variant="slate" size="md">
            <GraduationCap className="w-3.5 h-3.5" /> {doctor.degree}
          </Badge>
        </div>
      </div>

      {/* Grid: Details, Practice Location & Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Bio, Clinic info & Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* About / Bio */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-900">About Practitioner</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {doctor.bio ||
                'Dedicated certified physician committed to evidence-based healthcare, empathetic patient communication, and comprehensive treatment plans.'}
            </p>
          </div>

          {/* Hospital & Clinic Details */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Practice Location & Clinic</h3>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">{doctor.hospitalClinic}</p>
                  <p className="text-xs text-slate-500">{doctor.serviceLocation}</p>
                  <p className="text-xs text-slate-500">{doctor.city}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Reviews Section */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">Patient Reviews</h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {doctor.reviews?.length || 0} Verified Reviews
              </span>
            </div>

            {(!doctor.reviews || doctor.reviews.length === 0) ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No patient reviews yet for this doctor.
              </p>
            ) : (
              <div className="space-y-4">
                {doctor.reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {rev.isAnonymous ? 'Verified Patient' : rev.patientId?.name || 'Patient'}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{rev.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {formatDate(rev.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Availability & Instant Schedule Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Consultation Schedule</span>
            </h3>

            {doctor.availability ? (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100">
                  <p className="font-bold text-sky-900 mb-1">Working Days:</p>
                  <p className="text-sky-800">
                    {doctor.availability.workingDays?.join(', ') || 'Monday - Friday'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800 mb-1">Consultation Hours:</p>
                  <p className="text-slate-700">
                    {doctor.availability.workingHours?.start || '09:00'} -{' '}
                    {doctor.availability.workingHours?.end || '17:00'}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Instant slot confirmation with double-booking lock.</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Regular working hours Monday to Friday.</p>
            )}

            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={() => setBookingModalOpen(true)}
              icon={Calendar}
            >
              Book Appointment Now
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && (
        <BookAppointmentModal
          doctor={doctor}
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
        />
      )}
    </div>
  );
};
