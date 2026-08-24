import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, User, Calendar, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { doctorService } from '../../services/doctorService';
import { formatDate, getInitials } from '../../utils/formatters';

export const DoctorPatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const res = await doctorService.getDoctorPatients();
        if (res.success) {
          setPatients(res.data || []);
        }
      } catch (err) {
        console.warn('Patients fetch notice:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Authorized Patient Records</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Patients who have booked or attended clinical consultations with your practice
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Doctor–Patient ACL Protected</span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullPage label="Retrieving authorized patient list..." />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patient records yet"
          description="Patients will automatically appear here once they schedule an appointment with your practice."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((item) => {
            const patient = item.patient || {};
            const profile = item.profile || {};
            const patientId = patient._id || patient.id;

            return (
              <div
                key={patientId}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                      {getInitials(patient.name)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{patient.name}</h3>
                      <p className="text-xs text-slate-500">
                        {patient.city} • {patient.mobile}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs text-slate-700">
                    <p>
                      <strong>Primary Concern:</strong>{' '}
                      {profile.primaryHealthConcern || 'General Checkup'}
                    </p>
                    {profile.allergies?.length > 0 && (
                      <p className="text-rose-700">
                        <strong>Allergies:</strong> {profile.allergies.join(', ')}
                      </p>
                    )}
                    <p className="text-slate-500 text-[11px] pt-1">
                      Last Visit: {formatDate(item.lastAppointmentDate)} ({item.totalAppointments} consultations)
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <Link to={`/doctor/patients/${patientId}`}>
                    <Button variant="outline" size="sm" icon={ArrowRight}>
                      View Medical History
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
