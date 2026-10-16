"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";

function LoginForm() {
  const searchParams = useSearchParams();
  const initialPortal = searchParams.get("portal");
  const { settings } = useSite();

  // Portal mode: "candidate" (Student/Parent) or "staff" (Principal / Admin)
  const [portalMode, setPortalMode] = useState<"candidate" | "staff">(
    initialPortal === "admin" || initialPortal === "principal" || initialPortal === "staff"
      ? "staff"
      : "candidate"
  );

  // Staff Portal States
  const [staffRole, setStaffRole] = useState<"principal" | "admin">(
    initialPortal === "admin" ? "admin" : "principal"
  );
  const [staffPasscode, setStaffPasscode] = useState("");
  const [showStaffPasscode, setShowStaffPasscode] = useState(false);
  const [showStaffForgotModal, setShowStaffForgotModal] = useState(false);

  // Candidate Portal States
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Candidate Forgot Password States
  const [showCandidateForgot, setShowCandidateForgot] = useState(false);
  const [candidateForgotEmail, setCandidateForgotEmail] = useState("");
  const [candidateForgotLoading, setCandidateForgotLoading] = useState(false);
  const [candidateForgotMsg, setCandidateForgotMsg] = useState("");
  const [candidateForgotErr, setCandidateForgotErr] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loginWithStaffPasscode, sendCandidatePasswordReset } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialPortal === "admin") {
      setPortalMode("staff");
      setStaffRole("admin");
    } else if (initialPortal === "principal") {
      setPortalMode("staff");
      setStaffRole("principal");
    }
  }, [initialPortal]);

  // Handle Staff (Principal / Admin) Password Submission
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!staffPasscode) {
      setError("Please enter the Security Password to continue.");
      return;
    }

    try {
      setLoading(true);
      const res = await loginWithStaffPasscode(staffRole, staffPasscode);

      if (res.success) {
        setSuccess(
          `✓ Access Verified! Welcome, ${
            staffRole === "principal" ? "Principal Ma'am" : "Master Administrator"
          }. Redirecting to dashboard...`
        );
        setTimeout(() => {
          if (staffRole === "principal") {
            router.push("/dashboard");
          } else {
            router.push("/admin");
          }
        }, 500);
      } else {
        setError(res.error || "Incorrect Security Password. Access Denied.");
      }
    } catch {
      setError("An unexpected error occurred while verifying credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Candidate Google Login
  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError("");
      await signInWithGoogle();
      router.push("/posts");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Google login failed.";
      if (msg.includes("popup-closed-by-user")) {
        setError("Sign-in popup was closed before completion. Please try again.");
      } else if (msg.includes("unauthorized-domain") || msg.includes("auth/configuration-not-found")) {
        setError("Google authentication notice: Please ensure your production domain is authorized in Firebase Console, or sign in directly with Email & Password below.");
      } else {
        setError(`${msg} (You can also sign in directly using email and password below).`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Candidate Email/Password Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      if (tab === "login") {
        await signInWithEmail(email, password);
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail.includes("admin")) {
          router.push("/admin");
        } else if (cleanEmail.includes("principal")) {
          router.push("/dashboard");
        } else {
          router.push("/posts");
        }
      } else {
        if (!name) {
          setError("Please enter your full name.");
          return;
        }
        await signUpWithEmail(email, password, name);
        setSuccess("Account created successfully! Please sign in with your credentials.");
        setTab("login");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Authentication failed.";
      if (
        msg.includes("user-not-found") ||
        msg.includes("wrong-password") ||
        msg.includes("invalid-credential")
      ) {
        setError("Invalid email or password. Please verify your credentials or click 'Forgot Password?'.");
      } else if (msg.includes("email-already-in-use")) {
        setError("This email is already registered. Please login.");
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Candidate Forgot Password Submission
  const handleCandidateForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCandidateForgotMsg("");
    setCandidateForgotErr("");

    if (!candidateForgotEmail) {
      setCandidateForgotErr("Please enter your registered email address.");
      return;
    }

    try {
      setCandidateForgotLoading(true);
      await sendCandidatePasswordReset(candidateForgotEmail);
      setCandidateForgotMsg("✅ A secure password reset link has been dispatched to your email! Please check your inbox and spam folder.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset link.";
      if (msg.includes("user-not-found")) {
        setCandidateForgotErr("No candidate account found with this email address.");
      } else {
        setCandidateForgotErr(msg);
      }
    } finally {
      setCandidateForgotLoading(false);
    }
  };

  const whatsappLink = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello Inspiria Careers, I need assistance with password recovery.")}`
    : `https://wa.me/919876543210?text=${encodeURIComponent("Hello Inspiria Careers, I need assistance with password recovery.")}`;

  return (
    <div className="auth-page" style={{ paddingTop: "6.5rem", paddingBottom: "4rem", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: "1rem", paddingRight: "1rem" }}>
      <div className="hero-orb hero-orb-1" style={{ opacity: 0.4 }} />
      <div className="hero-orb hero-orb-2" style={{ opacity: 0.25 }} />

      <div
        className="auth-card card animate-in"
        style={{
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          background: "#ffffff",
          color: "#0f172a",
          borderRadius: 16,
          boxShadow: "0 20px 45px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)",
          padding: "2rem 1.75rem",
        }}
      >
        {/* Logo and Header */}
        <div className="auth-logo" style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <Image
            src="/logo.jpg"
            alt="Inspiria Careers Logo"
            width={72}
            height={72}
            style={{ borderRadius: 14, margin: "0 auto 0.75rem", border: "2px solid #b8860b", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
          <h1 className="auth-title" style={{ fontSize: "1.65rem", fontFamily: "Playfair Display, serif", color: "#002147", fontWeight: 700, margin: "0 0 0.35rem 0" }}>
            Inspiria Careers Portal
          </h1>
          <p className="auth-subtitle" style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
            {portalMode === "staff"
              ? "🔒 Counselor & Administration Authentication"
              : "Sign in to access personalized counseling & guidance"}
          </p>
        </div>

        {/* Primary Portal Selector: Candidate vs Staff (High-Contrast Buttons) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            background: "#f1f5f9",
            padding: "5px",
            borderRadius: 10,
            marginBottom: "1.25rem",
            border: "1px solid #e2e8f0",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setPortalMode("candidate");
              setError("");
              setSuccess("");
            }}
            style={{
              padding: "0.7rem 0.5rem",
              borderRadius: 8,
              border: portalMode === "candidate" ? "1px solid #002147" : "1px solid transparent",
              background: portalMode === "candidate" ? "#002147" : "transparent",
              color: portalMode === "candidate" ? "#ffffff" : "#334155",
              fontWeight: portalMode === "candidate" ? 700 : 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              boxShadow: portalMode === "candidate" ? "0 2px 8px rgba(0,33,71,0.25)" : "none",
            }}
          >
            <span>🎓</span> Candidate Portal
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalMode("staff");
              setError("");
              setSuccess("");
            }}
            style={{
              padding: "0.7rem 0.5rem",
              borderRadius: 8,
              border: portalMode === "staff" ? "1px solid #b8860b" : "1px solid transparent",
              background: portalMode === "staff" ? "#b8860b" : "transparent",
              color: portalMode === "staff" ? "#ffffff" : "#334155",
              fontWeight: portalMode === "staff" ? 700 : 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              boxShadow: portalMode === "staff" ? "0 2px 8px rgba(184,134,11,0.25)" : "none",
            }}
          >
            <span>🛡️</span> Staff / Admin
          </button>
        </div>

        {/* Global Error & Success Banners */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #f87171",
              borderRadius: 8,
              padding: "0.75rem 0.9rem",
              color: "#b91c1c",
              fontSize: "0.85rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: "1rem" }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #4ade80",
              borderRadius: 8,
              padding: "0.75rem 0.9rem",
              color: "#15803d",
              fontSize: "0.85rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: "1rem" }}>✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* ── SECTION 1: RESTRICTED STAFF & ADMIN PORTAL ── */}
        {portalMode === "staff" ? (
          <form onSubmit={handleStaffSubmit}>
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "1.15rem",
                marginBottom: "1.25rem",
              }}
            >
              {/* Role Picker Buttons */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#002147",
                    marginBottom: "0.45rem",
                  }}
                >
                  Select Staff Access Role:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffRole("principal");
                      setError("");
                    }}
                    style={{
                      padding: "0.65rem 0.4rem",
                      borderRadius: 8,
                      border: staffRole === "principal" ? "2px solid #b8860b" : "1px solid #cbd5e1",
                      background: staffRole === "principal" ? "#fffbeb" : "#ffffff",
                      color: staffRole === "principal" ? "#92400e" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.84rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    👩‍🏫 Principal Ma&apos;am
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffRole("admin");
                      setError("");
                    }}
                    style={{
                      padding: "0.65rem 0.4rem",
                      borderRadius: 8,
                      border: staffRole === "admin" ? "2px solid #009ea9" : "1px solid #cbd5e1",
                      background: staffRole === "admin" ? "#f0fdfa" : "#ffffff",
                      color: staffRole === "admin" ? "#0f766e" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.84rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    🛡️ Master Admin
                  </button>
                </div>
              </div>

              {/* Password Input with Visibility Toggle */}
              <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                <label
                  style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}
                >
                  🔑 {staffRole === "principal" ? "Principal" : "Administrator"} Security Password:
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showStaffPasscode ? "text" : "password"}
                    placeholder={`Enter ${staffRole === "principal" ? "Principal" : "Admin"} password`}
                    value={staffPasscode}
                    onChange={(e) => setStaffPasscode(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 2.5rem 0.75rem 0.85rem",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.95rem",
                      color: "#0f172a",
                      background: "#ffffff",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPasscode(!showStaffPasscode)}
                    style={{
                      position: "absolute",
                      right: "0.65rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      padding: "4px",
                    }}
                    title={showStaffPasscode ? "Hide password" : "Show password"}
                  >
                    {showStaffPasscode ? "👁️" : "🔒"}
                  </button>
                </div>
              </div>

              {/* Forgot Security Password Link */}
              <div style={{ textAlign: "right", marginTop: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => setShowStaffForgotModal(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#009ea9",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontWeight: 600,
                  }}
                >
                  Forgot Security Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.85rem",
                fontSize: "0.95rem",
                fontWeight: 700,
                borderRadius: 8,
                border: "none",
                background: staffRole === "principal" ? "#b8860b" : "#009ea9",
                color: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? "Verifying Credentials..." : `Unlock & Enter ${staffRole === "principal" ? "Principal" : "Admin"} Dashboard →`}
            </button>
          </form>
        ) : (
          /* ── SECTION 2: CANDIDATE / STUDENT / PARENT PORTAL ── */
          <>
            {/* Candidate Sub-Tab: Login vs Sign Up */}
            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                borderRadius: 8,
                padding: 3,
                marginBottom: "1.25rem",
                border: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setShowCandidateForgot(false);
                }}
                style={{
                  flex: 1,
                  padding: "0.55rem",
                  borderRadius: 6,
                  border: "none",
                  background: tab === "login" && !showCandidateForgot ? "#002147" : "transparent",
                  color: tab === "login" && !showCandidateForgot ? "#ffffff" : "#475569",
                  fontWeight: tab === "login" && !showCandidateForgot ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("signup");
                  setShowCandidateForgot(false);
                }}
                style={{
                  flex: 1,
                  padding: "0.55rem",
                  borderRadius: 6,
                  border: "none",
                  background: tab === "signup" && !showCandidateForgot ? "#002147" : "transparent",
                  color: tab === "signup" && !showCandidateForgot ? "#ffffff" : "#475569",
                  fontWeight: tab === "signup" && !showCandidateForgot ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Create Account
              </button>
            </div>

            {/* Candidate Forgot Password Form */}
            {showCandidateForgot ? (
              <form onSubmit={handleCandidateForgotSubmit} style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1rem", color: "#002147", fontWeight: 700 }}>
                  Reset Candidate Password
                </h3>
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>
                  Enter your registered email address. We will send you an official secure link to choose a new password.
                </p>

                {candidateForgotErr && (
                  <div style={{ background: "#fef2f2", border: "1px solid #f87171", borderRadius: 6, padding: "0.5rem 0.75rem", color: "#b91c1c", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                    ⚠️ {candidateForgotErr}
                  </div>
                )}
                {candidateForgotMsg && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #4ade80", borderRadius: 6, padding: "0.5rem 0.75rem", color: "#15803d", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                    {candidateForgotMsg}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={candidateForgotEmail}
                    onChange={(e) => setCandidateForgotEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.75rem",
                      borderRadius: 6,
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.9rem",
                      color: "#0f172a",
                      background: "#ffffff",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="submit"
                    disabled={candidateForgotLoading}
                    style={{
                      flex: 1,
                      padding: "0.65rem",
                      borderRadius: 6,
                      border: "none",
                      background: "#009ea9",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    {candidateForgotLoading ? "Sending Link..." : "Send Reset Link ✉️"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCandidateForgot(false);
                      setCandidateForgotMsg("");
                      setCandidateForgotErr("");
                    }}
                    style={{
                      padding: "0.65rem 1rem",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    background: "#ffffff",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: 8,
                    color: "#1e293b",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    transition: "all 0.2s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    marginBottom: "1rem",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {loading ? "Connecting Google..." : "Continue with Google"}
                </button>

                <div style={{ display: "flex", alignItems: "center", margin: "1rem 0", gap: "0.5rem" }}>
                  <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                  <span style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: 500 }}>
                    or continue with email credentials
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                </div>

                <form onSubmit={handleSubmit}>
                  {tab === "signup" && (
                    <div className="form-group" style={{ marginBottom: "0.85rem" }}>
                      <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Priya Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.7rem 0.85rem",
                          borderRadius: 8,
                          border: "1.5px solid #cbd5e1",
                          fontSize: "0.9rem",
                          color: "#0f172a",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                  )}
                  <div className="form-group" style={{ marginBottom: "0.85rem" }}>
                    <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.7rem 0.85rem",
                        borderRadius: 8,
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.9rem",
                        color: "#0f172a",
                        background: "#ffffff",
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>
                        Password
                      </label>
                      {tab === "login" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCandidateForgot(true);
                            setCandidateForgotEmail(email);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#009ea9",
                            fontSize: "0.78rem",
                            cursor: "pointer",
                            textDecoration: "underline",
                            fontWeight: 600,
                          }}
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder={tab === "signup" ? "Min. 6 characters" : "Your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.7rem 0.85rem",
                        borderRadius: 8,
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.9rem",
                        color: "#0f172a",
                        background: "#ffffff",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "0.85rem",
                      marginTop: "1rem",
                      borderRadius: 8,
                      border: "none",
                      background: "#002147",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.92rem",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0,33,71,0.2)",
                    }}
                  >
                    {loading ? "Please wait..." : tab === "login" ? "Login to Inspiria Careers" : "Create My Account"}
                  </button>
                </form>
              </>
            )}
          </>
        )}

        {/* Footer Links */}
        <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.78rem", marginTop: "1.5rem", marginBottom: 0 }}>
          By continuing, you agree to our{" "}
          <Link href="/about" style={{ color: "#009ea9", textDecoration: "underline" }}>
            Terms &amp; Guidelines
          </Link>{" "}
          and{" "}
          <Link href="/contact" style={{ color: "#009ea9", textDecoration: "underline" }}>
            Advisory Support
          </Link>
        </p>
      </div>

      {/* ── MODAL: STAFF PASSWORD RECOVERY HELP ── */}
      {showStaffForgotModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setShowStaffForgotModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              color: "#0f172a",
              borderRadius: 14,
              maxWidth: "460px",
              width: "100%",
              padding: "1.75rem",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🔐</span>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#002147" }}>
                Staff Security Password Recovery
              </h3>
            </div>
            <p style={{ color: "#475569", fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
              Staff access credentials are strictly managed for institutional security:
            </p>

            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "0.85rem", marginBottom: "1rem" }}>
              <strong style={{ color: "#92400e", display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>
                👩‍🏫 For Principal Ma&apos;am:
              </strong>
              <p style={{ color: "#78350f", fontSize: "0.82rem", margin: 0 }}>
                Your password can be reset anytime by the Master Administrator inside the Admin Panel (under <em>Settings → Security &amp; Passwords</em>). Please contact the Master Admin or counseling cell.
              </p>
            </div>

            <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 8, padding: "0.85rem", marginBottom: "1.25rem" }}>
              <strong style={{ color: "#0f766e", display: "block", marginBottom: "0.25rem", fontSize: "0.85rem" }}>
                🛡️ For Master Administrator:
              </strong>
              <p style={{ color: "#115e59", fontSize: "0.82rem", margin: 0 }}>
                The Master Admin password can be changed inside the Admin Panel, or updated in your hosting dashboard via Vercel Environment Variable (<code>NEXT_PUBLIC_ADMIN_PASSWORD</code>).
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.35rem",
                  padding: "0.65rem 1rem",
                  borderRadius: 6,
                  background: "#22c55e",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              >
                💬 WhatsApp Support
              </a>
              <button
                type="button"
                onClick={() => setShowStaffForgotModal(false)}
                style={{
                  padding: "0.65rem 1.25rem",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#f1f5f9",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#009ea9", fontWeight: 600 }}>
          Loading Inspiria Careers Portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
