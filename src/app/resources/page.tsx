"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import CircularProgressLoader from "@/components/CircularProgressLoader";
import type { ResourceItem } from "@/types";

export default function ResourcesPage() {
  const { lang } = useSite();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicResources = async () => {
      try {
        const q = query(
          collection(db, "resources"),
          where("visibility", "==", "public"),
          limit(50)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ResourceItem));
        setResources(list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
      } catch (err) {
        console.error("Error loading resources:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicResources();
  }, []);

  const filtered = resources.filter((r) =>
    activeCategory === "all" ? true : r.category === activeCategory
  );

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{t("resources", lang)}</span>
            <h1 className="section-title">
              {lang === "hi" ? "शैक्षणिक संसाधन एवं " : "Educational Resources & "}
              <span>{lang === "hi" ? "मार्गदर्शन सामग्री" : "Worksheets"}</span>
            </h1>
            <p className="section-subtitle">
              {lang === "hi"
                ? "करियर चयन, परीक्षा तनाव प्रबंधन और व्यक्तिगत विकास के लिए सत्यापित कार्यपत्रक और मार्गदर्शिकाएं।"
                : "Curated assessment worksheets, college planning checklists, and mindfulness exercises prepared by our counselling team."}
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            {[
              { id: "all", label: "All Resources" },
              { id: "career", label: "Career & College" },
              { id: "wellness", label: "Mental Wellness" },
              { id: "exam_prep", label: "Exam Prep & Anxiety" },
              { id: "mindfulness", label: "Mindfulness Guides" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: "0.5rem 1.1rem",
                  borderRadius: "999px",
                  border: activeCategory === cat.id ? "2px solid var(--brand-primary)" : "1px solid var(--border)",
                  background: activeCategory === cat.id ? "rgba(26, 58, 143, 0.1)" : "transparent",
                  color: activeCategory === cat.id ? "var(--brand-primary)" : "var(--text-muted)",
                  fontWeight: activeCategory === cat.id ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
              <CircularProgressLoader
                size={106}
                title={lang === "hi" ? "संसाधन लोड हो रहे हैं..." : "Loading Resources..."}
                subtitle={
                  lang === "hi"
                    ? "मार्गदर्शन सामग्री और अध्ययन पत्रक प्राप्त किए जा रहे हैं..."
                    : "Fetching guidance worksheets and study resources..."
                }
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📖</div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
                {lang === "hi" ? "कोई संसाधन उपलब्ध नहीं है" : "No Resources in this Category"}
              </h2>
              <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem" }}>
                New guides and exercises are uploaded regularly. You can also explore our articles or book a session.
              </p>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <Link href="/posts" className="btn btn-outline">
                  Browse Articles
                </Link>
                <Link href="/book" className="btn btn-primary">
                  {t("bookAppointment", lang)}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid-3" style={{ gap: "1.5rem" }}>
              {filtered.map((res) => (
                <div
                  key={res.id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "1.5rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <span className="badge badge-primary" style={{ textTransform: "capitalize" }}>
                        {res.category.replace("_", " ")}
                      </span>
                      <span className="badge badge-outline" style={{ textTransform: "uppercase" }}>
                        {res.type}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
                      {res.title}
                    </h3>

                    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                      {res.description}
                    </p>
                  </div>

                  <div>
                    {res.url ? (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {res.type === "video"
                          ? "▶️ Watch Video"
                          : res.type === "pdf"
                          ? "📥 Download PDF / Worksheet"
                          : "🔗 Open Resource"}
                      </a>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Available in Consultation</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
