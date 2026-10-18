"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import { CalendarIcon, SparklesIcon } from "@/components/Icons";

export interface ReviewItem {
  id: string;
  userId?: string | null;
  clientName: string;
  clientPhoto?: string | null;
  displayNameChoice?: "full" | "first_only" | "anonymous";
  rating: number;
  comment: string;
  approved: boolean;
  createdAt?: any;
}

function getInitials(name: string) {
  if (!name) return "S";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  "linear-gradient(135deg, #10b981 0%, #047857 100%)",
  "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)",
];

function getAvatarGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function ReviewerAvatar({
  review,
  size = 48,
  fontSize = "1rem",
}: {
  review: ReviewItem;
  size?: number;
  fontSize?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const isAnonymous = review.displayNameChoice === "anonymous";

  if (isAnonymous) {
    return (
      <div
        className="review-avatar"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
        }}
        title="Anonymous Client"
      >
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    );
  }

  if (review.clientPhoto && !imgError) {
    return (
      <img
        src={review.clientPhoto}
        alt={review.clientName || "Reviewer"}
        className="review-avatar"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        onError={() => setImgError(true)}
      />
    );
  }

  const initials = getInitials(review.clientName || "Student");
  const bg = getAvatarGradient(review.clientName || review.id || "Student");

  return (
    <div
      className="review-avatar"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: bg,
        fontSize,
      }}
    >
      {initials}
    </div>
  );
}

function RatingStars({ rating, size = 18 }: { rating: number; size?: number }) {
  const safeRating = Math.min(5, Math.max(1, rating || 5));
  return (
    <div
      style={{
        display: "inline-flex",
        gap: "3px",
        fontSize: `${size}px`,
        lineHeight: 1,
      }}
      aria-label={`${safeRating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= safeRating ? "#f59e0b" : "#cbd5e1" }}>
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(createdAt: any, lang: string) {
  if (!createdAt) return null;
  try {
    const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const { lang } = useSite();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  useEffect(() => {
    async function loadReviews() {
      try {
        const q = query(
          collection(db, "reviews"),
          where("approved", "==", true),
          limit(50)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReviewItem));

        list.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });

        setReviews(list);
      } catch (err) {
        console.error("Error loading reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, []);

  // Format client name by preference
  const formatName = (review: ReviewItem) => {
    if (review.displayNameChoice === "anonymous") {
      return lang === "hi" ? "सत्यापित छात्र / अभिभावक" : "Verified Student / Parent";
    }
    if (review.displayNameChoice === "first_only") {
      const parts = (review.clientName || "").trim().split(" ");
      return parts[0] || (lang === "hi" ? "छात्र" : "Student");
    }
    return review.clientName || (lang === "hi" ? "छात्र" : "Student");
  };

  // Auto-flash spotlight every 4.5 seconds if more than 1 review
  useEffect(() => {
    if (reviews.length <= 1 || isPaused) return;

    const intervalTime = 4500;
    const stepTime = 50;
    const increment = (stepTime / intervalTime) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((curr) => (curr + 1) % reviews.length);
          return 0;
        }
        return prev + increment;
      });
    }, stepTime);

    return () => clearInterval(interval);
  }, [reviews.length, isPaused]);

  const handleSelectIndex = (idx: number) => {
    setActiveIndex(idx);
    setProgress(0);
  };

  const handlePrev = () => {
    setActiveIndex((curr) => (curr - 1 + reviews.length) % reviews.length);
    setProgress(0);
  };

  const handleNext = () => {
    setActiveIndex((curr) => (curr + 1) % reviews.length);
    setProgress(0);
  };

  // Average rating
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length
        ).toFixed(1)
      : null;

  const filteredReviews = filterRating
    ? reviews.filter((r) => (r.rating || 5) >= filterRating)
    : reviews;

  const activeReview = reviews[activeIndex];

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: "1080px" }}>
          {/* Header */}
          <div className="section-header">
            <span className="section-tag">{t("reviews", lang)}</span>
            <h1 className="section-title">
              {lang === "hi" ? (
                <>छात्रों एवं अभिभावकों के <span>वास्तविक अनुभव</span></>
              ) : (
                <>Student & Parent <span>Reviews</span></>
              )}
            </h1>
            <p className="section-subtitle">
              {lang === "hi"
                ? "हमारे प्रमाणित परामर्शदाता से मार्गदर्शन प्राप्त करने वाले छात्रों की सच्ची समीक्षाएं।"
                : "Real feedback from students and parents guided by our educational and career mentors."}
            </p>
          </div>

          {/* Stats Bar */}
          {avgRating && (
            <div
              className="card"
              style={{
                maxWidth: "520px",
                margin: "0 auto 2.5rem",
                textAlign: "center",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "2rem",
                padding: "1.25rem 2rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: 900,
                    color: "var(--brand-secondary)",
                    lineHeight: 1,
                  }}
                >
                  ★ {avgRating}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {lang === "hi" ? "औसत रेटिंग" : "Average Rating"}
                </div>
              </div>
              <div style={{ width: "1px", height: "40px", background: "var(--border)" }} />
              <div>
                <div
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: 900,
                    color: "var(--brand-primary)",
                    lineHeight: 1,
                  }}
                >
                  {reviews.length}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  {lang === "hi" ? "सत्यापित समीक्षाएं" : "Verified Reviews"}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
              <div className="spinner" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="empty-state card" style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div className="empty-state-icon" style={{ display: "flex", justifyContent: "center" }}>
                <SparklesIcon size={48} color="var(--brand-secondary)" />
              </div>
              <div className="empty-state-title">
                {lang === "hi" ? "अभी कोई समीक्षा प्रकाशित नहीं हुई है" : "No verified reviews published yet"}
              </div>
              <p className="empty-state-desc" style={{ marginBottom: "1.5rem" }}>
                {t("detailsComingSoon", lang)}
              </p>
              {user ? (
                <Link href="/dashboard/client" className="btn btn-primary btn-sm">
                  ★ {t("shareExperience", lang)}
                </Link>
              ) : (
                <Link href="/login" className="btn btn-outline btn-sm">
                  {lang === "hi" ? "समीक्षा देने के लिए लॉगिन करें" : "Login to Share Feedback"}
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* ── Auto-flashing Spotlight Showcase ── */}
              {activeReview && (
                <div
                  className="review-spotlight"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  {/* Flashing Review Card */}
                  <div key={activeReview.id} className="review-flash-card">
                    {/* Top Row: Spotlight Header & Pause indicator */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.25rem",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          background: "var(--brand-primary-light)",
                          color: "var(--brand-primary)",
                          padding: "0.3rem 0.75rem",
                          borderRadius: "20px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                        }}
                      >
                        ⚡ {lang === "hi" ? "समीक्षा स्पॉटलाइट" : "Review Spotlight"}
                        {reviews.length > 1 && (
                          <span style={{ opacity: 0.8, fontWeight: 500 }}>
                            {isPaused
                              ? `(${lang === "hi" ? "रुका हुआ" : "Paused on hover"})`
                              : `(${activeIndex + 1}/${reviews.length})`}
                          </span>
                        )}
                      </div>

                      {/* Manual Next / Prev Buttons */}
                      {reviews.length > 1 && (
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={handlePrev}
                            aria-label="Previous review"
                            style={{
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              borderRadius: "50%",
                              width: "32px",
                              height: "32px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              color: "var(--text)",
                              fontSize: "0.9rem",
                            }}
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={handleNext}
                            aria-label="Next review"
                            style={{
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              borderRadius: "50%",
                              width: "32px",
                              height: "32px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              color: "var(--text)",
                              fontSize: "0.9rem",
                            }}
                          >
                            →
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Spotlight Main Content: Avatar, Stars, Message */}
                    <div
                      style={{
                        display: "flex",
                        gap: "1.5rem",
                        alignItems: "flex-start",
                        flexDirection: "row",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Reviewer Photo / Avatar */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                        <ReviewerAvatar review={activeReview} size={72} fontSize="1.4rem" />
                      </div>

                      {/* Review Details */}
                      <div style={{ flex: 1, minWidth: "260px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                          <RatingStars rating={activeReview.rating} size={20} />
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-secondary)" }}>
                            {activeReview.rating || 5}.0 / 5.0
                          </span>
                        </div>

                        {/* Large Quote Message */}
                        <blockquote
                          style={{
                            fontSize: "1.1rem",
                            lineHeight: 1.7,
                            color: "var(--text)",
                            fontStyle: "italic",
                            marginBottom: "1rem",
                            position: "relative",
                            paddingLeft: "0.2rem",
                          }}
                        >
                          "{activeReview.comment}"
                        </blockquote>

                        {/* Reviewer Name and Badge */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text)" }}>
                            {formatName(activeReview)}
                          </span>
                          <span
                            style={{
                              fontSize: "0.74rem",
                              color: "var(--success)",
                              fontWeight: 700,
                              background: "rgba(29, 155, 95, 0.1)",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            ✓ {lang === "hi" ? "सत्यापित परामर्शार्थी" : "Verified Client"}
                          </span>
                          {formatDate(activeReview.createdAt, lang) && (
                            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                              • {formatDate(activeReview.createdAt, lang)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dot Indicators */}
                    {reviews.length > 1 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "0.4rem",
                          marginTop: "1.5rem",
                          alignItems: "center",
                        }}
                      >
                        {reviews.slice(0, 12).map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`review-dot${idx === activeIndex ? " active" : ""}`}
                            onClick={() => handleSelectIndex(idx)}
                            aria-label={`Go to review ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Progress bar indicating next flash */}
                  {reviews.length > 1 && !isPaused && (
                    <div
                      className="review-progress-bar"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </div>
              )}

              {/* ── All Reviews Grid Header & Filter Tabs ── */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)" }}>
                  {lang === "hi"
                    ? `सभी समीक्षाएं (${filteredReviews.length})`
                    : `All Reviews (${filteredReviews.length})`}
                </h2>

                <div className="tabs" style={{ marginBottom: 0 }}>
                  <button
                    type="button"
                    className={`tab-btn${filterRating === null ? " active" : ""}`}
                    onClick={() => setFilterRating(null)}
                  >
                    {lang === "hi" ? "सभी" : "All"} ({reviews.length})
                  </button>
                  <button
                    type="button"
                    className={`tab-btn${filterRating === 5 ? " active" : ""}`}
                    onClick={() => setFilterRating(5)}
                  >
                    ★ 5 {lang === "hi" ? "स्टार" : "Stars"}
                  </button>
                </div>
              </div>

              {/* Full Reviews Grid with Reviewer Photos, Names, Messages, and Stars */}
              <div className="grid-3" style={{ gap: "1.5rem" }}>
                {filteredReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      {/* Top Row: Reviewer Photo, Name, Verified Badge, Rating */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.85rem",
                          marginBottom: "0.85rem",
                        }}
                      >
                        <ReviewerAvatar review={rev} size={48} fontSize="1rem" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.95rem",
                              color: "var(--text)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {formatName(rev)}
                          </div>
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--success)",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.2rem",
                            }}
                          >
                            ✓ {lang === "hi" ? "सत्यापित परामर्शार्थी" : "Verified Client"}
                          </div>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div style={{ marginBottom: "0.75rem" }}>
                        <RatingStars rating={rev.rating} size={16} />
                      </div>

                      {/* Comment Message */}
                      <p
                        style={{
                          color: "var(--text)",
                          fontSize: "0.92rem",
                          lineHeight: 1.7,
                          fontStyle: "italic",
                          marginBottom: "1rem",
                        }}
                      >
                        "{rev.comment}"
                      </p>
                    </div>

                    {/* Card Footer: Date */}
                    {formatDate(rev.createdAt, lang) && (
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          paddingTop: "0.6rem",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>{formatDate(rev.createdAt, lang)}</span>
                        <span style={{ opacity: 0.8 }}>★ {rev.rating || 5}.0</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CTA Footer: Book Appointment & Share Experience */}
          <div
            style={{
              textAlign: "center",
              marginTop: "3.5rem",
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/book"
              className="btn btn-primary btn-lg"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <CalendarIcon size={20} />
              {t("bookAppointment", lang)}
            </Link>

            {user ? (
              <Link href="/dashboard/client" className="btn btn-outline btn-lg">
                ★ {t("shareExperience", lang)}
              </Link>
            ) : (
              <Link href="/login" className="btn btn-outline btn-lg">
                {lang === "hi" ? "समीक्षा लिखें" : "Share Your Feedback"}
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
