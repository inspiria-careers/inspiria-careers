"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface GalleryItem {
  id?: string;
  type: "photo" | "video";
  url: string; // Image URL or Video URL
  thumbnailUrl?: string;
  caption: string;
  category: string;
  emoji?: string;
}

const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    type: "photo",
    url: "/logo.jpg",
    emoji: "🎓",
    caption: "Annual Higher Education & Career Fair 2024",
    category: "Events",
  },
  {
    type: "video",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    emoji: "🎤",
    caption: "Keynote Address: Overcoming Exam Fear & Finding True Passion",
    category: "Speaking",
  },
  {
    type: "photo",
    url: "/logo.jpg",
    emoji: "🏆",
    caption: "National Counseling Excellence Award Ceremony",
    category: "Awards",
  },
  {
    type: "video",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    emoji: "💻",
    caption: "All-India Career Orientation Webinar (2500+ attendees)",
    category: "Online",
  },
  {
    type: "photo",
    url: "/logo.jpg",
    emoji: "📚",
    caption: "Interactive Academic Strategy Workshop with Students",
    category: "Workshops",
  },
  {
    type: "photo",
    url: "/logo.jpg",
    emoji: "👨‍👩‍👧",
    caption: "Parent-Child Empathy Counseling Forum",
    category: "Sessions",
  },
  {
    type: "photo",
    url: "/logo.jpg",
    emoji: "🌏",
    caption: "Global Counselors Summit, Singapore",
    category: "International",
  },
  {
    type: "photo",
    url: "/logo.jpg",
    emoji: "🌟",
    caption: "JEE & NEET Top Rankers Felicitation Ceremony",
    category: "Achievements",
  },
];

const categories = ["All", "Events", "Workshops", "Awards", "Speaking", "Sessions", "Online", "Achievements"];

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [activeTab, setActiveTab] = useState("All");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      let combined: GalleryItem[] = [];

      // Check localStorage first
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("insersia_gallery");
        if (local) {
          try {
            combined = JSON.parse(local);
          } catch {}
        }
      }

      // Try Firestore
      try {
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
          const existingUrls = new Set(combined.map((c) => c.url));
          remote.forEach((r) => {
            if (!existingUrls.has(r.url)) combined.push(r);
          });
        }
      } catch {}

      if (combined.length === 0) {
        combined = DEFAULT_GALLERY_ITEMS;
      }
      setItems(combined);
    };

    fetchGallery();
  }, []);

  const filtered = activeTab === "All" ? items : items.filter((item) => item.category === activeTab);

  // Helper to extract YouTube embed URL
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "youtube.com/embed/");
    }
    return url;
  };

  return (
    <main className="page-wrapper" style={{ paddingTop: "6.5rem", paddingBottom: "5rem" }}>
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div className="section-tag">Visual Media &amp; Videos</div>
            <h1 className="section-title">
              Moments that <span>Inspire</span>
            </h1>
            <p className="section-subtitle">
              Explore event photographs, recorded keynote videos, student felicitation ceremonies, and counseling camps.
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "3rem" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className="btn btn-sm"
                style={{
                  background: activeTab === cat ? "var(--gold)" : "rgba(255,255,255,0.04)",
                  color: activeTab === cat ? "#07122b" : "var(--text-muted)",
                  border: `1px solid ${activeTab === cat ? "var(--gold)" : "var(--border)"}`,
                  fontWeight: activeTab === cat ? 700 : 500,
                  borderRadius: 20,
                  padding: "0.4rem 1.1rem",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="gallery-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.75rem" }}>
            {filtered.map((item, i) => (
              <div
                key={i}
                className="card card-gold animate-in"
                onClick={() => {
                  if (item.type === "video") setActiveVideo(getEmbedUrl(item.url));
                  else setActivePhoto(item.url || item.thumbnailUrl || "/logo.jpg");
                }}
                style={{
                  padding: 0,
                  position: "relative",
                  borderRadius: 16,
                  overflow: "hidden",
                  minHeight: "280px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, rgba(26,58,143,0.4), rgba(201,168,76,0.15))",
                }}
              >
                {/* Media representation */}
                {item.type === "photo" && item.url && item.url.startsWith("http") ? (
                  <img
                    src={item.url}
                    alt={item.caption}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ fontSize: "5rem", marginBottom: "2rem" }}>{item.emoji || (item.type === "video" ? "🎥" : "📸")}</div>
                )}

                {/* Video Play Badge overlay */}
                {item.type === "video" && (
                  <div
                    style={{
                      position: "absolute",
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "rgba(231,76,60,0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "1.5rem",
                      boxShadow: "0 0 25px rgba(231,76,60,0.7)",
                      zIndex: 2,
                    }}
                  >
                    ▶
                  </div>
                )}

                {/* Caption Overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(7,18,43,0.95) 0%, rgba(7,18,43,0.4) 50%, transparent 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "1.5rem",
                    zIndex: 1,
                  }}
                >
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span className="badge badge-gold" style={{ fontSize: "0.75rem" }}>
                      {item.category}
                    </span>
                    <span className={`badge ${item.type === "video" ? "badge-red" : "badge-blue"}`} style={{ fontSize: "0.75rem" }}>
                      {item.type === "video" ? "🎥 Video" : "📸 Photo"}
                    </span>
                  </div>
                  <p style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.4 }}>
                    {item.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* VIDEO MODAL */}
          {activeVideo && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "2rem",
              }}
              onClick={() => setActiveVideo(null)}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "850px",
                  aspectRatio: "16/9",
                  background: "#000",
                  borderRadius: 16,
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "0 0 40px rgba(0,0,0,0.8)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setActiveVideo(null)}
                  style={{
                    position: "absolute",
                    top: 15,
                    right: 15,
                    background: "rgba(0,0,0,0.7)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    zIndex: 10,
                  }}
                >
                  ✕
                </button>
                <iframe
                  src={activeVideo}
                  title="Gallery Video Player"
                  style={{ width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* PHOTO LIGHTBOX */}
          {activePhoto && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "2rem",
              }}
              onClick={() => setActivePhoto(null)}
            >
              <div style={{ maxWidth: "800px", maxHeight: "80vh", position: "relative" }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setActivePhoto(null)}
                  style={{
                    position: "absolute",
                    top: -40,
                    right: 0,
                    background: "transparent",
                    color: "#fff",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                  }}
                >
                  ✕ Close
                </button>
                <img
                  src={activePhoto}
                  alt="Gallery Lightbox"
                  style={{ width: "100%", height: "auto", maxHeight: "80vh", borderRadius: 12, objectFit: "contain" }}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
