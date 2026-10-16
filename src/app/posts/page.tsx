"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  authorName: string;
  createdAt: string;
  imageUrl?: string;
  videoUrl?: string;
  pdfUrl?: string;
  tags: string[];
}

const DEFAULT_POSTS: Post[] = [
  {
    id: "p1",
    title: "How to Choose the Right Career Path After Class 12: Stream by Stream Analysis",
    excerpt: "Confused between Engineering, Medicine, Commerce, and Humanities? Here is our comprehensive decision matrix based on your true strengths.",
    content: `Choosing a career path after 12th grade is often the first major independent decision in a student's life. The pressure from peers, family, and society can feel overwhelming.

Here are the four pillars of choosing the right stream:
1. Self-Assessment: Focus on your natural inclinations, not just your 10th/12th board marks.
2. Market Trends vs. Passion: Align emerging opportunities with long-term interests.
3. Financial & Academic Realities: Understand course durations, entrance exams, and college options.
4. Mentorship: Never hesitate to book a counseling session when in doubt.

Remember: No decision is carved in stone. Your dedication and continuous skill development matter more than any single exam.`,
    category: "Career Guidance",
    authorName: "Principal Ma'am",
    createdAt: new Date().toISOString(),
    tags: ["career", "class12", "stream-selection", "guidance"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    pdfUrl: "#download",
  },
  {
    id: "p2",
    title: "Mastering Exam Anxiety: Psychological Strategies for JEE & NEET Aspirants",
    excerpt: "Overcome fear of failure, manage mock test stress, and build unshakable exam-day composure with these counseling-backed techniques.",
    content: `Exam stress is a natural biological response, but unmanaged anxiety drastically reduces cognitive recall. 

Key strategies:
1. The 50/10 Study Cycle: Study with full concentration for 50 minutes, then take a mandatory 10-minute break.
2. Positive Visualization: Spend 5 minutes every morning visualizing yourself calmly reading and solving tricky questions.
3. Routine Normalization: Maintain consistent sleep of 7-8 hours; sleep deprivation impairs memory consolidation.`,
    category: "Exam Strategies",
    authorName: "Principal Ma'am",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    tags: ["mental-wellness", "jee", "neet", "exam-tips"],
    pdfUrl: "#download",
  },
  {
    id: "p3",
    title: "The Parent's Role: How to Support Your Teenager Without Creating Pressure",
    excerpt: "A guide for parents on active listening, recognizing burnout signs, and fostering an emotionally secure home environment during crucial academic years.",
    content: `When children face competitive exams, parents often feel equal anxiety. However, this anxiety can unintentionally project onto students as unrealistic expectations.

Advice for parents:
• Celebrate effort and consistency, not just scores.
• Be an active listener rather than an immediate problem solver.
• Encourage hobbies and physical exercise alongside studies.`,
    category: "Parent Counseling",
    authorName: "Principal Ma'am",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    tags: ["parenting", "support", "empathy"],
  },
];

export default function PostsPage() {
  const { user, loading } = useAuth();
  const { settings } = useSite();
  const [posts, setPosts] = useState<Post[]>(DEFAULT_POSTS);
  const [filter, setFilter] = useState("All");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});

  const categories = [
    "All",
    "Career Guidance",
    "Exam Strategies",
    "Academic Success",
    "Parent Counseling",
    "Mental Wellness",
  ];

  useEffect(() => {
    // Load posts from both Firestore and localStorage
    const loadAllPosts = async () => {
      let combined: Post[] = [];

      // Check localStorage first for any posts published locally
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("insersia_posts");
        if (local) {
          try {
            combined = JSON.parse(local);
          } catch {}
        }
      }

      // Try fetching from Firestore
      try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
          const existingIds = new Set(combined.map((p) => p.id));
          remote.forEach((rp) => {
            if (!existingIds.has(rp.id)) combined.push(rp);
          });
        }
      } catch {}

      // Fallback to sample posts if empty
      if (combined.length === 0) {
        combined = DEFAULT_POSTS;
      }

      setPosts(combined);
    };

    loadAllPosts();
  }, []);

  const handleLike = (postId: string) => {
    if (!user) return;
    const isLiked = userLikes[postId];
    setUserLikes((prev) => ({ ...prev, [postId]: !isLiked }));
    setLikes((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + (isLiked ? -1 : 1),
    }));
  };

  const filtered = filter === "All" ? posts : posts.filter((p) => p.category === filter);

  return (
    <main className="page-wrapper" style={{ paddingTop: "6.5rem", paddingBottom: "5rem" }}>
      <section className="section">
        <div className="container">
          {/* Header */}
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="section-tag">Guidance &amp; Knowledge Hub</div>
            <h1 className="section-title">
              Articles &amp; Guidance by <span>{settings.principalName}</span>
            </h1>
            <p className="section-subtitle">
              Exclusive insights, career strategies, motivation, and downloadable resources curated for your growth.
            </p>

            {/* Personalized greeting or login prompt banner */}
            {user ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: 30,
                  padding: "0.5rem 1.25rem",
                  marginTop: "1.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <span>👋</span>
                <span>
                  Welcome, <strong>{user.displayName || user.email}</strong>! You have full access to all articles and attachments.
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                  background: "linear-gradient(135deg, rgba(14,31,69,0.8), rgba(201,168,76,0.15))",
                  border: "1px solid var(--border-gold)",
                  borderRadius: 16,
                  padding: "0.75rem 1.5rem",
                  marginTop: "1.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <span>🔒</span>
                <span>Sign in with Google or Email to unlock full reading, download PDFs &amp; watch videos</span>
                <Link href="/login" className="btn btn-gold btn-sm">
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: "3rem",
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="btn btn-sm"
                style={{
                  background: filter === cat ? "var(--gold)" : "rgba(255,255,255,0.04)",
                  color: filter === cat ? "#07122b" : "var(--text-muted)",
                  border: `1px solid ${filter === cat ? "var(--gold)" : "var(--border)"}`,
                  fontWeight: filter === cat ? 700 : 500,
                  borderRadius: 20,
                  padding: "0.4rem 1rem",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Posts Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "850px", margin: "0 auto" }}>
            {filtered.map((post) => {
              const isExpanded = expandedPost === post.id;
              const likeCount = (likes[post.id] || 0) + 12; // Base sample likes

              return (
                <article
                  key={post.id}
                  className="card card-gold animate-in"
                  style={{
                    padding: "2rem",
                    position: "relative",
                  }}
                >
                  {/* Category and Date */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <span className="badge badge-gold">{post.category}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      📅 {new Date(post.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "1.45rem",
                      fontWeight: 700,
                      marginBottom: "0.75rem",
                      color: "#fff",
                      lineHeight: 1.4,
                    }}
                  >
                    {post.title}
                  </h2>

                  {/* Cover Image if attached */}
                  {post.imageUrl && (
                    <div
                      style={{
                        width: "100%",
                        maxHeight: "350px",
                        overflow: "hidden",
                        borderRadius: 12,
                        marginBottom: "1.25rem",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  )}

                  {/* Excerpt / Full Content */}
                  <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: "1.25rem" }}>
                    {user ? (
                      <div>
                        {isExpanded ? (
                          <div style={{ whiteSpace: "pre-line", color: "var(--text-primary)" }}>
                            {post.content || post.excerpt}
                          </div>
                        ) : (
                          <p>{post.excerpt}</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p>{post.excerpt}</p>
                        {/* Blur gate for non-authenticated visitors */}
                        <div
                          style={{
                            marginTop: "1rem",
                            padding: "1.25rem",
                            borderRadius: 10,
                            background: "rgba(14,31,69,0.7)",
                            border: "1px dashed var(--gold)",
                            textAlign: "center",
                          }}
                        >
                          <p style={{ color: "var(--gold)", fontWeight: 600, marginBottom: "0.5rem" }}>
                            🔒 Exclusive Content for Students &amp; Parents
                          </p>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                            Sign in with your Google or Email account to read the full article and download attachments.
                          </p>
                          <Link href="/login" className="btn btn-gold btn-sm">
                            Sign In to Read More →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attachments (Video & PDF) - Visible to authenticated users */}
                  {user && (
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                      {post.videoUrl && (
                        <a
                          href={post.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-ghost"
                          style={{ borderColor: "rgba(231,76,60,0.5)", color: "#ff6b6b" }}
                        >
                          ▶️ Watch Video Guide
                        </a>
                      )}
                      {post.pdfUrl && (
                        <a
                          href={post.pdfUrl}
                          download
                          className="btn btn-sm btn-ghost"
                          style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
                        >
                          📄 Download Study PDF
                        </a>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                      {post.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            background: "rgba(255,255,255,0.03)",
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Footer: Author, Read More Toggle & Like Button */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid var(--border)",
                      paddingTop: "1rem",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      By <strong style={{ color: "#fff" }}>{post.authorName || settings.principalName}</strong>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      {user && (
                        <button
                          onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                          className="btn btn-ghost btn-sm"
                        >
                          {isExpanded ? "Collapse ▲" : "Read Full Article ▼"}
                        </button>
                      )}

                      <button
                        onClick={() => handleLike(post.id)}
                        className="btn btn-sm"
                        style={{
                          background: userLikes[post.id] ? "rgba(231,76,60,0.2)" : "rgba(255,255,255,0.05)",
                          color: userLikes[post.id] ? "#e74c3c" : "var(--text-muted)",
                          border: "1px solid var(--border)",
                          borderRadius: 20,
                          padding: "0.3rem 0.8rem",
                        }}
                        title={user ? "Like this post" : "Sign in to like"}
                      >
                        ❤️ {likeCount}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
