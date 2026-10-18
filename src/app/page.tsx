"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import { CalendarIcon, SparklesIcon, DynamicVectorIcon } from "@/components/Icons";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ display: "flex", justifyContent: "center", color: "var(--brand-secondary)" }}>
        <SparklesIcon size={40} />
      </div>
      <p className="empty-state-desc">{message}</p>
    </div>
  );
}

export default function HomePage() {
  const { profile, services, loading, lang } = useSite();

  if (loading) {
    return (
      <main className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </main>
    );
  }

  const hasProfile = profile.counsellorName || profile.counsellorBio;
  const hasAnnouncement = !!profile.announcement;

  return (
    <main className="page-wrapper">
      {/* ── Announcement Ticker ── */}
      {hasAnnouncement && (
        <div className="ticker-bar" role="marquee" aria-label="Announcements">
          <div className="container">
            <div className="ticker-inner">{profile.announcement}&nbsp;&nbsp;&nbsp;&nbsp;{profile.announcement}</div>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container">
          <div className="hero-title" id="hero-title">
            {profile.siteName || "Inspiria Careers"}{" "}
            {profile.tagline && <><br /><span>{profile.tagline}</span></>}
          </div>
          <p className="hero-subtitle">
            {profile.subTagline || t("detailsComingSoon", lang)}
          </p>
          <div className="hero-actions">
            <Link href="/contact" className="btn btn-secondary btn-lg" id="hero-book-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarIcon size={18} />
              {t("bookAppointment", lang)}
            </Link>
            <Link href="/about" className="btn btn-ghost btn-lg" style={{ color: "#fff", borderColor: "rgba(255,255,255,.45)" }}>
              {t("about", lang)} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Banner (only if data set) ── */}
      {(profile.studentsGuided || profile.yearsExperience || profile.successRate) && (
        <section style={{ background: "var(--brand-primary-dark, #111f52)", padding: "2.5rem 1.25rem" }} aria-label="Statistics">
          <div className="container">
            <div className="grid-4" style={{ textAlign: "center" }}>
              {[
                { val: profile.studentsGuided, lbl: lang === "hi" ? "मार्गदर्शित छात्र" : "Students Guided" },
                { val: profile.yearsExperience, lbl: lang === "hi" ? "वर्षों का अनुभव" : "Years Experience" },
                { val: profile.successRate, lbl: lang === "hi" ? "सफलता दर" : "Success Rate" },
                { val: "100%", lbl: lang === "hi" ? "व्यक्तिगत ध्यान" : "Personalised Attention" },
              ]
                .filter((s) => s.val)
                .map((s) => (
                  <div key={s.lbl} className="stat-card">
                    <div className="stat-value">{s.val}</div>
                    <div className="stat-label">{s.lbl}</div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Services Section ── */}
      <section className="section" aria-labelledby="services-heading">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">{lang === "hi" ? "हमारी सेवाएं" : "Our Services"}</div>
            <h2 className="section-title" id="services-heading">
              {lang === "hi" ? (
                <>परामर्श <span>सेवाएं</span></>
              ) : (
                <>Counselling <span>Services</span></>
              )}
            </h2>
            <p className="section-subtitle">
              {lang === "hi" ? "हर छात्र के लिए अनुकूलित मार्गदर्शन।" : "Tailored guidance for every student's unique journey."}
            </p>
          </div>

          {services.length === 0 ? (
            <EmptyState message={t("detailsComingSoon", lang)} />
          ) : (
            <div className="grid-3">
              {services.map((s) => (
                <div key={s.id} className="card card-accent">
                  <div style={{ marginBottom: ".75rem", color: "var(--brand-primary)" }}>
                    <DynamicVectorIcon name={s.icon} size={36} />
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: ".5rem" }}>{s.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.7 }}>{s.description}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link href="/contact" className="btn btn-primary" id="services-book-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarIcon size={18} />
              {t("bookAppointment", lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Counsellor Intro ── */}
      <section className="section" style={{ background: "var(--surface-2)" }} aria-labelledby="counsellor-heading">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "3rem", alignItems: "center" }} className="grid-auto-counsellor">
            <div>
              <div className="section-tag">{lang === "hi" ? "परामर्शदाता" : "Meet the Counsellor"}</div>
              <h2 className="section-title" id="counsellor-heading" style={{ textAlign: "left", marginTop: ".5rem" }}>
                {hasProfile ? profile.counsellorName : t("detailsComingSoon", lang)}
              </h2>
              {profile.counsellorTitle && (
                <p style={{ color: "var(--brand-secondary)", fontWeight: 600, marginBottom: "1rem" }}>
                  {profile.counsellorTitle}
                </p>
              )}
              {profile.counsellorBio && (
                <p style={{ color: "var(--text-muted)", lineHeight: 1.85, marginBottom: "1.5rem" }}>
                  {profile.counsellorBio}
                </p>
              )}
              {!hasProfile && <p style={{ color: "var(--text-muted)" }}>{t("detailsComingSoon", lang)}</p>}
              <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                <Link href="/about" className="btn btn-outline">{t("about", lang)} →</Link>
                <Link href="/contact" className="btn btn-primary" id="counsellor-book-btn">
                  {t("bookAppointment", lang)}
                </Link>
              </div>
            </div>

            {profile.counsellorPhoto && (
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <img
                  src={profile.counsellorPhoto}
                  alt={profile.counsellorName || "Counsellor"}
                  style={{ width: 160, height: 200, objectFit: "cover", borderRadius: "var(--radius)", border: "3px solid var(--brand-secondary)", boxShadow: "var(--shadow)" }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginTop: ".75rem", justifyContent: "center", maxWidth: 180 }}>
                  {profile.badge1 && <span className="badge badge-primary">{profile.badge1}</span>}
                  {profile.badge2 && <span className="badge badge-secondary">{profile.badge2}</span>}
                  {profile.badge3 && <span className="badge badge-muted">{profile.badge3}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Reviews Showcase Section ── */}
      <section className="section" style={{ background: "var(--surface-2)" }} aria-labelledby="reviews-heading">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">{t("reviews", lang)}</div>
            <h2 className="section-title" id="reviews-heading">
              {lang === "hi" ? (
                <>छात्रों के <span>अनुभव</span></>
              ) : (
                <>What Students <span>Say</span></>
              )}
            </h2>
            <p className="section-subtitle">
              {lang === "hi"
                ? "सत्यापित छात्रों और अभिभावकों की निष्पक्ष प्रतिक्रिया।"
                : "Real reviews and genuine feedback from guided students and parents."}
            </p>
          </div>

          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <Link href="/reviews" className="btn btn-outline btn-sm">
              {lang === "hi" ? "सभी सत्यापित समीक्षाएं देखें →" : "View All Verified Reviews →"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" style={{ background: "var(--brand-primary)", color: "#fff", textAlign: "center" }} aria-label="Call to action">
        <div className="container" style={{ maxWidth: 680 }}>
          <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 800, marginBottom: "1rem" }}>
            {lang === "hi" ? "अपनी यात्रा आज शुरू करें" : "Start Your Journey Today"}
          </h2>
          <p style={{ opacity: .85, lineHeight: 1.8, marginBottom: "2rem", fontSize: "1rem" }}>
            {lang === "hi"
              ? "हमारे अनुभवी परामर्शदाता के साथ एक सत्र बुक करें और अपने लक्ष्यों की ओर पहला कदम उठाएं।"
              : "Book a session with our experienced counsellor and take the first step towards your goals."}
          </p>
          <Link href="/book" className="btn btn-secondary btn-lg" id="cta-book-btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <CalendarIcon size={18} />
            {t("bookAppointment", lang)}
          </Link>
        </div>
      </section>
    </main>
  );
}
