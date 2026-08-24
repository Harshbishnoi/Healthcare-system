import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, User, Mail, Lock, Phone, MapPin, GraduationCap, Building2, Briefcase } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SPECIALIZATIONS } from '../../utils/constants';

export const DoctorRegisterPage = () => {
  const { registerDoctor } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    city: '',
    degree: '',
    specialization: 'General Medicine',
    experienceYears: '5',
    hospitalClinic: '',
    serviceLocation: '',
    bio: '',
    consultationFee: '500',
    onlineConsultation: true,
    offlineConsultation: true,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.degree ||
      !formData.hospitalClinic ||
      !formData.serviceLocation ||
      !formData.city
    ) {
      showError('Please complete all required doctor onboarding fields.');
      return;
    }

    const modes = [];
    if (formData.offlineConsultation) modes.push('offline');
    if (formData.onlineConsultation) modes.push('online');

    if (modes.length === 0) {
      showError('Please select at least one consultation mode (In-person or Video).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        experienceYears: parseInt(formData.experienceYears, 10) || 0,
        consultationFee: parseFloat(formData.consultationFee) || 500,
        consultationModes: modes,
      };

      await registerDoctor(payload);
      showSuccess('Doctor profile registered successfully! Welcome to your clinical workspace.');
      navigate('/doctor/dashboard');
    } catch (err) {
      showError(err.message || 'Doctor registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Doctor Practitioner Onboarding
          </h2>
          <p className="text-xs text-slate-500">
            Join the verified medical network to manage appointments, patients, and digital consultations
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Doctor Full Name"
              required
              icon={User}
              placeholder="e.g. Dr. Sarah Jenkins"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              required
              icon={Mail}
              placeholder="doctor@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Mobile Number"
              required
              icon={Phone}
              placeholder="+1-555-0101"
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              icon={Lock}
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
            />
          </div>

          {/* Professional Credentials Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3.5">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Professional Credentials & Practice
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Input
                label="Qualifications / Degree"
                required
                icon={GraduationCap}
                placeholder="e.g. MD, MBBS, FACC"
                value={formData.degree}
                onChange={(e) => handleChange('degree', e.target.value)}
              />

              <Select
                label="Specialization"
                value={formData.specialization}
                onChange={(e) => handleChange('specialization', e.target.value)}
                options={SPECIALIZATIONS.filter((s) => s !== 'All Specializations')}
              />

              <Input
                label="Years of Experience"
                type="number"
                min="0"
                icon={Briefcase}
                placeholder="Years"
                value={formData.experienceYears}
                onChange={(e) => handleChange('experienceYears', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Hospital / Clinic Name"
                required
                icon={Building2}
                placeholder="e.g. Mount Sinai Medical Center"
                value={formData.hospitalClinic}
                onChange={(e) => handleChange('hospitalClinic', e.target.value)}
              />

              <Input
                label="City / Metro Area"
                required
                icon={MapPin}
                placeholder="e.g. New York"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>

            <Input
              label="Service Address / Clinic Location"
              required
              icon={MapPin}
              placeholder="e.g. Suite 400, 1425 Madison Ave"
              value={formData.serviceLocation}
              onChange={(e) => handleChange('serviceLocation', e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Professional Bio & Clinical Focus
              </label>
              <textarea
                rows={2}
                placeholder="Describe your clinical expertise, conditions treated, and approach to care..."
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="block w-full rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
              <Input
                label="Standard Consultation Fee ($)"
                type="number"
                min="0"
                value={formData.consultationFee}
                onChange={(e) => handleChange('consultationFee', e.target.value)}
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Consultation Modes Offered
                </label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.offlineConsultation}
                      onChange={(e) => handleChange('offlineConsultation', e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>In-Clinic Visits</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.onlineConsultation}
                      onChange={(e) => handleChange('onlineConsultation', e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Video Consultation</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="teal"
            className="w-full"
            size="lg"
            isLoading={loading}
            icon={Stethoscope}
          >
            Complete Doctor Registration
          </Button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
          Already registered as a physician?{' '}
          <Link to="/login" className="text-teal-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
