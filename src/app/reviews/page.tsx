"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export interface ReviewItem {
  id: string;
  userId?: string | null;
  clientName: string;
  displayNameChoice?: "full" | "first_only" | "anonymous";
  rating: number;
  comment: string;
  approved: boolean;
  createdAt?: any;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const { lang } = useSite();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      try {
        const q = query(collection(db, "reviews"), where("approved", "==", true), limit(50));
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
      return lang === "hi" ? "अनाम छात्र/अभिभावक" : "Verified Student / Parent";
    }
    if (review.displayNameChoice === "first_only") {
      const parts = (review.clientName || "").trim().split(" ");
      return parts[0] || (lang === "hi" ? "छात्र" : "Student");
    }
    return review.clientName || (lang === "hi" ? "छात्र" : "Student");
  };

  // Average rating
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: "1080px" }}>
          <div className="section-header">
            <span className="section-tag">{t("reviews", lang)}</span>
            <h1 className="section-title">
              {lang === "hi" ? "छात्रों एवं अभिभावकों के " : "Student & Parent "}
              <span>{lang === "hi" ? "वास्तविक अनुभव" : "Reviews"}</span>
            </h1>
            <p className="section-subtitle">
              {lang === "hi"
                ? "हमारे प्रमाणित परामर्शदाता से मार्गदर्शन प्राप्त करने वाले छात्रों की सच्ची समीक्षाएं।"
                : "Real feedback from students and parents guided by our educational and career mentors."}
            </p>
          </div>

          {/* Aggregate Rating Banner (If reviews exist) */}
          {avgRating && (
            <div
              className="card"
              style={{
                maxWidth: "480px",
                margin: "0 auto 2.5rem",
                textAlign: "center",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--brand-secondary)", lineHeight: 1 }}>
                ★ {avgRating} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>/ 5.0</span>
              </div>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                {lang === "hi"
                  ? `${reviews.length} सत्यापित समीक्षाओं के आधार पर`
                  : `Based on ${reviews.length} verified guidance reviews`}
              </p>
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
              <div className="spinner" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="empty-state card" style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div className="empty-state-icon">⭐</div>
              <div className="empty-state-title">
                {lang === "hi" ? "अभी कोई समीक्षा प्रकाशित नहीं हुई है" : "No verified reviews published yet"}
              </div>
              <p className="empty-state-desc" style={{ marginBottom: "1.5rem" }}>
                {t("detailsComingSoon", lang)}
              </p>
              {user ? (
                <Link href="/dashboard/client" className="btn btn-primary btn-sm">
                  ⭐ {t("shareExperience", lang)}
                </Link>
              ) : (
                <Link href="/login" className="btn btn-outline btn-sm">
                  {lang === "hi" ? "समीक्षा देने के लिए लॉगिन करें" : "Login to Share Feedback"}
                </Link>
              )}
            </div>
          ) : (
            <div className="grid-3" style={{ gap: "1.5rem" }}>
              {reviews.map((rev) => (
                <div key={rev.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                  {/* Star Rating */}
                  <div style={{ color: "#f39c12", fontSize: "1.2rem", marginBottom: "0.75rem" }}>
                    {"★".repeat(rev.rating || 5)}
                    {"☆".repeat(Math.max(0, 5 - (rev.rating || 5)))}
                  </div>

                  {/* Comment */}
                  <p style={{ color: "var(--text)", fontSize: "0.92rem", lineHeight: 1.7, flex: 1, marginBottom: "1.25rem", fontStyle: "italic" }}>
                    "{rev.comment}"
                  </p>

                  {/* Reviewer Name & Badge */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                        {formatName(rev)}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--success)", fontWeight: 600 }}>
                        ✓ {lang === "hi" ? "सत्यापित परामर्शार्थी" : "Verified Client"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Footer */}
          <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
            <Link href="/book" className="btn btn-primary btn-lg">
              📅 {t("bookAppointment", lang)}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
