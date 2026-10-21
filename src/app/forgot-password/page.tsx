"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import CircularProgressLoader from "@/components/CircularProgressLoader";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const { profile, lang } = useSite();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg(lang === "hi" ? "कृपया अपना ईमेल दर्ज करें।" : "Please enter your registered email address.");
      return;
    }

    try {
      setStatus("submitting");
      setErrorMsg("");
      await sendPasswordReset(email);
      setStatus("success");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setStatus("error");
      let msg = lang === "hi" ? "पासवर्ड रीसेट लिंक भेजने में त्रुटि हुई।" : "Failed to send reset link. Please check the email address.";
      if (err.code === "auth/user-not-found") {
        msg = lang === "hi" ? "इस ईमेल से कोई खाता नहीं मिला।" : "No account found with this email.";
      }
      setErrorMsg(msg);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "2rem 1rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "2.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-block", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--brand-primary)" }}>
              {profile.siteName || "Inspiria Careers"}
            </span>
          </Link>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", marginBottom: "0.4rem" }}>
            {lang === "hi" ? "पासवर्ड रीसेट करें" : "Reset Your Password"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {lang === "hi"
              ? "अपना पंजीकृत ईमेल दर्ज करें। हम आपको पासवर्ड रीसेट करने का लिंक भेजेंगे।"
              : "Enter your registered email and we'll send you a secure link to reset your password."}
          </p>
        </div>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📩</div>
            <div className="alert alert-success" style={{ marginBottom: "1.5rem", fontSize: "0.88rem" }}>
              {lang === "hi"
                ? `पासवर्ड रीसेट लिंक ${email} पर भेज दिया गया है। कृपया अपना इनबॉक्स (और स्पैम फ़ोल्डर) जांचें।`
                : `Password reset link sent to ${email}. Please check your inbox and spam folder.`}
            </div>
            <Link href="/login" className="btn btn-primary btn-full">
              ← {lang === "hi" ? "लॉगिन पेज पर वापस जाएं" : "Return to Sign In"}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {errorMsg && <div className="alert alert-error" style={{ fontSize: "0.85rem" }}>{errorMsg}</div>}

            <div className="form-group">
              <label className="form-label">{t("email", lang)}</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? t("loading", lang) : (lang === "hi" ? "रीसेट लिंक भेजें" : "Send Reset Link")}
            </button>

            <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <Link href="/login" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                ← {lang === "hi" ? "लॉगिन पर वापस जाएं" : "Back to Sign In"}
              </Link>
            </div>
          </form>
        )}
      </div>

      {status === "submitting" && (
        <CircularProgressLoader
          isModal={true}
          size={116}
          title={lang === "hi" ? "पासवर्ड रीसेट लिंक भेजा जा रहा है" : "Sending Password Reset Link"}
          subtitle={
            lang === "hi"
              ? "पंजीकृत ईमेल सत्यापित किया जा रहा है..."
              : "Verifying account credentials & dispatching reset email..."
          }
        />
      )}
    </div>
  );
}
