"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import CircularProgressLoader from "@/components/CircularProgressLoader";
import type { WorkshopItem, WorkshopRegistration } from "@/types";

export default function WorkshopsPage() {
  const { lang } = useSite();
  const [workshops, setWorkshops] = useState<WorkshopItem[]>([]);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const qWorkshops = query(collection(db, "workshops"), limit(50));
        const snap = await getDocs(qWorkshops);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkshopItem));
        const sorted = list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
        setWorkshops(sorted);

        // Fetch registration counts to compute remaining capacity (capped at 500)
        const qRegs = query(collection(db, "workshopRegistrations"), limit(500));
        const regSnap = await getDocs(qRegs);
        const counts: Record<string, number> = {};
        regSnap.docs.forEach((d) => {
          const r = d.data() as WorkshopRegistration;
          if (r.status !== "cancelled") {
            counts[r.workshopId] = (counts[r.workshopId] || 0) + 1;
          }
        });
        setRegCounts(counts);
      } catch (err) {
        console.error("Error loading workshops:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, []);

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t("workshops", lang)}</span>
            <h1 className="section-title">
              {lang === "hi" ? "आगामी " : "Interactive "}
              <span>{lang === "hi" ? "कार्यशालाएं एवं वेबिनार" : "Workshops & Webinars"}</span>
            </h1>
            <p className="section-subtitle">
              {lang === "hi"
                ? "विशेषज्ञ परामर्शदाता के साथ समूह सत्र, करियर मार्गदर्शन, और मानसिक कल्याण कार्यशालाएं।"
                : "Engaging group workshops, college admission strategy webinars, and emotional wellness sessions led by experienced counsellors."}
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
              <CircularProgressLoader
                size={106}
                title={lang === "hi" ? "कार्यशालाएं लोड हो रही हैं..." : "Loading Workshops..."}
                subtitle={
                  lang === "hi"
                    ? "आगामी वेबिनार और समूह सत्र प्राप्त किए जा रहे हैं..."
                    : "Fetching upcoming webinars and group sessions..."
                }
              />
            </div>
          ) : workshops.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎓</div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
                {lang === "hi" ? "फिलहाल कोई कार्यशाला निर्धारित नहीं है" : "No Workshops Scheduled At The Moment"}
              </h2>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem" }}>
                {lang === "hi"
                  ? "कृपया नए सत्रों की घोषणा के लिए जल्द वापस आएं या व्यक्तिगत परामर्श बुक करें।"
                  : "Please check back soon for upcoming webinar announcements, or book a 1-on-1 private consultation."}
              </p>
              <Link href="/book" className="btn btn-primary">
                {t("bookAppointment", lang)}
              </Link>
            </div>
          ) : (
            <div className="grid-2" style={{ gap: "1.5rem" }}>
              {workshops.map((w) => {
                const booked = regCounts[w.id] || 0;
                const remaining = Math.max(0, w.maxSeats - booked);
                const isFull = remaining === 0;

                return (
                  <div
                    key={w.id}
                    className="card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <span className="badge badge-primary">
                          {w.mode === "online" ? "🌐 Online Video" : "🏢 In-Person"}
                        </span>
                        <span className={`badge ${isFull ? "badge-error" : "badge-success"}`}>
                          {isFull
                            ? t("workshopFull", lang)
                            : `${remaining} ${t("seatsLeft", lang)}`}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
                        {w.title}
                      </h3>

                      <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                        {w.description}
                      </p>

                      {/* Schedule info */}
                      <div
                        style={{
                          background: "var(--surface-2)",
                          padding: "0.85rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.825rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem",
                          marginBottom: "1.25rem",
                        }}
                      >
                        <div>📅 <strong>Date:</strong> {w.date}</div>
                        <div>⏰ <strong>Time:</strong> {w.time} ({w.durationMinutes} mins)</div>
                        {w.mode === "in_person" && w.venue && (
                          <div>📍 <strong>Venue:</strong> {w.venue}</div>
                        )}
                        <div>
                          💳 <strong>Fee:</strong>{" "}
                          <span style={{ color: w.fee > 0 ? "var(--brand-primary)" : "#10b981", fontWeight: 700 }}>
                            {w.fee > 0 ? `₹${w.fee}` : "Free of Cost"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {booked} / {w.maxSeats} enrolled
                      </span>
                      <Link
                        href={`/workshops/${w.id}`}
                        className={`btn ${isFull ? "btn-outline" : "btn-primary"} btn-sm`}
                      >
                        {isFull ? t("joinWaitlist", lang) : t("registerWorkshop", lang)} →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
