"use client";
import React from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export default function OfflinePage() {
  const { lang } = useSite();

  return (
    <div className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "75vh", padding: "1rem" }}>
      <div className="card" style={{ maxWidth: 540, textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>📡</div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--brand-primary)", marginBottom: "0.75rem" }}>
          {lang === "hi" ? "आप ऑफ़लाइन हैं" : "You Are Currently Offline"}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.75rem" }}>
          {t("offlineMessage", lang)}
        </p>

        {/* Emergency offline assistance */}
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "1rem", marginBottom: "1.75rem", textAlign: "left" }}>
          <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#b91c1c", marginBottom: "0.4rem" }}>
            🚨 Emergency Crisis Support (Direct Dial):
          </div>
          <div style={{ fontSize: "0.85rem", color: "#7f1d1d", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <div>• <strong>Tele-MANAS:</strong> <a href="tel:14416" style={{ fontWeight: 700, color: "#b91c1c" }}>14416</a> (24×7 Toll-Free)</div>
            <div>• <strong>KIRAN Helpline:</strong> <a href="tel:18005990019" style={{ fontWeight: 700, color: "#b91c1c" }}>1800-599-0019</a></div>
            <div>• <strong>National Emergency:</strong> <a href="tel:112" style={{ fontWeight: 700, color: "#b91c1c" }}>112</a></div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: "center" }}
          >
            🔄 {lang === "hi" ? "पुनः प्रयास करें" : "Retry"}
          </button>
          <Link
            href="/"
            className="btn btn-secondary"
            style={{ flex: 1, justifyContent: "center" }}
          >
            🏠 {lang === "hi" ? "होम" : "Home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
