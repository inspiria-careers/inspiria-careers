"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

interface Webinar {
  id: string;
  title: string;
  speaker: string;
  speakerTitle: string;
  date: string;
  time: string;
  badge: string;
  category: string;
  desc: string;
  keyTakeaways: string[];
  attendeesCount: string;
  status: "upcoming" | "past";
  recordingUrl?: string;
}

const WEBINAR_LIST: Webinar[] = [
  {
    id: "w1",
    title: "Overcoming the 97% Career Regret: Diagnostic Stream Selection for Classes 10 & 12",
    speaker: "Principal Ma'am",
    speakerTitle: "Senior Educational Counselor & Adolescent Psychologist",
    date: "Sunday, 26 October 2026",
    time: "11:00 AM - 12:30 PM IST",
    badge: "Live Interactive Masterclass",
    category: "High School & Intermediate",
    desc: "Why do 97% of graduates regret their career choices? How to distinguish between what is merely popular and what quenches your authentic curiosity. Introducing the Socratic Inquisitions method.",
    keyTakeaways: [
      "Scientific mapping of aptitude vs. true joy before picking PCM, PCB, Commerce, or Arts",
      "How to avoid herd mentality and commercial coaching institute traps",
      "Turning students into independent debuggers of their academic challenges",
    ],
    attendeesCount: "1,840+ Registered",
    status: "upcoming",
  },
  {
    id: "w2",
    title: "Demystifying College Electives: What Your Syllabus Won't Tell You About Future Jobs",
    speaker: "Faculty Advisory Panel & Senior Mentors",
    speakerTitle: "Inspiria Careers Global Mentor Network",
    date: "Saturday, 8 November 2026",
    time: "5:00 PM - 6:30 PM IST",
    badge: "Undergraduate Advisory",
    category: "College Electives",
    desc: "A thorough dissection of electives and multi-disciplinary pathways across B.Tech, MBBS, B.Com, Design, and Sports Sciences. How to choose electives that unlock top global placements.",
    keyTakeaways: [
      "Comparative analysis of emergent electives: AI systems, corporate econometrics, sports tech",
      "Aligning college minor/major combinations for international master's programs",
      "Unlocking instruments of growth: Competitions, fellowships, and research directors",
    ],
    attendeesCount: "2,200+ Registered",
    status: "upcoming",
  },
  {
    id: "w3",
    title: "Non-Linear Careers: Excelling in Sports Sciences, Design & Entrepreneurship",
    speaker: "Guest Mentors from Khelo India, NID & Top Startups",
    speakerTitle: "Specialized Field Directors",
    date: "Sunday, 22 November 2026",
    time: "4:00 PM - 5:30 PM IST",
    badge: "Creative & Sports Disciplines",
    category: "Atypical Trajectories",
    desc: "Guided guidance for proficient and struggling students in education, sports, and entrepreneurship. How to convince parents and build sustainable careers outside typical 9-to-5 models.",
    keyTakeaways: [
      "Funding avenues, corporate sponsorships, and university athletic fellowships",
      "Portfolio architecture and design entrance exam composure (UCEED/NID)",
      "Venture building basics for teenagers and early college students",
    ],
    attendeesCount: "950+ Registered",
    status: "upcoming",
  },
  {
    id: "w_past_1",
    title: "Exam Composure & Board Exam Distress Mitigation: Masterclass for Parents & Teens",
    speaker: "Principal Ma'am",
    speakerTitle: "Senior Counselor",
    date: "Recorded Live Session (September 2026)",
    time: "1 Hour 40 Mins",
    badge: "Recorded Archive",
    category: "Mental Wellness",
    desc: "Overcoming fear of failure, performance anxiety, and building emotional fortitude for high-pressure competitive exams like JEE, NEET, and CUET.",
    keyTakeaways: [
      "Parent-child empathetic dialogue frameworks",
      "Sleep and circadian optimization during intensive revision",
      "Converting distress into focused calm during test hours",
    ],
    attendeesCount: "4,500+ Watched",
    status: "past",
    recordingUrl: "https://www.youtube.com",
  },
];

export default function WebinarsPage() {
  const { settings } = useSite();
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "past">("upcoming");
  const [registered, setRegistered] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "", grade: "Class 12", webinarTitle: "" });
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenRegister = (title: string) => {
    setRegForm((prev) => ({ ...prev, webinarTitle: title }));
    setRegistered(false);
    setModalOpen(true);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistered(true);
  };

  const displayedWebinars = WEBINAR_LIST.filter((w) => w.status === selectedTab);

  return (
    <main className="page-wrapper" style={{ paddingTop: "6rem", paddingBottom: "5rem" }}>
      {/* ── 1. HEADER ── */}
      <section
        style={{
          background: "linear-gradient(135deg, #002147 0%, #1e3a8a 100%)",
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
            <span style={{ color: "#ffffff" }}>WEBINARS &amp; MASTERCLASSES</span>
          </div>

          <div style={{ maxWidth: 850 }}>
            <div className="section-tag" style={{ background: "rgba(255,204,0,0.18)", color: "#ffcc00", borderColor: "rgba(255,204,0,0.4)" }}>
              5-7 Year Global Business Goal #5
            </div>
            <h1 style={{ fontSize: "2.6rem", fontWeight: 800, marginTop: "0.75rem", lineHeight: 1.25 }}>
              All-India Orientation <span>Webinars &amp; Masterclasses</span>
            </h1>
            <p style={{ color: "#e2e8f0", fontSize: "1.1rem", lineHeight: 1.8, marginTop: "1rem" }}>
              Demystifying career choices, examining college electives, and sharing direct lived experiences of senior mentors. Free interactive webinars connecting thousands of students nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. TAB CONTROLS ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "1.25rem 2rem" }}>
        <div className="container">
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => setSelectedTab("upcoming")}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                background: selectedTab === "upcoming" ? "#009ea9" : "transparent",
                color: selectedTab === "upcoming" ? "#ffffff" : "#475569",
                border: selectedTab === "upcoming" ? "1px solid #009ea9" : "1px solid #cbd5e1",
                transition: "all 0.2s ease",
              }}
            >
              🗓️ Upcoming Live Webinars ({WEBINAR_LIST.filter((w) => w.status === "upcoming").length})
            </button>
            <button
              onClick={() => setSelectedTab("past")}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: 6,
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                background: selectedTab === "past" ? "#002147" : "transparent",
                color: selectedTab === "past" ? "#ffffff" : "#475569",
                border: selectedTab === "past" ? "1px solid #002147" : "1px solid #cbd5e1",
                transition: "all 0.2s ease",
              }}
            >
              🎥 Recorded Video Vault ({WEBINAR_LIST.filter((w) => w.status === "past").length})
            </button>
          </div>
        </div>
      </section>

      {/* ── 3. WEBINAR LIST ── */}
      <section className="section" style={{ background: "#f8fafc" }}>
        <div className="container">
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {displayedWebinars.map((w) => (
              <div
                key={w.id}
                className="card card-gold animate-in"
                style={{
                  background: "#ffffff",
                  padding: "2.25rem",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  display: "grid",
                  gridTemplateColumns: "1.3fr 0.7fr",
                  gap: "2.5rem",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    <span className="badge badge-teal">{w.category}</span>
                    <span className="badge badge-gold">{w.badge}</span>
                  </div>

                  <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#002147", marginBottom: "0.75rem" }}>
                    {w.title}
                  </h3>

                  <p style={{ color: "#475569", lineHeight: 1.8, fontSize: "0.95rem", marginBottom: "1.25rem" }}>
                    {w.desc}
                  </p>

                  <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: 8, marginBottom: "1.25rem" }}>
                    <strong style={{ fontSize: "0.85rem", color: "#002147", display: "block", marginBottom: "0.4rem" }}>
                      Key Masterclass Outcomes:
                    </strong>
                    <ul style={{ paddingLeft: "1.25rem", margin: 0, fontSize: "0.88rem", color: "#64748b", lineHeight: 1.6 }}>
                      {w.keyTakeaways.map((k, i) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.9rem", color: "#002147", fontWeight: 600 }}>
                    <span>📅 {w.date}</span>
                    <span>⏰ {w.time}</span>
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(0,33,71,0.03)",
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "1.75rem",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎙️</div>
                  <strong style={{ fontSize: "1.1rem", color: "#002147", display: "block" }}>{w.speaker}</strong>
                  <span style={{ fontSize: "0.85rem", color: "#009ea9", display: "block", marginBottom: "1rem" }}>
                    {w.speakerTitle}
                  </span>

                  <div style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 700, marginBottom: "1.25rem" }}>
                    👥 {w.attendeesCount}
                  </div>

                  {w.status === "upcoming" ? (
                    <button
                      onClick={() => handleOpenRegister(w.title)}
                      className="btn btn-teal w-full"
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      🎟️ Reserve Free Seat
                    </button>
                  ) : (
                    <a
                      href={w.recordingUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-navy w-full"
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      ▶️ Watch Recording Free
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. REGISTRATION MODAL ── */}
      {modalOpen && (
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
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: "2rem",
              maxWidth: 500,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              border: "2px solid #ffcc00",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span className="badge badge-gold">Free Webinar Seat Reservation</span>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {registered ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
                <h3 style={{ color: "#002147", fontWeight: 800 }}>Seat Confirmed!</h3>
                <p style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.6, margin: "0.75rem 0 1.5rem" }}>
                  A confirmation email with the private webinar joining link has been scheduled for <strong>{regForm.email || "your email"}</strong>.
                </p>
                <button onClick={() => setModalOpen(false)} className="btn btn-teal">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>
                  {regForm.webinarTitle}
                </h4>
                <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                  Enter your details to receive the webinar calendar invite and preparatory materials.
                </p>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="Enter student or parent name"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label">WhatsApp Number (For Reminder Alert)</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+91 99999 99999"
                  />
                </div>

                <button type="submit" className="btn btn-gold w-full" style={{ width: "100%", justifyContent: "center" }}>
                  Confirm My Free Seat 🚀
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
