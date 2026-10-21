"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSite } from "@/contexts/SiteContext";
import { INTERNATIONAL_UNIVERSITIES } from "@/data/internationalUniversities";

export interface GlobalSearchResult {
  id: string;
  category: "University" | "Service" | "Page" | "FAQ";
  categoryHi: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  url: string;
  icon: string;
  badge?: string;
}

const STATIC_SEARCH_TARGETS: GlobalSearchResult[] = [
  {
    id: "page-book",
    category: "Page",
    categoryHi: "पेज",
    title: "Book Consultation Appointment",
    titleHi: "अपॉइंटमेंट बुक करें",
    description: "Schedule a 1-on-1 confidential counselling or guidance session.",
    descriptionHi: "व्यक्तिगत और गोपनीय परामर्श सत्र के लिए समय स्लॉट आरक्षित करें।",
    url: "/book",
    icon: "📅",
    badge: "Action",
  },
  {
    id: "page-universities",
    category: "Page",
    categoryHi: "पेज",
    title: "Top 10 International Universities Guide",
    titleHi: "शीर्ष 10 अंतर्राष्ट्रीय विश्वविद्यालय गाइड",
    description: "MIT, Oxford, Stanford, Cambridge, NUS, Harvard admission guide, fees & scholarships.",
    descriptionHi: "MIT, Oxford, Stanford, Harvard प्रवेश प्रक्रिया, ट्यूशन फीस व छात्रवृत्ति गाइड।",
    url: "/universities",
    icon: "🏛️",
    badge: "Guide",
  },
  {
    id: "page-workshops",
    category: "Page",
    categoryHi: "पेज",
    title: "Workshops & Interactive Webinars",
    titleHi: "कार्यशालाएं व इंटरएक्टिव वेबिनार",
    description: "Group career guidance, stream selection webinars, and stress wellness workshops.",
    descriptionHi: "समूह करियर मार्गदर्शन एवं परीक्षा तनाव प्रबंधन वेबिनार।",
    url: "/workshops",
    icon: "🎓",
  },
  {
    id: "page-resources",
    category: "Page",
    categoryHi: "पेज",
    title: "Guidance Worksheets & Study Resources",
    titleHi: "संसाधन व अध्ययन कार्यपत्रक",
    description: "Downloadable career checklists, stream guides, and mindfulness exercises.",
    descriptionHi: "डाउनलोड करने योग्य करियर चेकलिस्ट और अध्ययन मार्गदर्शिकाएं।",
    url: "/resources",
    icon: "📖",
  },
  {
    id: "page-reviews",
    category: "Page",
    categoryHi: "पेज",
    title: "Verified Student & Parent Reviews",
    titleHi: "सत्यापित समीक्षाएं",
    description: "Read real client testimonials and shared success stories.",
    descriptionHi: "छात्रों एवं अभिभावकों के सत्यापित अनुभव और प्रतिक्रियाएं पढ़ें।",
    url: "/reviews",
    icon: "★",
  },
  {
    id: "page-emergency",
    category: "Page",
    categoryHi: "पेज",
    title: "24×7 Emergency & Crisis Helplines",
    titleHi: "आपातकालीन हेल्पलाइन (24×7)",
    description: "Tele-MANAS, KIRAN, Vandrevala Foundation free crisis helplines.",
    descriptionHi: "टेली-मानस, किरण और वंद्रेवाला फाउंडेशन 24×7 संकट हेल्पलाइन।",
    url: "/emergency",
    icon: "🚨",
    badge: "Support",
  },
  {
    id: "page-faq",
    category: "Page",
    categoryHi: "पेज",
    title: "Frequently Asked Questions (FAQ)",
    titleHi: "अक्सर पूछे जाने वाले प्रश्न",
    description: "Confidentiality, online vs in-person format, UPI QR payments, and rescheduling.",
    descriptionHi: "गोपनीयता, ऑनलाइन सत्र, यूपीआई भुगतान और अपॉइंटमेंट संबंधित प्रश्न।",
    url: "/faq",
    icon: "❓",
  },
  {
    id: "page-contact",
    category: "Page",
    categoryHi: "पेज",
    title: "Contact Office & Timings",
    titleHi: "कार्यालय संपर्क व समय",
    description: "Official address, email, phone, and operational timings.",
    descriptionHi: "काउंसलर का आधिकारिक पता, फोन, ईमेल एवं कार्य समय।",
    url: "/contact",
    icon: "📍",
  },
];

export default function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { services, profile, lang } = useSite();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Build searchable index from Universities, Services, and Static Targets
  const searchableIndex = useMemo<GlobalSearchResult[]>(() => {
    const list: GlobalSearchResult[] = [...STATIC_SEARCH_TARGETS];

    // Add Top Universities
    INTERNATIONAL_UNIVERSITIES.forEach((u) => {
      list.push({
        id: `uni-${u.id}`,
        category: "University",
        categoryHi: "विश्वविद्यालय",
        title: u.name,
        titleHi: u.nameHi,
        description: `${u.country} • Core: ${u.coreStrengths.slice(0, 3).join(", ")} • COA: ${u.tuitionFees.totalCoa}`,
        descriptionHi: `${u.countryHi} • मुख्य विषय: ${u.coreStrengthsHi.slice(0, 3).join(", ")}`,
        url: `/universities#uni-${u.id}`,
        icon: u.flag,
        badge: `#${u.rank}`,
      });
    });

    // Add Services
    services.forEach((s) => {
      list.push({
        id: `srv-${s.id}`,
        category: "Service",
        categoryHi: "सेवा",
        title: s.title,
        titleHi: s.title,
        description: s.description,
        descriptionHi: s.description,
        url: `/services#srv-${s.id}`,
        icon: s.icon || "🎯",
        badge: s.fee ? `₹${s.fee}` : undefined,
      });
    });

    // Add FAQs from profile if present
    if (profile.faqList) {
      profile.faqList.forEach((faq) => {
        list.push({
          id: faq.id,
          category: "FAQ",
          categoryHi: "प्रश्न",
          title: faq.questionEn,
          titleHi: faq.questionHi || faq.questionEn,
          description: faq.answerEn,
          descriptionHi: faq.answerHi || faq.answerEn,
          url: "/faq",
          icon: "💡",
        });
      });
    }

    return list;
  }, [services, profile.faqList]);

  // Filtered results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Default recommended results
      return searchableIndex.slice(0, 8);
    }
    const q = query.toLowerCase().trim();
    return searchableIndex.filter((item) => {
      const inTitle =
        item.title.toLowerCase().includes(q) ||
        item.titleHi.toLowerCase().includes(q);
      const inDesc =
        item.description.toLowerCase().includes(q) ||
        item.descriptionHi.toLowerCase().includes(q);
      const inCat = item.category.toLowerCase().includes(q);
      return inTitle || inDesc || inCat;
    });
  }, [searchableIndex, query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "3.5rem 1rem 1rem",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          borderRadius: "16px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--surface)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            gap: "0.75rem",
            background: "var(--surface)",
          }}
        >
          <span style={{ fontSize: "1.25rem", color: "var(--brand-primary)" }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="form-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === "hi"
                ? "विश्वविद्यालय, सेवाएं, लेख या प्रश्न खोजें... (Esc to close)"
                : "Search universities, services, articles, FAQs... (Esc to close)"
            }
            style={{
              border: "none",
              boxShadow: "none",
              fontSize: "1.05rem",
              padding: "0.4rem 0",
              flex: 1,
              background: "transparent",
              outline: "none",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                background: "none",
                border: "none",
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "0.2rem 0.5rem",
              }}
            >
              ✕
            </button>
          )}
          <kbd
            style={{
              fontSize: "0.72rem",
              padding: "0.2rem 0.5rem",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          style={{
            overflowY: "auto",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            maxHeight: "60vh",
          }}
        >
          {results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔎</div>
              <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                {lang === "hi" ? "कोई परिणाम नहीं मिला" : "No results found"}
              </p>
              <span style={{ fontSize: "0.82rem" }}>
                {lang === "hi"
                  ? "कृपया कोई अन्य शब्द या विषय लिखकर खोजें।"
                  : "Try searching with broader keywords like 'MIT', 'Admissions', or 'Stress'."}
              </span>
            </div>
          ) : (
            results.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 0.9rem",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "background 0.15s ease",
                  gap: "0.75rem",
                }}
                className="search-result-item"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", overflow: "hidden" }}>
                  <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.92rem",
                          fontWeight: 700,
                          color: "var(--text)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {lang === "hi" ? item.titleHi : item.title}
                      </span>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.45rem",
                            borderRadius: "10px",
                            background: "rgba(26,58,143,0.1)",
                            color: "var(--brand-primary)",
                            flexShrink: 0,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        margin: "2px 0 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {lang === "hi" ? item.descriptionHi : item.description}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    background: "var(--surface-2)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    flexShrink: 0,
                    textTransform: "uppercase",
                  }}
                >
                  {lang === "hi" ? item.categoryHi : item.category}
                </span>
              </Link>
            ))
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div
          style={{
            padding: "0.6rem 1.25rem",
            background: "var(--surface-2)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          <span>
            {lang === "hi" ? "त्वरित नेविगेशन के लिए क्लिक करें" : "Click any result to navigate"}
          </span>
          <span>Inspiria Quick Search</span>
        </div>
      </div>
    </div>
  );
}
