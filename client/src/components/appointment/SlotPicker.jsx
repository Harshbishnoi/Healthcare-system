import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Users, AlertCircle, Check } from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { formatTimeSlot, formatDate } from '../../utils/formatters';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const SlotPicker = ({
  doctor,
  selectedDate,
  onDateChange,
  selectedSlot,
  onSlotChange,
  selectedMode,
  onModeChange,
}) => {
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotData, setSlotData] = useState(null);

  // Generate next 14 days
  const today = new Date();
  const nextDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (!doctor || !selectedDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const doctorId = doctor.doctorId || doctor.id;
        const res = await doctorService.getDoctorById(doctorId, selectedDate);
        if (res.success && res.data?.calculatedSlots) {
          setSlotData(res.data.calculatedSlots);
        } else {
          setSlotData(null);
        }
      } catch (err) {
        console.warn('Error fetching slots:', err.message);
        setSlotData(null);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [doctor, selectedDate]);

  const canOnline = doctor.consultationModes?.includes('online');
  const canOffline = doctor.consultationModes?.includes('offline');

  return (
    <div className="space-y-5">
      {/* 1. Mode Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
          1. Select Consultation Mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canOffline}
            onClick={() => onModeChange('offline')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-sm font-semibold transition-all ${
              selectedMode === 'offline'
                ? 'border-sky-600 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            } ${!canOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Users className="w-4 h-4" />
            <span>In-Person Visit</span>
          </button>

          <button
            type="button"
            disabled={!canOnline}
            onClick={() => onModeChange('online')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-2xl border text-sm font-semibold transition-all ${
              selectedMode === 'online'
                ? 'border-sky-600 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            } ${!canOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Video className="w-4 h-4" />
            <span>Video Consultation</span>
          </button>
        </div>
      </div>

      {/* 2. Date Selection Carousel */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
          2. Choose Appointment Date
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {nextDays.map((dateStr) => {
            const dateObj = new Date(dateStr);
            const isSelected = selectedDate === dateStr;
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => {
                  onDateChange(dateStr);
                  onSlotChange(''); // Reset slot on date change
                }}
                className={`flex flex-col items-center justify-center min-w-[70px] py-2.5 px-2 rounded-2xl border text-xs transition-all shrink-0 ${
                  isSelected
                    ? 'border-sky-600 bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`font-semibold ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                  {dayName}
                </span>
                <span className="text-base font-bold my-0.5">{dayNum}</span>
                <span className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                  {monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Slot Matrix */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
          <span>3. Select Time Slot</span>
          {selectedDate && <span className="text-slate-400 font-normal">{formatDate(selectedDate)}</span>}
        </label>

        {loadingSlots ? (
          <LoadingSpinner size="sm" label="Checking real-time slot availability..." />
        ) : !slotData?.isWorkingDay ? (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Doctor does not take appointments on {slotData?.dayOfWeek || 'this day'}. Please pick another date.</span>
          </div>
        ) : slotData?.slots?.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs text-center">
            No active consultation slots configured for this day.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slotData.slots.map((s) => {
              const isSelected = selectedSlot === s.time;
              return (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.isAvailable}
                  onClick={() => onSlotChange(s.time)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                    !s.isAvailable
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:bg-sky-50/50'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeSlot(s.time)}</span>
                  {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
