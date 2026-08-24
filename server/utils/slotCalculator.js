/**
 * Helper to generate time slots and filter out already-booked slots
 */
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutesTotal) {
  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Generate slots for a doctor given availability config and booked appointments
 */
function generateAvailableSlots({
  workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  workingHours = { start: '09:00', end: '17:00' },
  slotDurationMinutes = 30,
  targetDateStr, // YYYY-MM-DD
  bookedSlots = [], // Array of time strings like ["09:00", "09:30"]
}) {
  const targetDate = new Date(targetDateStr);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[targetDate.getDay()];

  if (!workingDays.includes(dayOfWeek)) {
    return {
      isWorkingDay: false,
      dayOfWeek,
      slots: [],
    };
  }

  const startMinutes = parseTime(workingHours.start || '09:00');
  const endMinutes = parseTime(workingHours.end || '17:00');
  const duration = slotDurationMinutes || 30;

  const slots = [];
  for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
    const slotTime = formatTime(current);
    const isBooked = bookedSlots.includes(slotTime);
    slots.push({
      time: slotTime,
      isAvailable: !isBooked,
    });
  }

  return {
    isWorkingDay: true,
    dayOfWeek,
    slots,
  };
}

module.exports = {
  generateAvailableSlots,
  parseTime,
  formatTime,
};
