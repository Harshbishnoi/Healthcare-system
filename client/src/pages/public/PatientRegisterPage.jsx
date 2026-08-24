import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, MapPin, Activity, UserPlus, HeartHandshake } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PatientRegisterPage = () => {
  const { registerPatient } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    city: '',
    primaryHealthConcern: '',
    problemDuration: '',
    pastMedicalHistory: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.mobile || !formData.city) {
      showError('Please fill out all required fields marked with *.');
      return;
    }

    setLoading(true);
    try {
      await registerPatient(formData);
      showSuccess('Patient account created successfully! Welcome to DocPulse.');
      navigate('/patient/dashboard');
    } catch (err) {
      showError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-600/20">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Patient Registration
          </h2>
          <p className="text-xs text-slate-500">
            Sign up to discover certified doctors and book verified appointments
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Full Name"
              required
              icon={User}
              placeholder="e.g. Alex Morgan"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />

            <Input
              label="Mobile Number"
              required
              icon={Phone}
              placeholder="+1-555-0199"
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="alex@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />

            <Input
              label="City"
              required
              icon={MapPin}
              placeholder="e.g. New York"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>

          <Input
            label="Password"
            type="password"
            required
            icon={Lock}
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
          />

          {/* Health Intake Questions */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Initial Health Concern (Optional Intake)
            </p>

            <Input
              label="Current Health Concern / Symptoms"
              placeholder="e.g., Occasional shortness of breath during workouts"
              value={formData.primaryHealthConcern}
              onChange={(e) => handleChange('primaryHealthConcern', e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Duration of Problem"
                placeholder="e.g., 2 weeks"
                value={formData.problemDuration}
                onChange={(e) => handleChange('problemDuration', e.target.value)}
              />

              <Input
                label="Past Medical History (Allergies/Conditions)"
                placeholder="e.g., Mild asthma, penicillin allergy"
                value={formData.pastMedicalHistory}
                onChange={(e) => handleChange('pastMedicalHistory', e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="lg"
            isLoading={loading}
            icon={UserPlus}
          >
            Create Patient Account
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
