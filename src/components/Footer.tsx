"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
  LinkedInIcon,
  TwitterIcon,
  WhatsAppIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  SirenIcon,
  KeyIcon,
  CertificateIcon,
  LockIcon,
} from "@/components/Icons";

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
            {profile.footerTagline || profile.subTagline || t("detailsComingSoon", lang)}
          </p>
          <div className="social-links" aria-label="Social media links">
            {profile.facebook && (
              <a href={profile.facebook} target="_blank" rel="noreferrer" className="social-link" aria-label="Facebook">
                <FacebookIcon size={18} />
              </a>
            )}
            {profile.instagram && (
              <a href={profile.instagram} target="_blank" rel="noreferrer" className="social-link" aria-label="Instagram">
                <InstagramIcon size={18} />
              </a>
            )}
            {profile.youtube && (
              <a href={profile.youtube} target="_blank" rel="noreferrer" className="social-link" aria-label="YouTube">
                <YouTubeIcon size={18} />
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="social-link" aria-label="LinkedIn">
                <LinkedInIcon size={18} />
              </a>
            )}
            {profile.twitter && (
              <a href={profile.twitter} target="_blank" rel="noreferrer" className="social-link" aria-label="Twitter">
                <TwitterIcon size={18} />
              </a>
            )}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="social-link" aria-label="WhatsApp" style={{ color: "#25D366" }}>
                <WhatsAppIcon size={18} />
              </a>
            )}
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
            {profile.email && (
              <li>
                <a href={`mailto:${profile.email}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <MailIcon size={16} /> {profile.email}
                </a>
              </li>
            )}
            {profile.phone && (
              <li>
                <a href={`tel:${profile.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <PhoneIcon size={16} /> {profile.phone}
                </a>
              </li>
            )}
            {whatsapp && (
              <li>
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <WhatsAppIcon size={16} /> WhatsApp
                </a>
              </li>
            )}
            {profile.address && (
              <li>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,.75)" }}>
                  <MapPinIcon size={16} /> {profile.address}
                </span>
              </li>
            )}
            {profile.officeHours && (
              <li>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,.75)" }}>
                  <ClockIcon size={16} /> {profile.officeHours}
                </span>
              </li>
            )}
            <li>
              <Link href="/emergency" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#fca5a5", fontWeight: 700 }}>
                <SirenIcon size={16} /> {t("emergencyHelplines", lang)} (24×7)
              </Link>
            </li>
            <li>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <KeyIcon size={16} /> {t("login", lang)}
              </Link>
            </li>
            {profile.privacyPolicyUrl && <li><Link href={profile.privacyPolicyUrl}>{t("privacyPolicy", lang)}</Link></li>}
            {profile.termsOfServiceUrl && <li><Link href={profile.termsOfServiceUrl}>{lang === "hi" ? "नियम व शर्तें" : "Terms of Service"}</Link></li>}
            {profile.professionalRegNumber && (
              <li style={{ fontSize: "0.78rem", color: "rgba(255,255,255,.7)", marginTop: "0.35rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <CertificateIcon size={16} /> {profile.professionalRegNumber}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Confidentiality + Emergency disclaimer */}
      <div className="footer-disclaimer" role="note" aria-label="Confidentiality and emergency notice">
        {profile.footerDisclaimer ? (
          <span>{profile.footerDisclaimer}</span>
        ) : (
          <>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", verticalAlign: "middle" }}>
              <LockIcon size={14} /> {t("confidentiality", lang)}
            </span>
            &nbsp;|&nbsp; Non-emergency service. In distress, call{" "}
            <a href="tel:14416" style={{ fontWeight: 700, color: "inherit", textDecoration: "underline" }}>
              Tele-MANAS (14416)
            </a>{" "}
            or visit our{" "}
            <Link href="/emergency" style={{ fontWeight: 700, color: "inherit", textDecoration: "underline" }}>
              {t("emergencyHelplines", lang)}
            </Link>{" "}
            directory.
          </>
        )}
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
