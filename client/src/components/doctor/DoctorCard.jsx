import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  Star,
  Video,
  Users,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatCurrency, getInitials } from '../../utils/formatters';

export const DoctorCard = ({ doctor, onBookClick }) => {
  const hasOnline = doctor.consultationModes?.includes('online');
  const hasOffline = doctor.consultationModes?.includes('offline');

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 hover:border-sky-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      <div className="p-6 space-y-4">
        {/* Top Header Row */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            {getInitials(doctor.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {doctor.name}
              </h3>
              <CheckCircle className="w-4 h-4 text-sky-500 shrink-0" title="Verified Practitioner" />
            </div>

            <p className="text-xs font-semibold text-sky-600 truncate mt-0.5">
              {doctor.specialization}
            </p>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{doctor.ratingAvg > 0 ? doctor.ratingAvg.toFixed(1) : 'New'}</span>
                {doctor.totalReviews > 0 && (
                  <span className="text-[10px] text-amber-700/70 font-normal">
                    ({doctor.totalReviews})
                  </span>
                )}
              </div>

              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {doctor.experienceYears} yrs exp
              </span>
            </div>
          </div>
        </div>

        {/* Doctor Details Block */}
        <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-700">{doctor.degree}</span>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{doctor.hospitalClinic}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {doctor.city} • <span className="text-slate-400">{doctor.serviceLocation}</span>
            </span>
          </div>
        </div>

        {/* Consultation Modes & Fee Badges */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {hasOffline && (
              <Badge variant="teal" size="sm">
                <Users className="w-3 h-3" /> In-Clinic
              </Badge>
            )}
            {hasOnline && (
              <Badge variant="sky" size="sm">
                <Video className="w-3 h-3" /> Video
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium">Consultation Fee</p>
            <p className="text-sm font-bold text-slate-900">
              {formatCurrency(doctor.consultationFee || 500)}
            </p>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2.5">
        <Link to={`/doctors/${doctor.doctorId || doctor.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View Profile
          </Button>
        </Link>
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => onBookClick && onBookClick(doctor)}
          icon={Calendar}
        >
          Book Visit
        </Button>
      </div>
    </div>
  );
};
