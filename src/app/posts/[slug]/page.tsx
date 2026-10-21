"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import CircularProgressLoader from "@/components/CircularProgressLoader";

interface PostDetail {
  id: string;
  title: string;
  slug?: string;
  category: string;
  excerpt?: string;
  content: string;
  authorName?: string;
  coverImage?: string;
  coverImageAlt?: string;
  published: boolean;
  createdAt?: any;
}

export default function SinglePostPage() {
  const params = useParams();
  const slugParam = params?.slug as string;
  const { lang, profile } = useSite();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      if (!slugParam) return;
      try {
        setLoading(true);
        // 1. Query by slug
        const qSlug = query(
          collection(db, "posts"),
          where("slug", "==", slugParam),
          where("published", "==", true)
        );
        const snapSlug = await getDocs(qSlug);

        if (!snapSlug.empty) {
          const docData = snapSlug.docs[0];
          setPost({ id: docData.id, ...docData.data() } as PostDetail);
          return;
        }

        // 2. Fallback: try by direct doc ID if slug match fails
        const docRef = doc(db, "posts", slugParam);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().published !== false) {
          setPost({ id: docSnap.id, ...docSnap.data() } as PostDetail);
          return;
        }

        setNotFound(true);
      } catch (err) {
        console.error("Error fetching post by slug:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slugParam]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgressLoader
          size={110}
          title={lang === "hi" ? "लेख लोड हो रहा है..." : "Loading Article..."}
          subtitle={
            lang === "hi"
              ? "सामग्री तैयार की जा रही है..."
              : "Preparing article content & resources..."
          }
        />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ padding: "5rem 1rem", textAlign: "center" }}>
          <div className="empty-state card" style={{ maxWidth: "560px", margin: "0 auto" }}>
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">
              {lang === "hi" ? "लेख नहीं मिला" : "Article Not Found"}
            </div>
            <p className="empty-state-desc" style={{ marginBottom: "1.5rem" }}>
              {lang === "hi"
                ? "यह लेख मौजूद नहीं है या अप्रकाशित कर दिया गया है।"
                : "The requested article does not exist or has been unpublished."}
            </p>
            <Link href="/posts" className="btn btn-primary">
              ← {lang === "hi" ? "सभी लेखों पर जाएं" : "Back to All Articles"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format date
  let publishedDate = "";
  if (post.createdAt?.toDate) {
    publishedDate = post.createdAt.toDate().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="page-wrapper">
      <article className="container" style={{ maxWidth: "860px", padding: "4rem 1.25rem" }}>
        {/* Breadcrumb / Back button */}
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/posts" className="btn btn-ghost btn-sm">
            ← {lang === "hi" ? "सभी लेख" : "All Articles"}
          </Link>
        </div>

        {/* Header */}
        <header style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
            <span className="badge badge-primary">{post.category || "Guidance"}</span>
            {publishedDate && (
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                🗓️ {publishedDate}
              </span>
            )}
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              ✍️ By {post.authorName || profile.counsellorName || "Counsellor"}
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(1.9rem, 4vw, 2.7rem)", fontWeight: 800, color: "var(--brand-primary)", lineHeight: 1.25, marginBottom: "1rem" }}>
            {post.title}
          </h1>

          {post.excerpt && (
            <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", lineHeight: 1.7, fontStyle: "italic" }}>
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div style={{ marginBottom: "2.5rem" }}>
            <img
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              style={{
                width: "100%",
                maxHeight: "440px",
                objectFit: "cover",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow-sm)",
              }}
            />
            {post.coverImageAlt && (
              <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-light)", marginTop: "0.5rem", textAlign: "center" }}>
                {post.coverImageAlt}
              </span>
            )}
          </div>
        )}

        {/* Body content */}
        <div
          className="card"
          style={{
            fontSize: "1.08rem",
            lineHeight: 1.9,
            color: "var(--text)",
            whiteSpace: "pre-line",
            padding: "2.5rem 2rem",
            border: "none",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {post.content}
        </div>

        {/* Author Bio Card & Booking CTA */}
        <div
          className="card card-accent"
          style={{
            marginTop: "3rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div>
            <span className="badge badge-secondary" style={{ marginBottom: "0.5rem" }}>
              {lang === "hi" ? "विशेषज्ञ परामर्शदाता" : "Expert Guidance"}
            </span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text)" }}>
              {profile.counsellorName || "Certified Educational Counsellor"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "460px", marginTop: "0.25rem" }}>
              {lang === "hi"
                ? "क्या आपके पास अपने करियर या कॉलेज प्रवेश के संबंध में प्रश्न हैं? व्यक्तिगत 1-on-1 परामर्श बुक करें।"
                : "Have questions about this topic or need personalized career planning? Schedule a 1-on-1 confidential session."}
            </p>
          </div>
          <Link href="/book" className="btn btn-primary btn-lg">
            📅 {t("bookAppointment", lang)}
          </Link>
        </div>
      </article>
    </div>
  );
}
