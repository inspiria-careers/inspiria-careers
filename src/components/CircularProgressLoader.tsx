"use client";
import React, { useEffect, useState } from "react";
import { useSite } from "@/contexts/SiteContext";

export interface CircularProgressLoaderProps {
  /** If provided, sets a controlled percentage (0 to 100) */
  percentage?: number;
  /** Automatically animate percentage from 0 to 100 */
  autoAnimate?: boolean;
  /** Estimated duration in milliseconds for autoAnimate (default: 2600ms) */
  durationMs?: number;
  /** Size of circle in pixels (default: 110) */
  size?: number;
  /** Primary title message */
  title?: string;
  /** Subtitle message */
  subtitle?: string;
  /** Whether to render as a fullscreen modal overlay (default: false) */
  isModal?: boolean;
  /** Whether to show site logo or brand icon in center (default: true) */
  showLogo?: boolean;
  /** Callback fired when progress reaches 100% */
  onComplete?: () => void;
  className?: string;
}

export default function CircularProgressLoader({
  percentage,
  autoAnimate = true,
  durationMs = 2600,
  size = 114,
  title,
  subtitle,
  isModal = false,
  showLogo = true,
  onComplete,
  className = "",
}: CircularProgressLoaderProps) {
  const { profile, lang } = useSite();
  const [currentPercent, setCurrentPercent] = useState<number>(percentage ?? 0);

  // Synchronize controlled percentage
  useEffect(() => {
    if (typeof percentage === "number") {
      setCurrentPercent(Math.min(100, Math.max(0, percentage)));
    }
  }, [percentage]);

  // Handle smooth auto animation
  useEffect(() => {
    if (typeof percentage === "number" || !autoAnimate) return;

    setCurrentPercent(5);
    const intervalTime = 40;
    const totalSteps = durationMs / intervalTime;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      // Ease out curve: fast at start, slowing down near 95%
      const easedPercent = Math.min(
        98,
        Math.round(100 * (1 - Math.pow(1 - progress, 2.2)))
      );

      setCurrentPercent((prev) => {
        if (prev >= 98 && progress < 1) return prev;
        return Math.max(prev, easedPercent);
      });

      if (step >= totalSteps) {
        clearInterval(timer);
        setCurrentPercent(100);
        if (onComplete) onComplete();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [percentage, autoAnimate, durationMs, onComplete]);

  // Circle Geometry
  const strokeWidth = 7;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (currentPercent / 100) * circumference;

  // Dynamic progress stage label
  const getStageLabel = () => {
    if (subtitle) return subtitle;
    if (currentPercent < 30) {
      return lang === "hi"
        ? "विवरण सत्यापित हो रहा है..."
        : "Validating request details...";
    }
    if (currentPercent < 75) {
      return lang === "hi"
        ? "कैलेंडर स्लॉट आरक्षित किया जा रहा है..."
        : "Securing calendar appointment...";
    }
    if (currentPercent < 100) {
      return lang === "hi"
        ? "पुष्टिकरण तैयार किया जा रहा है..."
        : "Finalizing confirmation...";
    }
    return lang === "hi" ? "सफलतापूर्वक पूर्ण!" : "Successfully completed!";
  };

  const defaultTitle =
    title ||
    (lang === "hi"
      ? "कृपया प्रतीक्षा करें (Please Wait)"
      : "Processing Request...");

  const content = (
    <div
      className={`circular-progress-container ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: isModal ? "2.25rem 2rem" : "1.5rem 1rem",
        background: isModal ? "var(--surface)" : "transparent",
        borderRadius: isModal ? "var(--radius-lg)" : "0",
        boxShadow: isModal ? "var(--shadow-lg)" : "none",
        maxWidth: isModal ? "440px" : "100%",
        width: "100%",
        border: isModal ? "1px solid var(--border)" : "none",
      }}
      role="status"
      aria-live="polite"
    >
      {/* ── Circular SVG Progress Ring with Center Logo & Percent ── */}
      <div
        style={{
          position: "relative",
          width: `${size}px`,
          height: `${size}px`,
          marginBottom: "1.25rem",
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)", display: "block" }}
        >
          {/* Subtle Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            opacity={0.5}
          />
          {/* Active Gradient / Brand Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </svg>

        {/* Center Content: Site Logo + Percentage */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {showLogo && (
            <div style={{ marginBottom: "2px" }}>
              {profile.siteLogo ? (
                <img
                  src={profile.siteLogo}
                  alt={profile.siteLogoAlt || profile.siteName || "Logo"}
                  style={{
                    width: `${size * 0.34}px`,
                    height: `${size * 0.34}px`,
                    objectFit: "contain",
                    borderRadius: "50%",
                    border: "1px solid var(--border)",
                    background: "var(--bg-white, #fff)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: `${size * 0.34}px`,
                    height: `${size * 0.34}px`,
                    borderRadius: "50%",
                    background: "var(--brand-primary)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: `${size * 0.16}px`,
                    boxShadow: "0 2px 6px rgba(26,58,143,0.2)",
                  }}
                >
                  {(profile.siteName || "I").charAt(0)}
                </div>
              )}
            </div>
          )}

          {/* Completion Percentage */}
          <span
            style={{
              fontSize: `${size * 0.17}px`,
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            {Math.round(currentPercent)}%
          </span>
        </div>
      </div>

      {/* ── Status Text & Waiting Guidance ── */}
      <h3
        style={{
          fontSize: "1.12rem",
          fontWeight: 800,
          color: "var(--brand-primary)",
          marginBottom: "0.4rem",
          lineHeight: 1.4,
        }}
      >
        {defaultTitle}
      </h3>

      <p
        style={{
          fontSize: "0.88rem",
          color: "var(--text-muted)",
          marginBottom: "0.75rem",
          lineHeight: 1.5,
          fontWeight: 500,
        }}
      >
        {getStageLabel()}
      </p>

      {/* Reassurance Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.3rem 0.8rem",
          borderRadius: "20px",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
        }}
      >
        <span>⏳</span>
        <span>
          {lang === "hi"
            ? "कृपया पेज को बंद या रीफ्रेश न करें"
            : "Please do not close or refresh this page"}
        </span>
      </div>
    </div>
  );

  // If Modal mode requested, wrap in an accessible high-z-index backdrop
  if (isModal) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          padding: "1rem",
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
