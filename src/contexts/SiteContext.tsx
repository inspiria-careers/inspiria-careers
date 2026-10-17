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

  // Organisation
  siteName: string;
  siteLogo: string; // URL or base64
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

  // Footer legal
  privacyPolicyUrl: string;
  copyrightText: string;
  developedBy: string;
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
  siteName: "Inspiria Careers",
  siteLogo: "",
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
  privacyPolicyUrl: "/privacy",
  copyrightText: "",
  developedBy: "GAURAV SHUKLA",
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
const FIRESTORE_DOC = "siteContent/settings";

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
