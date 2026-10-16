"use client";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSite } from "@/contexts/SiteContext";

export default function ContactPage() {
  const { settings } = useSite();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Career Counseling",
    date: "",
    timeSlot: "11:00 AM - 12:00 PM",
    message: "",
    paymentMethod: "UPI",
    transactionId: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleCopyUpi = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(settings.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (settings.paidSessionsEnabled && !form.transactionId.trim()) {
      setError("Please provide the UPI Transaction ID / UTR Number after completing your payment.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const submission = {
        id: "booking_" + Date.now(),
        ...form,
        isPaidSession: settings.paidSessionsEnabled,
        amount: settings.paidSessionsEnabled ? settings.sessionFee : "Free",
        paymentStatus: settings.paidSessionsEnabled ? "Pending Verification" : "Free Session",
        createdAt: new Date().toISOString(),
        read: false,
      };

      try {
        await addDoc(collection(db, "contact_requests"), submission);
      } catch {}

      if (typeof window !== "undefined") {
        const existing = JSON.parse(localStorage.getItem("insersia_contact_messages") || "[]");
        localStorage.setItem("insersia_contact_messages", JSON.stringify([submission, ...existing]));
      }

      setSuccess(true);
      setForm({
        name: "",
        email: "",
        phone: "",
        category: "Career Counseling",
        date: "",
        timeSlot: "11:00 AM - 12:00 PM",
        message: "",
        paymentMethod: "UPI",
        transactionId: "",
      });
    } catch {
      setError("Failed to submit request. Please try again or reach out directly.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}?text=Hello%20Principal%20Ma'am,%20I%20would%20like%20to%20book%20a%20counseling%20session.`
    : null;

  return (
    <main className="page-wrapper" style={{ paddingTop: "6.5rem", paddingBottom: "5rem" }}>
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div className="section-tag">Appointment &amp; Inquiry</div>
            <h1 className="section-title">
              Book a Session with <span>{settings.principalName}</span>
            </h1>
            <p className="section-subtitle">
              Schedule a personalized 1-on-1 counseling session for career mapping, stream selection, or mental wellness.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "3rem", alignItems: "start" }}>
            {/* Info Cards & Social Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {[
                { icon: "✉️", title: "Email Inquiry", value: settings.contactEmail, sub: "Guaranteed response within 24 hours" },
                { icon: "📞", title: "Direct Helpline", value: settings.contactPhone, sub: settings.officeHours },
                { icon: "📍", title: "Counseling Center", value: settings.contactAddress, sub: "Online video sessions also available globally" },
                {
                  icon: settings.paidSessionsEnabled ? "💳" : "🎁",
                  title: "Session Format & Fee",
                  value: settings.paidSessionsEnabled ? `${settings.sessionFee} / Session` : "Free Initial Consultation",
                  sub: settings.paidSessionsEnabled ? "Includes personalized action plan" : "Limited complimentary slots each week",
                },
              ].map((item, i) => (
                <div key={i} className="card card-gold animate-in" style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start", padding: "1.5rem" }}>
                  <div style={{ fontSize: "2rem" }}>{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{item.title}</div>
                    <div style={{ color: "var(--gold)", fontSize: "1rem", fontWeight: 600 }}>{item.value}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>{item.sub}</div>
                  </div>
                </div>
              ))}

              {/* Direct WhatsApp Quick Connect */}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="btn animate-in"
                  style={{
                    background: "#25D366",
                    color: "#fff",
                    justifyContent: "center",
                    fontWeight: 700,
                    padding: "0.9rem",
                    borderRadius: 10,
                  }}
                >
                  💬 Chat on WhatsApp Directly
                </a>
              )}
            </div>

            {/* Booking & Payment Form */}
            <div className="card card-gold" style={{ padding: "2.5rem" }}>
              {success ? (
                <div style={{ textAlign: "center", padding: "2.5rem" }}>
                  <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🎉</div>
                  <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.6rem", marginBottom: "0.75rem" }}>
                    Appointment Request Received!
                  </h3>
                  <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
                    Thank you, <strong>{form.name}</strong>. {settings.principalName} will review your counseling request
                    {settings.paidSessionsEnabled ? " and verify your payment confirmation." : "."}{" "}
                    You will receive a confirmation email with meeting details within 24 hours.
                  </p>
                  <button onClick={() => setSuccess(false)} className="btn btn-gold" style={{ marginTop: "1.75rem" }}>
                    Book Another Session
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <div>
                      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.45rem", fontWeight: 700 }}>
                        {settings.paidSessionsEnabled ? "Book 1-on-1 Counseling Session" : "Schedule a Free Counseling Consultation"}
                      </h2>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        Fill in your details below to secure your counseling slot.
                      </p>
                    </div>
                    {settings.paidSessionsEnabled && (
                      <span className="badge badge-gold" style={{ fontSize: "0.9rem", padding: "6px 12px" }}>
                        Fee: {settings.sessionFee}
                      </span>
                    )}
                  </div>

                  {error && (
                    <div
                      style={{
                        background: "rgba(231,76,60,0.15)",
                        border: "1px solid rgba(231,76,60,0.3)",
                        borderRadius: 8,
                        padding: "0.75rem 1rem",
                        color: "#e74c3c",
                        fontSize: "0.875rem",
                        marginBottom: "1.25rem",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Rahul Sharma"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Phone / WhatsApp Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="+91 98765 43210"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Counseling Area</label>
                      <select
                        className="form-input"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        <option>Career Counseling (Stream Selection / Degree)</option>
                        <option>Competitive Exam Strategy (JEE/NEET/CUET)</option>
                        <option>Parent-Child Guidance Session</option>
                        <option>Mental Wellness &amp; Exam Anxiety</option>
                        <option>Study Abroad Guidance</option>
                        <option>General Academic Mentorship</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Preferred Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Preferred Time Slot</label>
                      <select
                        className="form-input"
                        value={form.timeSlot}
                        onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                      >
                        <option>10:00 AM - 11:00 AM IST</option>
                        <option>11:00 AM - 12:00 PM IST</option>
                        <option>2:00 PM - 3:00 PM IST</option>
                        <option>4:00 PM - 5:00 PM IST</option>
                        <option>6:00 PM - 7:00 PM IST</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tell Principal Ma&apos;am about your goals / questions *</label>
                    <textarea
                      className="form-input"
                      rows={4}
                      placeholder="Please mention your current class/grade, any confusion you have, or specific topics you want guidance on..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                    />
                  </div>

                  {/* PAYMENT SECTION - Displayed only if Paid Sessions are enabled by Ma'am */}
                  {settings.paidSessionsEnabled && (
                    <div
                      style={{
                        background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(14,31,69,0.7))",
                        border: "1px solid var(--border-gold)",
                        borderRadius: 12,
                        padding: "1.5rem",
                        marginBottom: "1.5rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--gold)" }}>
                          💳 Payment &amp; Confirmation ({settings.sessionFee})
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, paymentMethod: "UPI" })}
                            className="btn btn-sm"
                            style={{
                              background: form.paymentMethod === "UPI" ? "var(--gold)" : "rgba(255,255,255,0.05)",
                              color: form.paymentMethod === "UPI" ? "#07122b" : "#fff",
                              padding: "0.3rem 0.8rem",
                            }}
                          >
                            UPI / QR
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, paymentMethod: "Bank" })}
                            className="btn btn-sm"
                            style={{
                              background: form.paymentMethod === "Bank" ? "var(--gold)" : "rgba(255,255,255,0.05)",
                              color: form.paymentMethod === "Bank" ? "#07122b" : "#fff",
                              padding: "0.3rem 0.8rem",
                            }}
                          >
                            Bank Transfer
                          </button>
                        </div>
                      </div>

                      {form.paymentMethod === "UPI" ? (
                        <div>
                          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
                            {settings.upiQrCode ? (
                              <div style={{ width: 110, height: 110, background: "#fff", padding: 6, borderRadius: 8, flexShrink: 0 }}>
                                <img src={settings.upiQrCode} alt="UPI QR Code" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: 100,
                                  height: 100,
                                  background: "rgba(255,255,255,0.08)",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  borderRadius: 8,
                                  textAlign: "center",
                                  padding: "0.5rem",
                                }}
                              >
                                <span style={{ fontSize: "2rem" }}>📱</span>
                                <span style={{ fontSize: "0.7rem", color: "var(--gold)" }}>UPI Instant</span>
                              </div>
                            )}

                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                                Official Counselor UPI ID:
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <code
                                  style={{
                                    background: "rgba(0,0,0,0.4)",
                                    color: "var(--gold)",
                                    padding: "0.5rem 0.8rem",
                                    borderRadius: 6,
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {settings.upiId}
                                </code>
                                <button type="button" onClick={handleCopyUpi} className="btn btn-ghost btn-sm">
                                  {copiedUpi ? "✅ Copied" : "📋 Copy"}
                                </button>
                              </div>
                              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                                Open Google Pay, PhonePe, Paytm, or BHIM and send {settings.sessionFee} to the UPI ID above.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.85rem", lineHeight: 1.8, marginBottom: "1rem", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: 8 }}>
                          <div><strong>Account Holder:</strong> {settings.bankHolderName}</div>
                          <div><strong>Bank:</strong> {settings.bankName}</div>
                          <div><strong>Account Number:</strong> {settings.bankAccountNumber}</div>
                          <div><strong>IFSC Code:</strong> {settings.bankIfsc}</div>
                        </div>
                      )}

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ color: "#fff", fontWeight: 600 }}>
                          UPI Reference / UTR Number / Transaction ID *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 425619874123 or UPI Ref No."
                          value={form.transactionId}
                          onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                          required={settings.paidSessionsEnabled}
                        />
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                          Enter the 12-digit transaction ID generated by your payment app for instant booking confirmation.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-gold"
                    style={{ width: "100%", justifyContent: "center", padding: "0.85rem", fontSize: "1rem" }}
                    disabled={loading}
                  >
                    {loading
                      ? "Submitting Appointment..."
                      : settings.paidSessionsEnabled
                      ? `🚀 Submit Booking & Payment Details (${settings.sessionFee})`
                      : "🚀 Book Free Counseling Session"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
