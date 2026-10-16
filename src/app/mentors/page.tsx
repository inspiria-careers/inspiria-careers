"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

interface Mentor {
  id: string;
  name: string;
  role: string;
  institution: string;
  expertise: string;
  experience: string;
  bio: string;
  avatarEmoji: string;
  badge: string;
}

const GLOBAL_MENTORS: Mentor[] = [
  {
    id: "m1",
    name: "Dr. Arvind Subramanian",
    role: "Senior Research Fellow & Academic Dean",
    institution: "Former Faculty, IIT Delhi & Cambridge Visiting Fellow",
    expertise: "STEM Streams, Computing Architectures, Research Fellowships",
    experience: "22+ Years in Academia",
    bio: "Passionate about demystifying engineering disciplines so high school students choose tracks based on deep cognitive joy rather than societal pressure.",
    avatarEmoji: "👨‍🔬",
    badge: "Faculty Partner",
  },
  {
    id: "m2",
    name: "Dr. Meenakshi Sundaram",
    role: "Clinical Professor & Adolescent Wellness Advisor",
    institution: "AIIMS New Delhi & NIMHANS Associate",
    expertise: "Medical Entrance Mindset, Bioethics, Clinical Sciences",
    experience: "18+ Years Clinical Practice",
    bio: "Helping aspiring medical students develop the emotional fortitude and composure necessary for grueling entrance exams and clinical realities.",
    avatarEmoji: "👩‍⚕️",
    badge: "Medical Fellow",
  },
  {
    id: "m3",
    name: "Vikramjit Roy, CFA",
    role: "Global Fintech Director & Startup Mentor",
    institution: "IIM Ahmedabad Alumnus & Angel Investor",
    expertise: "Economics, Investment Banking, Venture Building",
    experience: "16+ Years in Global Capital",
    bio: "Instilling the 'Life Demat Account' mindset in commerce students — helping them analyze risk, build agency, and master market dynamics.",
    avatarEmoji: "👨‍💼",
    badge: "Industry Mentor",
  },
  {
    id: "m4",
    name: "Coach Rajeshwar Rao",
    role: "National Conditioning Director & Sports Analyst",
    institution: "Sports Authority of India & Olympic Grassroots Program",
    expertise: "Sports Sciences, Athlete Nutrition, Athletic Management",
    experience: "14+ Years in Elite Athletics",
    bio: "Guiding young sportsmen and athletic science aspirants to unlock professional careers in performance tracking, physical therapy, and league operations.",
    avatarEmoji: "🏃‍♂️",
    badge: "Sports Director",
  },
  {
    id: "m5",
    name: "Tanvi Kulkarni",
    role: "Design Lead & Cognitive Ergonomics Specialist",
    institution: "National Institute of Design (NID) Alumna & Product Lead",
    expertise: "Human-Centered Design, UCEED/NID Preparation, UI/UX",
    experience: "11+ Years Product Innovation",
    bio: "Mentoring unconventional thinkers and visual storytellers to transform creative aptitude into high-impact product careers.",
    avatarEmoji: "🎨",
    badge: "Design Mentor",
  },
  {
    id: "m6",
    name: "Adv. Raghavendra Chawla",
    role: "Supreme Court Advocate & Policy Analyst",
    institution: "NLSIU Bangalore Alumnus & Constitutional Researcher",
    expertise: "CLAT Strategy, Public Policy, Cross-Border Jurisprudence",
    experience: "13+ Years Legal Practice",
    bio: "Exposing young legal minds to critical confabs, rhetorical rigor, and judicial ethics before they enter law school.",
    avatarEmoji: "⚖️",
    badge: "Legal Partner",
  },
];

export default function MentorsPage() {
  const { settings } = useSite();
  const [applied, setApplied] = useState(false);
  const [applyModal, setApplyModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", field: "", background: "" });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied(true);
  };

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
            <span style={{ color: "#ffffff" }}>GLOBAL MENTOR &amp; PARTNER NETWORK</span>
          </div>

          <div style={{ maxWidth: 900 }}>
            <div className="section-tag" style={{ background: "rgba(255,204,0,0.18)", color: "#ffcc00", borderColor: "rgba(255,204,0,0.4)" }}>
              5-7 Year Global Business Goal #2
            </div>
            <h1 style={{ fontSize: "2.6rem", fontWeight: 800, marginTop: "0.75rem", lineHeight: 1.25 }}>
              Connecting the Best Mentors <span>Throughout the World</span>
            </h1>
            <p style={{ color: "#e2e8f0", fontSize: "1.1rem", lineHeight: 1.8, marginTop: "1rem" }}>
              Having assistance from faculties of different fields, associated students pursuing all X, Y, and Z trajectories, and indelible experiences of seniors is what enables Inspiria Careers to empower zillions in direct and second-hand terms.
            </p>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.75rem", flexWrap: "wrap" }}>
              <button onClick={() => setApplyModal(true)} className="btn btn-gold">
                🤝 Join as a Global Mentor
              </button>
              <Link href="/contact" className="btn btn-ghost">
                🗓️ Request Mentor Matching
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. PARTNER EXPERIENCE MANIFESTO ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "2.5rem 2rem" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "3rem", alignItems: "center" }}>
            <div>
              <span className="section-tag">Collective Intelligence</span>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#002147", marginTop: "0.5rem" }}>
                Partner&apos;s Experience &amp; Faculty Synergy
              </h2>
              <p style={{ color: "#334155", lineHeight: 1.85, fontSize: "0.98rem", margin: "1rem 0" }}>
                To be honest, no single counselor possesses omniscience across every modern field. That is why Inspiria Careers is designed as an open collaborative network: bringing university deans, corporate practitioners, and athletic directors under one unified portal sharing our core notion.
              </p>
              <p style={{ color: "#64748b", lineHeight: 1.8, fontSize: "0.92rem" }}>
                When a student consults with us, they do not merely receive textbook advice. They unlock direct confabs with field veterans who lived the exact triumphs and pitfalls they are about to encounter.
              </p>
            </div>

            <div className="card card-gold" style={{ padding: "2rem", background: "rgba(255,204,0,0.06)", border: "1px solid rgba(255,204,0,0.3)" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#002147", marginBottom: "0.75rem" }}>
                🚀 Instruments of Growth We Unlock:
              </h3>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem", color: "#334155" }}>
                <li style={{ display: "flex", gap: "0.6rem" }}>
                  <span>🎯</span> <strong>Right Competitions:</strong> Olympiads, hackathons, moot courts, federations.
                </li>
                <li style={{ display: "flex", gap: "0.6rem" }}>
                  <span>📚</span> <strong>Vetted Channels:</strong> Open archives, research portals, elite syllabi.
                </li>
                <li style={{ display: "flex", gap: "0.6rem" }}>
                  <span>👨‍🏫</span> <strong>Dedicated Field Directors:</strong> 1-on-1 strategic milestones.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. MENTOR CARDS GRID ── */}
      <section className="section" style={{ background: "#f8fafc" }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="section-tag">Distinguished Faculties</div>
            <h2 className="section-title">
              Our Global <span>Advisory Council</span>
            </h2>
          </div>

          <div className="grid-3">
            {GLOBAL_MENTORS.map((m) => (
              <div
                key={m.id}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "2.5rem" }}>{m.avatarEmoji}</div>
                    <span className="badge badge-gold">{m.badge}</span>
                  </div>

                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#002147", marginBottom: "0.25rem" }}>
                    {m.name}
                  </h3>
                  <div style={{ fontSize: "0.85rem", color: "#009ea9", fontWeight: 700, marginBottom: "0.3rem" }}>
                    {m.role}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.75rem" }}>
                    🏛️ {m.institution}
                  </div>

                  <p style={{ color: "#475569", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                    {m.bio}
                  </p>

                  <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: 6, fontSize: "0.8rem", color: "#334155" }}>
                    <strong>Focus:</strong> {m.expertise}
                  </div>
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <Link
                    href={`/contact?subject=Mentorship with ${encodeURIComponent(m.name)}`}
                    className="btn btn-navy btn-sm w-full"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    💬 Request Mentorship Session
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. JOIN AS MENTOR MODAL ── */}
      {applyModal && (
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
          onClick={() => setApplyModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: "2rem",
              maxWidth: 520,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              border: "2px solid #009ea9",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span className="badge badge-teal">Global Mentor Application</span>
              <button
                onClick={() => setApplyModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {applied ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🤝</div>
                <h3 style={{ color: "#002147", fontWeight: 800 }}>Application Received!</h3>
                <p style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.6, margin: "0.75rem 0 1.5rem" }}>
                  Thank you for sharing our vision of selfless guidance. Our Senior Counselor team will connect with you within 48 hours.
                </p>
                <button onClick={() => setApplyModal(false)} className="btn btn-teal">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit}>
                <h4 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>
                  Join the Inspiria Global Mentor Circle
                </h4>
                <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                  Are you a university professor, senior industry practitioner, or athletic director who wants to guide students genuinely without commercial doubt?
                </p>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Full Name &amp; Title *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Kumar, Professor of Economics"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@university.edu"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Domain / Discipline of Mentorship *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={form.field}
                    onChange={(e) => setForm({ ...form, field: e.target.value })}
                    placeholder="e.g. Mechanical Engineering, Biotech, Law, Sports Kinesiology"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label">Brief Background &amp; Motivation</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    value={form.background}
                    onChange={(e) => setForm({ ...form, background: e.target.value })}
                    placeholder="Tell us about your mentoring background..."
                  />
                </div>

                <button type="submit" className="btn btn-gold w-full" style={{ width: "100%", justifyContent: "center" }}>
                  Submit Mentor Application 🚀
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
