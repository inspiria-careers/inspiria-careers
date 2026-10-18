"use client";
import { useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import { formatVideoEmbedUrl, isDirectVideoUrl } from "@/lib/videoUtils";

type Filter = "All" | "photo" | "video";

export default function GalleryPage() {
  const { gallery, lang } = useSite();
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = filter === "All" ? gallery : gallery.filter((g) => g.type === filter);

  return (
    <main className="page-wrapper">
      <div style={{ paddingTop: "3.5rem" }}>
        {/* Header */}
        <section className="section" style={{ background: "var(--surface-2)", paddingTop: "3rem", paddingBottom: "2rem" }}>
          <div className="container">
            <div className="section-tag">{t("gallery", lang)}</div>
            <h1 className="section-title" style={{ textAlign: "left", marginTop: ".5rem" }}>
              {lang === "hi" ? "मीडिया & <span>कार्यक्रम</span>" : "Media & <span>Events</span>"}
            </h1>
          </div>
        </section>

        {/* Filter tabs */}
        {gallery.length > 0 && (
          <div style={{ padding: "1.25rem 1.25rem 0" }}>
            <div className="container">
              <div className="tabs">
                {(["All", "photo", "video"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    className={`tab-btn${filter === f ? " active" : ""}`}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                  >
                    {f === "All" ? (lang === "hi" ? "सभी" : "All") : f === "photo" ? (lang === "hi" ? "फ़ोटो" : "Photos") : (lang === "hi" ? "वीडियो" : "Videos")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <section className="section" aria-label="Gallery items">
          <div className="container">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🖼️</div>
                <div className="empty-state-title">{t("detailsComingSoon", lang)}</div>
                <p className="empty-state-desc" style={{ marginTop: ".5rem" }}>
                  {lang === "hi" ? "गैलरी जल्द अपडेट होगी।" : "Gallery will be updated soon."}
                </p>
              </div>
            ) : (
              <div className="grid-3">
                {filtered.map((item) => (
                  <div key={item.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                    {item.type === "photo" ? (
                      <img
                        src={item.url}
                        alt={item.caption}
                        style={{ width: "100%", height: 220, objectFit: "cover" }}
                        loading="lazy"
                      />
                    ) : isDirectVideoUrl(item.url) ? (
                      <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000" }}>
                        <video
                          src={item.url}
                          controls
                          playsInline
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>
                    ) : (
                      <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000" }}>
                        <iframe
                          src={formatVideoEmbedUrl(item.url)}
                          title={item.caption || "Gallery video"}
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div style={{ padding: "1rem" }}>
                      {item.category && <span className="badge badge-primary" style={{ marginBottom: ".5rem" }}>{item.category}</span>}
                      <p style={{ fontSize: ".88rem", color: "var(--text-muted)", marginTop: ".25rem" }}>{item.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
