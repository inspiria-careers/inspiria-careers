"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Lang } from "@/translations";

// ── TYPES ────────────────────────────────────────────────────────
export interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  fee?: number;
}

export interface GalleryItem {
  id: string;
  type: "photo" | "video";
  url: string;
  caption: string;
  category: string;
}

export interface SiteProfile {
  // Counsellor identity
  counsellorName: string;
  counsellorTitle: string;
  counsellorPhoto: string; // URL or base64
  counsellorBio: string;
  qualifications: string; // Free text, newline-separated
  specializations: string; // comma-separated
  badge1: string;
  badge2: string;
  badge3: string;
  yearsExperience: string;
  studentsGuided: string;
  successRate: string;

  // Organisation & Branding (Phase 4)
  siteName: string;
  siteLogo: string; // URL or base64
  siteLogoDark?: string;
  siteLogoAlt?: string;
  siteFavicon?: string;
  tagline: string;
  subTagline: string;
  announcement: string; // ticker text

  // Contact
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  officeHours: string;

  // Social
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  twitter: string;

  // Theme (2 brand colours + font)
  brandPrimary: string;   // e.g. "#1a3a8f"
  brandSecondary: string; // e.g. "#c9a84c"
  fontFamily?: string;
  preset?: string;

  // Appointments & Booking Settings (Phase 3)
  cancellationCutoffHours: number; // e.g. 24
  blockedDates: string[];          // e.g. ["2026-10-25", "2026-11-01"]

  // Manual QR & UPI Payments Settings (Phase 4)
  paymentsEnabled: boolean;
  defaultConsultationFee?: number; // Standard consultation booking fee in INR (e.g. 500)
  paymentQr?: string;             // QR code image URL / base64
  upiId?: string;                 // e.g. counsellor@oksbi
  payeeName?: string;             // e.g. Dr. Ananya Sharma
  refundPolicyText?: string;      // Editable refund policy text

  // Professional Identity & Trust (Phase 5)
  professionalRegNumber?: string; // e.g. RCI / NCS / University Registration

  // Informed Consent (Phase 5)
  consentText: string;
  consentVersion: number;

  // Smarter Scheduling & Weekly Slots (Phase 5)
  slotDurationMinutes: number; // e.g. 45
  slotBufferMinutes: number;   // e.g. 15
  weeklySchedule?: Record<string, { enabled: boolean; start: string; end: string }>;

  // Trust & Safety: FAQs and Helplines (Phase 5)
  faqList?: Array<{
    id: string;
    category: "booking" | "privacy" | "formats" | "payments";
    questionEn: string;
    questionHi: string;
    answerEn: string;
    answerHi: string;
  }>;
  emergencyHelplines?: Array<{
    id: string;
    name: string;
    number: string;
    descEn: string;
    descHi: string;
    available: string;
  }>;

  // Footer legal & customization
  privacyPolicyUrl: string;
  termsOfServiceUrl?: string;
  copyrightText: string;
  developedBy: string;
  footerTagline?: string;
  footerDisclaimer?: string;

  // ── Phase 6: Optional Add-ons (all off by default) ──────────────

  // Part A: Secure Async Messaging
  messagingEnabled: boolean;
  messagingResponseTimeText?: string; // Editable counsellor response time notice

  // Part C: WhatsApp / SMS Reminders (dry-run by default)
  smsRemindersEnabled: boolean;

  // Part E: Private Session Feedback & Follow-up
  feedbackEnabled: boolean;

  // Part F: Newsletter / Email Tips
  newsletterEnabled: boolean;

  // Phase 7: Maintenance Mode & System Reliability
  maintenanceMode?: boolean;
  maintenanceNoticeText?: string;
}

export const EMPTY_PROFILE: SiteProfile = {
  counsellorName: "",
  counsellorTitle: "",
  counsellorPhoto: "",
  counsellorBio: "",
  qualifications: "",
  specializations: "",
  badge1: "",
  badge2: "",
  badge3: "",
  yearsExperience: "",
  studentsGuided: "",
  successRate: "",
  professionalRegNumber: "",
  siteName: "Inspiria Careers",
  siteLogo: "",
  siteLogoDark: "",
  siteLogoAlt: "",
  siteFavicon: "",
  tagline: "",
  subTagline: "",
  announcement: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  officeHours: "",
  facebook: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  twitter: "",
  brandPrimary: "#1a3a8f",
  brandSecondary: "#c9a84c",
  cancellationCutoffHours: 24,
  blockedDates: [],
  paymentsEnabled: false,
  defaultConsultationFee: 0,
  paymentQr: "",
  upiId: "",
  payeeName: "",
  refundPolicyText: "Appointments cancelled at least 24 hours in advance are eligible for a full refund or free rescheduling.",
  consentText: "I acknowledge that career and emotional counselling is a collaborative and developmental process. All shared disclosures are held in strict professional confidentiality under Indian data protection standards, except where disclosure is mandated by law to prevent imminent harm. I understand that this service does not provide acute psychiatric emergency or crisis intervention.",
  consentVersion: 1,
  slotDurationMinutes: 45,
  slotBufferMinutes: 15,
  weeklySchedule: {
    monday: { enabled: true, start: "10:00", end: "18:00" },
    tuesday: { enabled: true, start: "10:00", end: "18:00" },
    wednesday: { enabled: true, start: "10:00", end: "18:00" },
    thursday: { enabled: true, start: "10:00", end: "18:00" },
    friday: { enabled: true, start: "10:00", end: "18:00" },
    saturday: { enabled: true, start: "10:00", end: "15:00" },
    sunday: { enabled: false, start: "10:00", end: "14:00" },
  },
  faqList: [
    {
      id: "faq-1",
      category: "privacy",
      questionEn: "How is my counselling session kept confidential?",
      questionHi: "मेरा परामर्श सत्र किस प्रकार गोपनीय रखा जाता है?",
      answerEn: "All personal disclosures, session notes, and shared documents are strictly protected with encrypted, least-privilege security controls. Admin staff have zero access to clinical notes or personal reflections.",
      answerHi: "आपकी सभी व्यक्तिगत बातें, सत्र नोट्स और साझा दस्तावेज़ सुरक्षित एन्क्रिप्शन के साथ सुरक्षित रहते हैं। व्यवस्थापकों (एडमिन) को आपके क्लिनिकल नोट्स देखने की अनुमति नहीं है।"
    },
    {
      id: "faq-2",
      category: "booking",
      questionEn: "How do I reschedule or cancel my appointment?",
      questionHi: "मैं अपनी अपॉइंटमेंट कैसे बदल या रद्द कर सकता हूँ?",
      answerEn: "You can request a reschedule or cancel your session from your Client Dashboard up to 24 hours before the scheduled time.",
      answerHi: "आप सत्र के निर्धारित समय से 24 घंटे पहले तक अपने क्लाइंट डैशबोर्ड से रीशेड्यूल या रद्दीकरण का अनुरोध कर सकते हैं।"
    },
    {
      id: "faq-3",
      category: "formats",
      questionEn: "What happens during an Online session?",
      questionHi: "ऑनलाइन सत्र के दौरान क्या होता है?",
      answerEn: "Once your appointment is confirmed, a secure video meeting link (Google Meet / Zoom) will appear in your Client Dashboard and will be sent via calendar invite.",
      answerHi: "अपॉइंटमेंट कन्फर्म होते ही आपके क्लाइंट डैशबोर्ड में सुरक्षित वीडियो मीटिंग लिंक उपलब्ध हो जाएगा और कैलेंडर में भी भेजा जाएगा।"
    },
    {
      id: "faq-4",
      category: "payments",
      questionEn: "How does the manual QR payment work?",
      questionHi: "मैनुअल क्यूआर भुगतान कैसे काम करता है?",
      answerEn: "You scan the verified counsellor UPI QR code using any UPI app (GPay, PhonePe, Paytm, BHIM), pay the fee, and enter your 12-digit bank UTR / Ref number. Once verified, your slot is confirmed.",
      answerHi: "आप किसी भी यूपीआई ऐप से काउंसलर के क्यूआर कोड को स्कैन करके शुल्क भरते हैं और 12-अंकों का यूटीआर नंबर दर्ज करते हैं। सत्यापन के बाद स्लॉट कन्फर्म हो जाता है।"
    }
  ],
  emergencyHelplines: [
    {
      id: "help-1",
      name: "Tele-MANAS (MoHFW, Govt of India)",
      number: "14416",
      descEn: "24×7 National Tele Mental Health Helpline across Indian languages",
      descHi: "24×7 राष्ट्रीय टेली मेंटल हेल्थ हेल्पलाइन (भारत सरकार)",
      available: "24×7 (Toll-Free)"
    },
    {
      id: "help-2",
      name: "KIRAN Helpline",
      number: "1800-599-0019",
      descEn: "Ministry of Social Justice & Empowerment mental health rehabilitation",
      descHi: "सामाजिक न्याय और अधिकारिता मंत्रालय मानसिक स्वास्थ्य हेल्पलाइन",
      available: "24×7 (Toll-Free)"
    },
    {
      id: "help-3",
      name: "iCall Psychosocial Helpline",
      number: "9152987821",
      descEn: "Tata Institute of Social Sciences (TISS) professional counselling",
      descHi: "टाटा इंस्टीट्यूट ऑफ सोशल साइंसेज (TISS) मनोवैज्ञानिक परामर्श",
      available: "Mon–Sat, 8:00 AM – 10:00 PM"
    },
    {
      id: "help-4",
      name: "Vandrevala Foundation Helpline",
      number: "9999 666 555",
      descEn: "24×7 Crisis intervention & mental wellness support",
      descHi: "24×7 क्राइसिस इंटरवेंशन व मानसिक स्वास्थ्य सहायता",
      available: "24×7"
    },
    {
      id: "help-5",
      name: "National Emergency Number",
      number: "112",
      descEn: "All-in-one emergency response (Police, Ambulance, Fire)",
      descHi: "एकीकृत आपातकालीन सेवा (पुलिस, एम्बुलेंस, दमकल)",
      available: "24×7"
    }
  ],
  privacyPolicyUrl: "/privacy",
  termsOfServiceUrl: "/privacy",
  copyrightText: "",
  developedBy: "GAURAV SHUKLA",
  footerTagline: "",
  footerDisclaimer: "",

  // Phase 6 flags — all OFF by default
  messagingEnabled: false,
  messagingResponseTimeText: "1-2 working days",
  smsRemindersEnabled: false,
  feedbackEnabled: false,
  newsletterEnabled: false,

  // Phase 7: Maintenance Mode & System Reliability
  maintenanceMode: false,
  maintenanceNoticeText: "We are currently conducting scheduled system maintenance. New appointment bookings are temporarily paused. If you need urgent support, please visit our Emergency page.",
};

interface SiteContextType {
  profile: SiteProfile;
  services: ServiceItem[];
  gallery: GalleryItem[];
  lang: Lang;
  setLang: (l: Lang) => void;
  loading: boolean;
  updateProfile: (partial: Partial<SiteProfile>) => Promise<void>;
  updateServices: (items: ServiceItem[]) => Promise<void>;
  updateGallery: (items: GalleryItem[]) => Promise<void>;
}

const SiteContext = createContext<SiteContextType>({} as SiteContextType);
export const useSite = () => useContext(SiteContext);

const STORAGE_KEY = "ic_site_v2";

// ── PROVIDER ─────────────────────────────────────────────────────
export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<SiteProfile>(EMPTY_PROFILE);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [lang, setLangState] = useState<Lang>("en");
  const [loading, setLoading] = useState(true);

  // Apply brand colours to CSS variables
  const applyTheme = useCallback((p: SiteProfile) => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty("--brand-primary", p.brandPrimary || "#1a3a8f");
    document.documentElement.style.setProperty("--brand-secondary", p.brandSecondary || "#c9a84c");
    if (p.fontFamily) {
      document.documentElement.style.setProperty("--font", p.fontFamily);
    }
  }, []);

  useEffect(() => {
    // 1. Try localStorage first for instant paint
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const c = JSON.parse(cached);
          if (c.profile) { setProfile(c.profile); applyTheme(c.profile); }
          if (c.services) setServices(c.services);
          if (c.gallery) setGallery(c.gallery);
        }
      } catch {}
    }

    // 2. Fetch from Firestore with 3s timeout
    const load = async () => {
      try {
        const snap = (await Promise.race([
          getDoc(doc(db, "siteContent", "settings")),
          new Promise<null>((_, r) => setTimeout(() => r(null), 3000)),
        ])) as Awaited<ReturnType<typeof getDoc>> | null;

        if (snap && snap.exists()) {
          const d = snap.data() as Record<string, any>;
          const p: SiteProfile = { ...EMPTY_PROFILE, ...(d.profile ?? {}) };
          const sv: ServiceItem[] = d.services ?? [];
          const gv: GalleryItem[] = d.gallery ?? [];
          setProfile(p);
          setServices(sv);
          setGallery(gv);
          applyTheme(p);
          // Cache
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile: p, services: sv, gallery: gv }));
          }
        }
      } catch {}
      setLoading(false);
    };

    load();
  }, [applyTheme]);

  // Cross-tab sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const c = JSON.parse(e.newValue);
        if (c.profile) { setProfile(c.profile); applyTheme(c.profile); }
        if (c.services) setServices(c.services);
        if (c.gallery) setGallery(c.gallery);
      } catch {}
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [applyTheme]);

  const persist = useCallback(
    async (p: SiteProfile, sv: ServiceItem[], gv: GalleryItem[]) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile: p, services: sv, gallery: gv }));
      }
      try {
        await Promise.race([
          setDoc(doc(db, "siteContent", "settings"), { profile: p, services: sv, gallery: gv }, { merge: true }),
          new Promise<void>((res) => setTimeout(res, 2500)),
        ]);
      } catch {}
    },
    []
  );

  const updateProfile = useCallback(
    async (partial: Partial<SiteProfile>) => {
      const updated = { ...profile, ...partial };
      setProfile(updated);
      applyTheme(updated);
      await persist(updated, services, gallery);
    },
    [profile, services, gallery, applyTheme, persist]
  );

  const updateServices = useCallback(
    async (items: ServiceItem[]) => {
      setServices(items);
      await persist(profile, items, gallery);
    },
    [profile, gallery, persist]
  );

  const updateGallery = useCallback(
    async (items: GalleryItem[]) => {
      setGallery(items);
      await persist(profile, services, items);
    },
    [profile, services, persist]
  );

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("ic_lang", l);
  }, []);

  // Restore lang preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ic_lang");
      if (saved === "en" || saved === "hi") setLangState(saved);
    }
  }, []);

  return (
    <SiteContext.Provider
      value={{ profile, services, gallery, lang, setLang, loading, updateProfile, updateServices, updateGallery }}
    >
      {children}
    </SiteContext.Provider>
  );
}
