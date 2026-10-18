// Bilingual (Hindi + English) safe email templates for appointment lifecycle
// PRIVACY NOTICE: In accordance with core principles, these templates deliberately omit sensitive client questions or notes.

export interface EmailData {
  clientName: string;
  serviceTitle: string;
  counsellorName?: string;
  date: string;
  timeSlot: string;
  mode: string;
  meetingLink?: string;
  officeAddress?: string;
}

export function getBookingReceivedEmail(data: EmailData) {
  const subject = `Appointment Request Received: ${data.serviceTitle} | Inspiria Careers`;
  const text = `
Dear ${data.clientName},

Thank you for requesting an appointment for "${data.serviceTitle}".
Your request has been received and is currently under review by our counsellor${data.counsellorName ? ` (${data.counsellorName})` : ""}.

Session Details Requested:
• Service: ${data.serviceTitle}
• Date: ${data.date}
• Time Slot: ${data.timeSlot}
• Mode: ${data.mode}

You will receive an official confirmation shortly once the slot is reviewed.

--
नमस्ते ${data.clientName},
आपकी परामर्श अपॉइंटमेंट का अनुरोध प्राप्त हो गया है। काउंसलर द्वारा पुष्टि होते ही आपको सूचित किया जाएगा।

Best regards,
Inspiria Careers
`;
  return { subject, text };
}

export function getBookingConfirmedEmail(data: EmailData) {
  const subject = `Appointment Confirmed: ${data.serviceTitle} on ${data.date} | Inspiria Careers`;
  const locationInfo =
    data.mode === "Online"
      ? `• Meeting Link: ${data.meetingLink || "Will be shared prior to session"}`
      : `• Office Location: ${data.officeAddress || "Counselling Office"}`;

  const text = `
Dear ${data.clientName},

Your appointment for "${data.serviceTitle}" is CONFIRMED.

Confirmed Session Details:
• Date: ${data.date}
• Time Slot: ${data.timeSlot}
• Mode: ${data.mode}
${locationInfo}

Please ensure you are ready 5 minutes prior to the scheduled time.

--
नमस्ते ${data.clientName},
आपकी अपॉइंटमेंट की पुष्टि हो गई है। कृपया निर्धारित समय से 5 मिनट पहले तैयार रहें।

Best regards,
Inspiria Careers
`;
  return { subject, text };
}

export function getBookingCancelledEmail(data: EmailData) {
  const subject = `Appointment Cancelled: ${data.serviceTitle} on ${data.date} | Inspiria Careers`;
  const text = `
Dear ${data.clientName},

Your consultation appointment for "${data.serviceTitle}" scheduled for ${data.date} (${data.timeSlot}) has been cancelled.

If you would like to reschedule or have questions, please visit our website to select an alternate slot or reach out to us directly.

--
नमस्ते ${data.clientName},
आपकी ${data.date} की अपॉइंटमेंट रद्द कर दी गई है। नया समय चुनने के लिए कृपया वेबसाइट पर जाएं।

Best regards,
Inspiria Careers
`;
  return { subject, text };
}

export function getBookingRescheduledEmail(data: EmailData) {
  const subject = `Appointment Rescheduled: ${data.serviceTitle} | Inspiria Careers`;
  const locationInfo =
    data.mode === "Online"
      ? `• Meeting Link: ${data.meetingLink || "Available in client portal"}`
      : `• Office Location: ${data.officeAddress || "Counselling Office"}`;

  const text = `
Dear ${data.clientName},

Your consultation session for "${data.serviceTitle}" has been rescheduled.

Updated Session Details:
• New Date: ${data.date}
• New Time Slot: ${data.timeSlot}
• Mode: ${data.mode}
${locationInfo}

--
नमस्ते ${data.clientName},
आपके परामर्श सत्र का समय पुनर्निर्धारित (rescheduled) कर दिया गया है। नई तारीख: ${data.date}, समय: ${data.timeSlot}।

Best regards,
Inspiria Careers
`;
  return { subject, text };
}

export function getAppointmentReminderEmail(data: EmailData) {
  const subject = `Reminder: Upcoming Counselling Session Tomorrow (${data.date}) | Inspiria Careers`;
  const locationInfo =
    data.mode === "Online"
      ? `• Meeting Link: ${data.meetingLink || "Please log into client dashboard to join"}`
      : `• Office Location: ${data.officeAddress || "Counselling Office"}`;

  const text = `
Dear ${data.clientName},

This is a gentle reminder that your 1-on-1 career consultation session is scheduled for tomorrow.

Session Details:
• Service: ${data.serviceTitle}
• Date: ${data.date}
• Time: ${data.timeSlot}
• Mode: ${data.mode}
${locationInfo}

All discussions are strictly confidential. We look forward to guiding you.

--
नमस्ते ${data.clientName},
यह एक अनुस्मारक है कि आपका परामर्श सत्र कल (${data.date}) निर्धारित है।

Best regards,
Inspiria Careers
`;
  return { subject, text };
}
