import React, { useState, useEffect } from 'react';
import { Stethoscope, Save, Building2, MapPin, GraduationCap, Briefcase, DollarSign } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { doctorService } from '../../services/doctorService';
import { authService } from '../../services/authService';
import { SPECIALIZATIONS } from '../../utils/constants';

export const DoctorProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    degree: '',
    specialization: 'General Medicine',
    experienceYears: '0',
    city: '',
    hospitalClinic: '',
    serviceLocation: '',
    bio: '',
    consultationFee: '500',
    onlineConsultation: true,
    offlineConsultation: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authService.getMe();
        if (res.success && res.data?.profile) {
          const p = res.data.profile;
          setFormData({
            degree: p.degree || '',
            specialization: p.specialization || 'General Medicine',
            experienceYears: `${p.experienceYears || 0}`,
            city: p.city || user?.city || '',
            hospitalClinic: p.hospitalClinic || '',
            serviceLocation: p.serviceLocation || '',
            bio: p.bio || '',
            consultationFee: `${p.consultationFee || 500}`,
            onlineConsultation: (p.consultationModes || []).includes('online'),
            offlineConsultation: (p.consultationModes || []).includes('offline'),
          });
        }
      } catch (err) {
        console.warn('Profile load notice:', err.message);
      }
    };
    loadProfile();
  }, [user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        degree: formData.degree,
        specialization: formData.specialization,
        experienceYears: parseInt(formData.experienceYears, 10) || 0,
        city: formData.city,
        hospitalClinic: formData.hospitalClinic,
        serviceLocation: formData.serviceLocation,
        bio: formData.bio,
        consultationFee: parseFloat(formData.consultationFee) || 500,
        consultationModes: modes,
      };

      const res = await doctorService.updateProfile(payload);
      if (res.success) {
        showSuccess('Doctor professional profile updated successfully!');
        updateUserData({ profile: res.data });
      }
    } catch (err) {
      showError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">Manage Doctor Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your public qualifications, clinic location, fee, and clinical description
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              label="Medical Specialization"
              value={formData.specialization}
              onChange={(e) => handleChange('specialization', e.target.value)}
              options={SPECIALIZATIONS.filter((s) => s !== 'All Specializations')}
            />

            <Input
              label="Experience (Years)"
              type="number"
              min="0"
              icon={Briefcase}
              value={formData.experienceYears}
              onChange={(e) => handleChange('experienceYears', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Hospital / Clinic Name"
              required
              icon={Building2}
              placeholder="Hospital or Practice"
              value={formData.hospitalClinic}
              onChange={(e) => handleChange('hospitalClinic', e.target.value)}
            />

            <Input
              label="Practice City"
              required
              icon={MapPin}
              placeholder="City"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>

          <Input
            label="Service Location / Address"
            required
            icon={MapPin}
            placeholder="e.g. Suite 400, 1425 Madison Ave"
            value={formData.serviceLocation}
            onChange={(e) => handleChange('serviceLocation', e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Professional Description & Clinical Focus
            </label>
            <textarea
              rows={4}
              placeholder="Describe your medical approach, specialized procedures, and clinical interests..."
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
            <Input
              label="Consultation Fee ($)"
              type="number"
              min="0"
              value={formData.consultationFee}
              onChange={(e) => handleChange('consultationFee', e.target.value)}
            />

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Active Consultation Modes
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.offlineConsultation}
                    onChange={(e) => handleChange('offlineConsultation', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>In-Person Visits</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.onlineConsultation}
                    onChange={(e) => handleChange('onlineConsultation', e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>Video Consultations</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              icon={Save}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
