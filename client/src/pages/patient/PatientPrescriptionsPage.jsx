import React, { useState, useEffect } from 'react';
import { Pill, FileText, Calendar, Stethoscope, Printer, Download } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { PrescriptionViewerModal } from '../../components/patient/PrescriptionViewerModal';
import { patientService } from '../../services/patientService';
import { formatDate } from '../../utils/formatters';

export const PatientPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const res = await patientService.getPrescriptions();
        if (res.success) {
          setPrescriptions(res.data || []);
        }
      } catch (err) {
        console.warn('Prescriptions fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Prescriptions & Treatments</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View official electronic prescriptions issued by your consulting doctors
        </p>
      </div>

      {loading ? (
        <LoadingSpinner fullPage label="Loading prescriptions..." />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No digital prescriptions found"
          description="Prescriptions issued by licensed doctors following completed consultations will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((rx) => (
            <div
              key={rx._id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-sky-600" />
                      {rx.doctorId?.name || 'Doctor'}
                    </h3>
                    <p className="text-xs text-slate-500">{rx.doctorId?.city}</p>
                  </div>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                    {formatDate(rx.createdAt)}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <p className="font-bold text-slate-900">Prescribed Medicines:</p>
                  <ul className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {rx.medications?.map((m, idx) => (
                      <li key={idx} className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-800">
                          {m.medicineName} <span className="font-normal text-sky-600">({m.dosage})</span>
                        </span>
                        <span className="text-slate-500 text-[11px] shrink-0">
                          {m.frequency} • {m.duration}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {rx.generalAdvice && (
                  <p className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                    <strong>Doctor's Advice:</strong> {rx.generalAdvice}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedPrescription(rx)}
                  icon={FileText}
                >
                  View Full Rx & Print
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription Viewer Modal */}
      {selectedPrescription && (
        <PrescriptionViewerModal
          prescription={selectedPrescription}
          isOpen={!!selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
        />
      )}
    </div>
  );
};
