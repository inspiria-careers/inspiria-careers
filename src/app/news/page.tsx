import Link from "next/link";

const news = [
  {
    date: "2026-10-15",
    type: "Upcoming",
    icon: "🎓",
    title: "Career Orientation Workshop for Class 11 & 12 Students",
    desc: "Join Principal Ma'am for an in-depth career orientation workshop covering all streams and emerging career options. Limited seats available.",
    venue: "Online + Delhi Center Venue",
    time: "10:00 AM - 1:00 PM IST",
    registration: true,
  },
  {
    date: "2026-10-20",
    type: "Upcoming",
    icon: "👨‍👩‍👧",
    title: "Parent-Student Career Alignment Camp",
    desc: "A special interactive session designed for parents and students to jointly explore career pathways, minimize exam anxiety, and set realistic goals.",
    venue: "Inspiria Careers Guidance Auditorium",
    time: "2:00 PM - 5:00 PM IST",
    registration: true,
  },
  {
    date: "2026-11-01",
    type: "Upcoming",
    icon: "💻",
    title: "Free Live Webinar: Strategic Mindset for JEE & NEET 2027",
    desc: "Proven revision frameworks, psychological composure, and time-management strategies for competitive exam aspirants.",
    venue: "Online Live (Zoom / YouTube)",
    time: "6:00 PM - 8:00 PM IST",
    registration: true,
  },
  {
    date: "2026-09-28",
    type: "Recent",
    icon: "🏆",
    title: "Inspiria Careers Awarded Best Student Mentorship Platform",
    desc: "Recognized at the National EdTech & Guidance Summit for excellence in adolescent career guidance and mental wellness advocacy.",
    venue: "",
    time: "",
    registration: false,
  },
  {
    date: "2026-09-15",
    type: "Recent",
    icon: "📰",
    title: "New Article Series: Demystifying Global University Scholarships",
    desc: "Principal Ma'am has released a detailed 4-part guide detailing how Indian students can secure fully funded undergraduate scholarships abroad.",
    venue: "",
    time: "",
    registration: false,
  },
  {
    date: "2026-08-30",
    type: "Recent",
    icon: "🎙️",
    title: "Keynote Address: 'Redefining Success in Modern Education'",
    desc: "Full recording of Principal Ma'am's celebrated talk on shifting focus from rote marks to true passion and mental resilience is now streaming.",
    venue: "",
    time: "",
    registration: false,
  },
];

export default function NewsPage() {
  const upcoming = news.filter((n) => n.type === "Upcoming");
  const recent = news.filter((n) => n.type === "Recent");

  return (
    <main className="page-wrapper" style={{ paddingTop: "6.5rem", paddingBottom: "5rem" }}>
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <div className="section-tag">Announcements &amp; Workshops</div>
            <h1 className="section-title">
              News &amp; <span>Events</span>
            </h1>
            <p className="section-subtitle">
              Stay updated with upcoming counseling camps, webinars, workshops, and achievements.
            </p>
          </div>

          {/* Upcoming Events */}
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "1.6rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            🗓️ Upcoming Workshops &amp; Camps
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "4rem" }}>
            {upcoming.map((item, i) => (
              <div
                key={i}
                className="card card-gold animate-in"
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "1.5rem",
                  alignItems: "center",
                  borderLeft: "4px solid var(--gold)",
                  padding: "1.75rem",
                }}
              >
                <div style={{ fontSize: "2.75rem" }}>{item.icon}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <span className="badge badge-gold">{item.type}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      📅 {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    {item.time && (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        ⏰ {item.time}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: "0.5rem" }}>{item.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "0.5rem" }}>
                    {item.desc}
                  </p>
                  {item.venue && (
                    <p style={{ color: "var(--primary-light)", fontSize: "0.85rem" }}>
                      📍 {item.venue}
                    </p>
                  )}
                </div>
                {item.registration && (
                  <Link href="/contact" className="btn btn-gold btn-sm" style={{ whiteSpace: "nowrap" }}>
                    Register Free →
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Recent News */}
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "1.6rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            📰 Recent Highlights &amp; Media
          </h2>

          <div className="grid-3">
            {recent.map((item, i) => (
              <div key={i} className="card card-gold animate-in" style={{ padding: "1.75rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{item.icon}</div>
                <span className="badge badge-blue" style={{ marginBottom: "0.75rem", display: "inline-block" }}>
                  Announcement
                </span>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                  📅 {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <h3 style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
