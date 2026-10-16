"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  authorName: string;
  createdAt: string;
  imageUrl?: string;
  videoUrl?: string;
  pdfUrl?: string;
  tags: string[];
}

const SAMPLE: Record<string, Post> = {
  "1": { id:"1", title:"How to Choose the Right Career Path After 12th", content:"<h2>Introduction</h2><p>Choosing a career after 12th grade is one of the most important decisions of your life. This comprehensive guide will help you navigate through the process with clarity and confidence.</p><h2>Step 1: Self Assessment</h2><p>Begin by understanding your strengths, interests, and values. Take aptitude tests, speak to your counselor, and reflect on what activities energize you.</p><h2>Step 2: Explore Options</h2><p>Research various career paths and understand the long-term prospects of each field.</p><h2>Step 3: Seek Guidance</h2><p>Talk to professionals in fields you are interested in. Attend career fairs, webinars, and counseling sessions to gain real-world insights.</p>", excerpt:"A comprehensive guide for students.", category:"Career", authorName:"Principal Ma'am", createdAt:new Date().toISOString(), tags:["career","students"] },
  "2": { id:"2", title:"Effective Study Techniques for Competitive Exams", content:"<h2>The Science of Learning</h2><p>Studying effectively is not about studying longer, it is about studying smarter. These proven techniques will transform your preparation.</p><h2>Pomodoro Technique</h2><p>Study for 25 minutes, then take a 5-minute break. This keeps your brain fresh and focused.</p><h2>Active Recall</h2><p>Instead of passively re-reading notes, test yourself. Flashcards and practice questions are forms of active recall.</p>", excerpt:"Proven strategies for JEE, NEET, and competitive exams.", category:"Academic", authorName:"Principal Ma'am", createdAt:new Date(Date.now()-86400000).toISOString(), tags:["study","competitive"] },
  "3": { id:"3", title:"Mental Health Matters: Dealing with Exam Stress", content:"<h2>You Are More Than Your Grades</h2><p>Exam stress is real, and it affects students everywhere. But remember: your worth is not defined by your marks. This article shares practical strategies to manage stress and maintain mental wellness.</p><h2>Breathing Exercises</h2><p>When anxiety strikes, try the 4-7-8 breathing technique: Inhale for 4 seconds, hold for 7, exhale for 8. This calms you down.</p><h2>Talk About It</h2><p>Do not bottle up your feelings. Talk to a trusted friend, family member, or counselor. Seeking help is a sign of strength, not weakness.</p>", excerpt:"Managing anxiety and stress during exam season.", category:"Wellness", authorName:"Principal Ma'am", createdAt:new Date(Date.now()-172800000).toISOString(), tags:["wellness","mental health"] },
};

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    const fetchPost = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "posts", id as string));
        if (snap.exists()) {
          setPost({ id: snap.id, ...snap.data() } as Post);
        } else {
          setPost(SAMPLE[id as string] || null);
        }
      } catch {
        setPost(SAMPLE[id as string] || null);
      } finally { setFetching(false); }
    };
    if (user) fetchPost();
    else if (!loading) setFetching(false);
  }, [id, user, loading, router]);

  if (loading || fetching) return <div className="page-wrapper" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div className="spinner" /></div>;
  if (!user) return null;
  if (!post) return <main className="page-wrapper"><section className="section"><div className="container-sm text-center"><p>Post not found.</p><Link href="/posts" className="btn btn-gold mt-2">Back to Posts</Link></div></section></main>;

  return (
    <main className="page-wrapper">
      <section className="section">
        <div className="container-sm">
          <Link href="/posts" style={{color:"var(--text-muted)", textDecoration:"none", fontSize:"0.875rem", display:"inline-flex", alignItems:"center", gap:6, marginBottom:"2rem"}}>
            Back to Posts
          </Link>
          <span className="badge badge-gold" style={{marginBottom:"1rem", display:"inline-block"}}>{post.category}</span>
          <h1 style={{fontFamily:"Playfair Display, serif", fontSize:"clamp(1.75rem, 4vw, 2.5rem)", fontWeight:900, lineHeight:1.2, marginBottom:"1.5rem"}}>{post.title}</h1>
          <div style={{display:"flex", alignItems:"center", gap:"1.5rem", color:"var(--text-muted)", fontSize:"0.875rem", marginBottom:"2rem", flexWrap:"wrap"}}>
            <span>Written by {post.authorName}</span>
            <span>{new Date(post.createdAt).toLocaleDateString("en-IN", {weekday:"long", year:"numeric", month:"long", day:"numeric"})}</span>
          </div>
          {post.imageUrl && <img src={post.imageUrl} alt={post.title} style={{width:"100%", borderRadius:16, marginBottom:"2rem", maxHeight:400, objectFit:"cover"}} />}
          {(post.videoUrl || post.pdfUrl) && (
            <div className="card" style={{marginBottom:"2rem"}}>
              <p style={{fontWeight:600, marginBottom:"0.75rem"}}>Attachments</p>
              <div style={{display:"flex", gap:"0.75rem", flexWrap:"wrap"}}>
                {post.videoUrl && <a href={post.videoUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Watch Video</a>}
                {post.pdfUrl && <a href={post.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Download PDF</a>}
              </div>
            </div>
          )}
          <div className="card" style={{padding:"2rem", lineHeight:1.9, color:"var(--text)", fontSize:"1rem"}}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {post.tags?.length > 0 && (
            <div style={{display:"flex", gap:"0.5rem", flexWrap:"wrap", marginTop:"2rem"}}>
              {post.tags.map(tag => <span key={tag} className="badge badge-blue">#{tag}</span>)}
            </div>
          )}
          <div style={{marginTop:"3rem", paddingTop:"2rem", borderTop:"1px solid var(--border)"}}>
            <Link href="/posts" className="btn btn-ghost">Back to Posts</Link>
            <Link href="/contact" className="btn btn-gold" style={{marginLeft:"1rem"}}>Connect with Principal</Link>
          </div>
        </div>
      </section>
    </main>
  );
}