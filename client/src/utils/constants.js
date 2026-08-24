export const SPECIALIZATIONS = [
  'All Specializations',
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Neurology',
  'ENT (Otolaryngology)',
  'Psychiatry',
  'Gastroenterology',
  'Ophthalmology',
];

export const CITIES = [
  'All Cities',
  'New York',
  'San Francisco',
  'Chicago',
  'Austin',
  'Seattle',
  'Boston',
  'Los Angeles',
  'Houston',
  'Denver',
];

export const CONSULTATION_MODES = [
  { value: 'all', label: 'All Modes' },
  { value: 'offline', label: 'In-Person / Clinic' },
  { value: 'online', label: 'Video / Online' },
];

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const APPOINTMENT_STATUS_CONFIG = {
  pending: {
    label: 'Pending Confirmation',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};
