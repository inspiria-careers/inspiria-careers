"use client";
import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import CircularProgressLoader from "@/components/CircularProgressLoader";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const { signInWithEmail, signInWithGoogle, role, user, loading: authLoading } = useAuth();
  const { profile, lang } = useSite();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Guard against Open Redirects and Role Mismatch bounce loops
  const sanitizeRedirect = (path: string | null, userRole?: string | null): string => {
    const targetRole = userRole || role || "client";
    const defaultDash =
      targetRole === "admin"
        ? "/dashboard/admin"
        : targetRole === "counsellor"
        ? "/dashboard/counsellor"
        : "/dashboard/client";

    if (!path) return defaultDash;

    // Must be a relative path, must not be protocol-relative (//), must not include colon/javascript
    const trimmed = path.trim();
    if (
      !trimmed.startsWith("/") ||
      trimmed.startsWith("//") ||
      trimmed.includes("://") ||
      trimmed.toLowerCase().startsWith("javascript:")
    ) {
      return defaultDash;
    }

    // Role check for dashboard paths to prevent infinite bounce loops
    if (trimmed.startsWith("/dashboard/admin") && targetRole !== "admin") {
      return defaultDash;
    }
    if (
      trimmed.startsWith("/dashboard/counsellor") &&
      targetRole !== "counsellor" &&
      targetRole !== "admin"
    ) {
      return defaultDash;
    }

    return trimmed;
  };

  // Handle post-login redirection
  const handleRedirect = (userRole?: string | null) => {
    const safeTarget = sanitizeRedirect(redirectPath, userRole);
    router.push(safeTarget);
  };

  // If already authenticated, redirect to appropriate destination
  useEffect(() => {
    if (!authLoading && user) {
      handleRedirect(role);
    }
  }, [authLoading, user, role]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg(lang === "hi" ? "कृपया ईमेल और पासवर्ड दोनों दर्ज करें।" : "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await signInWithEmail(email, password);
      // Wait a moment for onAuthStateChanged and cookie sync
      setTimeout(() => {
        handleRedirect();
      }, 500);
    } catch (err: any) {
      console.error("Login error:", err);
      let msg = lang === "hi" ? "लॉगिन विफल रहा। कृपया विवरण जांचें।" : "Invalid email or password.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = lang === "hi" ? "ईमेल या पासवर्ड गलत है।" : "Invalid email or password. Please verify your credentials.";
      } else if (err.code === "auth/too-many-requests") {
        msg = lang === "hi" ? "बहुत अधिक असफल प्रयास। कृपया कुछ समय बाद प्रयास करें।" : "Too many attempts. Please try again later.";
      }
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      await signInWithGoogle();
      setTimeout(() => {
        handleRedirect();
      }, 500);
    } catch (err: any) {
      console.error("Google login error:", err);
      setErrorMsg(lang === "hi" ? "गूगल साइन-इन विफल रहा।" : "Google sign-in was cancelled or failed.");
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "85vh", padding: "2rem 1rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "2.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-block", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--brand-primary)" }}>
              {profile.siteName || "Inspiria Careers"}
            </span>
          </Link>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", marginBottom: "0.4rem" }}>
            {lang === "hi" ? "पोर्टल में लॉगिन करें" : "Sign In to Your Account"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            {lang === "hi" ? "अपने खाते में सुरक्षित रूप से प्रवेश करें" : "Access your appointments, guidance, and dashboard"}
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: "1.25rem", fontSize: "0.85rem" }}>
            {errorMsg}
          </div>
        )}

        {/* Google One-Click Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
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
          {lang === "hi" ? "Google के साथ लॉगिन करें" : "Continue with Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--text-light)", textTransform: "uppercase" }}>
            {lang === "hi" ? "या ईमेल से" : "or with email"}
          </span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
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

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">{lang === "hi" ? "पासवर्ड" : "Password"}</label>
              <Link href="/forgot-password" style={{ fontSize: "0.78rem", color: "var(--brand-primary)" }}>
                {lang === "hi" ? "पासवर्ड भूल गए?" : "Forgot Password?"}
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingRight: "2.5rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? t("loading", lang) : `🔑 ${t("login", lang)}`}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {lang === "hi" ? "नया खाता बनाना चाहते हैं? " : "Don't have an account? "}
          <Link href="/signup" style={{ color: "var(--brand-primary)", fontWeight: 700 }}>
            {t("signup", lang)}
          </Link>
        </div>
      </div>

      {loading && (
        <CircularProgressLoader
          isModal={true}
          size={116}
          durationMs={1800}
          title={lang === "hi" ? "लॉगिन किया जा रहा है..." : "Signing You In..."}
          subtitle={
            lang === "hi"
              ? "क्रेडेंशियल्स सत्यापित हो रहे हैं..."
              : "Verifying credentials & preparing your dashboard..."
          }
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <CircularProgressLoader size={106} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

