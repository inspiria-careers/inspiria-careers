"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export interface PostItem {
  id: string;
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  category: string;
  authorName?: string;
  coverImage?: string;
  published: boolean;
  createdAt?: any;
}

export default function PostsPage() {
  const { lang } = useSite();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);

  useEffect(() => {
    async function loadPosts() {
      try {
        const q = query(
          collection(db, "posts"),
          where("published", "==", true),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PostItem));
        setPosts(items);
      } catch (err) {
        // In case composite index isn't ready or empty
        try {
          const fallbackSnap = await getDocs(collection(db, "posts"));
          const items = fallbackSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as PostItem))
            .filter((p) => p.published !== false);
          setPosts(items);
        } catch {
          setPosts([]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: "1080px" }}>
          <div className="section-header">
            <span className="section-tag">{lang === "hi" ? "मार्गदर्शन लेख" : "Articles & Guidance"}</span>
            <h1 className="section-title">
              {lang === "hi" ? "ज्ञान एवं " : "Insights & "}
              <span>{lang === "hi" ? "करियर परामर्श" : "Articles"}</span>
            </h1>
            <p className="section-subtitle">
              {lang === "hi"
                ? "शैक्षणिक सफलता, करियर रणनीतियों और व्यक्तिगत विकास पर विशेषज्ञों के विचार।"
                : "Helpful guidance, career tips, and mental wellness articles by our certified counsellors."}
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
              <div className="spinner" />
            </div>
          ) : selectedPost ? (
            /* Single post reading view */
            <div className="card" style={{ maxWidth: "800px", margin: "0 auto", padding: "2.5rem 2rem" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedPost(null)}
                style={{ marginBottom: "1.5rem" }}
              >
                ← {lang === "hi" ? "सभी लेखों पर वापस जाएं" : "Back to all articles"}
              </button>

              {selectedPost.coverImage && (
                <img
                  src={selectedPost.coverImage}
                  alt={selectedPost.title}
                  style={{ width: "100%", maxHeight: "380px", objectFit: "cover", borderRadius: "var(--radius)", marginBottom: "1.5rem" }}
                />
              )}

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
                <span className="badge badge-primary">{selectedPost.category || "Guidance"}</span>
                {selectedPost.authorName && (
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    By {selectedPost.authorName}
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--brand-primary)", lineHeight: 1.3, marginBottom: "1.5rem" }}>
                {selectedPost.title}
              </h1>

              <div
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 1.85,
                  color: "var(--text)",
                  whiteSpace: "pre-line",
                }}
              >
                {selectedPost.content}
              </div>

              <div style={{ marginTop: "3rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {t("confidentiality", lang)}
                </span>
                <Link href="/book" className="btn btn-primary btn-sm">
                  📅 {t("bookAppointment", lang)}
                </Link>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state card" style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">
                {lang === "hi" ? "अभी कोई लेख प्रकाशित नहीं हुआ है" : "No articles published yet"}
              </div>
              <div className="empty-state-desc">
                {t("detailsComingSoon", lang)}
              </div>
              <div style={{ marginTop: "1.5rem" }}>
                <Link href="/contact" className="btn btn-outline btn-sm">
                  {t("contact", lang)}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="card"
                  style={{ display: "flex", flexDirection: "column", cursor: "pointer" }}
                  onClick={() => setSelectedPost(post)}
                >
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "calc(var(--radius) - 4px)", marginBottom: "1rem" }}
                    />
                  )}
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span className="badge badge-primary">{post.category || "Guidance"}</span>
                  </div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, lineHeight: 1.35, marginBottom: "0.6rem", color: "var(--text)" }}>
                    {post.title}
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", flex: 1, marginBottom: "1rem", lineHeight: 1.6 }}>
                    {post.excerpt || (post.content ? post.content.substring(0, 120) + "..." : "")}
                  </p>
                  <span style={{ color: "var(--brand-primary)", fontWeight: 600, fontSize: "0.85rem" }}>
                    {lang === "hi" ? "पूरा लेख पढ़ें →" : "Read Full Article →"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
