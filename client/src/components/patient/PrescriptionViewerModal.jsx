import React from 'react';
import { Pill, Printer, Building2, Stethoscope, Calendar, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatDate } from '../../utils/formatters';

export const PrescriptionViewerModal = ({ prescription, isOpen, onClose }) => {
  if (!prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  const doctor = prescription.doctorId || {};
  const patient = prescription.patientId || {};
  const appointment = prescription.appointmentId || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Digital Medical Prescription"
      subtitle={`Issued on ${formatDate(prescription.createdAt)}`}
      maxWidth="max-w-2xl"
    >
      <div id="printable-prescription" className="space-y-6 text-slate-800">
        {/* Prescription Doctor Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-sky-600 pb-4 gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <Stethoscope className="w-5 h-5 text-sky-600" />
              {doctor.name || 'Medical Practitioner'}
            </h3>
            <p className="text-xs text-sky-700 font-semibold">{doctor.specialization || 'General Medicine'}</p>
            <p className="text-xs text-slate-500">{doctor.degree || 'MD / MBBS'}</p>
            <p className="text-xs text-slate-500 mt-1">{doctor.city}</p>
          </div>

          <div className="sm:text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-700">DocPulse Clinical Network</p>
            <p>Rx ID: {prescription._id?.substring(0, 10).toUpperCase()}</p>
            <p>Date: {formatDate(prescription.createdAt)}</p>
          </div>
        </div>

        {/* Patient Details Sub-header */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Patient Name:</span>
            <span className="font-bold text-slate-800">{patient.name || 'Patient'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">City / Location:</span>
            <span className="font-medium text-slate-800">{patient.city || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Consultation Mode:</span>
            <span className="font-medium text-slate-800 uppercase">{appointment.mode || 'Offline'}</span>
          </div>
        </div>

        {/* Rx Medications Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
            <span className="text-xl font-serif italic">℞</span>
            <span>Prescribed Medication Regimen</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3.5 py-2.5 text-left">#</th>
                  <th className="px-3.5 py-2.5 text-left">Medicine & Dosage</th>
                  <th className="px-3.5 py-2.5 text-left">Frequency</th>
                  <th className="px-3.5 py-2.5 text-left">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {prescription.medications?.map((med, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3.5 py-3 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="px-3.5 py-3 font-bold text-slate-900">
                      {med.medicineName}{' '}
                      <span className="font-normal text-sky-600">({med.dosage})</span>
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">{med.frequency}</td>
                    <td className="px-3.5 py-3 text-slate-700">{med.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* General Advice / Dietary */}
        {prescription.generalAdvice && (
          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-900">
            <p className="font-bold mb-0.5">Doctor's Dietary / Lifestyle Advice:</p>
            <p className="leading-relaxed">{prescription.generalAdvice}</p>
          </div>
        )}

        {/* Signature & Disclaimer Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p className="text-[10px] max-w-xs italic">
            This digital prescription is electronically certified by the consulting physician on DocPulse Healthcare Platform.
          </p>
          <div className="text-center sm:text-right">
            <div className="w-32 border-b border-slate-300 pb-1 mb-1 font-serif text-slate-700 italic">
              {doctor.name || 'Dr. Physician'}
            </div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase">Authorized Signature</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} icon={Printer}>
            Print / Save PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
};
