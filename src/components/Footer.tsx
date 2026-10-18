"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";

export default function Footer() {
  const { profile, lang } = useSite();

  const whatsapp = profile.whatsapp?.replace(/[^0-9]/g, "");

  return (
    <footer className="footer" role="contentinfo">
      {profile.newsletterEnabled && (
        <div style={{ maxWidth: 1200, margin: "0 auto 1.5rem auto", padding: "0 1rem" }}>
          <NewsletterSubscribe />
        </div>
      )}
      <div className="footer-grid">
        {/* Brand col */}
        <div>
          <div className="footer-brand-name">{profile.siteName || "Inspiria Careers"}</div>
          <p className="footer-tagline">
            {profile.subTagline || t("detailsComingSoon", lang)}
          </p>
          <div className="social-links" aria-label="Social media links">
            {profile.facebook && <a href={profile.facebook} target="_blank" rel="noreferrer" className="social-link" aria-label="Facebook">📘</a>}
            {profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer" className="social-link" aria-label="Instagram">📸</a>}
            {profile.youtube && <a href={profile.youtube} target="_blank" rel="noreferrer" className="social-link" aria-label="YouTube">▶️</a>}
            {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="social-link" aria-label="LinkedIn">💼</a>}
            {profile.twitter && <a href={profile.twitter} target="_blank" rel="noreferrer" className="social-link" aria-label="Twitter">✖️</a>}
            {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="social-link" aria-label="WhatsApp" style={{ color: "#25D366" }}>💬</a>}
          </div>
        </div>

        {/* Quick links */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link href="/">{t("home", lang)}</Link></li>
            <li><Link href="/about">{t("about", lang)}</Link></li>
            <li><Link href="/services">{t("services", lang)}</Link></li>
            <li><Link href="/workshops">{t("workshops", lang)}</Link></li>
            <li><Link href="/resources">{t("resources", lang)}</Link></li>
            <li><Link href="/faq">{t("faqs", lang)}</Link></li>
            <li><Link href="/gallery">{t("gallery", lang)}</Link></li>
            <li><Link href="/contact">{t("contact", lang)}</Link></li>
          </ul>
        </div>

        {/* Contact & legal */}
        <div className="footer-col">
          <h4>Contact & Legal</h4>
          <ul>
            {profile.email && <li><a href={`mailto:${profile.email}`}>✉️ {profile.email}</a></li>}
            {profile.phone && <li><a href={`tel:${profile.phone}`}>📞 {profile.phone}</a></li>}
            {whatsapp && <li><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">💬 WhatsApp</a></li>}
            <li><Link href="/emergency" style={{ color: "#ef4444", fontWeight: 700 }}>🚨 {t("emergencyHelplines", lang)} (24×7)</Link></li>
            <li><Link href="/login">🔑 {t("login", lang)}</Link></li>
            {profile.privacyPolicyUrl && <li><Link href={profile.privacyPolicyUrl}>{t("privacyPolicy", lang)}</Link></li>}
            {profile.professionalRegNumber && (
              <li style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                📜 {profile.professionalRegNumber}
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Confidentiality + Emergency disclaimer */}
      <div className="footer-disclaimer" role="note" aria-label="Confidentiality and emergency notice">
        🔒 {t("confidentiality", lang)} &nbsp;|&nbsp; ⚠️ Non-emergency service. In distress, call{" "}
        <a href="tel:14416" style={{ fontWeight: 700, color: "inherit", textDecoration: "underline" }}>
          Tele-MANAS (14416)
        </a>{" "}
        or visit our{" "}
        <Link href="/emergency" style={{ fontWeight: 700, color: "inherit", textDecoration: "underline" }}>
          {t("emergencyHelplines", lang)}
        </Link>{" "}
        directory.
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {profile.siteName || "Inspiria Careers"}.{" "}
          {profile.copyrightText || "All rights reserved."}
        </span>
        {profile.developedBy && (
          <span>Designed &amp; Developed by {profile.developedBy}</span>
        )}
      </div>
    </footer>
  );
}
