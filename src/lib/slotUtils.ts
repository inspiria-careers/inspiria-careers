// Helper to generate dynamic time slots based on weekly schedule, duration & buffer

export interface ScheduleDay {
  enabled: boolean;
  start: string; // "10:00"
  end: string;   // "18:00"
}

export const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function formatTime12h(hours: number, minutes: number): string {
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, "0");
  return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
}

export function generateDailySlots(
  startTimeStr: string,
  endTimeStr: string,
  durationMinutes: number = 45,
  bufferMinutes: number = 15
): string[] {
  const [startH, startM] = startTimeStr.split(":").map(Number);
  const [endH, endM] = endTimeStr.split(":").map(Number);

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const slots: string[] = [];
  let current = startTotal;

  while (current + durationMinutes <= endTotal) {
    const slotStartH = Math.floor(current / 60);
    const slotStartM = current % 60;
    const slotEndH = Math.floor((current + durationMinutes) / 60);
    const slotEndM = (current + durationMinutes) % 60;

    slots.push(`${formatTime12h(slotStartH, slotStartM)} - ${formatTime12h(slotEndH, slotEndM)}`);
    current += durationMinutes + bufferMinutes;
  }

  return slots;
}

export function getAvailableSlotsForDate(
  dateStr: string,
  weeklySchedule?: Record<string, ScheduleDay>,
  durationMinutes: number = 45,
  bufferMinutes: number = 15
): { isDayAvailable: boolean; slots: string[] } {
  if (!dateStr) return { isDayAvailable: false, slots: [] };

  const d = new Date(dateStr + "T00:00:00");
  const dayName = DAYS_OF_WEEK[d.getDay()];

  const defaultSchedule: Record<string, ScheduleDay> = {
    monday: { enabled: true, start: "10:00", end: "18:00" },
    tuesday: { enabled: true, start: "10:00", end: "18:00" },
    wednesday: { enabled: true, start: "10:00", end: "18:00" },
    thursday: { enabled: true, start: "10:00", end: "18:00" },
    friday: { enabled: true, start: "10:00", end: "18:00" },
    saturday: { enabled: true, start: "10:00", end: "15:00" },
    sunday: { enabled: false, start: "10:00", end: "14:00" },
  };

  const schedule = weeklySchedule?.[dayName] || defaultSchedule[dayName];
  if (!schedule || !schedule.enabled) {
    return { isDayAvailable: false, slots: [] };
  }

  const slots = generateDailySlots(
    schedule.start,
    schedule.end,
    durationMinutes,
    bufferMinutes
  );

  return { isDayAvailable: true, slots };
}
