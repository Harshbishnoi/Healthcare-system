import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Heart,
  Calendar,
  Pill,
  ChevronLeft,
  ShieldCheck,
  Stethoscope,
  Clock,
  FileText,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PrescriptionViewerModal } from '../../components/patient/PrescriptionViewerModal';
import { patientService } from '../../services/patientService';
import { formatDate, getInitials } from '../../utils/formatters';

export const DoctorPatientDetailPage = () => {
  const { id: patientId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const res = await patientService.getPatientHistoryForDoctor(patientId);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError('Failed to fetch patient history.');
        }
      } catch (err) {
        setError(err.message || 'Unauthorized: Doctor-patient relationship not established.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [patientId]);

  if (loading) return <LoadingSpinner fullPage label="Validating authorization & fetching history..." />;

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Access Denied or Not Found</h2>
        <p className="text-xs text-rose-600">{error || 'Access restricted to authorized doctors only.'}</p>
        <Link to="/doctor/patients">
          <Button variant="outline" size="sm">
            Back to Patients
          </Button>
        </Link>
      </div>
    );
  }

  const { patient, profile, previousConsultations = [], previousPrescriptions = [] } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Back Link */}
      <Link
        to="/doctor/patients"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Authorized Patients</span>
      </Link>

      {/* Patient Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-sky-600 text-white font-extrabold flex items-center justify-center text-xl shadow-md">
              {getInitials(patient?.name)}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{patient?.name}</h1>
              <p className="text-xs text-slate-500">
                Email: {patient?.email} • Mobile: {patient?.mobile} • City: {patient?.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-full border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Authorized Medical Access</span>
          </div>
        </div>

        {/* Clinical Intake Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-700">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Health Concern & Duration:</span>
            <p>{profile?.primaryHealthConcern || 'None reported'}</p>
            <p className="text-slate-500 font-medium">Duration: {profile?.problemDuration || 'N/A'}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Medical History:</span>
            <p>{profile?.pastMedicalHistory || 'None on record'}</p>
            <p className="text-slate-500">Blood Group: {profile?.bloodGroup || 'Unknown'}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Allergies & Conditions:</span>
            <p className="text-rose-700">
              <strong>Allergies:</strong> {profile?.allergies?.join(', ') || 'None'}
            </p>
            <p className="text-slate-600">
              <strong>Conditions:</strong> {profile?.chronicConditions?.join(', ') || 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Past Consultations Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Stethoscope className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">
            Consultation History ({previousConsultations.length})
          </h2>
        </div>

        {previousConsultations.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No recorded consultations yet.</p>
        ) : (
          <div className="space-y-4">
            {previousConsultations.map((c) => (
              <div
                key={c._id}
                className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-sm text-slate-900">
                    Diagnosis: <span className="text-teal-700">{c.diagnosis}</span>
                  </span>
                  <span className="text-slate-500 font-medium">{formatDate(c.createdAt)}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                  <div>
                    <span className="font-semibold block mb-0.5">Clinical Notes:</span>
                    <p className="text-slate-600 leading-relaxed">{c.consultationNotes}</p>
                  </div>
                  <div>
                    <span className="font-semibold block mb-0.5">Treatment Plan:</span>
                    <p className="text-slate-600 leading-relaxed">{c.treatmentNotes}</p>
                  </div>
                </div>

                {c.followUpDate && (
                  <p className="text-[11px] text-sky-800 bg-sky-50 p-2 rounded-xl border border-sky-200">
                    <strong>Scheduled Follow-up:</strong> {formatDate(c.followUpDate)} -{' '}
                    {c.followUpInstructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Prescriptions Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Pill className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900">
            Prescription Records ({previousPrescriptions.length})
          </h2>
        </div>

        {previousPrescriptions.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No prescriptions issued yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {previousPrescriptions.map((rx) => (
              <div
                key={rx._id}
                className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{formatDate(rx.createdAt)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPrescription(rx)}
                    icon={FileText}
                  >
                    View Rx
                  </Button>
                </div>

                <ul className="space-y-1 bg-white p-3 rounded-xl border border-sky-100 text-slate-700">
                  {rx.medications?.map((m, idx) => (
                    <li key={idx}>
                      <strong>{m.medicineName}</strong> - {m.dosage} ({m.frequency})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

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
