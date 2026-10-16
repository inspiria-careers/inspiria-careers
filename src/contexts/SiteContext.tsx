"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ServiceItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export interface HomeOptionItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  badge?: string;
  href: string;
  btnText?: string;
}

export interface SiteSettings {
  // 1. Branding & Developer Attribution
  siteName: string;
  siteLogo: string; // Brand logo image URL, Base64 Data URI, or Emoji
  divisionTitle: string; // e.g. "e-Counselling Division"
  topGovTextLeft: string; // e.g. "GOVERNMENT ACCREDITED COUNSELING CELL | EDUCATIONAL & CAREER GUIDANCE DIVISION"
  accreditationTitle: string; // e.g. "National Guidance Centre"
  accreditationSub: string; // e.g. "राष्ट्रीय मार्गदर्शन प्रकोष्ठ"
  tagline: string;
  subtagline: string;
  developedByText: string; // e.g. "Designed & Developed by Atul Sharma"
  developedByLink: string; // e.g. "https://github.com" or portfolio link
  copyrightText: string; // e.g. "All rights reserved. Designed for Excellence in Student Mentorship & Admission Transparency."

  // Dynamic Navigation Links (Add, Rename, Reorder Navbar Options)
  navLinks: NavItem[];

  // Dynamic Home Page Module Options
  homeOptionsTitle?: string;
  homeOptionsSubtitle?: string;
  homeOptions: HomeOptionItem[];

  // 2. Counselor Profile
  principalName: string;
  principalDesignation: string; // e.g. "Senior Educational & Career Counselor | M.Ed & Child Psychologist"
  principalPhoto: string; // Passport size image URL or Base64 Data URI
  counselorBadge1: string; // e.g. "Academic Mentor"
  counselorBadge2: string; // e.g. "Adolescent Coach"
  counselorBadge3: string; // e.g. "Global Advisory"

  // 3. About Section, Undertaken Activities & Philosophy
  aboutTitle: string;
  aboutBio: string;
  aboutContent: string; // Detailed About Us story and vision
  philosophy: string;
  reasonForAppeal: string;
  counsellingExperience: string;
  partnersExperience: string;
  dematAccountAnalogy: string;
  socraticApproach: string;
  undertakenActivity1: string;
  undertakenActivity2: string;
  undertakenActivity3: string;
  fiveYearGoalsTitle: string;

  // 4. Portal Statistics Counters
  studentsGuided: string;
  studentsGuidedLabel: string;
  yearsExperience: string;
  yearsExperienceLabel: string;
  successRate: string;
  successRateLabel: string;
  statMetric4Value: string;
  statMetric4Label: string;

  // 5. Ticker & Homepage Mandate
  tickerTag: string; // e.g. "LATEST ANNOUNCEMENTS"
  tickerText: string; // e.g. "📢 Admissions & Career Counseling 2026-27 Registrations Open..."
  mandateText: string; // Introductory mandate text
  mandateBtnText: string; // e.g. "View More →"

  // 6. Strategic Goals & Mandates (Core Principle Cards)
  goalsSectionTag?: string;
  goalsSectionTitle?: string;
  goalsSectionSubtitle?: string;
  goal1Icon: string;
  goal1Title: string;
  goal1Desc: string;
  goal2Icon: string;
  goal2Title: string;
  goal2Desc: string;
  goal3Icon: string;
  goal3Title: string;
  goal3Desc: string;

  // 7. Services with customizable icons
  servicesSectionTag?: string;
  servicesSectionTitle?: string;
  servicesSectionSubtitle?: string;
  servicesBtnText?: string;
  services: ServiceItem[];

  // 8. Counselor Section Headings
  counselorSectionTag?: string;

  // 9. Hero Slider Banners
  slide1LeftTitle?: string;
  slide1RightTitle?: string;
  slide1CenterTagline?: string;
  slide1CateringText?: string;
  slide2LeftTitle?: string;
  slide2RightTitle?: string;
  slide2CenterTagline?: string;
  slide2CateringText?: string;
  slide3LeftTitle?: string;
  slide3RightTitle?: string;
  slide3CenterTagline?: string;
  slide3CateringText?: string;

  // 10. Call to Action Banner
  ctaTag: string;
  ctaTitle: string;
  ctaDesc: string;
  ctaBtnText: string;

  // 11. Contact Details & Helplines
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  officeHours: string;
  whatsappNumber: string;

  // 12. Social Media Links
  youtubeUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;

  // 13. Paid Session & Payment Gateway Settings
  paidSessionsEnabled: boolean;
  sessionFee: string; // e.g. "₹999" or "₹1,499"
  upiId: string; // e.g. "principal@upi" or "9876543210@paytm"
  upiQrCode: string; // Image URL or Base64 of UPI QR code
  bankHolderName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  paymentInstructions: string;

  // 14. Staff Security & Passwords
  principalPassword?: string;
  adminPassword?: string;
}

const defaultServices: ServiceItem[] = [
  {
    id: "s1",
    icon: "🎓",
    title: "Career Counseling",
    desc: "Scientific aptitude evaluation to help you choose the ideal career path aligned with your strengths, passions, and market opportunities.",
  },
  {
    id: "s2",
    icon: "📚",
    title: "Academic Guidance",
    desc: "Personalized academic planning, subject stream selection, and high-impact study strategies for board examinations.",
  },
  {
    id: "s3",
    icon: "🧠",
    title: "Mental Wellness & Composure",
    desc: "Emotional coaching to overcome exam anxiety, build stress resilience, and cultivate an unwavering growth mindset.",
  },
  {
    id: "s4",
    icon: "👨‍👩‍👧",
    title: "Parent-Child Counseling",
    desc: "Empowering parents to understand their teenager's ambitions and bridge the communication gap for a supportive home environment.",
  },
  {
    id: "s5",
    icon: "📝",
    title: "Entrance Exam Strategy",
    desc: "Strategic temperament coaching and preparation blueprints for JEE, NEET, UPSC, and central university entrance tests.",
  },
  {
    id: "s6",
    icon: "🌐",
    title: "Study Abroad Advisory",
    desc: "Comprehensive guidance for undergraduate and postgraduate admissions, scholarship applications, and global profile building.",
  },
];

export const defaultNavLinks: NavItem[] = [
  { id: "nav_1", label: "HOME", href: "/" },
  { id: "nav_2", label: "ABOUT US", href: "/about" },
  { id: "nav_3", label: "SERVICES", href: "/posts" },
  { id: "nav_4", label: "CAREER DATABASE", href: "/database" },
  { id: "nav_5", label: "WEBINARS", href: "/webinars" },
  { id: "nav_6", label: "MENTOR NETWORK", href: "/mentors" },
  { id: "nav_7", label: "AWARDS", href: "/achievements" },
  { id: "nav_8", label: "EXAMINATION", href: "/news" },
  { id: "nav_9", label: "COVERAGE", href: "/gallery" },
  { id: "nav_10", label: "TESTIMONIALS", href: "/testimonials" },
  { id: "nav_11", label: "ADMISSION", href: "/contact" },
];

export const defaultHomeOptions: HomeOptionItem[] = [
  {
    id: "opt_1",
    icon: "📊",
    title: "Detailed Career Fields Database",
    desc: "Interactive comparison of 100+ academic & professional fields with reviews, electives, and verified post-counseling journey analytics.",
    badge: "5-Year Goal #3",
    href: "/database",
    btnText: "Explore Database →",
  },
  {
    id: "opt_2",
    icon: "🎙️",
    title: "All-India Career Webinars",
    desc: "Join live orientations and masterclasses on stream selection, overcoming exam anxiety, and unlocking growth instruments.",
    badge: "Live Sessions",
    href: "/webinars",
    btnText: "View Webinars →",
  },
  {
    id: "opt_3",
    icon: "🌐",
    title: "Global Mentor & Partner Network",
    desc: "Connect with dedicated faculties, top university alumni, and industry mentors across education, sports, and entrepreneurship.",
    badge: "Global Community",
    href: "/mentors",
    btnText: "Meet Mentors →",
  },
  {
    id: "opt_4",
    icon: "💡",
    title: "Socratic Confabs & Inquisitions",
    desc: "Why do you need us? We impose diagnostic confabs that uncover what you love — making you an independent debugger of life.",
    badge: "Our Philosophy",
    href: "/about#socratic",
    btnText: "Learn Method →",
  },
  {
    id: "opt_5",
    icon: "🍕",
    title: "Zero-Doubt Global Guidance",
    desc: "Making elite career mentorship as effortless to apply and access as ordering a pizza. No doubts, full transparency.",
    badge: "Vision 2030",
    href: "/about#vision",
    btnText: "Read Vision →",
  },
  {
    id: "opt_6",
    icon: "📑",
    title: "Modular Page Template",
    desc: "Need a new custom page or department showcase? Duplicate or launch any custom module in seconds.",
    badge: "Template Ready",
    href: "/template",
    btnText: "Open Template →",
  },
];

const defaultSettings: SiteSettings = {
  // 1. Branding & Developer Attribution
  siteName: "INSPIRIA CAREERS",
  siteLogo: "/logo.jpg",
  divisionTitle: "e-Counselling Division",
  topGovTextLeft: "GOVERNMENT ACCREDITED COUNSELING CELL | EDUCATIONAL & CAREER GUIDANCE DIVISION",
  accreditationTitle: "National Guidance Centre",
  accreditationSub: "राष्ट्रीय मार्गदर्शन प्रकोष्ठ",
  tagline: "Stop Regretting, Start Solving — Career Mentorship for the Next Generation",
  subtagline: "Empowering Students to Become Independent Debuggers of Their Career, Education & Life",
  developedByText: "Designed & Developed by Atul Sharma",
  developedByLink: "https://github.com",
  copyrightText: "All rights reserved. Designed for Excellence in Student Mentorship & Admission Transparency.",

  // Dynamic Navigation Links
  navLinks: defaultNavLinks,

  // Dynamic Home Page Module Options
  homeOptionsTitle: "Interactive Guidance Modules & Quick Access Options",
  homeOptionsSubtitle: "Explore our integrated career database, global mentor network, orientation webinars, and custom institutional templates.",
  homeOptions: defaultHomeOptions,

  // 2. Counselor Profile
  principalName: "Principal Ma'am",
  principalDesignation: "Senior Educational & Career Counselor | M.Ed & Adolescent Mentor",
  principalPhoto: "/logo.jpg",
  counselorBadge1: "Independent Problem Solver",
  counselorBadge2: "Adolescent Coach",
  counselorBadge3: "Global Mentor Network",

  // 3. About Section, Undertaken Activities & Philosophy
  aboutTitle: "Being a Teacher by Love: Empowering Independent Problem Solvers",
  aboutBio:
    "Being a teacher by love inspires and directs me to guide my students with not just apposite theoretical knowledge, but to also make them independent debuggers in solving their problems. Having practiced counseling for years, Inspiria Careers was created to bring clarity on a broader horizon — ending the era of career regret and helping every student build a stock of purpose in the demat account of their life.",
  aboutContent:
    "Being a teacher by love inspires and directs me to guide my students with not just apposite theoretical knowledge, but to also make them independent debuggers in solving their problems.\n\nI have made myriad mistakes in my life, be it professionally or even at a personal level. The one thing which pinched me — and certainly does the same with 97% of people all around — is the lack of genuine and full-fledged knowledge and experience of the field of interest. We all regret and waste a good hunch of our life in the same.\n\nI have been practicing counseling for years, but now it is time to professionally implement it on a broader horizon. Despite the availability of counseling globally, umpteen students are still in the mode of regretting rather than solving. With the magnificent advancement in technology in numbers and in quality, the era of doubt in choosing the career plan will cease. This is what we aspire through Inspiria Careers.\n\nA mind once exquisitely said, 'Choose a job you love, and you will never have to work a day in your life.' Well, it is easier said than implemented. How many individuals actually mess with their gray matter to find their true love? Do we not mostly follow the populace? That's the prime reason one must have the stock of 'Career Plan' in their demat account, so-called life.\n\nTo be honest, we even as counselors do not know the true answers to the most righteous career for you. Talking pragmatically, no one knows. But then why do you need us? The answer is intelligible: we impose inquisitions upon you. History has proven innumerable times that the best methodology ever employed in resolving or optimizing a problem is having confabs with the same. We apprise you about certain parameters of choosing a plan that inspires you through, and in recoil to that, you do the same in future prospect.\n\nBeing good at an 'X' field or subject does not provide certainty of being happy. One must aspire for that which quenches both curiosity and fulfillment. In conjunction with these aspects, we administer students with a nuanced database of fields and unlock the instruments of growth — acknowledging them with the correct competitions, channels, mentors, and field directors to commence their journey.",
  philosophy:
    "Choose a job you love, and you will never have to work a day in your life. We impose the diagnostic inquisitions that uncover that love — turning students into independent debuggers of their own future.",
  reasonForAppeal:
    "Being a teacher by love inspires and directs me to guide my students with not just apposite theoretical knowledge but to also make them independent debuggers in solving their problems. I have made myriad mistakes in my life, be it professionally or even at a personal level. The one thing which pinched me and certainly does the same with 97% of people all around is the lack of genuine and full-fledged knowledge and experience of the field of interest. We all regret and waste a good hunch of our life in the same. I have been practicing counseling for years, but now it is time to professionally implement it on a broader horizon. I have been kind of hating the era of 2000' for the simple reason that despite the availability of counselors/guidance globally, umpteen students are still in the mode of regretting rather than solving. But now with the magnificent advancement in technology in numbers and in quality, the era of doubt in choosing the career plan will cease. This is what I aspire through the website.",
  counsellingExperience:
    "Over 15+ years of dedicated counseling across thousands of students. Experience encompasses high school stream selection, competitive exam composure, college major allocation, and life skills coaching for students and their families.",
  partnersExperience:
    "Assistance from faculties of different fields, associated students pursuing all X, Y, and Z motions, and indelible experiences of having gone through your seniors as a teacher and mentor. This collective network has empowered and transformed zillions of lives in both direct and second-hand terms.",
  dematAccountAnalogy:
    "A mind once exquisitely said, 'Choose a job you love, and you will never have to work a day in your life'. Well, it is easier said than implemented. How many of the individuals actually mess with their gray matter to find their true love? Do we not mostly follow the populace? Have we ever differentiated the contrast between the vocabulary, the good and enjoyable stuff before trespassing on the same? The answer indeed is rhetoric. And that's the prime reason one must have the stock of 'Career Plan' in their demat account, so-called life.",
  socraticApproach:
    "To be honest, we even as counselors do not know the true answers to the most righteous career for you. Talking pragmatically, no one knows. But then why do you need us? The answer to that too is damn intelligible: we impose inquisitions upon you. History has proven innumerable times that the best methodology ever employed in resolving or optimizing a problem is having confabs with the same. We apprise you about certain parameters of choosing a plan which inspires you through, and in recoil to that you do the same. Being good at an 'X' field does not provide certainty of being happy. We unlock the instruments of growth — acknowledging students with correct competitions, channels, mentors, and the best field directors to commence their journey.",
  undertakenActivity1:
    "Mentored hundreds of students in choosing the right field at high school and at the intermediate level of school and college. Eliminating the 97% career regret phenomenon through proactive exploration and aptitude alignment.",
  undertakenActivity2:
    "Providing associated students a thorough study of electives and disciplines preached at the college level as to what one could move on to, clarifying future trajectories and real-world industry realities.",
  undertakenActivity3:
    "Guided students at all levels, be it proficient or below average with their field of interest. Across Education, Sports, or Entrepreneurship, all connected kids are provided details, resources, and vetted mentors for the right competition or course.",
  fiveYearGoalsTitle: "Our 5-7 Year Global Expansion & Business Blueprint",

  // 4. Portal Statistics Counters
  studentsGuided: "15,000+",
  studentsGuidedLabel: "Students Mentored Nationwide",
  yearsExperience: "15+",
  yearsExperienceLabel: "Years of Educational Service",
  successRate: "98%",
  successRateLabel: "Positive Trajectory Rate",
  statMetric4Value: "100%",
  statMetric4Label: "Independent Problem Solving Focus",

  // 5. Ticker & Homepage Mandate
  tickerTag: "LATEST ANNOUNCEMENTS",
  tickerText:
    "📢 Admissions & Career Counseling 2026-27 Registrations Open · 🎯 Book 1-on-1 Direct Counseling Slot with Principal Ma'am · 🧠 Diagnostic Stream & Elective Roadmaps for High School & College Students · 🚀 Guidance Across Academics, Sports & Entrepreneurship",
  mandateText:
    "The Inspiria Careers eCounselling Solution is built to establish a global standard in career counseling over the next 5-7 years — ensuring every student and parent has access to genuine guidance as easily as ordering a pizza. Designed to cease the era of doubt and career regret, the platform connects world-class mentors, integrates a detailed database of fields and peer reviews, and prepares students to become independent problem solvers in education, sports, and entrepreneurship.",
  mandateBtnText: "View More →",

  // 6. Strategic Goals & Mandates (Core Principle Cards)
  goalsSectionTag: "Undertaken Activities & Vision",
  goalsSectionTitle: "Core Mandates & Mentorship Activities",
  goalsSectionSubtitle: "Empowering students across academics, sports, and entrepreneurship with genuine field intelligence and growth instruments.",
  goal1Icon: "🎯",
  goal1Title: "High School & Intermediate Stream Direction",
  goal1Desc:
    "Mentoring hundreds of students in choosing the right field at high school and intermediate levels, replacing guesswork with scientific cognitive alignment.",
  goal2Icon: "📚",
  goal2Title: "College Electives & Multi-Discipline Study",
  goal2Desc:
    "Providing associated students a thorough study of electives and disciplines preached at the college level, clarifying career trajectories and industry realities.",
  goal3Icon: "🚀",
  goal3Title: "Academics, Sports & Entrepreneurship Mentorship",
  goal3Desc:
    "Guiding students at all levels — proficient or below average — with curated competitions, channels, and seasoned field mentors to accelerate their growth.",

  // 7. Services with customizable icons
  servicesSectionTag: "Guidance Offerings",
  servicesSectionTitle: "Our Counselling Services & Verticals",
  servicesSectionSubtitle: "Comprehensive counseling solutions tailored to each student's unique journey and aspirations.",
  servicesBtnText: "🗓️ Book a Counseling Session Now",
  services: defaultServices,

  // 8. Counselor Section Headings
  counselorSectionTag: "About the Senior Counselor",

  // 9. Hero Slider Banners
  slide1LeftTitle: "Examination Management Services",
  slide1RightTitle: "Counselling & Admission Services",
  slide1CenterTagline: "SIMPLIFYING THE ADMISSION PROCESS",
  slide1CateringText: "Catering to Examinations and Admissions in IIT's, NIT's, IIIT's, Medical (NEET), CUET, Board Streams and many others",
  slide2LeftTitle: "Personalized Counseling Verticals",
  slide2RightTitle: "Direct Student Solutions",
  slide2CenterTagline: "SENIOR EDUCATIONAL & CAREER COUNSELOR",
  slide2CateringText: "Personalized 1-on-1 offline & online video consultation designed to convert stress into triumph.",
  slide3LeftTitle: "Study Abroad & Global Admissions",
  slide3RightTitle: "End-to-End International Support",
  slide3CenterTagline: "GLOBAL UNIVERSITY ADMISSIONS",
  slide3CateringText: "Empowering Indian students with comprehensive guidance to crack top global scholarships and prestigious foreign universities.",

  // 10. Call to Action Banner
  ctaTag: "Official Advisory Portal",
  ctaTitle: "Ready to Plan Your Educational & Career Future?",
  ctaDesc:
    "Empowering students with clarity, confidence, and competitive competence. Access expert counseling articles, research resources, and schedule your session today.",
  ctaBtnText: "🗓️ Book Consultation Session",

  // 9. Contact Details & Helplines
  contactEmail: "info@inspiriacareers.com",
  contactPhone: "+91 99999 99999",
  contactAddress: "New Delhi, India",
  officeHours: "Monday to Saturday, 9:00 AM - 6:00 PM IST",
  whatsappNumber: "+91 99999 99999",

  // 10. Social Media Links
  youtubeUrl: "https://youtube.com",
  linkedinUrl: "https://linkedin.com",
  instagramUrl: "https://instagram.com",
  facebookUrl: "https://facebook.com",
  twitterUrl: "https://x.com",

  // 11. Paid Session & Payment Gateway Settings
  paidSessionsEnabled: false,
  sessionFee: "₹999",
  upiId: "counselor@okhdfcbank",
  upiQrCode: "",
  bankHolderName: "Inspiria Educational Services",
  bankName: "HDFC Bank",
  bankAccountNumber: "50200012345678",
  bankIfsc: "HDFC0001234",
  paymentInstructions:
    "Please transfer the session fee using the UPI ID or scan the QR code. Enter the 12-digit UPI Reference / UTR Number below to confirm your appointment.",

  // 14. Staff Security & Passwords
  principalPassword: process.env.NEXT_PUBLIC_PRINCIPAL_PASSWORD || "Principal@Inspiria2025",
  adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "Admin@Inspiria2025",
};

interface SiteContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  loading: boolean;
}

const SiteContext = createContext<SiteContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
  loading: false,
});

export const useSite = () => useContext(SiteContext);

const STORAGE_KEY = "inspiria_site_settings";

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Load from localStorage if present
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("insersia_site_settings");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // If cached site name still has the old name, override it with the actual name
          if (!parsed.siteName || parsed.siteName.toLowerCase().includes("insersia")) {
            parsed.siteName = "INSPIRIA CAREERS";
          }
          setSettings((prev) => ({
            ...defaultSettings,
            ...prev,
            ...parsed,
            siteName: parsed.siteName || "INSPIRIA CAREERS",
            siteLogo: parsed.siteLogo || prev.siteLogo || defaultSettings.siteLogo,
            services: parsed.services && parsed.services.length > 0 ? parsed.services : defaultServices,
            navLinks: parsed.navLinks && parsed.navLinks.length > 0 ? parsed.navLinks : defaultNavLinks,
            homeOptions: parsed.homeOptions && parsed.homeOptions.length > 0 ? parsed.homeOptions : defaultHomeOptions,
          }));
        } catch {}
      }
    }

    // 2. Try fetching latest settings from Firestore
    const fetchRemote = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "site"));
        if (snap.exists()) {
          const remoteData = snap.data() as Partial<SiteSettings>;
          setSettings((prev) => {
            const merged = { ...prev, ...remoteData };
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            }
            return merged;
          });
        }
      } catch {
        // Fallback gracefully to localStorage or defaults
      } finally {
        setLoading(false);
      }
    };

    fetchRemote();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Save to localStorage immediately
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    // Attempt to persist to Firestore
    try {
      await setDoc(doc(db, "settings", "site"), updated, { merge: true });
    } catch {
      // If Firestore not configured, local state is still persisted
    }
  };

  return (
    <SiteContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SiteContext.Provider>
  );
}
