"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export default function ServicesPage() {
  const { services, profile, lang } = useSite();

  return (
    <main className="page-wrapper">
      <div style={{ paddingTop: "3.5rem" }}>
        {/* Page header */}
        <section className="section" style={{ background: "var(--surface-2)", paddingTop: "3rem", paddingBottom: "2.5rem" }}>
          <div className="container">
            <div className="section-tag">{lang === "hi" ? "हमारी सेवाएं" : "Our Services"}</div>
            <h1 className="section-title" style={{ textAlign: "left", marginTop: ".5rem" }}>
              {lang === "hi" ? "परामर्श <span>सेवाएं</span>" : "Counselling <span>Services</span>"}
            </h1>
            <p className="section-subtitle" style={{ textAlign: "left", margin: 0 }}>
              {lang === "hi"
                ? "हर छात्र की जरूरत के अनुसार विशेष मार्गदर्शन।"
                : "Personalised guidance tailored to every student's needs and aspirations."}
            </p>
          </div>
        </section>

        {/* Services grid */}
        <section className="section" aria-labelledby="services-list-heading">
          <div className="container">
            <h2 id="services-list-heading" className="sr-only">Services list</h2>
            {services.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🌟</div>
                <div className="empty-state-title">{t("detailsComingSoon", lang)}</div>
                <p className="empty-state-desc" style={{ marginTop: ".5rem" }}>
                  {lang === "hi"
                    ? "सेवाओं की जानकारी जल्द ही जोड़ी जाएगी।"
                    : "Service details will be added shortly. Please check back soon."}
                </p>
                <Link href="/contact" className="btn btn-primary" style={{ marginTop: "1.5rem" }} id="services-empty-cta">
                  {t("contact", lang)}
                </Link>
              </div>
            ) : (
              <div className="grid-3">
                {services.map((s) => (
                  <article key={s.id} className="card card-accent" aria-label={s.title}>
                    {s.icon && <div style={{ fontSize: "2.25rem", marginBottom: ".85rem" }}>{s.icon}</div>}
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: ".6rem", color: "var(--text)" }}>{s.title}</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.75 }}>{s.description}</p>
                  </article>
                ))}
              </div>
            )}

            {services.length > 0 && (
              <div style={{ textAlign: "center", marginTop: "3rem" }}>
                <Link href="/contact" className="btn btn-primary btn-lg" id="services-book-btn">
                  📅 {t("bookAppointment", lang)}
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Contact nudge */}
        <section className="section" style={{ background: "var(--brand-primary)", color: "#fff", textAlign: "center" }}>
          <div className="container" style={{ maxWidth: 620 }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: ".75rem" }}>
              {lang === "hi" ? "कोई प्रश्न है?" : "Have Questions?"}
            </h2>
            <p style={{ opacity: .85, marginBottom: "1.75rem", lineHeight: 1.75 }}>
              {lang === "hi"
                ? "हमसे सीधे संपर्क करें। हम आपकी मदद के लिए यहाँ हैं।"
                : "Reach out to us directly. We're here to help you navigate your path."}
            </p>
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="btn btn-secondary btn-lg" style={{ marginRight: "1rem" }} id="services-phone-btn">
                📞 {profile.phone}
              </a>
            )}
            <Link href="/contact" className="btn btn-ghost btn-lg" style={{ color: "#fff", borderColor: "rgba(255,255,255,.4)" }} id="services-contact-btn">
              {t("contact", lang)}
            </Link>
          </div>
        </section>
      </div>

      <style jsx>{`
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
      `}</style>
    </main>
  );
}
