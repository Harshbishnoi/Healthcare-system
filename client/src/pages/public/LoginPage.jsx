import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Mail, Lock, LogIn, Stethoscope, User, Sparkles } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      showSuccess(`Welcome back, ${loggedInUser.name}!`);

      if (from) {
        navigate(from, { replace: true });
      } else if (loggedInUser.role === 'doctor') {
        navigate('/doctor/dashboard', { replace: true });
      } else {
        navigate('/patient/dashboard', { replace: true });
      }
    } catch (err) {
      showError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to DocPulse
          </h2>
          <p className="text-xs text-slate-500">
            Access your direct doctor-patient healthcare portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            required
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="lg"
            isLoading={loading}
            icon={LogIn}
          >
            Sign In
          </Button>
        </form>

        {/* Quick Demo Logins for Instant Testing */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <p className="font-bold text-slate-700 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Quick Demo Logins (Click to Autofill):
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickLogin('alex.patient@example.com', 'password123')}
              className="p-2 bg-white rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-700 font-semibold flex items-center gap-1.5 justify-center transition-all"
            >
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span>Demo Patient</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('sarah.jenkins@docpulse.com', 'password123')}
              className="p-2 bg-white rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-700 font-semibold flex items-center gap-1.5 justify-center transition-all"
            >
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              <span>Demo Doctor</span>
            </button>
          </div>
        </div>

        {/* Sign up links */}
        <div className="text-center text-xs text-slate-500 space-y-2 border-t border-slate-100 pt-4">
          <p>
            Don't have an account?{' '}
            <Link to="/register/patient" className="text-sky-600 font-bold hover:underline">
              Sign up as Patient
            </Link>
          </p>
          <p>
            Are you a medical doctor?{' '}
            <Link to="/register/doctor" className="text-teal-600 font-bold hover:underline">
              Register as Doctor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
