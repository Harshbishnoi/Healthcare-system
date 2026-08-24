import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Save, CheckCircle2, Video, Users } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { doctorService } from '../../services/doctorService';
import { authService } from '../../services/authService';
import { WEEKDAYS } from '../../utils/constants';

export const DoctorAvailabilityPage = () => {
  const { showSuccess, showError } = useToast();

  const [workingDays, setWorkingDays] = useState([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '17:00',
  });
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
  const [onlineAvailable, setOnlineAvailable] = useState(true);
  const [offlineAvailable, setOfflineAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await authService.getMe();
        if (res.success && res.data?.availability) {
          const a = res.data.availability;
          if (a.workingDays) setWorkingDays(a.workingDays);
          if (a.workingHours) setWorkingHours(a.workingHours);
          if (a.slotDurationMinutes) setSlotDurationMinutes(a.slotDurationMinutes);
          if (a.onlineAvailable !== undefined) setOnlineAvailable(a.onlineAvailable);
          if (a.offlineAvailable !== undefined) setOfflineAvailable(a.offlineAvailable);
        }
      } catch (err) {
        console.warn('Availability fetch notice:', err.message);
      }
    };
    fetchAvailability();
  }, []);

  const handleToggleDay = (day) => {
    if (workingDays.includes(day)) {
      if (workingDays.length <= 1) {
        showError('You must retain at least one working day.');
        return;
      }
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        workingDays,
        workingHours,
        slotDurationMinutes: Number(slotDurationMinutes),
        onlineAvailable,
        offlineAvailable,
      };

      const res = await doctorService.updateAvailability(payload);
      if (res.success) {
        showSuccess('Availability schedule and time slots updated successfully!');
      }
    } catch (err) {
      showError(err.message || 'Failed to update availability schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">Manage Practice Availability</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your active consultation days, daily hours, and slot intervals for patient bookings
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Working Days Checkboxes */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              1. Active Practice Days
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {WEEKDAYS.map((day) => {
                const isSelected = workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{day.slice(0, 3)}</span>
                    <span className="text-[10px] font-normal opacity-80">
                      {isSelected ? 'Open' : 'Off'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Working Hours & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Shift Start Time
              </label>
              <input
                type="time"
                value={workingHours.start}
                onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                className="block w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Shift End Time
              </label>
              <input
                type="time"
                value={workingHours.end}
                onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                className="block w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <Select
                label="Slot Duration"
                value={slotDurationMinutes}
                onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                options={[
                  { value: 15, label: '15 Minutes' },
                  { value: 20, label: '20 Minutes' },
                  { value: 30, label: '30 Minutes (Standard)' },
                  { value: 45, label: '45 Minutes' },
                  { value: 60, label: '60 Minutes' },
                ]}
              />
            </div>
          </div>

          {/* Consultation Mode Flags */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              3. Channel Availability
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  offlineAvailable
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={offlineAvailable}
                  onChange={(e) => setOfflineAvailable(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-600" /> In-Clinic Physical Visits
                  </span>
                  <p className="text-slate-500 mt-0.5">Accept patients at your practice location</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  onlineAvailable
                    ? 'border-sky-500 bg-sky-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={onlineAvailable}
                  onChange={(e) => setOnlineAvailable(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-sky-600" /> Online Video Consultations
                  </span>
                  <p className="text-slate-500 mt-0.5">Accept remote video/telehealth sessions</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="teal"
              size="lg"
              isLoading={loading}
              icon={Save}
            >
              Save Availability Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
