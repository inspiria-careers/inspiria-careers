"use client";
import React, { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console without breaking user interface
    console.error("Application error captured:", error);
  }, [error]);

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
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🕊️</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.75rem" }}>
          Something Went Wrong / कुछ त्रुटि हुई
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          We apologize for the inconvenience. Your data and private sessions remain secure. You may try refreshing or contact us directly.
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          असुविधा के लिए खेद है। आपका डेटा सुरक्षित है। कृपया पुनः प्रयास करें।
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => reset()} className="btn btn-primary">
            Try Again / पुनः प्रयास करें
          </button>
          <Link href="/" className="btn btn-secondary">
            Go to Home / मुख्य पृष्ठ
          </Link>
        </div>
      </div>
    </main>
  );
}
