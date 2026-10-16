"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

export default function Footer() {
  const { settings } = useSite();

  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: "#d32f2f",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontFamily: "Playfair Display, serif",
                fontSize: "1.8rem",
                fontWeight: 900,
              }}
            >
              {settings.siteLogo && (settings.siteLogo.startsWith("/") || settings.siteLogo.startsWith("http") || settings.siteLogo.startsWith("data:")) ? (
                <img
                  src={settings.siteLogo}
                  alt="Logo"
                  style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }}
                />
              ) : (
                <span>{settings.siteLogo || "I"}</span>
              )}
            </div>
            <div>
              <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.1rem" }}>
                {settings.siteName.split(" ")[0]} e-Counselling Services
              </div>
              <div style={{ color: "#ffcc00", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em" }}>
                SIMPLIFYING THE ADMISSION PROCESS
              </div>
            </div>
          </Link>
          <p>
            {settings.subtagline || "Empowering students, parents, and aspirants through standardized psychometric profiling and personalized educational guidance."}
          </p>

          {/* Social Links */}
          <div className="social-links" style={{ marginTop: "1.25rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {settings.facebookUrl && (
              <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="social-link" title="Facebook" aria-label="Facebook">
                📘
              </a>
            )}
            {settings.instagramUrl && (
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="social-link" title="Instagram" aria-label="Instagram">
                📸
              </a>
            )}
            {settings.youtubeUrl && (
              <a href={settings.youtubeUrl} target="_blank" rel="noreferrer" className="social-link" title="YouTube" aria-label="YouTube">
                ▶️
              </a>
            )}
            {settings.linkedinUrl && (
              <a href={settings.linkedinUrl} target="_blank" rel="noreferrer" className="social-link" title="LinkedIn" aria-label="LinkedIn">
                💼
              </a>
            )}
            {settings.twitterUrl && (
              <a href={settings.twitterUrl} target="_blank" rel="noreferrer" className="social-link" title="Twitter / X" aria-label="Twitter">
                ✖️
              </a>
            )}
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="social-link" title="WhatsApp Helpline" aria-label="WhatsApp" style={{ color: "#25D366" }}>
                💬
              </a>
            )}
          </div>
        </div>

        <div className="footer-col">
          <h4>Portal Links</h4>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About {settings.principalName}</Link></li>
            <li><Link href="/posts">Services &amp; Guidance</Link></li>
            <li><Link href="/achievements">National Honors &amp; Awards</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Examinations &amp; Verticals</h4>
          <ul>
            <li><Link href="/news">Exam Notices &amp; Updates</Link></li>
            <li><Link href="/gallery">Media &amp; Event Coverage</Link></li>
            <li><Link href="/testimonials">Student &amp; Parent Reviews</Link></li>
            <li><Link href="/contact">Book a Counseling Session</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Advisory Helpline</h4>
          <ul>
            <li><a href={`mailto:${settings.contactEmail}`}>✉️ {settings.contactEmail}</a></li>
            <li><a href={`tel:${settings.contactPhone}`}>📞 {settings.contactPhone}</a></li>
            {whatsappHref && (
              <li><a href={whatsappHref} target="_blank" rel="noreferrer" style={{ color: "#2ecc71", fontWeight: 700 }}>💬 WhatsApp Counseling Cell</a></li>
            )}
            <li><Link href="/login" style={{ color: "#ffcc00", fontWeight: 700 }}>🔑 Candidate / Counselor Login</Link></li>
            <li><Link href="/admin">🛡️ Master Admin Panel</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p>© {new Date().getFullYear()} {settings.siteName} - {settings.divisionTitle || "e-Counselling Division"}. {settings.copyrightText || "All rights reserved."}</p>
          {settings.developedByText && (
            <p style={{ color: "#94a3b8", fontSize: "0.88rem" }}>
              Developed by{" "}
              <a
                href={settings.developedByLink || "#"}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#009ea9", fontWeight: 700, textDecoration: "underline" }}
              >
                {settings.developedByText}
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
