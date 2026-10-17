"use client";
import React, { useState } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export default function ContactPage() {
  const { profile, lang } = useSite();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const whatsappNum = profile.whatsapp?.replace(/[^0-9]/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!email.trim() && !phone.trim()) || !message.trim()) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया नाम, संदेश, और ईमेल या फोन में से कम से कम एक भरें।"
          : "Please fill name, message, and at least email or phone."
      );
      return;
    }

    try {
      setStatus("submitting");
      setErrorMsg("");
      await addDoc(collection(db, "messages"), {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        message: message.trim(),
        status: "unread",
        createdAt: serverTimestamp(),
      });
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err: any) {
      console.error("Message send error:", err);
      setStatus("error");
      setErrorMsg(
        lang === "hi"
          ? "संदेश भेजने में त्रुटि हुई। कृपया दोबारा प्रयास करें।"
          : "Failed to send message. Please try again."
      );
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <section className="section" style={{ paddingBottom: "2rem" }}>
        <div className="container" style={{ maxWidth: "1080px" }}>
          <div className="section-header">
            <span className="section-tag">{t("contact", lang)}</span>
            <h1 className="section-title">
              {lang === "hi" ? "हमसे " : "Get in "}
              <span>{lang === "hi" ? "संपर्क करें" : "Touch"}</span>
            </h1>
            <p className="section-subtitle">
              {lang === "hi"
                ? "शैक्षणिक परामर्श, करियर मार्गदर्शन या किसी भी प्रश्न के लिए सीधे संदेश भेजें या संपर्क विवरण का उपयोग करें।"
                : "Reach out for career guidance, counselling queries, or appointment inquiries. All conversations are confidential."}
            </p>
          </div>

          <div className="grid-2" style={{ alignItems: "start", gap: "2.5rem" }}>
            {/* Contact Details Card */}
            <div className="card card-accent" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                {profile.siteName || "Inspiria Careers"}
              </h2>

              {profile.counsellorName && (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {profile.counsellorPhoto ? (
                    <img
                      src={profile.counsellorPhoto}
                      alt={profile.counsellorName}
                      style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--brand-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                      👩‍🏫
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{profile.counsellorName}</h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{profile.counsellorTitle}</p>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem", fontSize: "0.92rem" }}>
                {profile.phone && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>📞</span>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.8rem" }}>{t("phone", lang)}</div>
                      <a href={`tel:${profile.phone}`} style={{ fontWeight: 600 }}>{profile.phone}</a>
                    </div>
                  </div>
                )}

                {profile.whatsapp && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.2rem", color: "#25D366" }}>💬</span>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.8rem" }}>WhatsApp</div>
                      {whatsappNum ? (
                        <a
                          href={`https://wa.me/${whatsappNum}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm"
                          style={{ background: "#25D366", color: "#fff", marginTop: "0.25rem" }}
                        >
                          Chat on WhatsApp
                        </a>
                      ) : (
                        <span>{profile.whatsapp}</span>
                      )}
                    </div>
                  </div>
                )}

                {profile.email && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>✉️</span>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.8rem" }}>{t("email", lang)}</div>
                      <a href={`mailto:${profile.email}`} style={{ fontWeight: 600 }}>{profile.email}</a>
                    </div>
                  </div>
                )}

                {profile.officeHours && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>🕒</span>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {lang === "hi" ? "कार्यालय समय" : "Office Hours"}
                      </div>
                      <span style={{ color: "var(--text)" }}>{profile.officeHours}</span>
                    </div>
                  </div>
                )}

                {profile.address && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>📍</span>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {lang === "hi" ? "पता" : "Address"}
                      </div>
                      <span style={{ color: "var(--text)" }}>{profile.address}</span>
                    </div>
                  </div>
                )}

                {!profile.phone && !profile.email && !profile.whatsapp && (
                  <div className="empty-state" style={{ padding: "1.5rem 0" }}>
                    <p>{t("detailsComingSoon", lang)}</p>
                  </div>
                )}
              </div>

              {/* Book Appointment CTA */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                <Link href="/book" className="btn btn-primary btn-full">
                  📅 {t("bookAppointment", lang)}
                </Link>
              </div>
            </div>

            {/* Direct Message Form */}
            <div className="card">
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--brand-primary)" }}>
                {lang === "hi" ? "सीधा संदेश भेजें" : "Send a Direct Message"}
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
                {lang === "hi"
                  ? "अपना संदेश लिखें, हम 24 घंटों के भीतर जवाब देंगे।"
                  : "Leave us a message, and we'll reply to you within 24 hours."}
              </p>

              {status === "success" && (
                <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
                  ✓ {lang === "hi"
                    ? "आपका संदेश सफलतापूर्वक भेज दिया गया है। हम जल्द ही आपसे संपर्क करेंगे।"
                    : "Your message has been sent successfully. We will get back to you shortly."}
                </div>
              )}

              {errorMsg && (
                <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div className="form-group">
                  <label className="form-label">{t("name", lang)} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === "hi" ? "आपका पूरा नाम" : "Your full name"}
                    required
                  />
                </div>

                <div className="grid-2" style={{ gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">{t("email", lang)}</label>
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("phone", lang)}</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t("message", lang)} *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      lang === "hi"
                        ? "अपनी समस्या या मार्गदर्शन की आवश्यकता के बारे में बताएं..."
                        : "Describe how we can assist you..."
                    }
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? t("loading", lang) : `✉️ ${t("send", lang)}`}
                </button>
              </form>
            </div>
          </div>

          {/* Emergency Alert */}
          <div className="alert alert-warning" style={{ marginTop: "3rem" }}>
            🔒 {t("confidentiality", lang)} &nbsp;|&nbsp; ⚠️ {t("emergencyDisclaimer", lang)}
          </div>
        </div>
      </section>
    </div>
  );
}
