"use client";
import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { t, Lang } from "@/translations";
import type { ClientIntake } from "@/types";

interface IntakeViewModalProps {
  isOpen: boolean;
  userId?: string | null;
  clientName?: string;
  onClose: () => void;
  lang?: Lang;
}

export default function IntakeViewModal({
  isOpen,
  userId,
  clientName = "Client",
  onClose,
  lang = "en",
}: IntakeViewModalProps) {
  const [loading, setLoading] = useState(false);
  const [intake, setIntake] = useState<ClientIntake | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    setError("");

    const fetchIntake = async () => {
      try {
        const snap = await getDoc(doc(db, "clientIntake", userId));
        if (snap.exists()) {
          setIntake(snap.data() as ClientIntake);
        } else {
          setIntake(null);
        }
      } catch (err: any) {
        console.error("Error reading client intake:", err);
        setError("Failed to load intake responses or access denied.");
      } finally {
        setLoading(false);
      }
    };

    fetchIntake();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "2rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "transparent",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "var(--text-muted, #64748b)",
          }}
        >
          ✕
        </button>

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-block", padding: "0.25rem 0.65rem", borderRadius: "999px", background: "rgba(26, 58, 143, 0.1)", color: "var(--brand-primary, #1a3a8f)", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.4rem" }}>
            🔒 {lang === "hi" ? "गोपनीय इन्टेक रिकॉर्ड" : "Confidential Intake Record"}
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, color: "var(--text-primary, #0f172a)" }}>
            {clientName} — {t("intakeProfile", lang)}
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            {t("loading", lang)}
          </div>
        ) : error ? (
          <div style={{ padding: "1rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.9rem" }}>
            {error}
          </div>
        ) : !intake ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📄</div>
            <p style={{ margin: 0 }}>This client has not submitted an intake profile yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Demographic Info */}
            <div style={{ background: "var(--surface-2, #f8fafc)", padding: "1rem", borderRadius: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.88rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.78rem" }}>Age Group</span>
                <strong>{intake.ageGroup.replace("_", " ")}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.78rem" }}>City / Location</span>
                <strong>{intake.city}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.78rem" }}>Preferred Language</span>
                <strong>{intake.preferredLanguage === "hi" ? "Hindi" : intake.preferredLanguage === "en" ? "English" : "Hindi / English"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.78rem" }}>Previous Counselling</span>
                <strong>{intake.previousCounselling ? "Yes" : "No (First time)"}</strong>
              </div>
            </div>

            {/* Purpose & Details */}
            <div style={{ border: "1px solid var(--border-color, #e2e8f0)", padding: "1rem", borderRadius: "10px" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "0.25rem" }}>
                🎯 Primary Purpose of Session
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--brand-primary, #1a3a8f)", marginBottom: "0.5rem", textTransform: "capitalize" }}>
                {intake.purpose} Guidance
              </div>
              {intake.purposeDetails && (
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.5, background: "var(--surface-2, #f8fafc)", padding: "0.6rem", borderRadius: "6px" }}>
                  "{intake.purposeDetails}"
                </p>
              )}
            </div>

            {/* Minor Safeguard */}
            {intake.ageGroup === "under_18" && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "1rem", borderRadius: "10px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400e", marginBottom: "0.5rem" }}>
                  🛡️ Minor Safeguard &amp; Parental Consent
                </div>
                <div style={{ fontSize: "0.85rem", color: "#78350f", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div><strong>Parent/Guardian:</strong> {intake.parentName || "N/A"}</div>
                  <div><strong>Parent Phone:</strong> {intake.parentPhone || "N/A"}</div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#92400e", marginTop: "0.5rem" }}>
                  ✓ Parental awareness confirmed by client.
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            <div style={{ background: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.2)", padding: "1rem", borderRadius: "10px" }}>
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "#b91c1c", marginBottom: "0.4rem" }}>
                🚨 Emergency Contact
              </div>
              <div style={{ fontSize: "0.88rem", display: "flex", justifyContent: "space-between" }}>
                <span><strong>Name:</strong> {intake.emergencyContactName}</span>
                <span><strong>Phone:</strong> <a href={`tel:${intake.emergencyContactPhone}`} style={{ color: "#b91c1c", fontWeight: 700 }}>{intake.emergencyContactPhone}</a></span>
              </div>
            </div>

            {/* Informed Consent Verification */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.85rem 1rem", borderRadius: "10px", fontSize: "0.825rem", color: "#166534", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>✓ Informed Consent v{intake.consentVersion || 1}.0 Accepted</span>
              <span>{new Date(intake.consentAcceptedAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            {t("close", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
