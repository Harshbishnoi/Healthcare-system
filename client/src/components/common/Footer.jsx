import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, HeartHandshake, PhoneCall } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-md">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Doc<span className="text-sky-400">Pulse</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering direct doctor-patient connections. Discover verified medical specialists, book appointments with real-time slot verification, and manage prescriptions safely.
            </p>
          </div>

          {/* Patient Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              For Patients
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/doctors" className="hover:text-white transition-colors">
                  Find a Doctor
                </Link>
              </li>
              <li>
                <Link to="/patient/dashboard" className="hover:text-white transition-colors">
                  Health Intake Portal
                </Link>
              </li>
              <li>
                <Link to="/patient/appointments" className="hover:text-white transition-colors">
                  Track Appointments
                </Link>
              </li>
              <li>
                <Link to="/patient/prescriptions" className="hover:text-white transition-colors">
                  Prescriptions & Records
                </Link>
              </li>
            </ul>
          </div>

          {/* Doctor Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              For Healthcare Providers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/register/doctor" className="hover:text-white transition-colors">
                  Doctor Registration
                </Link>
              </li>
              <li>
                <Link to="/doctor/dashboard" className="hover:text-white transition-colors">
                  Practitioner Workspace
                </Link>
              </li>
              <li>
                <Link to="/doctor/availability" className="hover:text-white transition-colors">
                  Slot & Calendar Management
                </Link>
              </li>
              <li>
                <Link to="/doctor/appointments" className="hover:text-white transition-colors">
                  Consultation Records
                </Link>
              </li>
            </ul>
          </div>

          {/* Medical Safety Disclaimer */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Medical Safety Notice</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              DocPulse AI features assist strictly with organizing symptom information and discovering specialties. <strong>AI never diagnoses, prescribes, or replaces medical professionals.</strong> In emergencies, call your local emergency services immediately.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} DocPulse Healthcare Systems. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Doctor–Patient Direct Healthcare Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
