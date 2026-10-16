"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

const testimonials = [
  {
    name: "Aryan Sharma",
    role: "B.Tech, IIT Delhi (JEE Advanced 2024)",
    emoji: "👨‍🎓",
    text: "Principal Ma'am's guidance was the defining turning point in my life. When I was stressed and confused between streams in Class 11, her scientific aptitude counseling helped me discover my true passion for computer science. Today I am at IIT Delhi, and I owe this milestone to her unwavering belief in me.",
    stars: 5,
  },
  {
    name: "Priya Verma",
    role: "MBBS Scholar, AIIMS New Delhi",
    emoji: "👩‍⚕️",
    text: "I was under immense pressure from both relatives and my own self-doubt before NEET. Ma'am not only structured my revision schedules but also provided continuous mental wellness support. Her mentoring went far beyond academic tips — she taught me how to stay calm and confident under exam pressure.",
    stars: 5,
  },
  {
    name: "Rohit Gupta",
    role: "Senior Software Engineer at Google",
    emoji: "💻",
    text: "Nearly 8 years ago, Principal Ma'am helped me see my true potential when I was feeling demoralized after poor 10th grade scores. Today I work at Google in Mountain View. She believed in me when I couldn't believe in myself. That is the life-changing power of world-class mentorship.",
    stars: 5,
  },
  {
    name: "Sunita Agarwal",
    role: "Parent of 2 Students (Class 10 & 12)",
    emoji: "👩‍👧",
    text: "As a parent, I was constantly anxious about my children's entrance exams and career choices. Through parent counseling sessions with Principal Ma'am, I learned how to actively support my children without putting undue pressure on them. Both are now thriving, self-driven, and happy!",
    stars: 5,
  },
  {
    name: "Kavya Nair",
    role: "Rhodes Scholar, Oxford University",
    emoji: "🎓",
    text: "Ma'am guided me through the entire multi-stage process of global university admissions, SOP writing, and scholarship interviews. Her international admissions acumen is outstanding. I am now studying at Oxford on a 100% scholarship thanks to her direction.",
    stars: 5,
  },
  {
    name: "Manish Kumar",
    role: "Assistant Commissioner, UPSC CSE 2023",
    emoji: "🏛️",
    text: "I had faced setbacks in my initial attempts at competitive civil services exams. Principal Ma'am helped me restructure my daily habits, build emotional resilience, and conquer negative self-talk. In my very next attempt, I cleared with an All India Rank. Eternally grateful!",
    stars: 5,
  },
];

export default function TestimonialsPage() {
  const { settings } = useSite();

  return (
    <main className="page-wrapper" style={{ paddingTop: "6.5rem", paddingBottom: "5rem" }}>
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div className="section-tag">Student &amp; Parent Stories</div>
            <h1 className="section-title">
              Lives <span>Transformed</span>
            </h1>
            <p className="section-subtitle">
              Authentic stories from students, parents, and working professionals whose trajectories have been reshaped through guidance.
            </p>
          </div>

          {/* Key Stats from Site Context */}
          <div className="grid-4" style={{ marginBottom: "4rem" }}>
            {[
              [settings.studentsGuided, "Students Mentored"],
              [settings.successRate, "Positive Outcome Rate"],
              [settings.yearsExperience, "Years Dedicated Service"],
              ["50+", "Cities Reached Globally"],
            ].map(([val, label]) => (
              <div key={label} className="card card-gold text-center" style={{ padding: "1.75rem" }}>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: "2.25rem", fontWeight: 800, color: "var(--gold)" }}>
                  {val}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.4rem" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial Cards */}
          <div className="grid-3">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="card card-gold testimonial-card animate-in"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "2rem",
                }}
              >
                <div>
                  <div style={{ color: "var(--gold)", fontSize: "1.2rem", letterSpacing: "2px", marginBottom: "1rem" }}>
                    {"★".repeat(t.stars)}
                  </div>
                  <p className="testimonial-text" style={{ fontSize: "0.925rem", lineHeight: 1.8, color: "var(--text-primary)" }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>

                <div className="testimonial-author" style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "1.5rem" }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(26,58,143,0.5), rgba(201,168,76,0.3))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.6rem",
                      border: "2px solid var(--gold)",
                      flexShrink: 0,
                    }}
                  >
                    {t.emoji}
                  </div>
                  <div>
                    <div className="testimonial-name" style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>
                      {t.name}
                    </div>
                    <div className="testimonial-role" style={{ color: "var(--gold)", fontSize: "0.8rem" }}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              Ready to embark on your personalized path to success?
            </h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              Book an initial 1-on-1 counseling session with {settings.principalName} today.
            </p>
            <Link href="/contact" className="btn btn-gold">
              Book a Counseling Session 💬
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
