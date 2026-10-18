"use client";
import React, { useState } from "react";
import { useSite } from "@/contexts/SiteContext";

export default function NewsletterSubscribe() {
  const { lang } = useSite();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Subscription failed");
      }

      setSuccess(true);
      setEmail("");
      setName("");
    } catch (err: any) {
      setError(
        lang === "hi"
          ? "सदस्यता नहीं ली जा सकी। कृपया पुनः प्रयास करें।"
          : err.message || "Failed to subscribe. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--card-bg, rgba(255, 255, 255, 0.05))",
        border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
        borderRadius: 12,
        padding: "1.25rem",
        marginTop: "1rem",
        marginBottom: "1rem",
      }}
    >
      <h4 style={{ margin: "0 0 0.4rem 0", fontSize: "1rem", fontWeight: 700 }}>
        📬 {lang === "hi" ? "करियर मार्गदर्शन और युक्तियाँ" : "Career Insights & Wellness Tips"}
      </h4>
      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 0.85rem 0", lineHeight: 1.4 }}>
        {lang === "hi"
          ? "मासिक विचारशील लेख और मार्गदर्शन प्राप्त करें। शून्य स्पैम। किसी भी समय अनसब्सक्राइब करें।"
          : "Receive thoughtful monthly guidance and strategies. Zero spam. Unsubscribe anytime."}
      </p>

      {success ? (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid #10b981",
            borderRadius: 8,
            padding: "0.75rem",
            fontSize: "0.85rem",
            color: "#10b981",
          }}
        >
          ✓{" "}
          {lang === "hi"
            ? "धन्यवाद! कृपया अपनी सदस्यता की पुष्टि के लिए अपना ईमेल देखें।"
            : "Thank you! Please check your email to confirm your subscription."}
        </div>
      ) : (
        <form onSubmit={handleSubscribe} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder={lang === "hi" ? "आपका नाम (वैकल्पिक)" : "Your name (optional)"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                flex: "1 1 140px",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                border: "1px solid var(--border-color, #ccc)",
                fontSize: "0.85rem",
                background: "var(--input-bg, #fff)",
                color: "inherit",
              }}
            />
            <input
              type="email"
              required
              placeholder={lang === "hi" ? "आपका ईमेल पता *" : "Your email address *"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: "2 1 200px",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                border: "1px solid var(--border-color, #ccc)",
                fontSize: "0.85rem",
                background: "var(--input-bg, #fff)",
                color: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-sm"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              {submitting ? "..." : lang === "hi" ? "सदस्य बनें" : "Subscribe"}
            </button>
          </div>
          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.78rem" }}>{error}</div>
          )}
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            🔒 {lang === "hi" ? "डेटा सुरक्षा 2023 के तहत सुरक्षित। केवल चयनित अपडेट्स।" : "Protected under DPDPA 2023. We never sell your email."}
          </span>
        </form>
      )}
    </div>
  );
}
