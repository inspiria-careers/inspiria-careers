"use client";
import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import type { ClientIntake, AgeGroup, SessionPurpose, PreferredLanguage } from "@/types";
import { LockIcon, SirenIcon, CloseIcon } from "@/components/Icons";

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requiredForBooking?: boolean;
}

export default function IntakeModal({
  isOpen,
  onClose,
  onSuccess,
  requiredForBooking = false,
}: IntakeModalProps) {
  const { user } = useAuth();
  const { profile, lang } = useSite();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formData, setFormData] = useState<Partial<ClientIntake>>({
    ageGroup: "18_24",
    city: "",
    purpose: "career",
    purposeDetails: "",
    previousCounselling: false,
    emergencyContactName: "",
    emergencyContactPhone: "",
    preferredLanguage: "either",
    parentName: "",
    parentPhone: "",
    parentConsentConfirmed: false,
    consentAccepted: false,
  });

  useEffect(() => {
    if (!isOpen || !user) return;
    setFetching(true);
    const fetchExisting = async () => {
      try {
        const snap = await getDoc(doc(db, "clientIntake", user.uid));
        if (snap.exists()) {
          const data = snap.data() as ClientIntake;
          setFormData(data);
        } else {
          setFormData((prev) => ({
            ...prev,
            clientName: user.displayName || "",
            clientEmail: user.email || "",
          }));
        }
      } catch (err: any) {
        console.error("Error loading intake form:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchExisting();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const isUnder18 = formData.ageGroup === "under_18";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) return;

    if (!formData.city?.trim()) {
      setError(lang === "hi" ? "कृपया अपना शहर दर्ज करें।" : "Please enter your city.");
      return;
    }
    if (!formData.emergencyContactName?.trim() || !formData.emergencyContactPhone?.trim()) {
      setError(
        lang === "hi"
          ? "कृपया आपातकालीन संपर्क नाम और फोन नंबर दर्ज करें।"
          : "Please enter emergency contact name and phone number."
      );
      return;
    }

    if (isUnder18) {
      if (!formData.parentName?.trim() || !formData.parentPhone?.trim()) {
        setError(
          lang === "hi"
            ? "18 वर्ष से कम आयु के लिए माता-पिता/अभिभावक का विवरण अनिवार्य है।"
            : "Parent/Guardian details are required for clients under 18."
        );
        return;
      }
      if (!formData.parentConsentConfirmed) {
        setError(
          lang === "hi"
            ? "कृपया माता-पिता की सहमति की पुष्टि करें।"
            : "Please confirm parental consent."
        );
        return;
      }
    }

    if (!formData.consentAccepted) {
      setError(
        lang === "hi"
          ? "कृपया आगे बढ़ने के लिए सूचित सहमति स्वीकार करें।"
          : "Please accept the informed consent to proceed."
      );
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const intakePayload: ClientIntake = {
        userId: user.uid,
        clientName: user.displayName || formData.clientName || "Client",
        clientEmail: user.email || formData.clientEmail || "",
        ageGroup: formData.ageGroup as AgeGroup,
        city: formData.city.trim(),
        purpose: formData.purpose as SessionPurpose,
        purposeDetails: formData.purposeDetails?.trim() || "",
        previousCounselling: !!formData.previousCounselling,
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
        preferredLanguage: (formData.preferredLanguage as PreferredLanguage) || "either",
        parentName: isUnder18 ? (formData.parentName?.trim() || null) : null,
        parentPhone: isUnder18 ? (formData.parentPhone?.trim() || null) : null,
        parentConsentConfirmed: isUnder18 ? !!formData.parentConsentConfirmed : false,
        consentAccepted: true,
        consentVersion: profile.consentVersion || 1,
        consentAcceptedAt: formData.consentAcceptedAt || now,
        updatedAt: now,
      };

      // Strip any undefined fields to guarantee Firestore compatibility
      const cleanPayload = Object.fromEntries(
        Object.entries(intakePayload).filter(([_, v]) => v !== undefined)
      );

      await setDoc(doc(db, "clientIntake", user.uid), cleanPayload, { merge: true });
      setSuccessMsg(t("intakeSubmitted", lang));
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Intake submission error:", err);
      setError(err?.message || "Failed to save intake profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 20, 40, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "2rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
          position: "relative",
        }}
      >
        {!requiredForBooking && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: "1.25rem",
              right: "1.25rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted, #64748b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloseIcon size={20} />
          </button>
        )}

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.75rem", borderRadius: "999px", background: "rgba(26, 58, 143, 0.1)", color: "var(--brand-primary, #1a3a8f)", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            <LockIcon size={14} />
            <span>{lang === "hi" ? "गोपनीय एवं सुरक्षित" : "Confidential & Protected"}</span>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary, #0f172a)" }}>
            {t("intakeTitle", lang)}
          </h2>
          <p style={{ margin: 0, color: "var(--text-muted, #64748b)", fontSize: "0.9rem" }}>
            {t("intakeSubtitle", lang)}
          </p>
        </div>

        {fetching ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            {t("loading", lang)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid #f87171", borderRadius: "8px", color: "#b91c1c", fontSize: "0.875rem" }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: "0.75rem 1rem", background: "#ecfdf5", border: "1px solid #34d399", borderRadius: "8px", color: "#065f46", fontSize: "0.875rem" }}>
                {successMsg}
              </div>
            )}

            {/* Age Group & City */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  {t("ageGroup", lang)} *
                </label>
                <select
                  value={formData.ageGroup || "18_24"}
                  onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value as AgeGroup })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-input, #fff)" }}
                >
                  <option value="under_18">{lang === "hi" ? "18 वर्ष से कम (Under 18)" : "Under 18"}</option>
                  <option value="18_24">18 – 24 yrs</option>
                  <option value="25_34">25 – 34 yrs</option>
                  <option value="35_plus">35+ yrs</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  {t("city", lang)} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Delhi, Lucknow, Patna"
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-input, #fff)" }}
                />
              </div>
            </div>

            {/* Under-18 Safeguards */}
            {isUnder18 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "1rem" }}>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#92400e", fontWeight: 600 }}>
                  🛡️ {lang === "hi" ? "नाबालिग सुरक्षा अनुबंध (माता-पिता का विवरण आवश्यक)" : "Minor Safeguard: Parental Information Required"}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", color: "#78350f" }}>
                      {t("parentGuardianName", lang)} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.parentName || ""}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #d97706", background: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem", color: "#78350f" }}>
                      {t("parentGuardianPhone", lang)} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.parentPhone || ""}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #d97706", background: "#fff" }}
                    />
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8rem", color: "#92400e", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!formData.parentConsentConfirmed}
                    onChange={(e) => setFormData({ ...formData, parentConsentConfirmed: e.target.checked })}
                    style={{ marginTop: "0.15rem" }}
                  />
                  <span>{t("parentConsentConfirm", lang)}</span>
                </label>
              </div>
            )}

            {/* Primary Purpose */}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                {t("sessionPurpose", lang)} *
              </label>
              <select
                value={formData.purpose || "career"}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value as SessionPurpose })}
                style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-input, #fff)", marginBottom: "0.5rem" }}
              >
                <option value="career">{t("careerGuidance", lang)}</option>
                <option value="academic">{t("academicStress", lang)}</option>
                <option value="emotional">{t("emotionalWellness", lang)}</option>
                <option value="personal">{t("personalGrowth", lang)}</option>
                <option value="other">{t("other", lang)}</option>
              </select>

              <textarea
                placeholder={lang === "hi" ? "संक्षेप में बताएं कि आप इस सत्र से क्या हासिल करना चाहते हैं..." : "Briefly describe what you would like support with..."}
                rows={2}
                value={formData.purposeDetails || ""}
                onChange={(e) => setFormData({ ...formData, purposeDetails: e.target.value })}
                style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-input, #fff)", resize: "vertical" }}
              />
            </div>

            {/* Language & Previous Counselling */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  {t("preferredLanguage", lang)}
                </label>
                <select
                  value={formData.preferredLanguage || "either"}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value as PreferredLanguage })}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-input, #fff)" }}
                >
                  <option value="either">{lang === "hi" ? "हिन्दी या English (कोई भी)" : "Hindi or English (Either)"}</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                  {t("previousCounselling", lang)}
                </label>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="prevCounselling"
                      checked={formData.previousCounselling === true}
                      onChange={() => setFormData({ ...formData, previousCounselling: true })}
                    />
                    {lang === "hi" ? "हाँ" : "Yes"}
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.9rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="prevCounselling"
                      checked={formData.previousCounselling === false}
                      onChange={() => setFormData({ ...formData, previousCounselling: false })}
                    />
                    {lang === "hi" ? "नहीं" : "No"}
                  </label>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div style={{ background: "var(--card-subtle, #f8fafc)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-primary)", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <SirenIcon size={16} />
                <span>{lang === "hi" ? "आपातकालीन संपर्क विवरण" : "Emergency Contact Information"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                    {t("emergencyContactName", lang)} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parent, Sibling, Friend"
                    value={formData.emergencyContactName || ""}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)", background: "#fff" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                    {t("emergencyContactPhone", lang)} *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.emergencyContactPhone || ""}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)", background: "#fff" }}
                  />
                </div>
              </div>
            </div>

            {/* Informed Consent Section */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1rem", borderRadius: "10px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#166534", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
                <span>📜 {t("consentTitle", lang)}</span>
                <span style={{ fontSize: "0.75rem", color: "#15803d" }}>v{profile.consentVersion || 1}.0</span>
              </div>
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.825rem", color: "#166534", lineHeight: 1.5 }}>
                {profile.consentText || "I acknowledge that this session is confidential under Indian privacy laws."}
              </p>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.85rem", color: "#14532d", fontWeight: 600, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  required
                  checked={!!formData.consentAccepted}
                  onChange={(e) => setFormData({ ...formData, consentAccepted: e.target.checked })}
                  style={{ marginTop: "0.15rem" }}
                />
                <span>{t("iAgreeConsent", lang)} *</span>
              </label>
            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              {!requiredForBooking && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "transparent", cursor: "pointer", fontWeight: 500 }}
                >
                  {t("cancel", lang)}
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.65rem 1.75rem",
                  borderRadius: "8px",
                  background: "var(--brand-primary, #1a3a8f)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? t("loading", lang) : t("save", lang)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
