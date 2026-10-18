"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export default function AboutPage() {
  const { profile, lang } = useSite();

  const hasData = profile.counsellorName || profile.counsellorBio;
  const qualRows = profile.qualifications
    ? profile.qualifications.split("\n").filter((q) => q.trim())
    : [];
  const specializations = profile.specializations
    ? profile.specializations.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <main className="page-wrapper">
      <div style={{ padding: "3.5rem 0 0" }}>
        {/* ── Hero ── */}
        <section className="section" style={{ background: "var(--surface-2)", paddingTop: "3rem" }} aria-labelledby="about-title">
          <div className="container">
            <div className="section-tag">{lang === "hi" ? "परामर्शदाता के बारे में" : "About the Counsellor"}</div>
            <h1 className="section-title" id="about-title" style={{ textAlign: "left", marginTop: ".5rem" }}>
              {hasData ? profile.counsellorName : t("detailsComingSoon", lang)}
            </h1>
            {profile.counsellorTitle && (
              <p style={{ color: "var(--brand-secondary)", fontWeight: 600, fontSize: "1.05rem", margin: ".5rem 0 .5rem" }}>
                {profile.counsellorTitle}
              </p>
            )}
            {profile.professionalRegNumber && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.75rem", background: "rgba(26,58,143,0.08)", color: "var(--brand-primary)", borderRadius: "999px", fontSize: "0.825rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                📜 {profile.professionalRegNumber}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "3rem", alignItems: "start" }}>
              <div>
                {profile.counsellorBio
                  ? profile.counsellorBio.split("\n").filter(Boolean).map((para, i) => (
                      <p key={i} style={{ color: "var(--text-muted)", lineHeight: 1.9, marginBottom: "1rem" }}>{para}</p>
                    ))
                  : <p style={{ color: "var(--text-muted)" }}>{t("detailsComingSoon", lang)}</p>
                }

                {/* Badges */}
                {(profile.badge1 || profile.badge2 || profile.badge3) && (
                  <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
                    {profile.badge1 && <span className="badge badge-primary">{profile.badge1}</span>}
                    {profile.badge2 && <span className="badge badge-secondary">{profile.badge2}</span>}
                    {profile.badge3 && <span className="badge badge-muted">{profile.badge3}</span>}
                  </div>
                )}

                <div style={{ marginTop: "2rem" }}>
                  <Link href="/contact" className="btn btn-primary" id="about-book-btn">
                    📅 {t("bookAppointment", lang)}
                  </Link>
                </div>
              </div>

              {/* Photo card */}
              <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
                {profile.counsellorPhoto ? (
                  <img
                    src={profile.counsellorPhoto}
                    alt={profile.counsellorName || "Counsellor"}
                    style={{ width: 150, height: 190, objectFit: "cover", borderRadius: "var(--radius)", border: "3px solid var(--brand-secondary)", margin: "0 auto 1.25rem" }}
                  />
                ) : (
                  <div style={{ width: 150, height: 190, background: "var(--surface-2)", borderRadius: "var(--radius)", margin: "0 auto 1.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>
                    👤
                  </div>
                )}
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{profile.counsellorName || t("detailsComingSoon", lang)}</h2>
                {profile.counsellorTitle && <p style={{ color: "var(--brand-secondary)", fontSize: ".85rem", marginTop: ".25rem" }}>{profile.counsellorTitle}</p>}

                {/* Mini stats */}
                {(profile.yearsExperience || profile.studentsGuided || profile.successRate) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem", marginTop: "1.25rem" }}>
                    {profile.yearsExperience && (
                      <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: ".6rem" }}>
                        <div style={{ fontWeight: 800, color: "var(--brand-secondary)", fontSize: "1.3rem" }}>{profile.yearsExperience}</div>
                        <div style={{ fontSize: ".7rem", color: "var(--text-muted)" }}>{lang === "hi" ? "वर्ष" : "Years Exp."}</div>
                      </div>
                    )}
                    {profile.studentsGuided && (
                      <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: ".6rem" }}>
                        <div style={{ fontWeight: 800, color: "var(--brand-secondary)", fontSize: "1.3rem" }}>{profile.studentsGuided}</div>
                        <div style={{ fontSize: ".7rem", color: "var(--text-muted)" }}>{lang === "hi" ? "छात्र" : "Students"}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Specializations ── */}
        {specializations.length > 0 && (
          <section className="section" aria-labelledby="spec-heading">
            <div className="container" style={{ maxWidth: 860 }}>
              <div className="section-header">
                <div className="section-tag">{lang === "hi" ? "विशेषज्ञता" : "Specializations"}</div>
                <h2 className="section-title" id="spec-heading">
                  {lang === "hi" ? "परामर्श <span>क्षेत्र</span>" : "Areas of <span>Expertise</span>"}
                </h2>
              </div>
              <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", justifyContent: "center" }}>
                {specializations.map((s) => (
                  <span key={s} className="badge badge-primary" style={{ fontSize: ".88rem", padding: ".4rem 1rem" }}>{s}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Qualifications ── */}
        {qualRows.length > 0 && (
          <section className="section" style={{ background: "var(--surface-2)" }} aria-labelledby="qual-heading">
            <div className="container" style={{ maxWidth: 780 }}>
              <div className="section-header">
                <div className="section-tag">{lang === "hi" ? "योग्यताएं" : "Credentials"}</div>
                <h2 className="section-title" id="qual-heading">
                  {lang === "hi" ? "शिक्षा & <span>प्रमाणपत्र</span>" : "Education & <span>Certifications</span>"}
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {qualRows.map((q, i) => (
                  <div key={i} className="card" style={{ borderLeft: "4px solid var(--brand-secondary)", padding: "1.25rem 1.5rem" }}>
                    <p style={{ color: "var(--text)", fontSize: ".95rem", lineHeight: 1.7 }}>{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty state if no data at all */}
        {!hasData && qualRows.length === 0 && specializations.length === 0 && (
          <section className="section">
            <div className="container">
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">{t("detailsComingSoon", lang)}</div>
                <p className="empty-state-desc" style={{ marginTop: ".5rem" }}>
                  {lang === "hi" ? "परामर्शदाता की विस्तृत जानकारी जल्द ही जोड़ी जाएगी।" : "The counsellor's detailed profile will be updated shortly."}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="section" style={{ background: "var(--brand-primary-light)", textAlign: "center" }}>
          <div className="container" style={{ maxWidth: 600 }}>
            <h2 className="section-title" style={{ marginBottom: "1rem" }}>
              {lang === "hi" ? "सत्र बुक करें" : "Book a Session"}
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.75rem" }}>
              {lang === "hi" ? "आज ही अपना अपॉइंटमेंट बुक करें।" : "Take the first step — book your appointment today."}
            </p>
            <Link href="/contact" className="btn btn-primary btn-lg" id="about-cta-btn">
              📅 {t("bookAppointment", lang)}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
