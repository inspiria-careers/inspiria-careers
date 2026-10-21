"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  runTransaction,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import { getAvailableSlotsForDate } from "@/lib/slotUtils";
import IntakeModal from "@/components/IntakeModal";
import type { ClientIntake } from "@/types";
import { CalendarIcon, CreditCardIcon, LockIcon, CertificateIcon } from "@/components/Icons";
import { checkClientRateLimit } from "@/lib/clientRateLimit";
import CircularProgressLoader from "@/components/CircularProgressLoader";

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const { profile, services, lang } = useSite();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [mode, setMode] = useState<"Online" | "In-Person">("Online");
  const [notes, setNotes] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const calculatedFee = useMemo(() => {
    if (selectedService?.fee !== undefined && selectedService?.fee !== null && Number(selectedService.fee) > 0) {
      return Number(selectedService.fee);
    }
    return profile.defaultConsultationFee !== undefined && Number(profile.defaultConsultationFee) > 0
      ? Number(profile.defaultConsultationFee)
      : 0;
  }, [selectedService, profile.defaultConsultationFee]);

  const requiresPayment = useMemo(
    () => profile.paymentsEnabled && calculatedFee > 0,
    [profile.paymentsEnabled, calculatedFee]
  );

  // Intake & Consent state
  const [intakeCompleted, setIntakeCompleted] = useState<boolean | null>(null);
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  // Honeypot anti-spam
  const [hp, setHp] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Min date: tomorrow
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, []);

  // Compute available slots dynamically based on weeklySchedule, slotDurationMinutes & slotBufferMinutes
  const dynamicSlotsInfo = useMemo(() => {
    if (!date) return { isDayAvailable: true, slots: [] };
    return getAvailableSlotsForDate(
      date,
      profile.weeklySchedule,
      profile.slotDurationMinutes || 45,
      profile.slotBufferMinutes || 15
    );
  }, [date, profile.weeklySchedule, profile.slotDurationMinutes, profile.slotBufferMinutes]);

  // Check client intake & consent status
  const checkIntake = useCallback(async () => {
    if (!user) {
      setIntakeCompleted(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, "clientIntake", user.uid));
      if (snap.exists()) {
        const d = snap.data() as ClientIntake;
        const currentVersion = profile.consentVersion || 1;
        if (d.consentAccepted && d.consentVersion >= currentVersion) {
          setIntakeCompleted(true);
        } else {
          setIntakeCompleted(false);
        }
      } else {
        setIntakeCompleted(false);
      }
    } catch {
      setIntakeCompleted(false);
    }
  }, [user, profile.consentVersion]);

  useEffect(() => {
    checkIntake();
  }, [checkIntake]);

  // Check already booked slots for the selected date from slotLocks (public availability index)
  useEffect(() => {
    async function checkBookedSlots() {
      if (!date) {
        setBookedSlots([]);
        return;
      }
      try {
        const q = query(
          collection(db, "slotLocks"),
          where("date", "==", date),
          where("status", "==", "booked")
        );
        const snap = await getDocs(q);
        const taken = snap.docs
          .map((d) => d.data().timeSlot as string)
          .filter(Boolean);
        setBookedSlots(taken);
      } catch (err) {
        console.warn("Error checking slotLocks availability:", err);
      }
    }

    checkBookedSlots();
  }, [date]);

  // Synchronize timeSlot selection with dynamicSlotsInfo and bookedSlots
  useEffect(() => {
    if (dynamicSlotsInfo.slots.length > 0) {
      setTimeSlot((current) => {
        if (current && dynamicSlotsInfo.slots.includes(current) && !bookedSlots.includes(current)) {
          return current;
        }
        const firstFree = dynamicSlotsInfo.slots.find((s) => !bookedSlots.includes(s));
        return firstFree || dynamicSlotsInfo.slots[0] || "";
      });
    } else {
      setTimeSlot("");
    }
  }, [dynamicSlotsInfo.slots, bookedSlots]);

  // Auto-fill from logged in user
  useEffect(() => {
    if (user) {
      if (user.displayName && !name) setName(user.displayName);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user, name, email]);

  // Set default service
  useEffect(() => {
    if (services.length > 0 && !serviceId) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  const executeBooking = async () => {
    const selectedService = services.find((s) => s.id === serviceId);
    const feeNum = (selectedService?.fee !== undefined && selectedService?.fee !== null && Number(selectedService.fee) > 0)
      ? Number(selectedService.fee)
      : (profile.defaultConsultationFee !== undefined && Number(profile.defaultConsultationFee) > 0
          ? Number(profile.defaultConsultationFee)
          : 0);
    const requiresPayment = feeNum > 0;

    setStatus("submitting");
    setErrorMsg("");

    const apptPayload = {
      userId: user?.uid || null,
      clientName: name.trim(),
      clientEmail: email.trim() || null,
      clientPhone: phone.trim(),
      serviceId: serviceId || null,
      serviceTitle: selectedService?.title || "General Counselling",
      serviceFee: requiresPayment ? feeNum : null,
      paymentStatus: requiresPayment ? "pending" : "not_required",
      date,
      timeSlot,
      mode,
      notes: notes.trim(),
      status: "pending",
      reminderSent: false,
      intakeCompleted: !!intakeCompleted,
      createdAt: serverTimestamp(),
    };

    try {
      let finalApptId = "";

      // 1. Attempt atomic concurrency transaction with slotLocks
      try {
        const lockKey = `${date}_${timeSlot.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const lockRef = doc(db, "slotLocks", lockKey);
        const newApptRef = doc(collection(db, "appointments"));
        finalApptId = newApptRef.id;

        await runTransaction(db, async (tx) => {
          const lockSnap = await tx.get(lockRef);
          if (lockSnap.exists() && lockSnap.data().status === "booked") {
            throw new Error("SLOT_TAKEN");
          }

          tx.set(lockRef, {
            date,
            timeSlot,
            status: "booked",
            appointmentId: newApptRef.id,
            userId: user?.uid || null,
            lockedAt: new Date().toISOString(),
          });

          tx.set(newApptRef, apptPayload);
        });
      } catch (lockErr: any) {
        if (lockErr.message === "SLOT_TAKEN") {
          throw lockErr;
        }
        console.warn("Atomic slotLock transaction failed (falling back to direct appointment creation):", lockErr);
        // Fallback: directly create the appointment document so the client is never blocked
        // (handles cases where remote firestore.rules do not have slotLocks permission deployed yet)
        const directDoc = await addDoc(collection(db, "appointments"), apptPayload);
        finalApptId = directDoc.id;
      }

      // 2. Dispatch transactional confirmation email (non-blocking)
      if (email.trim() && finalApptId) {
        fetch("/api/email/booking-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId: finalApptId,
            clientName: name.trim(),
            clientEmail: email.trim(),
            serviceTitle: selectedService?.title || "General Counselling",
            date,
            timeSlot,
            mode,
            counsellorName: profile.counsellorName || "Principal Ma'am",
            type: "booking_received",
          }),
        }).catch((mailErr) => console.warn("Confirmation email non-blocking error:", mailErr));
      }

      setStatus("success");
    } catch (err: any) {
      console.error("Booking error:", err);
      setStatus("error");
      if (err.message === "SLOT_TAKEN") {
        setErrorMsg(
          lang === "hi"
            ? "यह समय स्लॉट अभी-अभी किसी अन्य क्लाइंट द्वारा बुक कर लिया गया है। कृपया कोई अन्य स्लॉट चुनें।"
            : "This time slot was just booked by another client. Please select an alternate time slot."
        );
      } else {
        const detail = err?.code ? ` (${err.code})` : "";
        setErrorMsg(
          lang === "hi"
            ? `अपॉइंटमेंट बुक करने में त्रुटि हुई${detail}। कृपया पुनः प्रयास करें या सीधे संपर्क करें।`
            : `Failed to book appointment${detail}. Please try again or contact us directly.`
        );
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot bot protection
    if (hp) {
      setStatus("success");
      return;
    }

    // Rate Limit: Maximum 15 attempts per minute (prevents automated button spam while protecting genuine clients)
    const rl = checkClientRateLimit("booking", 15, 60000);
    if (!rl.allowed) {
      setErrorMsg(
        lang === "hi"
          ? `अनुरोध सीमा: आप प्रति मिनट अधिकतम 15 बार बुकिंग का प्रयास कर सकते हैं। कृपया ${rl.retryAfterSec} सेकंड बाद पुनः प्रयास करें।`
          : `Rate limit reached: Maximum 15 booking attempts allowed per minute. Please wait ${rl.retryAfterSec} seconds.`
      );
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

    const blockedDates = profile.blockedDates || [];
    if (blockedDates.includes(date)) {
      setErrorMsg(
        lang === "hi"
          ? "चयनित तारीख पर काउंसलर उपलब्ध नहीं हैं (अवकाश / अनुपलब्ध)। कृपया कोई अन्य तारीख चुनें।"
          : "This date is marked as a holiday/unavailable by the counsellor. Please select an alternate date."
      );
      return;
    }

    if (!dynamicSlotsInfo.isDayAvailable) {
      setErrorMsg(
        lang === "hi"
          ? "काउंसलर इस दिन उपलब्ध नहीं हैं। कृपया कार्य दिवस चुनें।"
          : "The counsellor is unavailable on this day. Please pick a working day."
      );
      return;
    }

    if (!timeSlot) {
      setErrorMsg(
        lang === "hi"
          ? "कृपया पसंदीदा समय स्लॉट चुनें।"
          : "Please select a preferred time slot."
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

    // If client is logged in and hasn't completed intake/consent, prompt intake modal
    if (user && intakeCompleted === false) {
      setShowIntakeModal(true);
      return;
    }

    await executeBooking();
  };

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: "760px" }}>
          {/* Trust & Safety: Prominent Non-Emergency Disclaimer */}
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "12px",
              padding: "0.85rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              fontSize: "0.85rem",
              color: "#92400e",
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>⚠️</span>
            <div>
              <strong>
                {lang === "hi" ? "आपातकालीन सूचना:" : "Non-Emergency Notice:"}
              </strong>{" "}
              {lang === "hi"
                ? "इन्स्पिरिया करियर पूर्व-निर्धारित मार्गदर्शन सेवा है, मनोरोग आपातकालीन सेवा नहीं। तीव्र संकट की स्थिति में कृपया "
                : "Inspiria Careers is a scheduled guidance service, not an acute emergency crisis intervention unit. In acute distress, please call "}
              <strong>Tele-MANAS (14416 - 24×7)</strong>{" "}
              {lang === "hi" ? "पर कॉल करें या हमारी " : "or visit our "}
              <Link href="/emergency" style={{ textDecoration: "underline", fontWeight: 700, color: "#78350f" }}>
                {t("emergencyHelplines", lang)}
              </Link>{" "}
              {lang === "hi" ? "सूची देखें।" : "directory."}
            </div>
          </div>

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
            {profile.maintenanceMode ? (
              <div style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🛠️</div>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--brand-primary)", marginBottom: "0.75rem" }}>
                  {lang === "hi" ? "अपॉइंटमेंट बुकिंग अस्थायी रूप से स्थगित है" : "Bookings Temporarily Paused"}
                </h2>
                <p style={{ color: "var(--text-muted)", maxWidth: "560px", margin: "0 auto 1.5rem", lineHeight: 1.7 }}>
                  {profile.maintenanceNoticeText || (lang === "hi"
                    ? "वर्तमान में प्रणाली का रखरखाव चल रहा है। नई अपॉइंटमेंट बुकिंग कुछ समय के लिए रोकी गई है। कृपया थोड़ी देर बाद पुनः प्रयास करें।"
                    : "We are currently conducting scheduled system maintenance. New appointment bookings are temporarily paused. Please check back shortly.")}
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/emergency" className="btn btn-outline" style={{ borderColor: "#dc2626", color: "#dc2626" }}>
                    🚨 {lang === "hi" ? "आपातकालीन हेल्पलाइन" : "Emergency Helplines"}
                  </Link>
                  <Link href="/" className="btn btn-primary">
                    {t("home", lang)}
                  </Link>
                </div>
              </div>
            ) : status === "success" ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>✅</div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--brand-primary)", marginBottom: "0.75rem" }}>
                  {lang === "hi" ? "अनुरोध प्राप्त हुआ!" : "Appointment Request Submitted!"}
                </h2>
                <p style={{ color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 1.75rem", lineHeight: 1.7 }}>
                  {t("bookingSuccess", lang)}
                  {email.trim() && (
                    <span style={{ display: "block", marginTop: "0.6rem", fontSize: "0.92rem", color: "var(--brand-primary)", fontWeight: 600 }}>
                      📧 {lang === "hi"
                        ? `पुष्टिकरण ईमेल ${email.trim()} पर भेजा गया है।`
                        : `A confirmation email has been dispatched to ${email.trim()}.`}
                    </span>
                  )}
                </p>

                {requiresPayment && calculatedFee > 0 && (
                  <div
                    style={{
                      margin: "1.25rem auto 1.5rem",
                      padding: "1.25rem",
                      background: "var(--surface-2)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      maxWidth: "480px",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--brand-primary)", marginBottom: "0.35rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                      <CreditCardIcon size={18} />
                      {lang === "hi" ? "परामर्श शुल्क:" : "Consultation Fee:"} ₹{calculatedFee}
                    </div>
                    {profile.paymentQr ? (
                      <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <img
                          src={profile.paymentQr}
                          alt="Payment QR Code"
                          style={{ width: 140, height: 140, objectFit: "contain", borderRadius: 8, border: "1px solid var(--border)", background: "#fff" }}
                        />
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                          {lang === "hi" ? "QR स्कैन करके भुगतान करें" : "Scan to Pay via UPI"}
                        </span>
                      </div>
                    ) : null}
                    {profile.upiId ? (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
                        <strong>UPI ID:</strong> <code>{profile.upiId}</code> {profile.payeeName && `(${profile.payeeName})`}
                      </div>
                    ) : null}
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                      {lang === "hi"
                        ? "भुगतान के बाद डैशबोर्ड में 12-अंकीय UTR नंबर दर्ज करें ताकि काउंसलर अपॉइंटमेंट की पुष्टि कर सकें।"
                        : "After payment, submit your 12-digit UTR in your dashboard to confirm your appointment."}
                    </div>
                  </div>
                )}

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
                        services.map((s) => {
                          const sFee = (s.fee !== undefined && s.fee !== null && Number(s.fee) > 0)
                            ? Number(s.fee)
                            : (profile.defaultConsultationFee !== undefined && Number(profile.defaultConsultationFee) > 0
                                ? Number(profile.defaultConsultationFee)
                                : 0);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.title}
                              {sFee > 0 ? ` (₹${sFee})` : (lang === "hi" ? " (निःशुल्क)" : " (Free)")}
                            </option>
                          );
                        })
                      ) : (
                        <option value="">
                          {lang === "hi" ? "सामान्य करियर परामर्श" : "General Career Counselling"}
                          {profile.defaultConsultationFee && Number(profile.defaultConsultationFee) > 0 ? ` (₹${profile.defaultConsultationFee})` : ""}
                        </option>
                      )}
                    </select>
                    {(() => {
                      const selectedService = services.find((s) => s.id === serviceId);
                      const currentFee = (selectedService?.fee !== undefined && selectedService?.fee !== null && Number(selectedService.fee) > 0)
                        ? Number(selectedService.fee)
                        : (profile.defaultConsultationFee !== undefined && Number(profile.defaultConsultationFee) > 0
                            ? Number(profile.defaultConsultationFee)
                            : 0);
                      return (
                        <div style={{ marginTop: "0.45rem", fontSize: "0.82rem", color: currentFee > 0 ? "var(--brand-primary)" : "#10b981", fontWeight: 600 }}>
                          💳 {lang === "hi" ? "परामर्श शुल्क:" : "Consultation Booking Fee:"}{" "}
                          {currentFee > 0 ? `₹${currentFee}` : (lang === "hi" ? "निःशुल्क (Free)" : "Free of Cost")}
                        </div>
                      );
                    })()}
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
                    {dynamicSlotsInfo.slots.length > 0 ? (
                      <select
                        className="form-select"
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        required
                      >
                        {!timeSlot && (
                          <option value="" disabled>
                            {lang === "hi" ? "-- समय स्लॉट चुनें --" : "-- Select Time Slot --"}
                          </option>
                        )}
                        {dynamicSlotsInfo.slots.map((slot) => {
                          const isBooked = bookedSlots.includes(slot);
                          return (
                            <option key={slot} value={slot} disabled={isBooked}>
                              {slot} {isBooked ? `(${lang === "hi" ? "बुक हो चुका" : "Booked"})` : ""}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div style={{ padding: "0.65rem", fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        {date
                          ? (lang === "hi" ? "इस तारीख पर कोई स्लॉट उपलब्ध नहीं है।" : "No slots available on this date.")
                          : (lang === "hi" ? "कृपया पहले तारीख चुनें।" : "Please select a date first.")}
                      </div>
                    )}
                    {dynamicSlotsInfo.slots.length > 0 && dynamicSlotsInfo.slots.every((s) => bookedSlots.includes(s)) && (
                      <div style={{ marginTop: "0.4rem", padding: "0.5rem 0.75rem", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.82rem" }}>
                        ⚠️ {lang === "hi" ? "इस तारीख के सभी स्लॉट बुक हो चुके हैं। कृपया कोई अन्य तारीख चुनें।" : "All slots on this date are fully booked. Please choose another date."}
                      </div>
                    )}
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

                {(() => {
                  const sel = services.find((s) => s.id === serviceId);
                  const fee = sel?.fee ? Number(sel.fee) : (profile.defaultConsultationFee ? Number(profile.defaultConsultationFee) : 0);
                  if (fee > 0) {
                    return (
                      <div
                        style={{
                          padding: "0.85rem 1rem",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          fontSize: "0.85rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "var(--brand-primary)", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                          <CreditCardIcon size={16} />
                          {lang === "hi" ? "परामर्श शुल्क:" : "Consultation Fee:"} ₹{fee}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {lang === "hi"
                            ? "बुकिंग के बाद आपके डैशबोर्ड में QR कोड व UPI विवरण मिलेगा। भुगतान सत्यापन के बाद सत्र कन्फर्म होगा।"
                            : "After booking, you will see the payment QR code & UPI options in your dashboard. Session will be confirmed upon payment verification."}
                        </div>
                        {profile.refundPolicyText && (
                          <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", borderTop: "1px dashed var(--border)", paddingTop: "0.35rem", marginTop: "0.25rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                            <CertificateIcon size={14} />
                            <span><strong>{lang === "hi" ? "रद्दकरण / रिफंड नीति:" : "Cancellation & Refund Policy:"}</strong> {profile.refundPolicyText}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <LockIcon size={14} />
                    {t("confidentiality", lang)}
                  </span>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={status === "submitting"}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    {status === "submitting" ? (
                      t("loading", lang)
                    ) : (
                      <>
                        <CalendarIcon size={18} />
                        {t("bookAppointment", lang)}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Branded Circular Progress Loader Modal (Circle with Logo & Percentage) ── */}
      {status === "submitting" && (
        <CircularProgressLoader
          isModal={true}
          size={124}
          title={
            lang === "hi"
              ? "अपॉइंटमेंट सुरक्षित किया जा रहा है..."
              : "Securing Consultation Slot..."
          }
          subtitle={
            lang === "hi"
              ? "कैलेंडर आरक्षित हो रहा है, कृपया प्रतीक्षा करें..."
              : "Reserving your time slot, please wait a moment..."
          }
        />
      )}

      {/* Mandatory Intake Form & Informed Consent Modal */}
      <IntakeModal
        isOpen={showIntakeModal}
        requiredForBooking={true}
        onClose={() => setShowIntakeModal(false)}
        onSuccess={async () => {
          setIntakeCompleted(true);
          setShowIntakeModal(false);
          await executeBooking();
        }}
      />
    </div>
  );
}
