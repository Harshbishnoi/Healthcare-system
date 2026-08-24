import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Stethoscope,
  Calendar,
  Clock,
  Users,
  UserCheck,
  Star,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';

export const DoctorLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Doctor Dashboard', path: '/doctor/dashboard', icon: Stethoscope },
    { label: 'Patient Schedule', path: '/doctor/appointments', icon: Calendar },
    { label: 'Manage Availability', path: '/doctor/availability', icon: Clock },
    { label: 'My Patients & History', path: '/doctor/patients', icon: Users },
    { label: 'Patient Reviews', path: '/doctor/reviews', icon: Star },
    { label: 'Professional Profile', path: '/doctor/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-bold text-slate-800">Doctor Workspace Menu</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`w-full md:w-64 bg-white rounded-3xl border border-slate-200/90 p-4 shadow-sm h-fit space-y-4 ${
            sidebarOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="p-3 bg-gradient-to-tr from-sky-50 to-teal-50 rounded-2xl border border-sky-100">
            <p className="text-xs text-sky-700 font-semibold uppercase tracking-wider">
              Practitioner Portal
            </p>
            <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {user?.name || 'Dr. Practitioner'}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              {user?.profile?.specialization || 'Specialist'} • {user?.city}
            </p>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Doctor Workspace */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
