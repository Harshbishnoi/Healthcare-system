import React, { useState } from 'react';
import { Plus, Trash2, Pill, Stethoscope, FileText, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useToast } from '../../context/ToastContext';
import { appointmentService } from '../../services/appointmentService';

export const ConsultationModal = ({
  appointment,
  isOpen,
  onClose,
  onConsultationSaved,
}) => {
  const { showSuccess, showError } = useToast();

  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    pulseRate: '',
    temperature: '',
    weightKg: '',
  });
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');

  // Prescription Medications
  const [medications, setMedications] = useState([
    { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);
  const [generalAdvice, setGeneralAdvice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!appointment) return null;

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const handleRemoveMedication = (index) => {
    if (medications.length <= 1) return;
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedChange = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      showError('Please record the clinical diagnosis.');
      return;
    }

    if (!consultationNotes.trim()) {
      showError('Please provide clinical consultation notes.');
      return;
    }

    if (!treatmentNotes.trim()) {
      showError('Please provide treatment notes / care plan.');
      return;
    }

    // Filter valid medications
    const validMeds = medications.filter(
      (m) => m.medicineName.trim() !== '' && m.dosage.trim() !== ''
    );

    setIsSubmitting(true);
    try {
      const payload = {
        consultationNotes,
        diagnosis,
        treatmentNotes,
        vitals,
        followUpDate: followUpDate || undefined,
        followUpInstructions: followUpInstructions || undefined,
        prescription:
          validMeds.length > 0
            ? {
                medications: validMeds,
                generalAdvice,
              }
            : undefined,
      };

      const res = await appointmentService.createConsultation(appointment._id, payload);
      if (res.success) {
        showSuccess('Consultation and prescription recorded successfully!');
        onClose();
        if (onConsultationSaved) onConsultationSaved(res.data);
      }
    } catch (err) {
      showError(err.message || 'Failed to record consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Clinical Consultation Record"
      subtitle={`Patient: ${appointment.patientId?.name || 'Patient'} • Scheduled for ${appointment.appointmentDate}`}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Reported Concern Review */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Patient Reported Health Concern
          </p>
          <p className="text-sm text-slate-900 font-medium">{appointment.reasonForVisit}</p>
        </div>

        {/* 1. Clinical Diagnosis (Physician Recorded) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            1. Clinical Diagnosis * <span className="text-slate-400 font-normal">(Recorded by licensed physician)</span>
          </label>
          <Input
            required
            placeholder="e.g., Primary Hypertension / Contact Dermatitis / Viral Upper Respiratory Infection"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>

        {/* 2. Patient Vitals */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            2. Vitals (Optional)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Input
              placeholder="BP (e.g. 120/80)"
              value={vitals.bloodPressure}
              onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
            />
            <Input
              placeholder="Pulse (e.g. 72 bpm)"
              value={vitals.pulseRate}
              onChange={(e) => setVitals({ ...vitals, pulseRate: e.target.value })}
            />
            <Input
              placeholder="Temp (e.g. 98.6 F)"
              value={vitals.temperature}
              onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
            />
            <Input
              placeholder="Weight (e.g. 70 kg)"
              value={vitals.weightKg}
              onChange={(e) => setVitals({ ...vitals, weightKg: e.target.value })}
            />
          </div>
        </div>

        {/* 3. Clinical Notes & Treatment Plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              3. Consultation Findings & Notes *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Clinical observation, symptoms review, examination findings..."
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              4. Treatment Plan / Care Plan *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Treatment strategy, recommended lifestyle adjustments, tests ordered..."
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 resize-none"
            />
          </div>
        </div>

        {/* 5. Prescription & Medications */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-sky-600" />
              <h4 className="text-sm font-bold text-slate-900">Issue Digital Prescription</h4>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedication}
              icon={Plus}
            >
              Add Medicine
            </Button>
          </div>

          <div className="space-y-2.5">
            {medications.map((med, index) => (
              <div
                key={index}
                className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
              >
                <div className="sm:col-span-4">
                  <Input
                    placeholder="Medicine Name (e.g. Amoxicillin)"
                    value={med.medicineName}
                    onChange={(e) => handleMedChange(index, 'medicineName', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Dosage (500mg)"
                    value={med.dosage}
                    onChange={(e) => handleMedChange(index, 'dosage', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    placeholder="Freq (1-0-1 after food)"
                    value={med.frequency}
                    onChange={(e) => handleMedChange(index, 'frequency', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Duration (5 days)"
                    value={med.duration}
                    onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(index)}
                    disabled={medications.length <= 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Input
            placeholder="General advice / Dietary instructions for patient..."
            value={generalAdvice}
            onChange={(e) => setGeneralAdvice(e.target.value)}
          />
        </div>

        {/* 6. Follow-up */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Follow-up Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Follow-up Instructions
            </label>
            <Input
              placeholder="e.g. Schedule review if fever persists after 3 days"
              value={followUpInstructions}
              onChange={(e) => setFollowUpInstructions(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="teal"
            isLoading={isSubmitting}
            icon={CheckCircle2}
          >
            Complete Consultation & Issue Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
