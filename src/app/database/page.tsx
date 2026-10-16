"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

interface CareerField {
  id: string;
  name: string;
  category: string;
  badge: string;
  duration: string;
  aptitudeMatch: string;
  happinessRating: string;
  disciplines: string[];
  keyElectives: string[];
  growthInstruments: {
    competitions: string;
    channels: string;
    mentorFocus: string;
  };
  review: {
    student: string;
    year: string;
    quote: string;
    outcome: string;
  };
  socraticQuestions: string[];
}

const CAREER_DATABASE: CareerField[] = [
  {
    id: "f_tech",
    name: "Artificial Intelligence, Data Systems & Software Engineering",
    category: "STEM & Computing",
    badge: "High Growth",
    duration: "4 Years (B.Tech / B.S.)",
    aptitudeMatch: "Logical Reasoning, Abstract Mathematics, Algorithmic Thinking",
    happinessRating: "92% (High autonomy & problem-solving satisfaction)",
    disciplines: [
      "Distributed Systems",
      "Machine Learning & Neural Networks",
      "Cloud Architecture & Security",
      "Human-Computer Interaction",
    ],
    keyElectives: [
      "Deep Learning & NLP",
      "Computational Complexity",
      "Parallel Computing",
      "Full-Stack Web Architectures",
    ],
    growthInstruments: {
      competitions: "ACM ICPC, Google Summer of Code, Smart India Hackathon, Kaggle Grandmaster tracks",
      channels: "MIT OpenCourseWare, 3Blue1Brown, Stanford CS229, GitHub Open Repositories",
      mentorFocus: "Senior engineers at global tech labs and IIT alumni research directors.",
    },
    review: {
      student: "Rohan Verma",
      year: "2024 Counselled Cohort",
      quote:
        "I was pushed by coaching peers to pursue Electrical, but during Inspiria's Socratic session, we discovered my genuine love for algorithmic problem solving. They mapped my electives before 1st semester began!",
      outcome: "Now Software Development Engineer at Top MNC after IIT Roorkee.",
    },
    socraticQuestions: [
      "Do you enjoy debugging broken logic for hours, or does failure quickly exhaust your composure?",
      "Can you differentiate between playing video games and designing scalable computer algorithms?",
      "Are you prepared for continuous self-learning every 2 years as frameworks evolve?",
    ],
  },
  {
    id: "f_med",
    name: "Medical Sciences, Clinical Diagnostics & Biotechnology",
    category: "Healthcare & Life Sciences",
    badge: "Public Service",
    duration: "5.5 Years (MBBS) + 3 Years (MD/MS) / 4 Years (Biotech)",
    aptitudeMatch: "Empathetic Composure, Biology, Organic Synthesis, Memory Retention",
    happinessRating: "94% (Profound sense of purpose and societal impact)",
    disciplines: [
      "Human Anatomy & Physiology",
      "Pathology & Microbiology",
      "Genomics & Molecular Biology",
      "Public Health Epidemiology",
    ],
    keyElectives: [
      "Immunology & Vaccine Design",
      "Bioethics & Health Policy",
      "Minimally Invasive Therapeutics",
      "Clinical Trial Analytics",
    ],
    growthInstruments: {
      competitions: "KVPY / INSPIRE Fellowships, Biology Olympiad (IBO), All-India Medical Quiz",
      channels: "Khan Academy Medicine, Osmosis Clinical, PubMed Research Portal, Nature Reviews",
      mentorFocus: "Senior resident doctors, AIIMS clinical faculties, and biotech startup founders.",
    },
    review: {
      student: "Priyanka Nair",
      year: "2023 Counselled Cohort",
      quote:
        "Counseling here saved me from repeat-drop depression. Principal Ma'am guided me on maintaining emotional fortitude during NEET, and opened my eyes to Clinical Biotechnology as an equal powerhouse.",
      outcome: "Secured Top Rank in State Medical Admissions & Research Fellow.",
    },
    socraticQuestions: [
      "Are you pursuing Medicine for personal validation/parental pride, or do you have the emotional stamina to care for suffering humans daily?",
      "Can you maintain high focus under sleep deprivation and emergency pressure?",
      "Does understanding biochemical systems trigger genuine curiosity in your gray matter?",
    ],
  },
  {
    id: "f_biz",
    name: "Corporate Finance, Fintech & Strategic Entrepreneurship",
    category: "Commerce & Business",
    badge: "Market Dynamic",
    duration: "3-4 Years (BBA / B.Com / Eco Hons) + 2 Years (MBA)",
    aptitudeMatch: "Quantitative Analysis, Strategic Negotiation, Economic Intuition",
    happinessRating: "89% (High agency, dynamic deal-making and ownership)",
    disciplines: [
      "Corporate Financial Valuation",
      "Algorithmic Trading & DeFi",
      "Macro & Micro Econometrics",
      "Organizational Psychology",
    ],
    keyElectives: [
      "Mergers & Acquisitions",
      "Behavioral Economics",
      "Venture Capital & Private Equity",
      "Financial Econometrics",
    ],
    growthInstruments: {
      competitions: "CFA Institute Research Challenge, Harvard Case Competitions, National Stock Pitch",
      channels: "Investopedia, Financial Times, Aswath Damodaran Lectures, The Economist",
      mentorFocus: "Investment banking associates, Chartered Accountants, and Series-A founders.",
    },
    review: {
      student: "Kabir Mehta",
      year: "2024 Counselled Cohort",
      quote:
        "The analogy of 'Career as stock in life's demat account' completely shifted my mindset. We mapped out whether CA or Eco Hons fit my risk appetite. Saved me 3 years of wandering.",
      outcome: "SRCC B.Com (Hons) with Early Private Equity Internship.",
    },
    socraticQuestions: [
      "Do you genuinely grasp the movement of capital and business levers, or just like the idea of high executive pay?",
      "How comfortable are you making decisions with 70% incomplete information in volatile markets?",
      "Can you articulate complex numerical ideas with executive clarity to convince skeptics?",
    ],
  },
  {
    id: "f_sports",
    name: "Sports Sciences, Athletic Management & Kinesiology",
    category: "Sports & Physical Performance",
    badge: "Specialized Discipline",
    duration: "3-4 Years (B.Sc. Sports Science / Sports Management)",
    aptitudeMatch: "Biomechanical Aptitude, Athletic Discipline, Tactical Leadership",
    happinessRating: "96% (Unmatched passion alignment for dedicated athletes)",
    disciplines: [
      "Sports Biomechanics & Kinesiology",
      "Nutrition & Athletic Recovery",
      "Sports Analytics & Performance Tracking",
      "Sports Marketing & Sponsorship Law",
    ],
    keyElectives: [
      "Exercise Physiology",
      "Rehabilitation & Sports Injury Care",
      "Athlete Psychology & Pressure Mentoring",
      "Global League Operations",
    ],
    growthInstruments: {
      competitions: "Khelo India University Games, National Federations, Sports Analytics Hackathons",
      channels: "Journal of Sports Sciences, NSCA Masterclasses, Catapult Performance Series",
      mentorFocus: "National team conditioning coaches, sports physiotherapists, and league managers.",
    },
    review: {
      student: "Arjun Singh",
      year: "2023 Counselled Cohort",
      quote:
        "Everyone told me sports has no future in India unless you're in the top 10 cricketers. Inspiria showed my parents how Sports Science and Analytics is an explosive global industry. Life changing!",
      outcome: "Performance Analyst with Premier League Academy & Sports Science Fellow.",
    },
    socraticQuestions: [
      "Do you love the scientific optimization of physical human performance, or only the spectator thrill of the game?",
      "Are you prepared to live an athlete's disciplined circadian routine yourself?",
      "Can you bridge data telemetry with human psychology to motivate struggling athletes?",
    ],
  },
  {
    id: "f_des",
    name: "Human-Centered Design, UI/UX & Interactive Media",
    category: "Design & Creative Arts",
    badge: "Creative Tech",
    duration: "4 Years (B.Des / B.F.A.)",
    aptitudeMatch: "Visual Sensitivity, Spatial Awareness, Empathy, Cognitive Psychology",
    happinessRating: "95% (Creative fulfillment blended with high tech utility)",
    disciplines: [
      "User Experience & Design Thinking",
      "Visual Communication & Typography",
      "Interactive Prototyping & Motion",
      "Product Strategy & Research",
    ],
    keyElectives: [
      "Design Systems for Scaled Apps",
      "Cognitive Ergonomics",
      "AR/VR Spatial Interfaces",
      "Ethnographic Design Research",
    ],
    growthInstruments: {
      competitions: "Adobe Creative Jam, D&AD New Blood Awards, Red Dot Design Junior",
      channels: "Nielsen Norman Group, Behance Curations, Figma Community, UX Collective",
      mentorFocus: "Design leaders at product firms, NID alumni, and creative directors.",
    },
    review: {
      student: "Ananya Deshmukh",
      year: "2024 Counselled Cohort",
      quote:
        "I was an average student in traditional PCM. Inspiria's counselors didn't judge my marks; they noticed my design sensibility and guided me to NID / UCEED prep. I found my true home.",
      outcome: "UCEED Top 50 Ranker & Product Designer at Bangalore Unicorn.",
    },
    socraticQuestions: [
      "Can you receive objective, harsh critique on your creative work without taking it personally?",
      "Do you notice how everyday door handles, app buttons, and signage fail humans in daily life?",
      "Are you passionate about solving user friction rather than just making pretty pictures?",
    ],
  },
  {
    id: "f_law",
    name: "Constitutional Law, Corporate Policy & Public Governance",
    category: "Law & Public Policy",
    badge: "Civic Leadership",
    duration: "5 Years Integrated (B.A. LL.B / B.B.A. LL.B)",
    aptitudeMatch: "Critical Reasoning, Rhetorical Precision, Ethics, Legal Research",
    happinessRating: "90% (Intellectual rigor, advocacy influence and justice)",
    disciplines: [
      "Constitutional & Administrative Law",
      "Corporate Governance & Insolvency",
      "Intellectual Property in Digital Era",
      "International Dispute Resolution",
    ],
    keyElectives: [
      "Cross-Border Mergers & Antitrust",
      "Cyber Law & AI Regulation",
      "Human Rights & Public Interest Litigation",
      "Environmental Policy Advocacy",
    ],
    growthInstruments: {
      competitions: "Philip C. Jessup Moot Court, Bar Council National Moots, Parliamentary Debates",
      channels: "LiveLaw, Bar & Bench, Harvard Law Review, Oxford University Press Law Podcasts",
      mentorFocus: "Senior Supreme Court advocates, National Law University faculties, and policy analysts.",
    },
    review: {
      student: "Siddharth Sen",
      year: "2023 Counselled Cohort",
      quote:
        "The counseling confabs helped me break down legal vocabulary before I ever committed to law school. They connected me with seniors at NLSIU who gave me the unvarnished reality.",
      outcome: "Admitted to National Law School of India University (NLSIU Bangalore).",
    },
    socraticQuestions: [
      "Can you read 80-page dry legal judgments without losing analytical sharpness?",
      "Are you capable of passionately defending an argument even when your personal bias disagrees?",
      "Do you possess the rhetorical stamina to advocate for justice against systemic inertia?",
    ],
  },
];

export default function DatabasePage() {
  const { settings } = useSite();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeField, setActiveField] = useState<CareerField | null>(null);

  const categories = ["All", "STEM & Computing", "Healthcare & Life Sciences", "Commerce & Business", "Sports & Physical Performance", "Design & Creative Arts", "Law & Public Policy"];

  const filteredFields = CAREER_DATABASE.filter((f) => {
    const matchesCat = selectedCategory === "All" || f.category === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.disciplines.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase())) ||
      f.keyElectives.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <main className="page-wrapper" style={{ paddingTop: "6rem", paddingBottom: "5rem" }}>
      {/* ── 1. HEADER BANNER ── */}
      <section
        style={{
          background: "linear-gradient(135deg, #002147 0%, #009ea9 100%)",
          color: "#ffffff",
          padding: "4rem 2rem 3rem",
        }}
      >
        <div className="container">
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.75rem" }}>
            <Link href="/" style={{ color: "#ffcc00", textDecoration: "none", fontWeight: 700 }}>
              HOME
            </Link>
            <span>/</span>
            <span style={{ color: "#ffffff" }}>CAREER FIELDS &amp; ELECTIVES DATABASE</span>
          </div>

          <div style={{ maxWidth: 900 }}>
            <div className="section-tag" style={{ background: "rgba(255,204,0,0.18)", color: "#ffcc00", borderColor: "rgba(255,204,0,0.4)" }}>
              5-7 Year Global Business Goal #3
            </div>
            <h1 style={{ fontSize: "2.6rem", fontWeight: 800, marginTop: "0.75rem", lineHeight: 1.25 }}>
              Nuanced Database of <span>Academic &amp; Career Fields</span>
            </h1>
            <p style={{ color: "#e2e8f0", fontSize: "1.1rem", lineHeight: 1.8, marginTop: "1rem" }}>
              Inspiria Careers administers students with a granular breakdown of disciplines, college electives, verified growth instruments, and authentic post-counseling reviews. Ceasing the era of career regret through scientific transparency.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. FILTER & SEARCH CONTROLS ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "1.5rem 2rem", position: "sticky", top: 52, zIndex: 90 }}>
        <div className="container">
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            {/* Search Input */}
            <div style={{ position: "relative", minWidth: 280, flex: 1, maxWidth: 420 }}>
              <input
                type="text"
                placeholder="🔍 Search disciplines, electives, or careers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ padding: "0.6rem 1rem", fontSize: "0.9rem" }}
              />
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: 20,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: selectedCategory === cat ? "1px solid #002147" : "1px solid #cbd5e1",
                    background: selectedCategory === cat ? "#002147" : "#f8fafc",
                    color: selectedCategory === cat ? "#ffcc00" : "#475569",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CAREER CARDS GRID ── */}
      <section className="section" style={{ background: "#f8fafc" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>
              Showing {filteredFields.length} specialized career field matrixes
            </span>
            <Link href="/about#socratic" style={{ fontSize: "0.85rem", color: "#009ea9", fontWeight: 700, textDecoration: "none" }}>
              💡 How Socratic Inquisitions Work →
            </Link>
          </div>

          <div className="grid-2">
            {filteredFields.map((field) => (
              <div
                key={field.id}
                className="card card-teal animate-in"
                style={{
                  background: "#ffffff",
                  padding: "2rem",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <span className="badge badge-blue">{field.category}</span>
                    <span className="badge badge-gold">{field.badge}</span>
                  </div>

                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>
                    {field.name}
                  </h3>

                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "#64748b", marginBottom: "1rem" }}>
                    <span>⏱️ {field.duration}</span>
                    <span>📈 {field.happinessRating}</span>
                  </div>

                  {/* Innate Aptitude Required */}
                  <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: 8, borderLeft: "3px solid #009ea9", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#009ea9", textTransform: "uppercase" }}>
                      Cognitive &amp; Temperament Prerequisites
                    </div>
                    <div style={{ fontSize: "0.88rem", color: "#1e293b", marginTop: "0.2rem" }}>
                      {field.aptitudeMatch}
                    </div>
                  </div>

                  {/* College Electives Dissected */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}>
                      Key College Electives Explored:
                    </div>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {field.keyElectives.map((el, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: "#e6f7f8",
                            color: "#007e87",
                            padding: "0.25rem 0.55rem",
                            borderRadius: 4,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          {el}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Growth Instruments */}
                  <div style={{ background: "rgba(255,204,0,0.08)", padding: "0.85rem", borderRadius: 8, border: "1px solid rgba(255,204,0,0.3)", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#92400e" }}>
                      🚀 Unlocked Growth Instruments:
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#334155", marginTop: "0.3rem", lineHeight: 1.5 }}>
                      <strong>Competitions:</strong> {field.growthInstruments.competitions}
                    </div>
                  </div>

                  {/* Counselled Student Review */}
                  <div style={{ fontStyle: "italic", fontSize: "0.85rem", color: "#64748b", borderLeft: "2px solid #cbd5e1", paddingLeft: "0.75rem", margin: "1rem 0" }}>
                    &ldquo;{field.review.quote}&rdquo;
                    <div style={{ fontStyle: "normal", fontWeight: 700, color: "#002147", marginTop: "0.3rem" }}>
                      — {field.review.student} ({field.review.year}) · <span style={{ color: "#16a34a" }}>{field.review.outcome}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                  <button
                    onClick={() => setActiveField(field)}
                    className="btn btn-outline-navy btn-sm"
                    style={{ flex: 1 }}
                  >
                    💡 Socratic Checkpoints
                  </button>
                  <Link
                    href={`/contact?subject=${encodeURIComponent(field.name)}`}
                    className="btn btn-teal btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    🗓️ Get Mentored
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. MODAL: SOCRATIC QUESTIONS DIALOG ── */}
      {activeField && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,33,71,0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setActiveField(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: "2rem",
              maxWidth: 580,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              border: "2px solid #009ea9",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span className="badge badge-teal">Socratic Self-Inquisition Checkpoints</span>
              <button
                onClick={() => setActiveField(null)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>
              {activeField.name}
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Before investing the next 4-8 years of your life, test your gray matter against these diagnostic inquisitions imposed by our counselors:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              {activeField.socraticQuestions.map((q, idx) => (
                <div key={idx} style={{ display: "flex", gap: "0.75rem", background: "#f8fafc", padding: "1rem", borderRadius: 8 }}>
                  <span style={{ fontWeight: 800, color: "#009ea9" }}>Q{idx + 1}:</span>
                  <span style={{ color: "#1e293b", fontSize: "0.92rem", lineHeight: 1.6 }}>{q}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link
                href={`/contact?subject=${encodeURIComponent(activeField.name)}`}
                className="btn btn-teal w-full"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Discuss with Principal Ma&apos;am 💬
              </Link>
              <button onClick={() => setActiveField(null)} className="btn btn-ghost" style={{ color: "#475569" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
