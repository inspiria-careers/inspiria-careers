"use client";
import Link from "next/link";
import Image from "next/image";
import HeroSlider from "@/components/HeroSlider";
import RenderIcon from "@/components/RenderIcon";
import { useSite, defaultHomeOptions } from "@/contexts/SiteContext";

export default function HomePage() {
  const { settings } = useSite();
  const services = settings.services || [];

  const stats = [
    { value: settings.studentsGuided, label: settings.studentsGuidedLabel || "Students Guided Nationwide" },
    { value: settings.yearsExperience, label: settings.yearsExperienceLabel || "Years of Educational Service" },
    { value: settings.successRate, label: settings.successRateLabel || "Admission & Career Success Rate" },
    { value: settings.statMetric4Value || "100%", label: settings.statMetric4Label || "Personalized 1-on-1 Attention" },
  ];

  return (
    <main style={{ background: "#f8fafc" }}>
      {/* ── 1. HERO SLIDER BANNER (MATCHES SCREENSHOT LAYOUT & CONTROLS) ── */}
      <HeroSlider />

      {/* ── 2. LATEST ANNOUNCEMENT TICKER ── */}
      <div className="gov-ticker-bar">
        <span className="ticker-tag">{settings.tickerTag || "LATEST ANNOUNCEMENTS"}</span>
        <div className="ticker-content">
          {settings.tickerText || `📢 Admissions & Career Counseling 2026-27 Registrations Open · 🎯 Book 1-on-1 Direct Counseling Slot with ${settings.principalName} · 🧠 Free Psychometric Stream Assessment Available for Class 10 & 12 Students`}
        </div>
      </div>

      {/* ── 3. MANDATE & INTRODUCTION SECTION (EXACT TEXT FROM SCREENSHOT) ── */}
      <section className="mandate-section">
        <div className="mandate-box">
          <p>
            {settings.mandateText || (
              <>
                The <strong>{settings.siteName.split(" ")[0]} eCounselling Solution</strong> is a robust and scalable system
                designed to streamline and enhance the digital counselling process for academic and professional institutions
                across the country. It provides end-to-end technical support and personalized mentorship services towards a
                hassle-free transparent admission process. Under the guidance of <strong>{settings.principalName}</strong>,
                it integrates advanced psychometric profiling and compassionate counseling to ensure secure, transparent,
                and efficient guidance services for candidates, parents, and examination/admission boards.
              </>
            )}
            {" "}
            <Link href="/about" className="btn-view-more">
              {settings.mandateBtnText || "View More →"}
            </Link>
          </p>
        </div>
      </section>

      {/* ── 4. STRATEGIC GOALS & MANDATES (HEADING FROM SCREENSHOT) ── */}
      <section className="section" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">{settings.goalsSectionTag || "Core Principles"}</div>
            <h2 className="section-title">
              {settings.goalsSectionTitle || (
                <>
                  Strategic Goals &amp; <span>Mandates</span>
                </>
              )}
            </h2>
            <p className="section-subtitle">
              {settings.goalsSectionSubtitle || "Pioneering a standardized, transparent, and empathetic career guidance framework for every student."}
            </p>
          </div>

          <div className="grid-3">
            <div className="card card-teal">
              <div style={{ marginBottom: "0.75rem" }}>
                <RenderIcon icon={settings.goal1Icon || "🎯"} alt={settings.goal1Title} size={50} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>
                {settings.goal1Title || "Scientific Stream & Career Selection"}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.7 }}>
                {settings.goal1Desc || "Eliminating uncertainty through validated aptitude metrics, helping students pinpoint subjects and college degrees perfectly aligned with their innate cognitive capabilities."}
              </p>
            </div>

            <div className="card card-teal">
              <div style={{ marginBottom: "0.75rem" }}>
                <RenderIcon icon={settings.goal2Icon || "🌿"} alt={settings.goal2Title} size={50} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>
                {settings.goal2Title || "Exam Distress & Anxiety Mitigation"}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.7 }}>
                {settings.goal2Desc || "Holistic psychological support and mental composure coaching for board exams, JEE, NEET, and CUET, fostering emotional resilience and unwavering confidence."}
              </p>
            </div>

            <div className="card card-teal">
              <div style={{ marginBottom: "0.75rem" }}>
                <RenderIcon icon={settings.goal3Icon || "🏛️"} alt={settings.goal3Title} size={50} />
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>
                {settings.goal3Title || "Central & Global Admission Advisory"}
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.7 }}>
                {settings.goal3Desc || "Complete roadmap navigation covering college seat matrix, SOP drafting, portfolio preparation, and scholarship acquisition across premier Indian institutions and Ivy League universities."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. SERVICES & VERTICALS (CUSTOMIZABLE WITH UNIFORM ICONS) ── */}
      <section className="section" style={{ background: "#f8fafc" }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">{settings.servicesSectionTag || "Guidance Offerings"}</div>
            <h2 className="section-title">
              {settings.servicesSectionTitle || (
                <>
                  Our Counselling <span>Services &amp; Verticals</span>
                </>
              )}
            </h2>
            <p className="section-subtitle">
              {settings.servicesSectionSubtitle || "Comprehensive counseling solutions tailored to each student's unique journey and aspirations."}
            </p>
          </div>

          <div className="grid-3">
            {services.map((s, i) => (
              <div
                key={i}
                className="card card-gold animate-in"
                style={{
                  background: "#ffffff",
                  padding: "1.75rem",
                  border: "1px solid #e2e8f0",
                  borderTop: "3px solid #002147",
                }}
              >
                <div style={{ marginBottom: "1rem" }}>
                  <RenderIcon icon={s.icon} alt={s.title} size={58} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>
                  {s.title}
                </h3>
                <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link href="/contact" className="btn btn-teal" style={{ padding: "0.75rem 2rem", fontSize: "0.95rem" }}>
              {settings.servicesBtnText || "🗓️ Book a Counseling Session Now"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. INTERACTIVE GUIDANCE MODULES & OPTIONS (DYNAMICALLY EDITABLE) ── */}
      <section className="section" style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Interactive Features</div>
            <h2 className="section-title">
              {settings.homeOptionsTitle || "Interactive Guidance Modules & Quick Options"}
            </h2>
            <p className="section-subtitle">
              {settings.homeOptionsSubtitle || "Explore our integrated career database, global mentor network, orientation webinars, and custom institutional templates."}
            </p>
          </div>

          <div className="grid-3">
            {(settings.homeOptions && settings.homeOptions.length > 0 ? settings.homeOptions : defaultHomeOptions).map((opt) => (
              <div
                key={opt.id}
                className="card card-teal animate-in"
                style={{
                  background: "#ffffff",
                  padding: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "2.25rem" }}>{opt.icon}</div>
                    {opt.badge && <span className="badge badge-gold">{opt.badge}</span>}
                  </div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#002147", marginBottom: "0.5rem" }}>
                    {opt.title}
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                    {opt.desc}
                  </p>
                </div>
                <Link
                  href={opt.href}
                  className="btn btn-teal btn-sm"
                  style={{ alignSelf: "flex-start", width: "100%", justifyContent: "center" }}
                >
                  {opt.btnText || "Open Option →"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. PHILOSOPHICAL HIGHLIGHT: THE DEMAT ACCOUNT & GROWTH INSTRUMENTS ── */}
      <section className="section" style={{ background: "linear-gradient(135deg, #002147 0%, #0c3666 100%)", color: "#ffffff" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "3.5rem", alignItems: "center" }}>
            <div>
              <div className="section-tag" style={{ background: "rgba(255,204,0,0.15)", color: "#ffcc00", borderColor: "rgba(255,204,0,0.4)" }}>
                Core Philosophy &amp; Socratic Inquisitions
              </div>
              <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#ffffff", marginTop: "0.75rem", lineHeight: 1.3 }}>
                Stock in Your Life&apos;s <span style={{ color: "#ffcc00" }}>Demat Account</span>
              </h2>
              <p style={{ color: "#cbd5e1", lineHeight: 1.85, fontSize: "1rem", margin: "1.25rem 0" }}>
                A mind once exquisitely said, <em>&ldquo;Choose a job you love, and you will never have to work a day in your life.&rdquo;</em> Easier said than implemented. How many individuals actually mess with their gray matter to find their true love? 97% of people follow the populace and waste years in regret. That is why a structured Career Plan is the single most valuable stock in your life&apos;s demat account.
              </p>
              <p style={{ color: "#94a3b8", lineHeight: 1.8, fontSize: "0.92rem", marginBottom: "1.75rem" }}>
                We impose diagnostic inquisitions upon you — structured confabs that distinguish between what is merely popular and what quenches your authentic curiosity. We then unlock the <strong>instruments of growth</strong>: acknowledging students with the right competitions, channels, mentors, and field directors.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link href="/database" className="btn btn-gold">
                  Explore Career Fields Database 📊
                </Link>
                <Link href="/about" className="btn btn-ghost">
                  Read Socratic Methodology →
                </Link>
              </div>
            </div>

            <div
              className="card"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,204,0,0.3)",
                padding: "2rem",
                borderRadius: 14,
                boxShadow: "0 12px 36px rgba(0,0,0,0.3)",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", color: "#ffcc00", marginBottom: "1rem", fontWeight: 800 }}>
                🍕 Ease of Access Like Ordering a Pizza
              </h3>
              <p style={{ color: "#e2e8f0", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                Our 5-7 year global mandate is to remove every shred of doubt from career guidance, establishing global accessibility as instinctive as ordering your favorite meal.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.2rem" }}>🎯</span>
                  <div style={{ fontSize: "0.88rem", color: "#cbd5e1" }}>
                    <strong style={{ color: "#ffffff" }}>Independent Debuggers:</strong> Training youth to solve problems without crippling doubt.
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.2rem" }}>🌐</span>
                  <div style={{ fontSize: "0.88rem", color: "#cbd5e1" }}>
                    <strong style={{ color: "#ffffff" }}>Worldwide Mentors:</strong> Connecting premier global faculties with student seekers.
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.2rem" }}>📱</span>
                  <div style={{ fontSize: "0.88rem", color: "#cbd5e1" }}>
                    <strong style={{ color: "#ffffff" }}>Mobile Ecosystem:</strong> Android &amp; iOS apps bringing guidance straight to your pocket.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. COUNSELOR PROFILE SECTION ── */}
      <section className="section" style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "3.5rem", alignItems: "center" }}>
            <div>
              <div className="section-tag">{settings.counselorSectionTag || "About the Senior Counselor"}</div>
              <h2 className="section-title" style={{ textAlign: "left", marginTop: "0.5rem" }}>
                Meet <span>{settings.principalName}</span>
              </h2>
              <p style={{ color: "#334155", lineHeight: 1.85, margin: "1.25rem 0", fontSize: "1rem" }}>
                {settings.aboutBio}
              </p>
              <blockquote
                style={{
                  borderLeft: "4px solid #009ea9",
                  padding: "0.85rem 1.25rem",
                  margin: "1.5rem 0",
                  fontStyle: "italic",
                  color: "#0f172a",
                  background: "#e6f7f8",
                  borderRadius: "0 6px 6px 0",
                  fontSize: "0.95rem",
                }}
              >
                &ldquo;{settings.philosophy}&rdquo;
              </blockquote>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                <Link href="/about" className="btn btn-navy">
                  Read Full Counselor Biography →
                </Link>
                <Link href="/contact" className="btn btn-teal">
                  Schedule Direct Consultation
                </Link>
              </div>
            </div>

            <div>
              <div
                className="card"
                style={{
                  textAlign: "center",
                  padding: "2.5rem",
                  background: "#ffffff",
                  border: "2px solid #002147",
                  boxShadow: "0 10px 30px rgba(0,33,71,0.1)",
                }}
              >
                <div
                  style={{
                    width: 140,
                    height: 175,
                    borderRadius: 10,
                    margin: "0 auto 1.25rem",
                    overflow: "hidden",
                    border: "3px solid #ffcc00",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                    background: "#0c1b3a",
                  }}
                >
                  <img
                    src={settings.principalPhoto || "/logo.jpg"}
                    alt={settings.principalName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#002147" }}>
                  {settings.principalName}
                </h3>
                <p style={{ color: "#009ea9", fontSize: "0.85rem", fontWeight: 700, margin: "0.3rem 0 1rem" }}>
                  {settings.principalDesignation || "Senior Educational & Career Counselor | M.Ed & Child Psychologist"}
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span className="badge badge-teal">{settings.counselorBadge1 || "Academic Mentor"}</span>
                  <span className="badge badge-gold">{settings.counselorBadge2 || "Adolescent Coach"}</span>
                  <span className="badge badge-blue">{settings.counselorBadge3 || "Global Advisory"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. STATS BANNER (PORTAL NUMBERS) ── */}
      <section style={{ background: "#002147", color: "#ffffff", padding: "3rem 2rem" }}>
        <div className="container">
          <div className="grid-4" style={{ textAlign: "center" }}>
            {stats.map((s, i) => (
              <div key={i} style={{ padding: "1rem" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#ffcc00", marginBottom: "0.25rem" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CALL TO ACTION ── */}
      <section style={{ background: "#e6f7f8", padding: "4rem 2rem", borderTop: "1px solid #a3e3e7" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: 740 }}>
          <div className="section-tag" style={{ background: "#ffffff" }}>{settings.ctaTag || "Official Advisory Portal"}</div>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#002147", marginTop: "0.5rem" }}>
            {settings.ctaTitle || "Ready to Plan Your Educational & Career Future?"}
          </h2>
          <p style={{ color: "#475569", margin: "1.25rem 0 2rem", fontSize: "1.05rem", lineHeight: 1.8 }}>
            {settings.ctaDesc || "Empowering students with clarity, confidence, and competitive competence. Access expert counseling articles, research resources, and schedule your session today."}
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact" className="btn btn-teal" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
              {settings.ctaBtnText || "🗓️ Book Consultation Session"}
            </Link>
            <Link href="/posts" className="btn btn-navy" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
              📖 Explore Articles &amp; Guides
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
