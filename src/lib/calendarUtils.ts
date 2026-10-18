// Calendar integration utilities for Google Calendar and .ics download
// Follows RFC 5545 iCalendar specification

export interface CalendarEventParams {
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM - 11:00 AM"
  counsellorName?: string;
}

/**
 * Parse a date string (YYYY-MM-DD) and a time slot ("10:00 AM - 11:00 AM")
 * into start and end Date objects in local time.
 */
export function parseSlotToDates(dateStr: string, timeSlot: string): { start: Date; end: Date } {
  const [startStr, endStr] = timeSlot.split("-").map((s) => s.trim());

  const parseTime = (baseDate: string, tStr: string): Date => {
    const d = new Date(`${baseDate}T00:00:00`);
    if (!tStr) return d;
    const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return d;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridian = match[3].toUpperCase();
    if (meridian === "PM" && hours < 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const start = parseTime(dateStr, startStr);
  const end = parseTime(dateStr, endStr || startStr);
  // Default end to 1 hour after start if same
  if (end.getTime() <= start.getTime()) {
    end.setTime(start.getTime() + 60 * 60 * 1000);
  }
  return { start, end };
}

/**
 * Format Date to UTC iCalendar string: YYYYMMDDTHHMMSSZ
 */
function toIcsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Generate Google Calendar Web Add URL
 */
export function createGoogleCalendarUrl(params: CalendarEventParams): string {
  const { start, end } = parseSlotToDates(params.date, params.timeSlot);
  const startIso = toIcsUtc(start);
  const endIso = toIcsUtc(end);

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set("dates", `${startIso}/${endIso}`);
  url.searchParams.set("details", params.description);
  url.searchParams.set("location", params.location);
  return url.toString();
}

/**
 * Generate and trigger download of an RFC 5545 .ics file
 */
export function downloadIcsFile(params: CalendarEventParams): void {
  const { start, end } = parseSlotToDates(params.date, params.timeSlot);
  const startUtc = toIcsUtc(start);
  const endUtc = toIcsUtc(end);
  const nowUtc = toIcsUtc(new Date());
  const uid = `appt_${Date.now()}@inspiria-careers.com`;

  // Escape special chars for ICS (newlines to \n, commas/semicolons escaped)
  const cleanSummary = (params.title || "Career Counselling Session").replace(/[,;]/g, " ");
  const cleanDesc = (params.description || "Career & Academic Guidance Consultation")
    .replace(/\r\n|\n|\r/g, "\\n")
    .replace(/[,;]/g, " ");
  const cleanLoc = (params.location || "Online").replace(/[,;]/g, " ");

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Inspiria Careers//Consultation Scheduling//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${cleanLoc}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Upcoming Counselling Session Tomorrow",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const icsContent = icsLines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `counselling_session_${params.date}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
