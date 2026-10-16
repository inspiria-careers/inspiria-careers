"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";

const qualifications = [
  {
    year: "2008",
    title: "M.Ed - Master of Education (Guidance & Counseling)",
    org: "University of Delhi",
    desc: "Specialized in Adolescent Psychology, Cognitive Development, and Educational Guidance.",
  },
  {
    year: "2012",
    title: "Certified Master Career Counselor",
    org: "NCERT & Global Career Development Facilitator",
    desc: "Aptitude profiling, psychometric evaluation, and multi-stream career mapping.",
  },
  {
    year: "2017",
    title: "Adolescent Mental Health & Life Skills Educator",
    org: "UNESCO India & NIMHANS",
    desc: "Certified interventionist for stress management, emotional resilience, and family counseling.",
  },
  {
    year: "2022",
    title: "Global Higher Education & Admissions Advisor",
    org: "International Counselors Association",
    desc: "Guiding students into Ivy League, IITs, AIIMS, Oxford, and top Indian central universities.",
  },
];

const expertise = [
  {
    icon: "🎓",
    title: "Career Counseling & Stream Selection",
    desc: "Scientific aptitude evaluation to discover careers matching innate strengths, temperament, and industry trends.",
  },
  {
    icon: "📚",
    title: "Academic Planning & Study Strategies",
    desc: "Customized time-management routines, memory retention techniques, and personalized revision schedules.",
  },
  {
    icon: "🧠",
    title: "Mental Wellness & Stress Resilience",
    desc: "Overcoming fear of failure, performance anxiety, and building emotional fortitude for life's milestones.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Parent-Child Counseling Sessions",
    desc: "Empowering parents to understand their teenager's mindset, resolve expectations conflict, and nurture mutual trust.",
  },
  {
    icon: "📝",
    title: "Competitive Exam Mentorship",
    desc: "Strategic temperament coaching and high-pressure composure training for JEE, NEET, UPSC, and CUET.",
  },
  {
    icon: "🌐",
    title: "Study Abroad Admissions",
    desc: "Profile building, Statement of Purpose (SOP) guidance, and scholarship strategies for global universities.",
  },
];

export default function AboutPage() {
  const { settings } = useSite();

  // Split multi-paragraph About Us content cleanly
  const paragraphs = (settings.aboutContent || settings.aboutBio).split("\n").filter((p) => p.trim() !== "");

  return (
    <main className="page-wrapper" style={{ paddingTop: "6.5rem", paddingBottom: "5rem" }}>
      {/* Hero Section */}
      <section className="section" style={{ background: "linear-gradient(135deg, rgba(26,58,143,0.25), rgba(201,168,76,0.08))" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "3.5rem", alignItems: "center" }}>
            <div>
              <div className="section-tag">About Counselor</div>
              <h1 className="section-title" style={{ textAlign: "left", marginTop: "0.75rem" }}>
                Meet <span>{settings.principalName}</span>
              </h1>
              <h3 style={{ color: "var(--gold)", fontSize: "1.25rem", margin: "1rem 0" }}>
                {settings.aboutTitle}
              </h3>

              {/* Render dynamic About Us story paragraphs */}
              <div style={{ color: "var(--text-muted)", lineHeight: 1.9, display: "flex", flexDirection: "column", gap: "1rem" }}>
                {paragraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              {settings.philosophy && (
                <blockquote
                  style={{
                    borderLeft: "4px solid var(--gold)",
                    paddingLeft: "1.25rem",
                    margin: "1.75rem 0",
                    fontStyle: "italic",
                    color: "var(--text-primary)",
                    background: "rgba(201,168,76,0.08)",
                    padding: "1rem 1.25rem",
                    borderRadius: "0 10px 10px 0",
                  }}
                >
                  &ldquo;{settings.philosophy}&rdquo;
                </blockquote>
              )}

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                <span className="badge badge-gold">M.Ed Certified</span>
                <span className="badge badge-blue">NCERT Certified</span>
                <span className="badge badge-green">Life Skills Coach</span>
                <span className="badge badge-gold">{settings.yearsExperience} Experience</span>
              </div>
            </div>

            {/* Passport Photo & Profile Card */}
            <div className="card card-gold" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
              <div
                style={{
                  width: 150,
                  height: 190,
                  borderRadius: 16,
                  margin: "0 auto 1.5rem",
                  overflow: "hidden",
                  border: "3px solid var(--gold)",
                  boxShadow: "0 8px 30px rgba(201,168,76,0.35)",
                  background: "#07122b",
                  position: "relative",
                }}
              >
                <img
                  src={settings.principalPhoto || "/logo.jpg"}
                  alt={settings.principalName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.75rem", fontWeight: 700 }}>
                {settings.principalName}
              </h2>
              <p style={{ color: "var(--gold)", margin: "0.4rem 0 1.25rem", fontWeight: 500 }}>
                {settings.principalDesignation || "Senior Educational & Career Counselor"}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
                {[
                  [settings.studentsGuided, settings.studentsGuidedLabel || "Students Guided"],
                  [settings.yearsExperience, settings.yearsExperienceLabel || "Years Experience"],
                  [settings.successRate, settings.successRateLabel || "Success Rate"],
                  [settings.statMetric4Value || "100%", settings.statMetric4Label || "Personalized Attention"],
                ].map(([val, label]) => (
                  <div key={label} style={{ background: "rgba(201,168,76,0.08)", borderRadius: 10, padding: "0.85rem" }}>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)" }}>
                      {val}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "1.75rem" }}>
                <Link href="/contact" className="btn btn-gold w-full" style={{ width: "100%", justifyContent: "center" }}>
                  Book a Counseling Session 💬
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. UNDERTAKEN ACTIVITIES & CORE PILLARS ── */}
      <section className="section" style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="section-tag">Undertaken Activities</div>
            <h2 className="section-title">
              Our 3 Pillars of <span>Student Mentorship</span>
            </h2>
            <p className="section-subtitle">
              Bridging the gap between aspiration and actionable execution from high school to professional life.
            </p>
          </div>

          <div className="grid-3">
            <div className="card card-teal animate-in" style={{ padding: "2rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎯</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.75rem" }}>
                1. High School &amp; Intermediate Guidance
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.8 }}>
                Mentored hundreds of students in choosing the right field at high school and at the intermediate level of school and college. Eliminating the 97% career regret phenomenon through proactive exploration.
              </p>
            </div>

            <div className="card card-gold animate-in" style={{ padding: "2rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📚</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.75rem" }}>
                2. College Electives &amp; Discipline Studies
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.8 }}>
                Providing associated students a thorough study of electives and disciplines preached at the college level, clarifying what each pathway unlocks in terms of future opportunities and real-world application.
              </p>
            </div>

            <div className="card card-teal animate-in" style={{ padding: "2rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚀</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.75rem" }}>
                3. Inclusive All-Level Guidance
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.8 }}>
                Guided students at all levels — whether proficient, struggling, or below average. Across Education, Sports, or Entrepreneurship, all connected youth receive targeted mentors and the right competitions to thrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. PHILOSOPHY & WHY YOU NEED US (THE SOCRATIC INQUISITIONS) ── */}
      <section id="socratic" className="section" style={{ background: "#f8fafc" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "3.5rem", alignItems: "center" }}>
            <div>
              <div className="section-tag">Mentorship Philosophy</div>
              <h2 className="section-title" style={{ textAlign: "left", marginTop: "0.5rem" }}>
                Why Do You Need Us? <span>The Socratic Approach</span>
              </h2>
              <div style={{ color: "var(--text)", lineHeight: 1.85, fontSize: "0.98rem", display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.25rem" }}>
                <p>
                  A brilliant mind once said, <em>&ldquo;Choose a job you love, and you will never have to work a day in your life.&rdquo;</em> Easier said than done. How many people truly interrogate their gray matter to discover their authentic calling, rather than simply following the crowd?
                </p>
                <p>
                  <strong>To be honest, even counselors cannot hand you the ultimate truth about your future on a platter.</strong> Pragmatically speaking, no one knows upfront. So why do you need us?
                </p>
                <p>
                  <strong>Because we impose diagnostic inquisitions upon you.</strong> History has demonstrated that the most effective methodology to resolve and optimize any complex problem is through structured, searching confabs. Being good at a particular subject does not guarantee you will be happy pursuing it. We help you distinguish between what is merely popular and what genuinely quenches your curiosity.
                </p>
                <p>
                  Beyond discovering your interest, most students lack the <strong>instruments of growth</strong>. We unlock those instruments — connecting you with the right competitions, channels, mentors, and field directors to kickstart your trajectory with certainty.
                </p>
              </div>
            </div>

            <div className="card card-gold" style={{ padding: "2.5rem", background: "linear-gradient(135deg, rgba(0,33,71,0.04), rgba(201,168,76,0.12))", border: "1px solid var(--border-gold)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📈</div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>
                Stock in Your Life&apos;s Demat Account
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.8, marginBottom: "1.25rem" }}>
                You invest in financial assets for long-term security. Yet 97% of people gamble with their career choices, wasting years in regret. A structured <strong>Career Plan</strong> is the single most valuable stock in the demat account of your life.
              </p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
                <li style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                  <span>✅</span> <strong>Independent Problem Solvers:</strong> Turning students into self-reliant debuggers of life.
                </li>
                <li style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                  <span>✅</span> <strong>Lived Faculty Experience:</strong> Insights from seniors, educators, and field veterans.
                </li>
                <li style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                  <span>✅</span> <strong>Direct Growth Instruments:</strong> Competitions, scholarship portals &amp; curated mentors.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3B. REASON FOR THE APPEAL & PARTNER'S EXPERIENCE ── */}
      <section id="appeal" className="section" style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "3.5rem", alignItems: "center" }}>
            <div>
              <div className="section-tag">Reason for the Appeal</div>
              <h2 className="section-title" style={{ textAlign: "left", marginTop: "0.5rem" }}>
                Being a Teacher by Love: <span>Ceasing the Era of Doubt</span>
              </h2>
              <div style={{ color: "var(--text-muted)", lineHeight: 1.85, fontSize: "0.98rem", display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.25rem" }}>
                <p>
                  Being a teacher by love inspires and directs me to guide my students with not just apposite theoretical knowledge but to also make them <strong>independent debuggers in solving their problems</strong>. I have made myriad mistakes in my life, be it professionally or even at a personal level.
                </p>
                <p>
                  The one thing which pinched me — and certainly does the same with <strong>97% of people all around</strong> — is the lack of genuine and full-fledged knowledge and experience of the field of interest. We all regret and waste a good hunch of our life in the same.
                </p>
                <p>
                  I have been practicing counseling for years, but now it is time to professionally implement it on a broader horizon. I have been kind of hating the era of 2000s for the simple reason that despite the availability of counselors globally, umpteen students are still in the mode of regretting rather than solving.
                </p>
                <p style={{ color: "var(--navy)", fontWeight: 700 }}>
                  Now, with the magnificent advancement in technology in numbers and in quality, the era of doubt in choosing the career plan will cease. This is what I aspire through Inspiria Careers.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className="card card-teal" style={{ padding: "2rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🤝</div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>
                  Partner&apos;s Experience &amp; Collective Wisdom
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>
                  Having assistance from faculties of different fields, associated students pursuing all X, Y, and Z trajectories, and indelible experiences of having gone through your seniors as a teacher and mentor is the same that has led us to empower and change the lives of zillions inclusive of direct and second-hand terms.
                </p>
              </div>

              <div className="card card-gold" style={{ padding: "2rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎯</div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>
                  Counselling Experience Across Milestones
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>
                  Mentored hundreds at high school, intermediate college, and beyond. Whether proficient, average, or struggling, students in education, sports, or entrepreneurship receive dedicated mentors and the right competitions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. 5-7 YEAR GLOBAL BLUEPRINT & GOALS ── */}
      <section id="vision" className="section" style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="section-tag">Vision &amp; Expansion</div>
            <h2 className="section-title">
              Our 5-Year <span>Global Blueprint</span>
            </h2>
            <p className="section-subtitle">
              Pioneering a worldwide paradigm where accessing world-class career mentorship is as effortless as ordering a pizza.
            </p>
          </div>

          <div className="grid-3">
            {[
              {
                icon: "🍕",
                title: "1. Zero-Doubt Global Accessibility",
                desc: "Establishing career counseling globally so that every student knows about it as naturally as coaching institutes. Guidance with absolute transparency and ease of application.",
              },
              {
                icon: "🌐",
                title: "2. Worldwide Mentor Network",
                desc: "Connecting accomplished mentors across Ivy League, premier Indian institutions, research centers, and global enterprises who share our vision of selfless guidance.",
              },
              {
                icon: "📊",
                title: "3. Nuanced Field Database",
                desc: "Building a comprehensive database comparing global academic fields, real student reviews, career paths, and authentic post-counseling journey analytics.",
              },
              {
                icon: "📱",
                title: "4. User-Centric Mobile Apps",
                desc: "Developing seamless, intuitive Android and iOS mobile applications to bring psychometric profiling, slot booking, and resources directly to your pocket.",
              },
              {
                icon: "🎙️",
                title: "5. Global Orientation Webinars",
                desc: "Conducting continuous masterclasses and live webinars highlighting evolving global careers, application requirements, and real transformation stories.",
              },
              {
                icon: "🤝",
                title: "6. Interdisciplinary Coaching",
                desc: "Assisting students pursuing atypical, non-linear trajectories across sports, creative arts, and entrepreneurship with equal rigor.",
              },
            ].map((goal, i) => (
              <div key={i} className="card card-teal animate-in" style={{ padding: "1.75rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{goal.icon}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)", marginBottom: "0.5rem" }}>
                  {goal.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.7 }}>
                  {goal.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas of Expertise */}
      <section className="section" style={{ background: "#f8fafc" }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="section-tag">Core Competencies</div>
            <h2 className="section-title">
              Counseling <span>Specializations</span>
            </h2>
            <p className="section-subtitle">
              Holistic mentoring designed to support students and families at every critical milestone.
            </p>
          </div>

          <div className="grid-3">
            {expertise.map((item, i) => (
              <div key={i} className="card card-gold animate-in" style={{ padding: "2rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{item.icon}</div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.75rem" }}>{item.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qualifications & Timeline */}
      <section className="section" style={{ background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div className="section-tag">Credentials</div>
            <h2 className="section-title">
              Education &amp; <span>Certifications</span>
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {qualifications.map((q, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  borderLeft: "4px solid var(--gold)",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    background: "rgba(201,168,76,0.15)",
                    color: "var(--gold)",
                    padding: "0.4rem 0.8rem",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  {q.year}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.3rem" }}>{q.title}</h3>
                  <div style={{ color: "var(--primary-light)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>{q.org}</div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>{q.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
