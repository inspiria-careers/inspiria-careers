"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import {
  INTERNATIONAL_UNIVERSITIES,
  UniversityItem,
} from "@/data/internationalUniversities";
import {
  SparklesIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
} from "@/components/Icons";

const COUNTRIES = ["All", "USA", "UK", "Singapore", "Canada", "Switzerland", "Australia"];

export default function UniversitiesPage() {
  const { universities, lang } = useSite();
  const currentUniversities = universities && universities.length > 0 ? universities : INTERNATIONAL_UNIVERSITIES;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [selectedAidType, setSelectedAidType] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>("mit");
  const [activeTab, setActiveTab] = useState<"cards" | "matrix">("cards");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Filter universities based on search, country, and aid type
  const filteredUniversities = useMemo(() => {
    return currentUniversities.filter((u) => {
      // Country match
      if (selectedCountry !== "All" && u.country !== selectedCountry) {
        return false;
      }
      // Aid type match
      if (selectedAidType !== "All" && u.aidType !== selectedAidType) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName =
          u.name.toLowerCase().includes(q) || u.nameHi.toLowerCase().includes(q);
        const inCountry =
          u.country.toLowerCase().includes(q) || u.countryHi.toLowerCase().includes(q);
        const inStrengths =
          u.coreStrengths.some((s) => s.toLowerCase().includes(q)) ||
          u.coreStrengthsHi.some((s) => s.toLowerCase().includes(q));
        const inTip =
          u.counselorTip.toLowerCase().includes(q) ||
          u.counselorTipHi.toLowerCase().includes(q);
        return inName || inCountry || inStrengths || inTip;
      }
      return true;
    });
  }, [currentUniversities, searchQuery, selectedCountry, selectedAidType]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const FAQS = [
    {
      q: lang === "hi" ? "नीड-ब्लाइंड (Need-Blind) और नीड-अवेयर (Need-Aware) में क्या अंतर है?" : "What is the difference between Need-Blind and Need-Aware admissions?",
      a: lang === "hi"
        ? "नीड-ब्लाइंड (जैसे MIT और Harvard) में छात्र की वित्तीय सहायता की मांग का उसके प्रवेश निर्णय पर कोई प्रभाव नहीं पड़ता। वहीं नीड-अवेयर (जैसे Stanford) में छात्र को वित्तीय सहायता की कितनी जरूरत है, इसे प्रवेश निर्णय के समय ध्यान में रखा जाता है, हालांकि चयनित होने पर 100% आवश्यकता पूरी की जाती है।"
        : "In Need-Blind admissions (e.g., MIT, Harvard), your financial aid request has zero negative impact on your admissions evaluation. In Need-Aware admissions (e.g., Stanford for internationals), financial need is considered during the decision process, but if admitted, 100% of demonstrated need is covered.",
    },
    {
      q: lang === "hi" ? "क्या ऑक्सफोर्ड और कैम्ब्रिज में एक ही वर्ष में आवेदन किया जा सकता है?" : "Can I apply to both Oxford and Cambridge in the same academic cycle?",
      a: lang === "hi"
        ? "नहीं। UCAS नियमों के अनुसार स्नातक (undergraduate) स्तर पर आप एक ही प्रवेश चक्र में ऑक्सफोर्ड और कैम्ब्रिज में से किसी एक में ही आवेदन कर सकते हैं।"
        : "No. Under UCAS regulations, undergraduate applicants may apply to either Oxford or Cambridge in a single cycle, never both simultaneously.",
    },
    {
      q: lang === "hi" ? "मानकीकृत परीक्षण (SAT/ACT) और भाषा प्रवीणता (IELTS/TOEFL) कब देना चाहिए?" : "When should I complete standardized tests (SAT/ACT) and English tests (IELTS/TOEFL)?",
      a: lang === "hi"
        ? "आदर्श रूप से 11वीं कक्षा के अंत या 12वीं की शुरुआत (मई-अगस्त) तक SAT/ACT और IELTS/TOEFL स्कोर तैयार कर लें, ताकि आप नवंबर के अर्ली एक्शन (EA/ED) की समय सीमा में समय पर आवेदन कर सकें।"
        : "Ideally by the end of Grade 11 or early Grade 12 (May–August), ensuring scores are ready ahead of October/November Early Action, REA, or UCAS deadlines.",
    },
    {
      q: lang === "hi" ? "इन्स्पिरिया करियर अंतर्राष्ट्रीय विश्वविद्यालय प्रवेश में कैसे सहायता करता है?" : "How does Inspiria Careers guide students through global admissions?",
      a: lang === "hi"
        ? "हम प्रोफाइल मूल्यांकन, विश्वविद्यालय चयन, कॉमन ऐप/UCAS निबंध ड्राफ्टिंग, सुपर-करिकुलर रीडिंग मार्गदर्शन, छात्रवृत्ति रणनीतियों और मॉक इंटरव्यू की 1-on-1 गोपनीय सलाह प्रदान करते हैं।"
        : "We offer 1-on-1 personalized guidance covering profile building, college list curation, Common App/UCAS essays, super-curricular academic prep, financial aid strategies, and mock interviews.",
    },
  ];

  return (
    <div className="page-wrapper">
      {/* ── Hero Section ── */}
      <section
        style={{
          background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)",
          padding: "3.5rem 1rem 2.5rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="container" style={{ maxWidth: 1160, textAlign: "center" }}>
          <span
            className="section-tag"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(26,58,143,0.08)",
              color: "var(--brand-primary)",
              padding: "0.4rem 0.9rem",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            <SparklesIcon size={16} />
            {lang === "hi" ? "वैश्विक उच्च शिक्षा एवं प्रवेश गाइड" : "Global Admissions & Study Abroad Guide"}
          </span>

          <h1
            style={{
              fontSize: "clamp(1.9rem, 4vw, 2.75rem)",
              fontWeight: 800,
              color: "var(--text)",
              lineHeight: 1.25,
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            {lang === "hi" ? "विश्व के शीर्ष 10 " : "Top 10 Global "}
            <span style={{ color: "var(--brand-primary)" }}>
              {lang === "hi" ? "अंतर्राष्ट्रीय विश्वविद्यालय" : "International Universities"}
            </span>
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--text-muted)",
              maxWidth: 760,
              margin: "0 auto 2rem",
              lineHeight: 1.7,
            }}
          >
            {lang === "hi"
              ? "कोर्स अवधि, वास्तविक वार्षिक लागत (COA), 100% नीड-मेट छात्रवृत्ति रणनीतियां, आवेदन समय-सीमाएं और काउंसलर की विशेष रणनीतिक सलाह।"
              : "In-depth breakdown of course durations, total cost of attendance (COA), need-blind scholarships, UCAS & Common App deadlines, and expert counsellor tips."}
          </p>

          {/* Quick Tab Toggle (Cards vs Comparison Matrix) */}
          <div
            style={{
              display: "inline-flex",
              background: "var(--surface)",
              padding: "0.3rem",
              borderRadius: "30px",
              border: "1px solid var(--border)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              marginBottom: "1.75rem",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("cards")}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "25px",
                border: "none",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "cards" ? "var(--brand-primary)" : "transparent",
                color: activeTab === "cards" ? "#ffffff" : "var(--text-muted)",
                transition: "all 0.2s ease",
              }}
            >
              📋 {lang === "hi" ? "विस्तृत प्रोफ़ाइल कार्ड्स" : "Detailed Profiles (Cards)"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("matrix")}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "25px",
                border: "none",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "matrix" ? "var(--brand-primary)" : "transparent",
                color: activeTab === "matrix" ? "#ffffff" : "var(--text-muted)",
                transition: "all 0.2s ease",
              }}
            >
              📊 {lang === "hi" ? "तुलनात्मक तालिका" : "Comparison Matrix (Table)"}
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ maxWidth: 580, margin: "0 auto" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="form-input"
                style={{
                  padding: "0.85rem 1.25rem 0.85rem 2.75rem",
                  fontSize: "0.95rem",
                  borderRadius: "30px",
                  border: "1.5px solid var(--border)",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === "hi"
                    ? "विश्वविद्यालय, विषय (उदा. Computer Science, Economics) या देश खोजें..."
                    : "Search by university, field (e.g., Computer Science, Law), or country..."
                }
              />
              <span
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "1.1rem",
                  color: "var(--text-muted)",
                }}
              >
                🔍
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Filters Bar ── */}
      <section style={{ padding: "1.25rem 1rem", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth: 1160 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            {/* Country Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                {lang === "hi" ? "देश:" : "Country:"}
              </span>
              {COUNTRIES.map((c) => {
                const isActive = selectedCountry === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCountry(c)}
                    style={{
                      padding: "0.35rem 0.85rem",
                      borderRadius: "20px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      border: `1px solid ${isActive ? "var(--brand-primary)" : "var(--border)"}`,
                      background: isActive ? "var(--brand-primary)" : "var(--surface-2)",
                      color: isActive ? "#ffffff" : "var(--text)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {c === "All" ? (lang === "hi" ? "सभी (10)" : "All (10)") : c}
                  </button>
                );
              })}
            </div>

            {/* Aid Type Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                {lang === "hi" ? "छात्रवृत्ति प्रकार:" : "Aid Model:"}
              </span>
              <select
                className="form-input"
                style={{
                  fontSize: "0.82rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "8px",
                  width: "auto",
                  minWidth: "160px",
                }}
                value={selectedAidType}
                onChange={(e) => setSelectedAidType(e.target.value)}
              >
                <option value="All">{lang === "hi" ? "सभी प्रकार" : "All Aid Types"}</option>
                <option value="Need-Blind">Need-Blind (MIT, Harvard)</option>
                <option value="Need-Met">Need-Met (Stanford, LSE)</option>
                <option value="Merit-Based">Merit-Based (Oxford, Cambridge, Toronto, Melbourne)</option>
                <option value="Subsidized Grant">Subsidized MOE Grant (NUS)</option>
                <option value="Low Tuition">Low Tuition (ETH Zurich)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <section className="section" style={{ minHeight: "60vh" }}>
        <div className="container" style={{ maxWidth: 1160 }}>
          {filteredUniversities.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏛️</div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.5rem" }}>
                {lang === "hi" ? "कोई विश्वविद्यालय नहीं मिला" : "No Universities Matched Your Filter"}
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                {lang === "hi"
                  ? "कृपया अपना खोज शब्द या फ़िल्टर बदलकर पुनः प्रयास करें।"
                  : "Try clearing search keywords or switching country filters."}
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCountry("All");
                  setSelectedAidType("All");
                }}
              >
                🔄 {lang === "hi" ? "फ़िल्टर रीसेट करें" : "Reset All Filters"}
              </button>
            </div>
          ) : activeTab === "matrix" ? (
            /* ── Comparison Matrix Table ── */
            <div className="card" style={{ padding: "1.5rem", overflowX: "auto" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--brand-primary)" }}>
                  {lang === "hi" ? "त्वरित तुलनात्मक मैट्रिक्स (Quick Comparison Matrix)" : "Global Top 10 Comparison Matrix"}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {lang === "hi"
                    ? "अवधि, वार्षिक लागत, छात्रवृत्ति मॉडल और आवेदन समय-सीमा की प्रत्यक्ष तुलना।"
                    : "Direct side-by-side comparison of duration, annual costs, aid models, and key deadlines."}
                </p>
              </div>

              <div className="table-wrap">
                <table className="table" style={{ fontSize: "0.85rem", minWidth: 800 }}>
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>#</th>
                      <th>{lang === "hi" ? "विश्वविद्यालय एवं देश" : "University & Country"}</th>
                      <th>{lang === "hi" ? "कोर्स अवधि" : "Duration"}</th>
                      <th>{lang === "hi" ? "कुल वार्षिक लागत (COA)" : "Total Annual COA"}</th>
                      <th>{lang === "hi" ? "वित्तीय सहायता मॉडल" : "Aid Policy"}</th>
                      <th>{lang === "hi" ? "प्रमुख समय-सीमा" : "Primary Deadline"}</th>
                      <th>{lang === "hi" ? "परामर्श" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUniversities.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: "var(--brand-primary)",
                              color: "#fff",
                              fontWeight: 800,
                              fontSize: "0.8rem",
                            }}
                          >
                            {u.rank}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--text)" }}>
                            {u.flag} {lang === "hi" ? u.nameHi : u.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {u.badge}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-secondary" style={{ fontSize: "0.75rem" }}>
                            {lang === "hi" ? u.courseDurationHi : u.courseDuration}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: "var(--brand-primary)" }}>
                            {u.tuitionFees.totalCoa}
                          </strong>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              fontSize: "0.75rem",
                              background:
                                u.aidType === "Need-Blind"
                                  ? "#dcfce7"
                                  : u.aidType === "Need-Met"
                                  ? "#e0e7ff"
                                  : "#fef3c7",
                              color:
                                u.aidType === "Need-Blind"
                                  ? "#166534"
                                  : u.aidType === "Need-Met"
                                  ? "#3730a3"
                                  : "#92400e",
                              fontWeight: 700,
                            }}
                          >
                            {u.aidType}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem" }}>
                          {u.admissionDeadlines.earlyDeadline
                            ? u.admissionDeadlines.earlyDeadline
                            : u.admissionDeadlines.regularDeadline}
                        </td>
                        <td>
                          <Link
                            href="/book"
                            className="btn btn-outline btn-sm"
                            style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                          >
                            {lang === "hi" ? "परामर्श लें" : "Plan App"}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── Detailed Profile Cards ── */
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              {filteredUniversities.map((u) => {
                const isExpanded = expandedId === u.id;
                return (
                  <div
                    key={u.id}
                    id={`uni-${u.id}`}
                    className="card"
                    style={{
                      padding: "1.75rem",
                      borderRadius: "16px",
                      border: isExpanded
                        ? "1.5px solid var(--brand-primary)"
                        : "1px solid var(--border)",
                      boxShadow: isExpanded
                        ? "0 10px 30px rgba(26,58,143,0.08)"
                        : "0 2px 8px rgba(0,0,0,0.03)",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {/* Top Row: Rank, Flag, Name, Badge, Total COA */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "1rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.9rem" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                            background: "var(--brand-primary)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            fontSize: "1.2rem",
                            flexShrink: 0,
                            boxShadow: "0 3px 10px rgba(26,58,143,0.25)",
                          }}
                        >
                          #{u.rank}
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "1.3rem" }}>{u.flag}</span>
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)" }}>
                              {lang === "hi" ? u.countryHi : u.country}
                            </span>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                padding: "0.2rem 0.65rem",
                                borderRadius: "12px",
                                background: "rgba(26,58,143,0.08)",
                                color: "var(--brand-primary)",
                              }}
                            >
                              {lang === "hi" ? u.badgeHi : u.badge}
                            </span>
                          </div>

                          <h2
                            style={{
                              fontSize: "1.35rem",
                              fontWeight: 800,
                              color: "var(--text)",
                              marginTop: "0.3rem",
                              lineHeight: 1.3,
                            }}
                          >
                            {lang === "hi" ? u.nameHi : u.name}
                          </h2>
                        </div>
                      </div>

                      {/* Right summary pill: Annual COA */}
                      <div
                        style={{
                          textAlign: "right",
                          background: "var(--surface-2)",
                          padding: "0.6rem 1rem",
                          borderRadius: "12px",
                          border: "1px solid var(--border)",
                          minWidth: "190px",
                        }}
                      >
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                          {lang === "hi" ? "कुल वार्षिक व्यय (Est. COA)" : "Total Annual COA"}
                        </div>
                        <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--brand-primary)", marginTop: "2px" }}>
                          {u.tuitionFees.totalCoa}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--brand-secondary)", fontWeight: 700 }}>
                          {u.scholarshipsAndAid.includes("Need-Blind") ? "✨ 100% Need-Blind" : "🎓 Financial Aid Available"}
                        </div>
                      </div>
                    </div>

                    {/* Middle Section: Core Strengths Pills & Duration */}
                    <div style={{ marginBottom: "1.25rem" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                        {lang === "hi" ? "प्रमुख विशेषज्ञता (Core Strengths):" : "Core Academic Strengths:"}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {(lang === "hi" ? u.coreStrengthsHi : u.coreStrengths).map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                              padding: "0.25rem 0.65rem",
                              borderRadius: "8px",
                              color: "var(--text)",
                            }}
                          >
                            {s}
                          </span>
                        ))}
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "#065f46",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "8px",
                          }}
                        >
                          ⏱️ {lang === "hi" ? u.courseDurationHi : u.courseDuration}
                        </span>
                      </div>
                    </div>

                    {/* Counselor's Tip Highlight Box (Always Visible) */}
                    <div
                      style={{
                        background: "rgba(245, 158, 11, 0.08)",
                        borderLeft: "4px solid #f59e0b",
                        borderRadius: "0 10px 10px 0",
                        padding: "0.85rem 1rem",
                        marginBottom: "1.25rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "1rem" }}>💡</span>
                        <strong style={{ fontSize: "0.85rem", color: "#92400e" }}>
                          {lang === "hi" ? "काउंसलर की रणनीतिक सलाह (Counselor's Tip):" : "Counselor's Strategic Admissions Tip:"}
                        </strong>
                      </div>
                      <p style={{ fontSize: "0.88rem", color: "#78350f", lineHeight: 1.6, margin: 0 }}>
                        {lang === "hi" ? u.counselorTipHi : u.counselorTip}
                      </p>
                    </div>

                    {/* Expandable Accordion Toggle */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(u.id)}
                        className="btn btn-ghost btn-sm"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          fontWeight: 700,
                          color: "var(--brand-primary)",
                          padding: "0.35rem 0.6rem",
                        }}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUpIcon size={16} />
                            {lang === "hi" ? "विस्तृत विवरण छुपाएं" : "Hide Detailed Breakdown"}
                          </>
                        ) : (
                          <>
                            <ChevronDownIcon size={16} />
                            {lang === "hi" ? "फीस, इंटर्नशिप व समय-सीमा देखें" : "View Fees, Internships & Deadlines"}
                          </>
                        )}
                      </button>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link
                          href={`/book?service=study-abroad&target=${encodeURIComponent(u.name)}`}
                          className="btn btn-primary btn-sm"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontSize: "0.82rem",
                            padding: "0.45rem 0.95rem",
                          }}
                        >
                          <CalendarIcon size={14} />
                          {lang === "hi" ? "प्रोफ़ाइल मूल्यांकन बुक करें" : "Book Profile Evaluation"}
                        </Link>
                      </div>
                    </div>

                    {/* Detailed Accordion Section */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: "1.25rem",
                          paddingTop: "1.25rem",
                          borderTop: "1px dashed var(--border)",
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                          gap: "1.25rem",
                        }}
                      >
                        {/* Box 1: Tuition & Cost Breakdown */}
                        <div
                          style={{
                            background: "var(--surface-2)",
                            padding: "1rem",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.6rem" }}>
                            💰 {lang === "hi" ? "ट्यूशन फीस एवं व्यय विवरण" : "Tuition Fees & Annual COA"}
                          </h4>
                          <div style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text)" }}>
                            <div>
                              <strong>{lang === "hi" ? "ट्यूशन फीस:" : "Tuition & Fees:"}</strong>{" "}
                              {u.tuitionFees.tuition}
                            </div>
                            <div>
                              <strong>{lang === "hi" ? "रहना एवं भोजन:" : "Room & Board:"}</strong>{" "}
                              {u.tuitionFees.livingAndHousing}
                            </div>
                            <div style={{ marginTop: "0.4rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border)" }}>
                              <strong>{lang === "hi" ? "कुल वार्षिक COA:" : "Total Annual COA:"}</strong>{" "}
                              <span style={{ fontWeight: 800, color: "var(--brand-primary)" }}>{u.tuitionFees.totalCoa}</span>
                            </div>
                          </div>
                        </div>

                        {/* Box 2: Scholarships & Aid Strategy */}
                        <div
                          style={{
                            background: "var(--surface-2)",
                            padding: "1rem",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.6rem" }}>
                            🎓 {lang === "hi" ? "छात्रवृत्ति एवं वित्तीय सहायता" : "Scholarships & Aid Strategy"}
                          </h4>
                          <p style={{ fontSize: "0.85rem", color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
                            {lang === "hi" ? u.scholarshipsAndAidHi : u.scholarshipsAndAid}
                          </p>
                        </div>

                        {/* Box 3: Admission Deadlines */}
                        <div
                          style={{
                            background: "var(--surface-2)",
                            padding: "1rem",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.6rem" }}>
                            📅 {lang === "hi" ? "प्रवेश की प्रमुख समय-सीमाएं" : "Key Admission Deadlines"}
                          </h4>
                          <div style={{ fontSize: "0.85rem", color: "var(--text)", lineHeight: 1.6 }}>
                            {u.admissionDeadlines.earlyDeadline && (
                              <div>
                                <strong>{lang === "hi" ? "अर्ली आवेदन:" : "Early Deadline:"}</strong>{" "}
                                {u.admissionDeadlines.earlyDeadline}
                              </div>
                            )}
                            <div>
                              <strong>{lang === "hi" ? "नियमित आवेदन:" : "Regular Deadline:"}</strong>{" "}
                              {u.admissionDeadlines.regularDeadline}
                            </div>
                            {u.admissionDeadlines.decisionRelease && (
                              <div>
                                <strong>{lang === "hi" ? "परिणाम घोषणा:" : "Decision Release:"}</strong>{" "}
                                {u.admissionDeadlines.decisionRelease}
                              </div>
                            )}
                            <div style={{ marginTop: "0.3rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                              Portal: {u.admissionDeadlines.portal}
                            </div>
                          </div>
                        </div>

                        {/* Box 4: Internships & Industry Integration */}
                        <div
                          style={{
                            background: "var(--surface-2)",
                            padding: "1rem",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.6rem" }}>
                            💼 {lang === "hi" ? "इंटर्नशिप एवं उद्योग साझेदारी" : "Internships & Industry Integration"}
                          </h4>
                          <p style={{ fontSize: "0.85rem", color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
                            {lang === "hi" ? u.internshipsAndIndustryHi : u.internshipsAndIndustry}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Callout Banner: 1-on-1 Personalized College Roadmap ── */}
      <section style={{ background: "linear-gradient(135deg, var(--brand-primary) 0%, #0f172a 100%)", color: "#ffffff", padding: "3.5rem 1rem" }}>
        <div className="container" style={{ maxWidth: 880, textAlign: "center" }}>
          <span style={{ fontSize: "2.5rem", marginBottom: "1rem", display: "inline-block" }}>🌍</span>
          <h2 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", fontWeight: 800, marginBottom: "0.8rem" }}>
            {lang === "hi"
              ? "विदेश में उच्च शिक्षा के लिए अपनी रणनीति तैयार करें"
              : "Plan Your Global University Application With Us"}
          </h2>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: "2rem", maxWidth: 680, margin: "0 auto 2rem" }}>
            {lang === "hi"
              ? "कॉमन ऐप, UCAS, पर्सनल स्टेटमेंट, सप्लीमेंटल निबंध और छात्रवृत्ति आवेदन के लिए प्रमाणित काउंसलर के साथ व्यक्तिगत मार्गदर्शन प्राप्त करें।"
              : "Get personalized 1-on-1 strategic guidance for profile building, Common App & UCAS personal statements, Ivy League essays, and financial aid appeals."}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              href="/book"
              className="btn btn-secondary btn-lg"
              style={{ fontWeight: 800, padding: "0.85rem 1.75rem" }}
            >
              🗓️ {t("bookAppointment", lang)}
            </Link>
            <Link
              href="/contact"
              className="btn btn-outline btn-lg"
              style={{ borderColor: "rgba(255,255,255,0.4)", color: "#ffffff" }}
            >
              ✉️ {t("contact", lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Study Abroad FAQ Section ── */}
      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="container" style={{ maxWidth: 840 }}>
          <div className="section-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section-tag">{lang === "hi" ? "प्रायः पूछे जाने वाले प्रश्न" : "Study Abroad FAQ"}</span>
            <h2 className="section-title">
              {lang === "hi" ? "अंतर्राष्ट्रीय प्रवेश से जुड़े " : "Frequently Asked "}
              <span>{lang === "hi" ? "प्रमुख प्रश्न" : "Questions"}</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: "1.2rem 1.5rem",
                    borderRadius: "12px",
                    border: isOpen ? "1.5px solid var(--brand-primary)" : "1px solid var(--border)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: isOpen ? "var(--brand-primary)" : "var(--text)",
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginLeft: "1rem" }}>
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7, borderTop: "1px dashed var(--border)", paddingTop: "0.75rem" }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
