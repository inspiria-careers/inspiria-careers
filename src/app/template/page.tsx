"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

/**
 * ==============================================================================
 * INSPIRIA CAREERS - MODULAR PAGE TEMPLATE
 * ==============================================================================
 * HOW TO USE THIS TEMPLATE:
 * 1. Duplicate this file into a new folder under `src/app/<your-page-name>/page.tsx`
 * 2. Customize the content below with your titles, cards, and FAQs.
 * 3. Add your new page link to the Navbar in Dashboard > Home Page & Site Settings
 *    or by visiting `/dashboard` -> Settings -> Navigation Menu.
 * ==============================================================================
 */

export default function TemplatePage() {
  const { settings } = useSite();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <main className="page-wrapper" style={{ paddingTop: "6rem", paddingBottom: "5rem" }}>
      {/* ── 1. HERO BANNER WITH BREADCRUMBS ── */}
      <section
        style={{
          background: "linear-gradient(135deg, #002147 0%, #0c3666 100%)",
          color: "#ffffff",
          padding: "4rem 2rem 3.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="container">
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "1rem" }}>
            <Link href="/" style={{ color: "#009ea9", textDecoration: "none", fontWeight: 700 }}>
              HOME
            </Link>
            <span>/</span>
            <span style={{ color: "#ffcc00" }}>CUSTOM MODULE TEMPLATE</span>
          </div>

          <div style={{ maxWidth: 850 }}>
            <div className="section-tag" style={{ background: "rgba(255,204,0,0.15)", color: "#ffcc00", borderColor: "rgba(255,204,0,0.4)" }}>
              Institutional Template
            </div>
            <h1 style={{ fontSize: "2.6rem", fontWeight: 800, marginTop: "0.75rem", lineHeight: 1.25 }}>
              Custom Modular Page <span>Template</span>
            </h1>
            <p style={{ color: "#cbd5e1", fontSize: "1.1rem", lineHeight: 1.8, marginTop: "1rem" }}>
              A standardized, high-performance page layout crafted for Inspiria Careers. Duplicate this template to launch new academic departments, competition guides, or regional counselling initiatives.
            </p>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", flexWrap: "wrap" }}>
              <Link href="/contact" className="btn btn-gold">
                🗓️ Schedule Consultation
              </Link>
              <Link href="/database" className="btn btn-ghost">
                📊 Explore Database
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. KEY STATS / QUICK METRICS BAR ── */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "1.75rem 2rem" }}>
        <div className="container">
          <div className="grid-4" style={{ textAlign: "center" }}>
            {[
              { val: "100%", label: "Customizable Components" },
              { val: "WCAG 2.1", label: "Accessibility Compliant" },
              { val: "Zero Lag", label: "Instant Next.js SSR Routing" },
              { val: "Mobile-First", label: "Responsive Grid System" },
            ].map((st, i) => (
              <div key={i} style={{ padding: "0.5rem" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#002147" }}>{st.val}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: "0.2rem" }}>
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. MAIN BODY & STRUCTURED CONTENT TABS ── */}
      <section className="section" style={{ background: "#f8fafc" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "3.5rem", alignItems: "flex-start" }}>
            {/* Left Content Area */}
            <div>
              {/* Tab Navigation */}
              <div style={{ display: "flex", gap: "0.5rem", borderBottom: "2px solid #e2e8f0", marginBottom: "2rem" }}>
                {[
                  { id: "overview", label: "📌 Overview & Objectives" },
                  { id: "curriculum", label: "📚 Structure & Disciplines" },
                  { id: "instruments", label: "🚀 Growth Instruments" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "0.75rem 1.25rem",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      borderBottom: activeTab === t.id ? "3px solid #009ea9" : "3px solid transparent",
                      color: activeTab === t.id ? "#009ea9" : "#64748b",
                      marginBottom: "-2px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div className="card" style={{ padding: "2rem", background: "#ffffff" }}>
                    <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#002147", marginBottom: "0.75rem" }}>
                      Modular Foundation for Educational Initiatives
                    </h3>
                    <p style={{ color: "#334155", lineHeight: 1.85, fontSize: "0.98rem" }}>
                      This template is engineered to serve students, educators, and partner faculties alike. Whether deploying information about engineering streams, sports fellowships, or overseas university prep, it follows the Inspiria Careers ethos: turning every student into an independent debugger of their own problems.
                    </p>
                    <p style={{ color: "#64748b", lineHeight: 1.8, fontSize: "0.95rem", marginTop: "1rem" }}>
                      97% of career regret originates from opaque information during transitional milestones. By detailing prerequisites, electives, and career outcomes upfront, we bring transparency and peace of mind to students and parents.
                    </p>
                  </div>

                  <div className="grid-2">
                    <div className="card card-teal" style={{ padding: "1.5rem", background: "#ffffff" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎯</div>
                      <h4 style={{ fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>Target Audience</h4>
                      <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.7 }}>
                        Class 9-12 students, undergraduate aspirants, parents seeking transparent guidance, and career changers.
                      </p>
                    </div>

                    <div className="card card-gold" style={{ padding: "1.5rem", background: "#ffffff" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💡</div>
                      <h4 style={{ fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>Socratic Inquisitions</h4>
                      <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.7 }}>
                        Structured self-inquiry checkpoints to confirm authentic interest versus crowd-driven trends.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Structure */}
              {activeTab === "curriculum" && (
                <div className="card" style={{ padding: "2rem", background: "#ffffff" }}>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#002147", marginBottom: "1rem" }}>
                    Program Pathways &amp; Electives Matrix
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {[
                      { stage: "Stage 01", title: "Aptitude & Cognitive Mapping", desc: "Scientific psychometric assessment to map innate logic, spatial intelligence, and resilience." },
                      { stage: "Stage 02", title: "Electives Exploration & Field Deep Dive", desc: "Dissecting college disciplines, coursework difficulty, and future career applications." },
                      { stage: "Stage 03", title: "Strategic Roadmapping", desc: "Building competitive milestones, entrance timelines, and backup options." },
                      { stage: "Stage 04", title: "Mentor Matching & Execution", desc: "Connecting 1-on-1 with industry veterans and senior students pursuing the same journey." },
                    ].map((step, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: "1.25rem",
                          padding: "1.25rem",
                          background: "#f8fafc",
                          borderRadius: 8,
                          borderLeft: "4px solid #009ea9",
                        }}
                      >
                        <span style={{ fontWeight: 800, color: "#009ea9", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                          {step.stage}
                        </span>
                        <div>
                          <strong style={{ color: "#002147", fontSize: "1.05rem", display: "block", marginBottom: "0.25rem" }}>
                            {step.title}
                          </strong>
                          <span style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>{step.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Growth Instruments */}
              {activeTab === "instruments" && (
                <div className="card" style={{ padding: "2rem", background: "#ffffff" }}>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#002147", marginBottom: "1rem" }}>
                    Unlocking the Instruments of Growth
                  </h3>
                  <p style={{ color: "#334155", lineHeight: 1.8, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
                    Knowing your interest is only half the battle. To excel, students must have direct access to the channels, competitions, and field mentors that turn passion into tangible achievements.
                  </p>
                  <div className="grid-2">
                    <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <h4 style={{ color: "#002147", fontWeight: 800, marginBottom: "0.5rem" }}>🏆 National Competitions</h4>
                      <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.6 }}>
                        Olympiads, hackathons, moot courts, sports federations, and innovation challenges suited to your level.
                      </p>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <h4 style={{ color: "#002147", fontWeight: 800, marginBottom: "0.5rem" }}>🌐 Curated Learning Channels</h4>
                      <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.6 }}>
                        Verified YouTube lecture series, open-source repositories, and digital archives vetted by senior counselors.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: Counselor Card & Quick Action */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="card card-gold" style={{ padding: "2rem", background: "#ffffff", textAlign: "center" }}>
                <div
                  style={{
                    width: 100,
                    height: 125,
                    borderRadius: 10,
                    margin: "0 auto 1rem",
                    overflow: "hidden",
                    border: "2px solid #ffcc00",
                    background: "#0c1b3a",
                  }}
                >
                  <img
                    src={settings.principalPhoto || "/logo.jpg"}
                    alt={settings.principalName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#002147" }}>{settings.principalName}</h4>
                <p style={{ color: "#009ea9", fontSize: "0.8rem", fontWeight: 700, margin: "0.25rem 0 1rem" }}>
                  {settings.principalDesignation}
                </p>
                <p style={{ color: "#64748b", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                  &ldquo;{settings.philosophy}&rdquo;
                </p>
                <Link href="/contact" className="btn btn-teal w-full" style={{ width: "100%", justifyContent: "center" }}>
                  🗓️ Book 1-on-1 Consultation
                </Link>
              </div>

              <div className="card" style={{ padding: "1.75rem", background: "#002147", color: "#ffffff" }}>
                <h4 style={{ color: "#ffcc00", fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.75rem" }}>
                  🍕 Vision 2030 Mandate
                </h4>
                <p style={{ color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.7, margin: 0 }}>
                  Over the next 5-7 years, Inspiria Careers is revolutionizing career mentorship globally: intuitive, transparent, and as easy to apply for as ordering a pizza.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. FREQUENTLY ASKED QUESTIONS ACCORDION ── */}
      <section className="section" style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="section-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div className="section-tag">Help &amp; Clarifications</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              {
                q: "How do I duplicate this template for my custom page?",
                a: "Simply copy this file src/app/template/page.tsx into a new folder such as src/app/my-custom-page/page.tsx. Customize the text and add the new route to the Navbar via Dashboard Settings.",
              },
              {
                q: "Can I add interactive buttons and booking widgets?",
                a: "Yes! All components support standard React 19 state and buttons linking directly to /contact, /database, or any custom URL.",
              },
              {
                q: "Is this page mobile responsive?",
                a: "Yes, it fully adheres to the Inspiria Careers design system with responsive CSS grid and fluid typography.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                style={{
                  background: "#f8fafc",
                  borderRadius: 8,
                  padding: "1rem 1.25rem",
                  border: "1px solid #e2e8f0",
                }}
              >
                <summary style={{ fontWeight: 700, color: "#002147", cursor: "pointer", fontSize: "1rem" }}>
                  {faq.q}
                </summary>
                <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.7, marginTop: "0.75rem", paddingLeft: "0.5rem" }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
