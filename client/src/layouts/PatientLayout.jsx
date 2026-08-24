import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Pill,
  User,
  Search,
  Activity,
  Sparkles,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/common/Navbar';
import { AiSearchAssistantDrawer } from '../components/ai/AiSearchAssistantDrawer';

export const PatientLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Health Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'My Appointments', path: '/patient/appointments', icon: Calendar },
    { label: 'Prescriptions & History', path: '/patient/prescriptions', icon: Pill },
    { label: 'Intake Profile & Medical Info', path: '/patient/profile', icon: User },
    { label: 'Find Doctors', path: '/doctors', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onOpenAiSearch={() => setAiDrawerOpen(true)} />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-bold text-slate-800">Patient Portal Navigation</span>
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
          <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100/80">
            <p className="text-xs text-sky-600 font-semibold uppercase tracking-wider">
              Patient Portal
            </p>
            <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {user?.name || 'Patient'}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">{user?.city || 'Verified User'}</p>
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

            <button
              onClick={() => setAiDrawerOpen(true)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-teal-700 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/60 font-semibold transition-all mt-2"
            >
              <Sparkles className="w-4 h-4 text-teal-600 animate-pulse" />
              <span>AI Doctor Matcher</span>
            </button>
          </nav>
        </aside>

        {/* Dynamic Patient Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <AiSearchAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />
    </div>
  );
};
