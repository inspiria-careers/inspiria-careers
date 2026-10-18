"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs, query, limit } from "firebase/firestore";
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
  coverImageAlt?: string;
  published: boolean;
  createdAt?: any;
}

const PAGE_SIZE = 6;

export default function PostsPage() {
  const { lang } = useSite();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    async function loadPosts() {
      try {
        const qPosts = query(collection(db, "posts"), limit(50));
        const snap = await getDocs(qPosts);
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as PostItem))
          .filter((p) => p.published !== false);

        // Sort descending by createdAt or title
        items.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });

        setPosts(items);
      } catch (err) {
        console.error("Error loading posts:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return ["All", ...Array.from(set)];
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [posts, selectedCategory, searchQuery]);

  const displayedPosts = filteredPosts.slice(0, visibleCount);

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: "1120px" }}>
          {/* Header */}
          <div className="section-header">
            <span className="section-tag">{lang === "hi" ? "मार्गदर्शन लेख" : "Articles & Insights"}</span>
            <h1 className="section-title">
              {lang === "hi" ? "करियर एवं " : "Career Guidance & "}
              <span>{lang === "hi" ? "शैक्षणिक लेख" : "Insights"}</span>
            </h1>
            <p className="section-subtitle">
              {lang === "hi"
                ? "शैक्षणिक सफलता, करियर रणनीतियों, प्रवेश परीक्षाओं और व्यक्तिगत विकास पर विशेषज्ञों के विचार।"
                : "Helpful insights, stream selection advice, entrance exams guidance, and wellness articles."}
            </p>
          </div>

          {/* Search & Category Filter Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
            {/* Category tabs */}
            <div className="tabs" style={{ marginBottom: 0 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`tab-btn${selectedCategory === cat ? " active" : ""}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setVisibleCount(PAGE_SIZE);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ minWidth: "220px" }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: "0.45rem 0.85rem", fontSize: "0.88rem" }}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder={lang === "hi" ? "लेख खोजें..." : "Search articles..."}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
              <div className="spinner" />
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="empty-state card" style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">
                {posts.length === 0
                  ? (lang === "hi" ? "अभी कोई लेख प्रकाशित नहीं हुआ है" : "No articles published yet")
                  : (lang === "hi" ? "कोई परिणाम नहीं मिला" : "No matching articles found")}
              </div>
              <div className="empty-state-desc">
                {posts.length === 0 ? t("detailsComingSoon", lang) : (lang === "hi" ? "कृपया अलग श्रेणी या कीवर्ड से खोजें।" : "Try adjusting your search terms or filter.")}
              </div>
              <div style={{ marginTop: "1.5rem" }}>
                <Link href="/contact" className="btn btn-outline btn-sm">
                  {t("contact", lang)}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid-3" style={{ gap: "1.75rem" }}>
                {displayedPosts.map((post) => {
                  const href = `/posts/${post.slug || post.id}`;
                  return (
                    <article
                      key={post.id}
                      className="card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        padding: 0,
                      }}
                    >
                      {post.coverImage ? (
                        <Link href={href} style={{ textDecoration: "none" }}>
                          <img
                            src={post.coverImage}
                            alt={post.coverImageAlt || post.title}
                            style={{
                              width: "100%",
                              height: "190px",
                              objectFit: "cover",
                            }}
                          />
                        </Link>
                      ) : (
                        <div
                          style={{
                            height: "120px",
                            background: "var(--brand-primary-light)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2.5rem",
                          }}
                        >
                          📖
                        </div>
                      )}

                      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
                          <span className="badge badge-primary">{post.category || "Guidance"}</span>
                        </div>

                        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.35, marginBottom: "0.6rem" }}>
                          <Link href={href} style={{ color: "var(--text)", textDecoration: "none" }}>
                            {post.title}
                          </Link>
                        </h2>

                        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", flex: 1, marginBottom: "1.25rem", lineHeight: 1.6 }}>
                          {post.excerpt || (post.content ? post.content.substring(0, 115) + "..." : "")}
                        </p>

                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>
                            {post.authorName || "Counsellor"}
                          </span>
                          <Link
                            href={href}
                            style={{ color: "var(--brand-primary)", fontWeight: 700, fontSize: "0.85rem" }}
                          >
                            {lang === "hi" ? "पढ़ें →" : "Read →"}
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Load More Pagination Button */}
              {visibleCount < filteredPosts.length && (
                <div style={{ textAlign: "center", marginTop: "3rem" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  >
                    {lang === "hi" ? "और लेख लोड करें" : "Load More Articles"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
