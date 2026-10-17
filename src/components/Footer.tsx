"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export default function Footer() {
  const { profile, lang } = useSite();

  const whatsapp = profile.whatsapp?.replace(/[^0-9]/g, "");

  return (
    <footer className="footer" role="contentinfo">
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
            <li><Link href="/login">🔑 {t("login", lang)}</Link></li>
            {profile.privacyPolicyUrl && <li><Link href={profile.privacyPolicyUrl}>{t("privacyPolicy", lang)}</Link></li>}
          </ul>
        </div>
      </div>

      {/* Confidentiality + Emergency disclaimer */}
      <div className="footer-disclaimer" role="note" aria-label="Confidentiality and emergency notice">
        🔒 {t("confidentiality", lang)} &nbsp;|&nbsp; ⚠️ {t("emergencyDisclaimer", lang)}
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
