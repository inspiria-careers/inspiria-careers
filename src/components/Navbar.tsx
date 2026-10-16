"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSite, defaultNavLinks } from "@/contexts/SiteContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fontSizeOffset, setFontSizeOffset] = useState(0);
  const [pathname, setPathname] = useState("");
  const { user, role, logout } = useAuth();
  const { settings } = useSite();

  useEffect(() => {
    setPathname(window.location.pathname);
    const onRouteChange = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onRouteChange);
    // Also poll after link clicks (Next.js doesn't fire popstate for pushState)
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== pathname) {
        setPathname(window.location.pathname);
      }
    });
    observer.observe(document, { subtree: true, childList: true });
    return () => {
      window.removeEventListener("popstate", onRouteChange);
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const getDashboardLink = () => {
    if (role === "admin") return "/admin";
    if (role === "principal") return "/dashboard";
    return null;
  };

  const adjustFontSize = (offset: number) => {
    setFontSizeOffset(offset);
    if (typeof document !== "undefined") {
      document.documentElement.style.fontSize = `${16 + offset * 1.5}px`;
    }
  };

  const links = settings.navLinks && settings.navLinks.length > 0 ? settings.navLinks : defaultNavLinks;

  return (
    <header style={{ position: "relative", zIndex: 1000, width: "100%" }}>
      {/* ── TIER 1: TOP GOVERNMENT / INSTITUTIONAL BAR ── */}
      <div className="top-gov-bar">
        <div className="top-gov-left">
          <span>{settings.topGovTextLeft || "GOVERNMENT ACCREDITED COUNSELING CELL | EDUCATIONAL & CAREER GUIDANCE DIVISION"}</span>
        </div>
        <div className="top-gov-right">
          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
            <button
              onClick={() => adjustFontSize(-1)}
              className="access-tool-btn"
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              onClick={() => adjustFontSize(0)}
              className="access-tool-btn"
              title="Standard Font Size"
            >
              A
            </button>
            <button
              onClick={() => adjustFontSize(1)}
              className="access-tool-btn"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <Link href="/contact" style={{ color: "#009ea9", textDecoration: "none", fontWeight: 700 }}>
            📞 Helpline: {settings.contactPhone}
          </Link>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <span style={{ fontWeight: 700, color: "#1e293b" }}>अ / A</span>
        </div>
      </div>

      {/* ── TIER 2: WHITE MAIN BRANDING BAR (MATCHES SCREENSHOT) ── */}
      <div className="header-brand-bar">
        {/* Left: e-Counselling Red Emblem & Subtitle */}
        <Link href="/" className="brand-emblem-left">
          <div className="emblem-square-red">
            {settings.siteLogo && (settings.siteLogo.startsWith("/") || settings.siteLogo.startsWith("http") || settings.siteLogo.startsWith("data:")) ? (
              <img
                src={settings.siteLogo}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }}
              />
            ) : (
              <span>{settings.siteLogo || "I"}</span>
            )}
          </div>
          <div className="brand-titles-left">
            <span className="brand-subtext">{settings.siteName.split(" ")[0]} Services</span>
            <span className="brand-main-title">{settings.divisionTitle ? `${settings.divisionTitle} Services` : "e-Counselling Services"}</span>
            <span className="brand-tagline-small">{settings.subtagline || "Simplifying The Admission Process"}</span>
          </div>
        </Link>

        {/* Center: e-Counselling Division Title */}
        <div className="center-division-heading">
          <h1>{settings.divisionTitle || "e-Counselling Division"}</h1>
        </div>

        {/* Right: National / Educational Accreditation Crest */}
        <div className="header-accreditation-right">
          <div className="crest-seal">🏛️</div>
          <div className="crest-details">
            <div className="crest-details-hi">{settings.accreditationSub || "राष्ट्रीय मार्गदर्शन प्रकोष्ठ"}</div>
            <div className="crest-details-en">{settings.accreditationTitle || "National Guidance Centre"}</div>
          </div>
        </div>
      </div>

      {/* ── TIER 3: NAVY BLUE NAVBAR WITH TEAL ACTIVE TAB ── */}
      <nav className="gov-navbar">
        <ul className="gov-nav-links">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.id || link.href} style={{ height: "100%" }}>
                <Link
                  href={link.href}
                  className={`gov-nav-link ${isActive ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="gov-nav-actions">
          {user ? (
            <>
              {getDashboardLink() && (
                <Link href={getDashboardLink()!} className="btn btn-teal btn-sm">
                  ⚙️ {role === "admin" ? "Admin Panel" : "Counselor Panel"}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-teal btn-sm">
              🔑 Candidate Login
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 4,
              color: "#ffffff",
              padding: "4px 8px",
              cursor: "pointer",
              display: "none",
            }}
            className="gov-mobile-hamburger"
            aria-label="Toggle Navigation"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            top: 140,
            background: "#002147",
            zIndex: 9999,
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            overflowY: "auto",
            maxHeight: "calc(100vh - 140px)",
          }}
        >
          {links.map((link) => (
            <Link
              key={link.id || link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                color: "#ffffff",
                padding: "0.75rem 1rem",
                borderRadius: 4,
                background: pathname === link.href ? "#009ea9" : "transparent",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              {getDashboardLink() && (
                <Link
                  href={getDashboardLink()!}
                  onClick={() => setMobileOpen(false)}
                  style={{ color: "#ffcc00", padding: "0.75rem", fontWeight: 700 }}
                >
                  ⚙️ Panel
                </Link>
              )}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="btn btn-ghost"
                style={{ textAlign: "left", color: "#ffffff" }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="btn btn-teal"
              style={{ textAlign: "center", marginTop: "1rem" }}
            >
              Candidate Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
