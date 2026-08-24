import React, { useState, useEffect } from 'react';
import { User, Heart, Sparkles, Save, ShieldCheck, AlertCircle } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { patientService } from '../../services/patientService';
import { aiService } from '../../services/aiService';

export const PatientProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: 'prefer_not_to_say',
    bloodGroup: 'Unknown',
    primaryHealthConcern: '',
    problemDuration: '',
    pastMedicalHistory: '',
    allergies: '',
    chronicConditions: '',
    emergencyName: '',
    emergencyMobile: '',
    emergencyRelation: '',
  });

  const [loading, setLoading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [intakeSummary, setIntakeSummary] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await patientService.getProfile();
        if (res.success && res.data?.profile) {
          const p = res.data.profile;
          setFormData({
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
            gender: p.gender || 'prefer_not_to_say',
            bloodGroup: p.bloodGroup || 'Unknown',
            primaryHealthConcern: p.primaryHealthConcern || '',
            problemDuration: p.problemDuration || '',
            pastMedicalHistory: p.pastMedicalHistory || '',
            allergies: Array.isArray(p.allergies) ? p.allergies.join(', ') : '',
            chronicConditions: Array.isArray(p.chronicConditions) ? p.chronicConditions.join(', ') : '',
            emergencyName: p.emergencyContact?.name || '',
            emergencyMobile: p.emergencyContact?.mobile || '',
            emergencyRelation: p.emergencyContact?.relation || '',
          });
          if (p.intakeSummary && p.intakeSummary.healthConcern) {
            setIntakeSummary(p.intakeSummary);
          }
        }
      } catch (err) {
        console.warn('Profile fetch notice:', err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateAiSummary = async () => {
    if (!formData.primaryHealthConcern.trim()) {
      showError('Please enter your primary health concern first.');
      return;
    }

    setGeneratingAi(true);
    try {
      const res = await aiService.generateIntakeSummary({
        healthConcern: formData.primaryHealthConcern,
        duration: formData.problemDuration,
        medicalHistory: formData.pastMedicalHistory,
      });

      if (res.success && res.data) {
        setIntakeSummary(res.data);
        showSuccess('AI clinical summary generated successfully!');
      }
    } catch (err) {
      showError(err.message || 'Could not generate intake summary');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        primaryHealthConcern: formData.primaryHealthConcern,
        problemDuration: formData.problemDuration,
        pastMedicalHistory: formData.pastMedicalHistory,
        allergies: formData.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        chronicConditions: formData.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean),
        emergencyContact: {
          name: formData.emergencyName,
          mobile: formData.emergencyMobile,
          relation: formData.emergencyRelation,
        },
        intakeSummary: intakeSummary || undefined,
      };

      const res = await patientService.updateProfile(payload);
      if (res.success) {
        showSuccess('Patient health profile updated successfully!');
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Health Intake Profile</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep your medical details and health concerns updated for consulting doctors
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Confidential Medical Store</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Demographics */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-800">
              1. Basic Demographics
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />

              <Select
                label="Gender"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                ]}
              />

              <Select
                label="Blood Group"
                value={formData.bloodGroup}
                onChange={(e) => handleChange('bloodGroup', e.target.value)}
                options={['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
              />
            </div>
          </div>

          {/* Section 2: Health Concerns & Intake */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-800">
                2. Health Concerns & Medical History
              </p>
              <button
                type="button"
                onClick={handleGenerateAiSummary}
                disabled={generatingAi || !formData.primaryHealthConcern.trim()}
                className="inline-flex items-center gap-1 text-xs text-teal-700 font-semibold bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                <span>{generatingAi ? 'Analyzing...' : 'Generate AI Summary'}</span>
              </button>
            </div>

            <Input
              label="Primary Health Concern / Symptom Description"
              placeholder="e.g., Occasional shortness of breath during light workouts"
              value={formData.primaryHealthConcern}
              onChange={(e) => handleChange('primaryHealthConcern', e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Duration of Problem"
                placeholder="e.g., 3 weeks"
                value={formData.problemDuration}
                onChange={(e) => handleChange('problemDuration', e.target.value)}
              />

              <Input
                label="Known Allergies (Comma separated)"
                placeholder="e.g., Penicillin, Peanuts"
                value={formData.allergies}
                onChange={(e) => handleChange('allergies', e.target.value)}
              />
            </div>

            <Input
              label="Past Medical History & Surgeries"
              placeholder="e.g., Appendectomy in 2018, mild childhood asthma"
              value={formData.pastMedicalHistory}
              onChange={(e) => handleChange('pastMedicalHistory', e.target.value)}
            />

            <Input
              label="Chronic Conditions (Comma separated)"
              placeholder="e.g., Hypertension, Type 2 Diabetes"
              value={formData.chronicConditions}
              onChange={(e) => handleChange('chronicConditions', e.target.value)}
            />
          </div>

          {/* AI Generated Intake Summary Display */}
          {intakeSummary && (
            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 space-y-2 text-xs text-teal-950 animate-fade-in">
              <div className="flex items-center justify-between text-teal-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  AI Clinical Intake Summary for Doctors
                </span>
                <span className="text-[10px] bg-teal-200/60 px-2 py-0.5 rounded-full">
                  Saved on Profile
                </span>
              </div>
              <p>
                <strong>Concern:</strong> {intakeSummary.healthConcern}
              </p>
              {intakeSummary.questionsForDoctor?.length > 0 && (
                <div>
                  <strong>Recommended Questions to Ask Doctor:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {intakeSummary.questionsForDoctor.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[10px] text-teal-700 italic border-t border-teal-200/50 pt-1">
                {intakeSummary.safetyNotice}
              </p>
            </div>
          )}

          {/* Section 3: Emergency Contact */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-800">
              3. Emergency Contact (Optional)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Input
                label="Contact Name"
                placeholder="e.g., Jane Morgan"
                value={formData.emergencyName}
                onChange={(e) => handleChange('emergencyName', e.target.value)}
              />

              <Input
                label="Contact Mobile"
                placeholder="+1-555-0188"
                value={formData.emergencyMobile}
                onChange={(e) => handleChange('emergencyMobile', e.target.value)}
              />

              <Input
                label="Relationship"
                placeholder="e.g., Spouse / Parent"
                value={formData.emergencyRelation}
                onChange={(e) => handleChange('emergencyRelation', e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              icon={Save}
            >
              Save Health Intake Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
