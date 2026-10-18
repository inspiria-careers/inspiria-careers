// src/lib/reminderService.ts
// Provider-agnostic reminder abstraction (Phase 6, Part C)
// Currently runs in DRY-RUN mode — no paid provider connected.
// To connect WhatsApp/SMS: implement sendActual() and set REMINDER_PROVIDER env.

export type ReminderChannel = "whatsapp" | "sms" | "none";

export interface ReminderPayload {
  to: string;           // Phone number (E.164 recommended)
  channel: ReminderChannel;
  templateKey: "appointment_reminder" | "followup_nudge";
  variables: {
    clientName: string;
    appointmentTime: string; // e.g. "09:30 AM"
    appointmentDate: string; // e.g. "Monday, Oct 18"
    lang: "en" | "hi";
  };
}

// Bilingual minimal templates — zero sensitive clinical detail
const TEMPLATES = {
  appointment_reminder: {
    en: (v: ReminderPayload["variables"]) =>
      `Hello ${v.clientName}, your appointment is tomorrow at ${v.appointmentTime} on ${v.appointmentDate}. — Inspiria Careers`,
    hi: (v: ReminderPayload["variables"]) =>
      `नमस्ते ${v.clientName}, आपका परामर्श सत्र कल ${v.appointmentDate} को ${v.appointmentTime} पर है। — Inspiria Careers`,
  },
  followup_nudge: {
    en: (v: ReminderPayload["variables"]) =>
      `Hello ${v.clientName}, your counsellor has suggested a follow-up session. Visit Inspiria Careers to book. — Inspiria Careers`,
    hi: (v: ReminderPayload["variables"]) =>
      `नमस्ते ${v.clientName}, आपके काउंसलर ने फॉलो-अप सत्र का सुझाव दिया है। बुक करने के लिए Inspiria Careers देखें।`,
  },
};

/**
 * Send a reminder notification.
 * Currently always runs in DRY-RUN mode (logs to console).
 * NEVER logs message content to any analytics or third-party service.
 */
export async function sendReminder(payload: ReminderPayload): Promise<void> {
  const { templateKey, variables, channel, to } = payload;
  const lang = variables.lang ?? "en";
  const messageText = TEMPLATES[templateKey][lang](variables);

  // DRY-RUN: log to console — no network request to any third-party
  console.log(`[ReminderService DRY-RUN] channel=${channel}, to=${to}`);
  console.log(`[ReminderService DRY-RUN] message length=${messageText.length} chars`);
  // NOTE: Message content is intentionally NOT logged to protect privacy.

  // FUTURE: When you have a provider API key, implement:
  // if (process.env.REMINDER_PROVIDER === "whatsapp") {
  //   await sendViaWhatsAppCloudAPI(to, messageText);
  // } else if (process.env.REMINDER_PROVIDER === "sms") {
  //   await sendViaSmsProvider(to, messageText);
  // }
}
