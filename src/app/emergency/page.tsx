"use client";
import React from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export default function EmergencyHelplinesPage() {
  const { profile, lang } = useSite();
  const helplines = profile.emergencyHelplines || [];

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: "860px" }}>
          {/* Urgent Disclaimer Notice */}
          <div
            style={{
              background: "#fef2f2",
              border: "2px solid #ef4444",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "2.5rem",
              boxShadow: "0 10px 25px rgba(239, 68, 68, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.75rem" }}>🚨</span>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#991b1b", margin: 0 }}>
                {lang === "hi" ? "आपातकालीन सूचना एवं अस्वीकरण" : "Important Emergency Notice & Disclaimer"}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#b91c1c", lineHeight: 1.7 }}>
              {t("crisisNoticeText", lang)}
            </p>
          </div>

          <div className="section-header" style={{ marginBottom: "2rem" }}>
            <span className="section-tag" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#dc2626" }}>
              {t("emergencyHelplines", lang)}
            </span>
            <h1 className="section-title">
              {lang === "hi" ? "24×7 निःशुल्क एवं गोपनीय " : "24×7 Free & Confidential "}
              <span>{lang === "hi" ? "राष्ट्रीय हेल्पलाइन" : "National Helplines"}</span>
            </h1>
            <p className="section-subtitle">
              {lang === "hi"
                ? "भारत सरकार एवं मान्यता प्राप्त संस्थाओं द्वारा संचालित 24×7 निःशुल्क मानसिक स्वास्थ्य व संकट सहायता सेवा।"
                : "Verified national crisis intervention and tele-mental health helplines across Indian languages. Free, immediate, and confidential."}
            </p>
          </div>

          {/* Helplines Directory Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {helplines.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1.25rem",
                  padding: "1.5rem",
                  borderLeft: "5px solid var(--brand-primary)",
                }}
              >
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                      {item.name}
                    </h3>
                  </div>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {lang === "hi" ? item.descHi : item.descEn}
                  </p>
                  <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700 }}>
                    🟢 {item.available}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--brand-primary)", letterSpacing: "1px" }}>
                    {item.number}
                  </div>
                  <a
                    href={`tel:${item.number.replace(/[^0-9+]/g, "")}`}
                    className="btn btn-primary"
                    style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem", fontWeight: 700 }}
                  >
                    📞 {t("callNow", lang)}
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Guidance Links */}
          <div style={{ marginTop: "3rem", textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1rem" }}>
              Looking for non-emergency student career guidance or scheduled counselling?
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <Link href="/book" className="btn btn-outline btn-sm">
                Schedule Standard Consultation
              </Link>
              <Link href="/" className="btn btn-ghost btn-sm">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
