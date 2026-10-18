import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="page-wrapper"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "3rem 2rem",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌿</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.75rem" }}>
          Page Not Found / पृष्ठ नहीं मिला
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          The page you are looking for may have been moved or does not exist. We encourage you to return to the homepage or reach out if you need assistance.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          आप जिस पृष्ठ को खोज रहे हैं वह उपलब्ध नहीं है। कृपया मुख्य पृष्ठ पर लौटें।
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">
            Return Home / मुख्य पृष्ठ
          </Link>
          <Link href="/contact" className="btn btn-secondary">
            Contact Support / संपर्क करें
          </Link>
        </div>
      </div>
    </main>
  );
}
