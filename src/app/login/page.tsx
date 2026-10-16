"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth, UserRole } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, demoLogin } = useAuth();
  const router = useRouter();

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError("");
      await signInWithGoogle();
      router.push("/posts");
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? `${e.message} (Note: To use Google Sign-In with your own domain, add Firebase credentials in .env.local, or use the 1-Click Demo buttons below!)`
          : "Google login failed. Please use Demo Access or configure Firebase."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = (targetRole: UserRole) => {
    demoLogin(targetRole);
    if (targetRole === "principal") {
      router.push("/dashboard");
    } else if (targetRole === "admin") {
      router.push("/admin");
    } else {
      router.push("/posts");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      setLoading(true);
      if (tab === "login") {
        await signInWithEmail(email, password);
        router.push("/posts");
      } else {
        if (!name) {
          setError("Please enter your name.");
          return;
        }
        await signUpWithEmail(email, password, name);
        setSuccess("Account created successfully! Please check your email for verification.");
        setTab("login");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Authentication failed.";
      if (
        msg.includes("user-not-found") ||
        msg.includes("wrong-password") ||
        msg.includes("invalid-credential")
      ) {
        setError("Invalid email or password.");
      } else if (msg.includes("email-already-in-use")) {
        setError("This email is already registered. Please login.");
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else {
        setError(msg + " — You can also use the 1-Click Quick Access buttons below!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ paddingTop: "7rem", paddingBottom: "4rem" }}>
      <div className="hero-orb hero-orb-1" style={{ opacity: 0.5 }} />
      <div className="hero-orb hero-orb-2" style={{ opacity: 0.3 }} />

      <div className="auth-card card animate-in" style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div className="auth-logo" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <Image
            src="/logo.jpg"
            alt="Inspiria Careers Logo"
            width={72}
            height={72}
            style={{ borderRadius: 16, margin: "0 auto 1rem", border: "2px solid var(--gold)" }}
          />
          <h1 className="auth-title" style={{ fontSize: "1.75rem", fontFamily: "Playfair Display, serif" }}>
            Welcome to Inspiria Careers
          </h1>
          <p className="auth-subtitle" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Sign in to access personalized counseling, exclusive articles &amp; resources
          </p>
        </div>

        {/* 1-Click Quick Access Demo Panel */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.12), rgba(14,31,69,0.5))",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: 12,
            padding: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--gold)",
              marginBottom: "0.6rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            ⚡ 1-Click Instant Access
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <button
              onClick={() => handleDemoAccess("principal")}
              className="btn btn-gold btn-sm"
              style={{ fontSize: "0.8rem", padding: "0.5rem 0.6rem", justifyContent: "center" }}
            >
              👩‍🏫 Principal Ma&apos;am
            </button>
            <button
              onClick={() => handleDemoAccess("admin")}
              className="btn btn-primary btn-sm"
              style={{ fontSize: "0.8rem", padding: "0.5rem 0.6rem", justifyContent: "center" }}
            >
              🛡️ Admin Panel
            </button>
          </div>
          <button
            onClick={() => handleDemoAccess("user")}
            className="btn btn-ghost btn-sm"
            style={{
              width: "100%",
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              justifyContent: "center",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            🎓 Continue as Student / Parent
          </button>
        </div>

        {/* Tab Switcher */}
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
            Login
          </button>
          <button
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
            Sign Up
          </button>
        </div>

        {/* Google Login */}
        <button
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
            or continue with email
          </span>
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
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              background: "rgba(46,204,113,0.15)",
              border: "1px solid rgba(46,204,113,0.3)",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              color: "#2ecc71",
              fontSize: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            {success}
          </div>
        )}

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
