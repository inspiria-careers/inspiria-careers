"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export default function SignupPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { profile, lang } = useSite();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg(lang === "hi" ? "कृपया अपना नाम दर्ज करें।" : "Please enter your name.");
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg(lang === "hi" ? "कृपया ईमेल और पासवर्ड दर्ज करें।" : "Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg(lang === "hi" ? "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।" : "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(lang === "hi" ? "पासवर्ड मेल नहीं खाते हैं।" : "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await signUpWithEmail(email, password, name);
      setTimeout(() => {
        router.push("/dashboard/client");
      }, 500);
    } catch (err: any) {
      console.error("Signup error:", err);
      let msg = lang === "hi" ? "साइन अप विफल रहा।" : "Sign up failed. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        msg = lang === "hi" ? "यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।" : "Email is already registered. Please log in.";
      } else if (err.code === "auth/invalid-email") {
        msg = lang === "hi" ? "अमान्य ईमेल प्रारूप।" : "Invalid email address.";
      }
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      await signInWithGoogle();
      setTimeout(() => {
        router.push("/dashboard/client");
      }, 500);
    } catch (err: any) {
      console.error("Google signup error:", err);
      setErrorMsg(lang === "hi" ? "गूगल साइन अप विफल रहा।" : "Google sign-up failed or was cancelled.");
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "85vh", padding: "2rem 1rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "460px", padding: "2.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-block", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--brand-primary)" }}>
              {profile.siteName || "Inspiria Careers"}
            </span>
          </Link>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", marginBottom: "0.4rem" }}>
            {lang === "hi" ? "नया खाता बनाएं" : "Create Your Account"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {lang === "hi" ? "परामर्श सत्र बुक करें और अपनी प्रगति ट्रैक करें" : "Book guidance sessions and manage your profile"}
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: "1.25rem", fontSize: "0.85rem" }}>
            {errorMsg}
          </div>
        )}

        {/* Google Signup */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="btn btn-ghost btn-full"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            fontWeight: 600,
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          {lang === "hi" ? "Google के साथ साइन अप करें" : "Sign up with Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>
            {lang === "hi" ? "या ईमेल द्वारा" : "or with email"}
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        <form onSubmit={handleEmailSignup} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
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

          <div className="form-group">
            <label className="form-label">{t("email", lang)} *</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{lang === "hi" ? "पासवर्ड (कम से कम 6 अक्षर)" : "Password (min 6 characters)"} *</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingRight: "2.5rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  fontSize: "1rem",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{lang === "hi" ? "पासवर्ड की पुष्टि करें" : "Confirm Password"} *</label>
            <input
              type={showPassword ? "text" : "password"}
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? t("loading", lang) : `✨ ${t("signup", lang)}`}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {lang === "hi" ? "पहले से खाता है? " : "Already have an account? "}
          <Link href="/login" style={{ color: "var(--brand-primary)", fontWeight: 700 }}>
            {t("login", lang)}
          </Link>
        </div>
      </div>
    </div>
  );
}
