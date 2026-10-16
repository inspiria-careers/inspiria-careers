"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

function LoginForm() {
  const searchParams = useSearchParams();
  const initialPortal = searchParams.get("portal");

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

  // Candidate Portal States
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loginWithStaffPasscode } = useAuth();
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

    setLoading(true);
    const res = loginWithStaffPasscode(staffRole, staffPasscode);

    if (res.success) {
      setSuccess(
        `✓ Access Verified! Welcome, ${
          staffRole === "principal" ? "Principal Ma'am" : "Master Administrator"
        }. Redirecting...`
      );
      setTimeout(() => {
        if (staffRole === "principal") {
          router.push("/dashboard");
        } else {
          router.push("/admin");
        }
      }, 600);
    } else {
      setError(res.error || "Incorrect Security Password. Access Denied.");
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
      setError(
        e instanceof Error
          ? e.message
          : "Google login failed. Please try again or use email sign in."
      );
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
        // If staff email was used, redirect appropriately
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
        setError("Invalid email or password. Please verify your credentials.");
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

  return (
    <div className="auth-page" style={{ paddingTop: "7rem", paddingBottom: "4rem" }}>
      <div className="hero-orb hero-orb-1" style={{ opacity: 0.5 }} />
      <div className="hero-orb hero-orb-2" style={{ opacity: 0.3 }} />

      <div className="auth-card card animate-in" style={{ maxWidth: "490px", margin: "0 auto" }}>
        {/* Logo and Header */}
        <div className="auth-logo" style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <Image
            src="/logo.jpg"
            alt="Inspiria Careers Logo"
            width={72}
            height={72}
            style={{ borderRadius: 16, margin: "0 auto 1rem", border: "2px solid var(--gold)" }}
          />
          <h1 className="auth-title" style={{ fontSize: "1.75rem", fontFamily: "Playfair Display, serif" }}>
            Inspiria Careers Portal
          </h1>
          <p className="auth-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            {portalMode === "staff"
              ? "🔒 Restricted Counselor & Administration Authentication"
              : "Sign in to access personalized career guidance & resources"}
          </p>
        </div>

        {/* Primary Portal Selector: Candidate vs Staff */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            background: "rgba(255,255,255,0.06)",
            padding: "4px",
            borderRadius: 12,
            marginBottom: "1.5rem",
            border: "1px solid rgba(255,255,255,0.1)",
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
              padding: "0.65rem 0.5rem",
              borderRadius: 8,
              border: "none",
              background: portalMode === "candidate" ? "var(--gold)" : "transparent",
              color: portalMode === "candidate" ? "#07122b" : "#ffffff",
              fontWeight: portalMode === "candidate" ? 700 : 500,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            🎓 Candidate / Student
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalMode("staff");
              setError("");
              setSuccess("");
            }}
            style={{
              padding: "0.65rem 0.5rem",
              borderRadius: 8,
              border: "none",
              background: portalMode === "staff" ? "var(--gold)" : "transparent",
              color: portalMode === "staff" ? "#07122b" : "#ffffff",
              fontWeight: portalMode === "staff" ? 700 : 500,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            🛡️ Staff / Admin Portal
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div
            style={{
              background: "rgba(231,76,60,0.15)",
              border: "1px solid rgba(231,76,60,0.4)",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              color: "#ff7675",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div
            style={{
              background: "rgba(46,204,113,0.15)",
              border: "1px solid rgba(46,204,113,0.4)",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              color: "#2ecc71",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* ── SECTION 1: RESTRICTED STAFF & ADMIN PORTAL ── */}
        {portalMode === "staff" ? (
          <form onSubmit={handleStaffSubmit}>
            <div
              style={{
                background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(14,31,69,0.5))",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: 12,
                padding: "1.25rem",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--gold)",
                    marginBottom: "0.5rem",
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
                      padding: "0.6rem 0.5rem",
                      borderRadius: 8,
                      border: staffRole === "principal" ? "2px solid var(--gold)" : "1px solid rgba(255,255,255,0.15)",
                      background: staffRole === "principal" ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.03)",
                      color: staffRole === "principal" ? "#ffdd59" : "#cbd5e1",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
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
                      padding: "0.6rem 0.5rem",
                      borderRadius: 8,
                      border: staffRole === "admin" ? "2px solid #009ea9" : "1px solid rgba(255,255,255,0.15)",
                      background: staffRole === "admin" ? "rgba(0,158,169,0.25)" : "rgba(255,255,255,0.03)",
                      color: staffRole === "admin" ? "#2dd4bf" : "#cbd5e1",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.3rem",
                    }}
                  >
                    🛡️ Master Admin
                  </button>
                </div>
              </div>

              {/* Password Input with Visibility Toggle */}
              <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                <label
                  className="form-label"
                  style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: 600 }}
                >
                  🔑 {staffRole === "principal" ? "Principal" : "Administrator"} Security Password:
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showStaffPasscode ? "text" : "password"}
                    className="form-input"
                    placeholder={`Enter ${staffRole === "principal" ? "Principal" : "Admin"} password`}
                    value={staffPasscode}
                    onChange={(e) => setStaffPasscode(e.target.value)}
                    required
                    style={{
                      paddingRight: "2.5rem",
                      width: "100%",
                      borderColor: "rgba(201,168,76,0.4)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPasscode(!showStaffPasscode)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "1rem",
                      padding: "4px",
                    }}
                    title={showStaffPasscode ? "Hide password" : "Show password"}
                  >
                    {showStaffPasscode ? "👁️" : "🔒"}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-gold w-full"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "0.85rem",
                fontSize: "0.95rem",
                fontWeight: 700,
              }}
              disabled={loading}
            >
              {loading ? "Verifying Credentials..." : `Unlock & Enter ${staffRole === "principal" ? "Principal" : "Admin"} Dashboard →`}
            </button>

            <div
              style={{
                marginTop: "1.25rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "0.75rem",
                fontSize: "0.78rem",
                color: "#94a3b8",
                lineHeight: "1.4",
              }}
            >
              🔒 <strong>Security Note:</strong> Direct 1-click access is permanently disabled for security. Passwords are controlled via your environment configuration (<code>.env.local</code> / Vercel). Default passwords: Admin (<code>Admin@Inspiria2025</code>), Principal (<code>Principal@Inspiria2025</code>).
            </div>
          </form>
        ) : (
          /* ── SECTION 2: CANDIDATE / STUDENT / PARENT PORTAL ── */
          <>
            {/* Tab Switcher: Login vs Sign Up */}
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 10,
                padding: 4,
                marginBottom: "1.25rem",
              }}
            >
              <button
                type="button"
                onClick={() => setTab("login")}
                className="btn"
                style={{
                  flex: 1,
                  background: tab === "login" ? "var(--gold)" : "transparent",
                  color: tab === "login" ? "#07122b" : "var(--text-muted)",
                  borderRadius: 8,
                  fontWeight: tab === "login" ? 700 : 500,
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className="btn"
                style={{
                  flex: 1,
                  background: tab === "signup" ? "var(--gold)" : "transparent",
                  color: tab === "signup" ? "#07122b" : "var(--text-muted)",
                  borderRadius: 8,
                  fontWeight: tab === "signup" ? 700 : 500,
                }}
              >
                Create Account
              </button>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              className="google-btn"
              onClick={handleGoogle}
              disabled={loading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s ease",
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
              {loading ? "Connecting..." : "Continue with Google"}
            </button>

            <div className="divider" style={{ margin: "1.25rem 0", textAlign: "center", position: "relative" }}>
              <span style={{ background: "#0c1b3a", padding: "0 0.75rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                or sign in with email credentials
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              {tab === "signup" && (
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem" }}>
                  Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder={tab === "signup" ? "Min. 6 characters" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                style={{ width: "100%", justifyContent: "center", padding: "0.85rem" }}
                disabled={loading}
              >
                {loading ? "Please wait..." : tab === "login" ? "Login to Inspiria Careers" : "Create My Account"}
              </button>
            </form>
          </>
        )}

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "1.5rem" }}>
          By continuing, you agree to our{" "}
          <Link href="#" style={{ color: "var(--gold)" }}>
            Terms of Service
          </Link>{" "}
          &amp;{" "}
          <Link href="#" style={{ color: "var(--gold)" }}>
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)" }}>
          Loading Inspiria Careers Portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
