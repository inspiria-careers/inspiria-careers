// Phase 5 TypeScript Interfaces and Data Types

export type AgeGroup = "under_18" | "18_24" | "25_34" | "35_plus";
export type SessionPurpose = "career" | "academic" | "emotional" | "personal" | "other";
export type PreferredLanguage = "en" | "hi" | "either";

export interface ClientIntake {
  userId: string;
  clientName: string;
  clientEmail: string;
  ageGroup: AgeGroup;
  city: string;
  purpose: SessionPurpose;
  purposeDetails: string;
  previousCounselling: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  preferredLanguage: PreferredLanguage;
  // Under-18 safeguards
  parentName?: string;
  parentPhone?: string;
  parentConsentConfirmed?: boolean;
  // Versioned Informed Consent
  consentAccepted: boolean;
  consentVersion: number;
  consentAcceptedAt: string;
  updatedAt: string;
}

export interface SessionNote {
  id: string;
  appointmentId: string;
  userId: string;
  clientName: string;
  sessionDate: string;
  summary: string;
  keyObservations: string;
  homeworkTasks: string;
  nextSessionRecommendation: string;
  status: "draft" | "final";
  createdAt: string;
  updatedAt: string;
  version: number;
  history?: Array<{
    timestamp: string;
    summary: string;
  }>;
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: "career" | "wellness" | "exam_prep" | "mindfulness" | "other";
  type: "pdf" | "link" | "audio" | "article" | "video";
  url: string;
  content?: string;
  visibility: "public" | "client_only";
  createdAt: string;
}

export interface ClientTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  reflection?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  mood: number; // 1 to 5
  moodLabel: string;
  reflection: string;
  gratitude: string;
  sharedWithCounsellor: boolean;
  createdAt: string;
}

export interface WorkshopItem {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  durationMinutes: number;
  mode: "online" | "in_person";
  meetingLink?: string;
  venue?: string;
  fee: number;
  maxSeats: number;
  bannerImage?: string;
  status: "upcoming" | "completed" | "cancelled";
  createdAt: string;
}

export interface WorkshopRegistration {
  id: string;
  workshopId: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  status: "confirmed" | "waitlist" | "cancelled";
  paymentStatus: "free" | "pending" | "submitted" | "verified" | "rejected";
  utr?: string;
  receiptNumber?: string;
  attendance: "pending" | "attended" | "absent";
  registeredAt: string;
}

export interface DeletionRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason?: string;
  status: "pending" | "completed" | "rejected";
  requestedAt: string;
  processedAt?: string;
}

export interface FaqItem {
  id: string;
  category: "booking" | "privacy" | "formats" | "payments";
  questionEn: string;
  questionHi: string;
  answerEn: string;
  answerHi: string;
}

export interface HelplineItem {
  id: string;
  name: string;
  number: string;
  descEn: string;
  descHi: string;
  available: string;
  tollFree?: boolean;
}

// ── Phase 6 Types ─────────────────────────────────────────────────

// Part A: Secure Async Messaging
export interface ThreadMessage {
  id: string;
  threadId: string; // = clientId
  senderId: string;
  senderRole: "client" | "counsellor";
  text: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string; // MIME type
  createdAt: string; // ISO
  editedAt?: string;
  deletedAt?: string; // soft-delete
  deleted?: boolean;
}

// Part C: WhatsApp / SMS Reminder Preferences
export interface ReminderPreference {
  userId: string;
  optedIn: boolean;       // User explicitly opted in
  phone?: string;         // Optional — user's whatsapp/sms number
  preferredChannel: "whatsapp" | "sms" | "none";
  updatedAt: string;
}

// Part E: Private Session Feedback
export interface SessionFeedback {
  id: string;
  appointmentId: string;
  clientId: string;
  rating: number; // 1–5
  helpfulness: string;
  improvements: string;
  wouldReturn: boolean;
  submittedAt: string;
}

// Part F: Newsletter Subscriber
export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  confirmed: boolean;         // double opt-in
  confirmationToken: string;
  unsubscribeToken: string;
  subscribedAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  active: boolean;
}

