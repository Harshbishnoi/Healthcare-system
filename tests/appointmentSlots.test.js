const { generateAvailableSlots, parseTime, formatTime } = require('../utils/slotCalculator');

describe('Phase 5: Appointment Slots & Double-Booking Collision Prevention Unit Tests', () => {
  it('should correctly parse and format time conversions', () => {
    expect(parseTime('09:30')).toBe(570);
    expect(parseTime('17:00')).toBe(1020);
    expect(formatTime(570)).toBe('09:30');
    expect(formatTime(1020)).toBe('17:00');
  });

  it('should generate 30-minute intervals from 09:00 to 11:00 and mark booked slots as unavailable', () => {
    // 2026-08-24 is a Monday
    const result = generateAvailableSlots({
      workingDays: ['Monday', 'Tuesday', 'Wednesday'],
      workingHours: { start: '09:00', end: '11:00' },
      slotDurationMinutes: 30,
      targetDateStr: '2026-08-24',
      bookedSlots: ['09:30'], // Simulate that 09:30 is already booked by another patient
    });

    expect(result.isWorkingDay).toBe(true);
    expect(result.slots.length).toBe(4); // 09:00, 09:30, 10:00, 10:30

    expect(result.slots[0]).toEqual({ time: '09:00', isAvailable: true });
    expect(result.slots[1]).toEqual({ time: '09:30', isAvailable: false }); // Booked!
    expect(result.slots[2]).toEqual({ time: '10:00', isAvailable: true });
    expect(result.slots[3]).toEqual({ time: '10:30', isAvailable: true });
  });

  it('should return isWorkingDay false when date falls on a non-working day', () => {
    // 2026-08-30 is a Sunday
    const result = generateAvailableSlots({
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 30,
      targetDateStr: '2026-08-30',
      bookedSlots: [],
    });

    expect(result.isWorkingDay).toBe(false);
    expect(result.slots).toEqual([]);
  });
});
