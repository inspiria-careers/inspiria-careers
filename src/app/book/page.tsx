"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

const TIME_SLOTS = [
  "10:00 AM - 11:00 AM",
  "11:30 AM - 12:30 PM",
  "02:00 PM - 03:00 PM",
  "03:30 PM - 04:30 PM",
  "05:00 PM - 06:00 PM",
];

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const { profile, services, lang } = useSite();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [mode, setMode] = useState<"Online" | "In-Person">("Online");
  const [notes, setNotes] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Honeypot anti-spam
  const [hp, setHp] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Check booked slots when date changes
  useEffect(() => {
    async function checkBookedSlots() {
      if (!date) {
        setBookedSlots([]);
        return;
      }
      try {
        const q = query(
          collection(db, "appointments"),
          where("date", "==", date)
        );
        const snap = await getDocs(q);
        const taken = snap.docs
          .map((d) => d.data())
          .filter((d) => d.status !== "cancelled")
          .map((d) => d.timeSlot);
        setBookedSlots(taken);

        // If current slot is taken, switch to first available
        if (taken.includes(timeSlot)) {
          const firstFree = TIME_SLOTS.find((s) => !taken.includes(s));
          if (firstFree) setTimeSlot(firstFree);
        }
      } catch (err) {
        console.error("Error checking slot availability:", err);
      }
    }

    checkBookedSlots();
  }, [date]);

  // Auto-fill from logged in user
  useEffect(() => {
    if (user) {
      if (user.displayName && !name) setName(user.displayName);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user]);

  // Set default service
  useEffect(() => {
    if (services.length > 0 && !serviceId) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot bot protection
    if (hp) {
      setStatus("success");
      return;
    }

    if (!name.trim() || !phone.trim() || !date) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया नाम, फोन नंबर, और तारीख अनिवार्य रूप से भरें।"
          : "Please provide your name, phone number, and appointment date."
      );
      return;
    }

    if (bookedSlots.includes(timeSlot)) {
      setErrorMsg(
        lang === "hi"
          ? "यह समय स्लॉट पहले से बुक हो चुका है। कृपया दूसरा स्लॉट चुनें।"
          : "This time slot has already been booked. Please choose an alternate slot."
      );
      return;
    }

    const selectedService = services.find((s) => s.id === serviceId);

    try {
      setStatus("submitting");
      setErrorMsg("");

      await addDoc(collection(db, "appointments"), {
        userId: user?.uid || null,
        clientName: name.trim(),
        clientEmail: email.trim() || null,
        clientPhone: phone.trim(),
        serviceId: serviceId || null,
        serviceTitle: selectedService?.title || "General Counselling",
        date,
        timeSlot,
        mode,
        notes: notes.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setStatus("success");
    } catch (err: any) {
      console.error("Booking error:", err);
      setStatus("error");
      setErrorMsg(
        lang === "hi"
          ? "अपॉइंटमेंट बुक करने में त्रुटि हुई। कृपया पुनः प्रयास करें।"
          : "Failed to book appointment. Please try again."
      );
    }
  };

  // Min date: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: "760px" }}>
          <div className="section-header">
            <span className="section-tag">{t("bookAppointment", lang)}</span>
            <h1 className="section-title">
              {lang === "hi" ? "अपॉइंटमेंट " : "Schedule a "}
              <span>{lang === "hi" ? "बुक करें" : "Consultation"}</span>
            </h1>
            <p className="section-subtitle">
              {lang === "hi"
                ? "व्यक्तिगत और गोपनीय परामर्श सत्र के लिए अपनी सुविधानुसार समय चुनें।"
                : "Choose a convenient date and time for a 1-on-1 personalized, confidential counselling session."}
            </p>
          </div>

          <div className="card">
            {status === "success" ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>✅</div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--brand-primary)", marginBottom: "0.75rem" }}>
                  {lang === "hi" ? "अनुरोध प्राप्त हुआ!" : "Appointment Request Submitted!"}
                </h2>
                <p style={{ color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 1.75rem", lineHeight: 1.7 }}>
                  {t("bookingSuccess", lang)}
                </p>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                  {user ? (
                    <Link href="/dashboard/client" className="btn btn-primary">
                      {lang === "hi" ? "मेरी अपॉइंटमेंट्स देखें" : "View My Appointments"}
                    </Link>
                  ) : (
                    <Link href="/login" className="btn btn-primary">
                      {lang === "hi" ? "ट्रैक करने के लिए लॉगिन करें" : "Login to Track Status"}
                    </Link>
                  )}
                  <Link href="/" className="btn btn-outline">
                    {t("home", lang)}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

                <div className="grid-2" style={{ gap: "1.25rem" }}>
                  <div className="form-group">
                    <label className="form-label">{t("name", lang)} *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === "hi" ? "आपका पूरा नाम" : "Your Full Name"}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("phone", lang)} *</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: "1.25rem" }}>
                  <div className="form-group">
                    <label className="form-label">{t("email", lang)}</label>
                    <input
                      type="email"
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t("services", lang)}</label>
                    <select
                      className="form-select"
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                    >
                      {services.length > 0 ? (
                        services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))
                      ) : (
                        <option value="">
                          {lang === "hi" ? "सामान्य करियर परामर्श" : "General Career Counselling"}
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: "1.25rem" }}>
                  <div className="form-group">
                    <label className="form-label">{lang === "hi" ? "पसंदीदा तारीख *" : "Preferred Date *"}</label>
                    <input
                      type="date"
                      className="form-input"
                      value={date}
                      min={minDate}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{lang === "hi" ? "समय स्लॉट *" : "Preferred Time Slot *"}</label>
                    <select
                      className="form-select"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                    >
                      {TIME_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        return (
                          <option key={slot} value={slot} disabled={isBooked}>
                            {slot} {isBooked ? `(${lang === "hi" ? "बुक हो चुका" : "Booked"})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Honeypot field for anti-spam bots */}
                <input
                  type="text"
                  name="user_confirm_token"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="form-group">
                  <label className="form-label">{lang === "hi" ? "परामर्श माध्यम *" : "Session Mode *"}</label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === "Online"}
                        onChange={() => setMode("Online")}
                      />
                      🌐 {lang === "hi" ? "ऑनलाइन वीडियो कॉल (Google Meet / Zoom)" : "Online Video Call"}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === "In-Person"}
                        onChange={() => setMode("In-Person")}
                      />
                      🏢 {lang === "hi" ? "कार्यालय में व्यक्तिगत मुलाकात" : "In-Person Office Visit"}
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {lang === "hi" ? "विशेष विषय या प्रश्न (वैकल्पिक)" : "Notes or Questions (Optional)"}
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      lang === "hi"
                        ? "आप किस विषय पर चर्चा करना चाहते हैं (जैसे 12वीं के बाद करियर, कॉलेज चयन, तनाव प्रबंधन)..."
                        : "Topics you would like to discuss (e.g. stream selection, college admissions, career switch)..."
                    }
                  />
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    🔒 {t("confidentiality", lang)}
                  </span>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={status === "submitting"}
                  >
                    {status === "submitting" ? t("loading", lang) : `📅 ${t("bookAppointment", lang)}`}
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
