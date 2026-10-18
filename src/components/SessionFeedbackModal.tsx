"use client";
import React, { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

interface FeedbackModalProps {
  appointmentId: string;
  serviceTitle: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function SessionFeedbackModal({
  appointmentId,
  serviceTitle,
  onClose,
  onSubmitted,
}: FeedbackModalProps) {
  const { user } = useAuth();
  const { lang } = useSite();
  const [rating, setRating] = useState(0);
  const [helpfulness, setHelpfulness] = useState("");
  const [improvements, setImprovements] = useState("");
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || wouldReturn === null || !user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "sessionFeedback"), {
        appointmentId,
        clientId: user.uid,
        rating,
        helpfulness: helpfulness.trim(),
        improvements: improvements.trim(),
        wouldReturn,
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      alert(lang === "hi" ? "फ़ीडबैक सबमिट नहीं हो सका।" : "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1200, padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          width: "100%", maxWidth: 520,
          maxHeight: "90vh", overflowY: "auto",
          padding: "2rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
        >
          ✕
        </button>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🙏</div>
            <h3 style={{ fontWeight: 800, fontSize: "1.2rem", marginBottom: "0.5rem" }}>
              {lang === "hi" ? "आपका फ़ीडबैक मिल गया!" : "Thank you for your feedback!"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {lang === "hi"
                ? "यह फ़ीडबैक केवल काउंसलर देखेंगी। यह सार्वजनिक नहीं होगा।"
                : "This feedback is private and visible only to your counsellor — never published publicly."}
            </p>
            <button onClick={onClose} className="btn btn-primary" style={{ marginTop: "1.25rem" }}>
              {t("close", lang)}
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.35rem" }}>
              💬 {lang === "hi" ? "सत्र फ़ीडबैक" : "Session Feedback"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              {lang === "hi"
                ? `"${serviceTitle}" सत्र के बारे में निजी फ़ीडबैक दें। यह केवल काउंसलर देखेंगी।`
                : `Share private feedback about your "${serviceTitle}" session. Only your counsellor will see this.`}
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {/* Star Rating */}
              <div>
                <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                  {lang === "hi" ? "सत्र कितना उपयोगी रहा? *" : "How helpful was the session? *"}
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        fontSize: "1.75rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        filter: star <= rating ? "none" : "grayscale(1) opacity(0.4)",
                        transform: star <= rating ? "scale(1.1)" : "scale(1)",
                        transition: "all 0.15s",
                      }}
                      aria-label={`${star} star`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              {/* Helpfulness */}
              <div className="form-group">
                <label className="form-label">
                  {lang === "hi" ? "क्या मदद मिली?" : "What was most helpful?"}
                </label>
                <textarea
                  rows={2}
                  value={helpfulness}
                  onChange={(e) => setHelpfulness(e.target.value)}
                  placeholder={lang === "hi" ? "आपकी टिप्पणी..." : "Your comments..."}
                  className="form-textarea"
                  maxLength={500}
                />
              </div>

              {/* Improvements */}
              <div className="form-group">
                <label className="form-label">
                  {lang === "hi" ? "क्या बेहतर हो सकता था?" : "What could be improved?"}
                </label>
                <textarea
                  rows={2}
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder={lang === "hi" ? "आपकी टिप्पणी..." : "Your comments..."}
                  className="form-textarea"
                  maxLength={500}
                />
              </div>

              {/* Would Return */}
              <div>
                <label style={{ fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
                  {lang === "hi" ? "क्या आप फिर सत्र बुक करेंगे? *" : "Would you book another session? *"}
                </label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  {[
                    { label: lang === "hi" ? "हाँ" : "Yes", value: true },
                    { label: lang === "hi" ? "शायद" : "Maybe", value: false },
                  ].map((opt) => (
                    <label
                      key={String(opt.value)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem",
                        cursor: "pointer", fontWeight: wouldReturn === opt.value ? 700 : 400,
                      }}
                    >
                      <input
                        type="radio"
                        checked={wouldReturn === opt.value}
                        onChange={() => setWouldReturn(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
                  {t("cancel", lang)}
                </button>
                <button
                  type="submit"
                  disabled={submitting || rating === 0 || wouldReturn === null}
                  className="btn btn-primary btn-sm"
                >
                  {submitting ? t("loading", lang) : (lang === "hi" ? "फ़ीडबैक भेजें" : "Submit Feedback")}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
