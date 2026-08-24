import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  Users,
  Video,
  Activity,
  Heart,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { DoctorCard } from '../../components/doctor/DoctorCard';
import { BookAppointmentModal } from '../../components/appointment/BookAppointmentModal';
import { AiSearchAssistantDrawer } from '../../components/ai/AiSearchAssistantDrawer';
import { doctorService } from '../../services/doctorService';
import { analyticsService } from '../../services/analyticsService';
import { SPECIALIZATIONS } from '../../utils/constants';

export const HomePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [platformMetrics, setPlatformMetrics] = useState(null);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, metricsRes] = await Promise.all([
          doctorService.getDoctors({ limit: 4 }),
          analyticsService.getPlatformSummary(),
        ]);
        if (docsRes.success) setFeaturedDoctors(docsRes.data || []);
        if (metricsRes.success) setPlatformMetrics(metricsRes.data?.metrics);
      } catch (e) {
        console.warn('Home fetch notice:', e.message);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/doctors');
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-slate-50 pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-bold tracking-wide animate-fade-in">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>DIRECT DOCTOR–PATIENT HEALTHCARE ECOSYSTEM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Find the Right Doctor for Your{' '}
            <span className="bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">
              Health Concern
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Search verified specialists by disease, city, or symptoms. Book instant online and clinic appointments with zero double-booking conflicts.
          </p>

          {/* Hero Search Box */}
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleHeroSearch}
              className="p-2 sm:p-3 bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col sm:flex-row gap-2 items-center"
            >
              <div className="flex-1 w-full pl-3">
                <Input
                  icon={Search}
                  placeholder="Enter health concern, disease, doctor name, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 shadow-none focus:ring-0 text-base"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="teal"
                  onClick={() => setAiDrawerOpen(true)}
                  icon={Sparkles}
                  className="w-full sm:w-auto whitespace-nowrap text-xs"
                >
                  AI Matcher
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto px-6 whitespace-nowrap"
                >
                  Search Doctors
                </Button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500 flex-wrap">
              <span className="font-semibold text-slate-700">Popular:</span>
              {['Cardiology', 'Dermatology', 'General Medicine', 'Pediatrics'].map((spec) => (
                <Link
                  key={spec}
                  to={`/doctors?specialization=${encodeURIComponent(spec)}`}
                  className="bg-slate-100 hover:bg-sky-50 hover:text-sky-700 px-3 py-1 rounded-full transition-colors font-medium text-slate-600"
                >
                  {spec}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Platform Metrics Banner */}
          {platformMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
                <p className="text-2xl font-black text-sky-600">
                  {platformMetrics.activeDoctors || '10+'}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Verified Doctors</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
                <p className="text-2xl font-black text-teal-600">
                  {platformMetrics.totalBookings || '50+'}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Appointments Booked</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
                <p className="text-2xl font-black text-indigo-600">100%</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Direct Care Access</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm text-center">
                <p className="text-2xl font-black text-amber-600">4.9 ★</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Patient Satisfaction</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Specializations Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Explore Medical Specialties</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Connect with top certified practitioners across primary and specialized fields
            </p>
          </div>
          <Link to="/doctors">
            <Button variant="outline" size="sm" icon={ArrowRight}>
              View All Doctors
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {SPECIALIZATIONS.filter((s) => s !== 'All Specializations').map((spec) => (
            <Link
              key={spec}
              to={`/doctors?specialization=${encodeURIComponent(spec)}`}
              className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-sky-400 hover:shadow-md transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors mb-3">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                {spec}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Explore doctors →</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Doctors Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Top-Rated Practitioners</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Verified clinical experts available for consultation
            </p>
          </div>
          <Link to="/doctors">
            <Button variant="ghost" size="sm" icon={ArrowRight}>
              Explore Full Directory
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredDoctors.map((doc) => (
            <DoctorCard
              key={doc.id || doc.doctorId}
              doctor={doc}
              onBookClick={(d) => setSelectedDoctorForBooking(d)}
            />
          ))}
        </div>
      </section>

      {/* 4. AI & Platform Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Safe Healthcare AI Assistance</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Intelligent Symptom Matching & Clinical Intake Summaries
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed">
              Describe your symptoms in natural language. Our safe AI helps you find the right specialist and prepares a structured intake summary for your doctor before your visit.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Zero AI Diagnoses — Strict physician responsibility</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Structured questions to ask your doctor during your visit</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Real-time appointment slot booking with double-booking prevention</span>
              </li>
            </ul>

            <Button
              variant="teal"
              size="lg"
              onClick={() => setAiDrawerOpen(true)}
              icon={Sparkles}
            >
              Try AI Doctor Matcher Now
            </Button>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <span className="text-xs font-semibold text-teal-400">DocPulse Clinical Safety</span>
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>Doctor-Patient Privilege:</strong> Doctors only access patient health records when an authorized appointment or consultation exists.
              </p>
              <p>
                <strong>Verified Prescriptions:</strong> Digital prescriptions are directly issued by the consulting physician with dosage schedules and instructions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {selectedDoctorForBooking && (
        <BookAppointmentModal
          doctor={selectedDoctorForBooking}
          isOpen={!!selectedDoctorForBooking}
          onClose={() => setSelectedDoctorForBooking(null)}
        />
      )}

      {/* AI Assistant Drawer */}
      <AiSearchAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        onApplySpecialization={(spec, city) => {
          navigate(
            `/doctors?specialization=${encodeURIComponent(spec)}&city=${encodeURIComponent(city || '')}`
          );
        }}
      />
    </div>
  );
};
