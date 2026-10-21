"use client";
import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { doc, getDoc, collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import CircularProgressLoader from "@/components/CircularProgressLoader";
import { validateUtr, formatInr, generateReceiptNumber } from "@/lib/paymentUtils";
import type { WorkshopItem, WorkshopRegistration } from "@/types";

export default function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const workshopId = resolvedParams.id;

  const { user } = useAuth();
  const { profile, lang } = useSite();

  const [workshop, setWorkshop] = useState<WorkshopItem | null>(null);
  const [bookedCount, setBookedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [utr, setUtr] = useState("");
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [registeredStatus, setRegisteredStatus] = useState<"confirmed" | "waitlist">("confirmed");

  useEffect(() => {
    if (user) {
      if (user.displayName && !name) setName(user.displayName);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user, name, email]);

  useEffect(() => {
    const fetchWorkshopAndRegs = async () => {
      try {
        const snap = await getDoc(doc(db, "workshops", workshopId));
        if (snap.exists()) {
          setWorkshop({ id: snap.id, ...snap.data() } as WorkshopItem);
        }

        const q = query(
          collection(db, "workshopRegistrations"),
          where("workshopId", "==", workshopId)
        );
        const regSnap = await getDocs(q);
        const activeRegs = regSnap.docs
          .map((d) => d.data() as WorkshopRegistration)
          .filter((r) => r.status !== "cancelled");
        setBookedCount(activeRegs.length);
      } catch (err) {
        console.error("Error loading workshop details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshopAndRegs();
  }, [workshopId]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgressLoader
          size={110}
          title={lang === "hi" ? "कार्यशाला विवरण लोड हो रहा है..." : "Loading Workshop..."}
          subtitle={
            lang === "hi"
              ? "पंजीकरण स्थिति और विवरण प्राप्त किए जा रहे हैं..."
              : "Checking seat availability & workshop curriculum..."
          }
        />
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="page-wrapper">
        <section className="section">
          <div className="container" style={{ textAlign: "center", padding: "4rem" }}>
            <h2>Workshop Not Found</h2>
            <p>The requested workshop may have been removed or rescheduled.</p>
            <Link href="/workshops" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              ← Browse All Workshops
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const remainingSeats = Math.max(0, workshop.maxSeats - bookedCount);
  const isFull = remainingSeats === 0;
  const isPaid = workshop.fee > 0;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg("Please provide your name, phone number, and email.");
      return;
    }

    if (isPaid && !isFull) {
      setStep("payment");
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setErrorMsg("");

    if (isPaid && !isFull) {
      const utrValidation = validateUtr(utr);
      if (!utrValidation.valid) {
        setErrorMsg(utrValidation.error || "Please enter a valid 12-character bank UTR.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const finalStatus = isFull ? "waitlist" : "confirmed";
      const paymentStatus = isPaid
        ? isFull
          ? "pending"
          : "submitted"
        : "free";

      const receiptNo = isPaid ? generateReceiptNumber("WS") : undefined;

      const regPayload: Omit<WorkshopRegistration, "id"> = {
        workshopId,
        userId: user?.uid,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        status: finalStatus,
        paymentStatus,
        utr: isPaid ? utr.trim().toUpperCase() : undefined,
        receiptNumber: receiptNo,
        attendance: "pending",
        registeredAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "workshopRegistrations"), regPayload);
      setRegisteredStatus(finalStatus);
      setStep("success");
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrorMsg(err?.message || "Failed to submit registration.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: "780px" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <Link href="/workshops" style={{ fontSize: "0.85rem", color: "var(--brand-primary)", textDecoration: "none", fontWeight: 600 }}>
              ← Back to All Workshops
            </Link>
          </div>

          <div className="card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span className="badge badge-primary">{workshop.mode === "online" ? "🌐 Online Video Call" : "🏢 In-Person Session"}</span>
              <span className={`badge ${isFull ? "badge-error" : "badge-success"}`}>
                {isFull ? "Session Full (Waitlist Open)" : `${remainingSeats} Seats Left`}
              </span>
            </div>

            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.75rem", color: "var(--brand-primary)" }}>
              {workshop.title}
            </h1>

            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              {workshop.description}
            </p>

            {/* Event Details Card */}
            <div
              style={{
                background: "var(--surface-2)",
                padding: "1rem 1.25rem",
                borderRadius: "var(--radius)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                fontSize: "0.88rem",
                marginBottom: "2rem",
              }}
            >
              <div>📅 <strong>Date:</strong> {workshop.date}</div>
              <div>⏰ <strong>Time:</strong> {workshop.time} ({workshop.durationMinutes}m)</div>
              {workshop.mode === "in_person" && workshop.venue && (
                <div>📍 <strong>Venue:</strong> {workshop.venue}</div>
              )}
              <div>
                💳 <strong>Registration Fee:</strong>{" "}
                <span style={{ color: isPaid ? "var(--brand-primary)" : "#10b981", fontWeight: 700 }}>
                  {isPaid ? formatInr(workshop.fee) : "Free"}
                </span>
              </div>
            </div>

            {/* FLOW STEPS */}
            {step === "success" ? (
              <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>
                  {registeredStatus === "waitlist" ? "⏳" : "🎉"}
                </div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                  {registeredStatus === "waitlist" ? "Added to Waitlist!" : "Registration Received!"}
                </h2>
                <p style={{ color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                  {registeredStatus === "waitlist"
                    ? "This session is currently at full capacity. We have added you to the priority waitlist and will notify you by email/phone if a seat becomes available."
                    : isPaid
                    ? "Thank you! Your payment details (UTR) have been received. The counsellor will verify your submission and confirm your seat."
                    : "You are confirmed! Meeting links and session reminders will be sent to your email."}
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                  <Link href="/workshops" className="btn btn-outline">
                    Browse Other Workshops
                  </Link>
                  <Link href="/" className="btn btn-primary">
                    Return Home
                  </Link>
                </div>
              </div>
            ) : step === "payment" ? (
              /* PAYMENT STEP FOR PAID WORKSHOPS */
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--brand-primary)" }}>
                    💳 Step 2: Complete Fee Payment ({formatInr(workshop.fee)})
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
                    Scan the counsellor's official UPI QR code and enter your 12-digit transaction UTR / Ref number.
                  </p>
                </div>

                {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

                {/* QR Code and UPI ID */}
                <div
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: "1rem",
                  }}
                >
                  {profile.paymentQr ? (
                    <img
                      src={profile.paymentQr}
                      alt="Counsellor Payment QR"
                      style={{ width: 180, height: 180, objectFit: "contain", background: "#fff", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border)" }}
                    />
                  ) : (
                    <div style={{ width: 180, height: 180, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      QR Details Coming Soon
                    </div>
                  )}

                  <div>
                    {profile.payeeName && (
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                        Payee: {profile.payeeName}
                      </div>
                    )}
                    {profile.upiId && (
                      <div style={{ fontSize: "0.9rem", color: "var(--brand-primary)", fontWeight: 600, marginTop: "0.25rem" }}>
                        UPI ID: <code>{profile.upiId}</code>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    12-Digit Bank UTR / Transaction Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.toUpperCase())}
                    placeholder="e.g. 428912345678"
                    className="form-input"
                    style={{ letterSpacing: "2px", fontWeight: 700 }}
                  />
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
                    Available in your UPI app payment receipt (GPay, PhonePe, Paytm, BHIM).
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  <button type="button" onClick={() => setStep("form")} className="btn btn-outline btn-sm">
                    ← Back to Details
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinalSubmit}
                    className="btn btn-primary"
                  >
                    {submitting ? t("loading", lang) : "Submit Registration & Payment"}
                  </button>
                </div>
              </div>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleNextStep} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--brand-primary)" }}>
                    {isFull ? "Join Workshop Waitlist" : "Register Your Seat"}
                  </h3>
                </div>

                {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

                <div className="form-group">
                  <label className="form-label">{t("name", lang)} *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="form-input"
                  />
                </div>

                <div className="grid-2" style={{ gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">{t("email", lang)} *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("phone", lang)} *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="form-input"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    🔒 Confidential registration under Indian privacy guidelines.
                  </span>
                  <button type="submit" disabled={submitting} className="btn btn-primary btn-lg">
                    {isPaid && !isFull ? "Proceed to Payment →" : isFull ? "Join Priority Waitlist" : "Confirm Free Registration"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
