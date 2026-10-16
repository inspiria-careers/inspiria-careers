"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSite } from "@/contexts/SiteContext";
import RenderIcon from "@/components/RenderIcon";

interface Achievement {
  id?: string;
  year: string;
  icon: string;
  title: string;
  org: string;
  desc: string;
  category: string;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    year: "2024",
    icon: "🏆",
    title: "National Career Counselor of the Year",
    org: "All India Education Council & EdTech Forum",
    desc: "Recognized for exemplary contributions toward empowering students across India with psychological and career decision frameworks.",
    category: "Award",
  },
  {
    year: "2023",
    icon: "🎖️",
    title: "Excellence in Adolescent Guidance",
    org: "Ministry of Education & National Guidance Cell",
    desc: "Honored for pioneering holistic counseling interventions reducing student exam distress by over 40% in partner institutions.",
    category: "Recognition",
  },
  {
    year: "2022",
    icon: "📚",
    title: "Bestselling Author - 'Navigating Your True Calling'",
    org: "National Academic Press",
    desc: "Authored an acclaimed practical guide for Indian students navigating the modern landscape of college streams, exams, and career pathways.",
    category: "Publication",
  },
  {
    year: "2021",
    icon: "🎙️",
    title: "Keynote Speaker at TEDx University",
    org: "TEDx Youth Chapter",
    desc: "Delivered a viral, inspirational talk on 'Redefining Success: Beyond Marks and Medals' viewed by over 100,000+ parents and students.",
    category: "Speaker",
  },
  {
    year: "2020",
    icon: "💡",
    title: "Pioneer in Digital Pan-India Counseling",
    org: "EdTech Innovation Summit",
    desc: "Conducted remote crisis intervention and college application workshops for thousands of locked-down students during the pandemic.",
    category: "Innovation",
  },
  {
    year: "2018",
    icon: "🏫",
    title: "Distinguished Principal of the Year",
    org: "National CBSE School Leaders Forum",
    desc: "Conferred regional leadership award for transforming academic standards, life-skills curricula, and mental health counseling protocols.",
    category: "Award",
  },
  {
    year: "2016",
    icon: "🌏",
    title: "UNESCO International Education Delegate",
    org: "UNESCO Youth Summit, Singapore",
    desc: "Presented seminal comparative research on psychological resilience and mentorship models in high-stress examination environments.",
    category: "International",
  },
  {
    year: "2014",
    icon: "📄",
    title: "Aptitude Profiling Research Published",
    org: "Journal of Educational Guidance & Psychology",
    desc: "Published empirical research on the correlation between scientific psychometric assessment and long-term career satisfaction.",
    category: "Research",
  },
];

const categoryColors: Record<string, string> = {
  Award: "badge-gold",
  Recognition: "badge-blue",
  Publication: "badge-green",
  Speaker: "badge-red",
  Innovation: "badge-blue",
  International: "badge-gold",
  Research: "badge-green",
};

export default function AchievementsPage() {
  const { settings } = useSite();
  const [items, setItems] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);

  useEffect(() => {
    const fetchAchievements = async () => {
      let combined: Achievement[] = [];

      // Check localStorage first
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("insersia_achievements");
        if (local) {
          try {
            combined = JSON.parse(local);
          } catch {}
        }
      }

      // Try Firestore
      try {
        const q = query(collection(db, "achievements"), orderBy("year", "desc"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement));
          const existingTitles = new Set(combined.map((c) => c.title));
          remote.forEach((r) => {
            if (!existingTitles.has(r.title)) combined.push(r);
          });
        }
      } catch {}

      if (combined.length === 0) {
        combined = DEFAULT_ACHIEVEMENTS;
      }
      setItems(combined);
    };

    fetchAchievements();
  }, []);

  return (
    <main className="page-wrapper" style={{ paddingTop: "6.5rem", paddingBottom: "5rem" }}>
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div className="section-tag">Milestones &amp; Honors</div>
            <h1 className="section-title">
              A Legacy of <span>Impact &amp; Recognition</span>
            </h1>
            <p className="section-subtitle">
              Celebrating over {settings.yearsExperience} years of dedication to guiding students, empowering parents, and shaping modern education.
            </p>
          </div>

          {/* Key Stat Highlights */}
          <div className="grid-4" style={{ marginBottom: "4rem" }}>
            {[
              ["🏆", `${items.filter((i) => i.category === "Award").length || 15}+`, "National Honors & Awards"],
              ["🎙️", "45+", "Keynote & TEDx Speeches"],
              ["📚", "3", "Published Mentorship Guides"],
              ["🌏", "10+", "Countries Reached Globally"],
            ].map(([icon, val, label]) => (
              <div key={label} className="card card-gold text-center" style={{ padding: "1.75rem" }}>
                <div style={{ fontSize: "2.25rem", marginBottom: "0.5rem" }}>{icon}</div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: "2rem", fontWeight: 800, color: "var(--gold)" }}>
                  {val}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Timeline Grid */}
          <div className="grid-2">
            {items.map((a, i) => (
              <div key={i} className="card card-gold animate-in" style={{ padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <RenderIcon icon={a.icon || "🏆"} alt={a.title} size={50} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                    <span className={`badge ${categoryColors[a.category] || "badge-gold"}`}>{a.category}</span>
                    <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "1rem" }}>{a.year}</span>
                  </div>
                </div>
                <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                  {a.title}
                </h3>
                <p style={{ color: "var(--primary-light)", fontSize: "0.85rem", marginBottom: "0.75rem", fontWeight: 600 }}>
                  {a.org}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>{a.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <Link href="/contact" className="btn btn-gold">
              Connect with {settings.principalName} →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
