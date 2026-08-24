import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CalendarCheck, ShieldCheck, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { SlotPicker } from './SlotPicker';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { appointmentService } from '../../services/appointmentService';
import { aiService } from '../../services/aiService';
import { formatCurrency } from '../../utils/formatters';

export const BookAppointmentModal = ({ doctor, isOpen, onClose, onBookingSuccess }) => {
  const { user, isAuthenticated, isPatient } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // State for booking
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedMode, setSelectedMode] = useState(
    doctor?.consultationModes?.[0] || 'offline'
  );
  const [reasonForVisit, setReasonForVisit] = useState(
    user?.profile?.primaryHealthConcern || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Intake State
  const [isGeneratingIntake, setIsGeneratingIntake] = useState(false);
  const [intakeSummary, setIntakeSummary] = useState(null);

  if (!doctor) return null;

  const handleGenerateAiIntake = async () => {
    if (!reasonForVisit.trim()) {
      showError('Please write your reason for visit or health concern first.');
      return;
    }
    setIsGeneratingIntake(true);
    try {
      const res = await aiService.generateIntakeSummary({
        healthConcern: reasonForVisit,
        duration: user?.profile?.problemDuration || 'Recent',
        medicalHistory: user?.profile?.pastMedicalHistory || 'None',
      });
      if (res.success && res.data) {
        setIntakeSummary(res.data);
        showSuccess('AI clinical intake summary generated successfully!');
      }
    } catch (err) {
      showError(err.message || 'Could not generate intake summary');
    } finally {
      setIsGeneratingIntake(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isPatient) {
      showError('Only registered patient accounts can book appointments.');
      return;
    }

    if (!selectedSlot) {
      showError('Please choose a time slot to proceed.');
      return;
    }

    if (!reasonForVisit.trim()) {
      showError('Please provide a reason for the consultation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        doctorId: doctor.doctorId || doctor.id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        mode: selectedMode,
        reasonForVisit,
        intakeSummary: intakeSummary || undefined,
      };

      const res = await appointmentService.bookAppointment(payload);
      if (res.success) {
        showSuccess(`Appointment confirmed with ${doctor.name}!`);
        onClose();
        if (onBookingSuccess) onBookingSuccess(res.data);
        navigate('/patient/appointments');
      }
    } catch (err) {
      // Handles 409 slot conflict or generic errors
      showError(err.message || 'Failed to book appointment. Please try another slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Doctor Appointment"
      subtitle={`Schedule with ${doctor.name} • ${doctor.specialization}`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmitBooking} className="space-y-6">
        {/* Doctor Summary Header Banner */}
        <div className="flex items-center justify-between p-4 bg-sky-50/70 border border-sky-100 rounded-2xl">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {doctor.hospitalClinic}
            </p>
            <p className="text-sm font-bold text-slate-900">{doctor.serviceLocation}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium">Fee</p>
            <p className="text-base font-bold text-sky-700">
              {formatCurrency(doctor.consultationFee || 500)}
            </p>
          </div>
        </div>

        {/* Slot Picker Component */}
        <SlotPicker
          doctor={doctor}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedSlot={selectedSlot}
          onSlotChange={setSelectedSlot}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
        />

        {/* Reason for Visit & AI Intake Helper */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              4. Reason for Consultation & Symptoms *
            </label>
            <button
              type="button"
              onClick={handleGenerateAiIntake}
              disabled={isGeneratingIntake || !reasonForVisit.trim()}
              className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>{isGeneratingIntake ? 'Organizing...' : 'Generate AI Intake Summary'}</span>
            </button>
          </div>

          <textarea
            required
            rows={3}
            value={reasonForVisit}
            onChange={(e) => setReasonForVisit(e.target.value)}
            placeholder="Describe your symptoms, how long you've felt unwell, or primary health question for the doctor..."
            className="block w-full rounded-2xl border border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all resize-none"
          />

          {/* Render Structured AI Intake Summary if generated */}
          {intakeSummary && (
            <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-2 text-xs text-teal-950 animate-fade-in">
              <div className="flex items-center justify-between text-teal-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  AI Structured Intake Ready for Doctor
                </span>
                <span className="text-[10px] bg-teal-200/60 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <p>
                <strong>Concern:</strong> {intakeSummary.healthConcern}
              </p>
              {intakeSummary.questionsForDoctor?.length > 0 && (
                <div>
                  <strong>Recommended Questions to Ask:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-teal-900">
                    {intakeSummary.questionsForDoctor.slice(0, 3).map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-[10px] text-teal-700 italic pt-1 border-t border-teal-200/50">
                {intakeSummary.safetyNotice}
              </p>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!selectedSlot}
            icon={CalendarCheck}
          >
            Confirm & Reserve Slot
          </Button>
        </div>
      </form>
    </Modal>
  );
};
