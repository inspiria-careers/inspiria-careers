"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/services", label: "services" },
  { href: "/posts", label: "articles" },
  { href: "/reviews", label: "reviews" },
  { href: "/gallery", label: "gallery" },
  { href: "/contact", label: "contact" },
];

function getDashHref(role: string | null) {
  if (role === "admin") return "/dashboard/admin";
  if (role === "counsellor") return "/dashboard/counsellor";
  if (role === "client") return "/dashboard/client";
  return null;
}

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const { profile, lang, setLang } = useSite();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const dashHref = getDashHref(role);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <Link href="/" className="navbar-brand" aria-label={profile.siteName || "Home"}>
        {profile.siteLogo ? (
          <img src={profile.siteLogo} alt="Logo" className="navbar-logo" />
        ) : (
          <div className="navbar-logo" style={{ background: "var(--brand-primary)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:"1.3rem" }}>
            {(profile.siteName || "I").charAt(0)}
          </div>
        )}
        <div>
          <div className="navbar-name">{profile.siteName || "Inspiria Careers"}</div>
          {profile.tagline && <div className="navbar-tagline">{profile.tagline}</div>}
        </div>
      </Link>

      {/* Desktop nav */}
      <div className={`navbar-links${open ? " open" : ""}`} role="menubar">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`navbar-link${pathname === href ? " active" : ""}`}
            role="menuitem"
          >
            {t(label, lang)}
          </Link>
        ))}

        {dashHref && (
          <Link href={dashHref} className={`navbar-link${pathname.startsWith("/dashboard") ? " active" : ""}`} role="menuitem">
            {t("dashboard", lang)}
          </Link>
        )}
      </div>

      {/* Actions */}
      <div className="navbar-actions">
        {/* Lang toggle */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setLang(lang === "en" ? "hi" : "en")}
          aria-label="Toggle language"
          title="Toggle language"
        >
          {t("switchToHindi", lang)}
        </button>

        {user ? (
          <button className="btn btn-outline btn-sm" onClick={logout} aria-label="Logout">
            {t("logout", lang)}
          </button>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm" id="nav-login-btn">
            {t("login", lang)}
          </Link>
        )}

        <button
          className="hamburger"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
    </nav>
  );
}
