import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const MedicalDisclaimerBanner = () => {
  return (
    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-start gap-3 text-sky-950 text-xs">
      <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <p className="font-bold">Medical Safety & Responsibility Policy</p>
        <p className="text-sky-800/90 leading-relaxed">
          DocPulse connects patients directly with licensed doctors. AI features organize intake summaries and assist in finding specialties. <strong>AI never replaces a physician, diagnoses illnesses, or prescribes medication.</strong> Clinical diagnosis and prescriptions are solely performed by licensed physicians.
        </p>
      </div>
    </div>
  );
};
