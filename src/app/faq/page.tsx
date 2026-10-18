"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export default function FaqPage() {
  const { profile, lang } = useSite();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  const faqs = profile.faqList || [];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const qText = lang === "hi" ? faq.questionHi : faq.questionEn;
    const aText = lang === "hi" ? faq.answerHi : faq.answerEn;
    const matchesSearch =
      !searchQuery.trim() ||
      qText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      aText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page-wrapper">
      <section className="section">
        <div className="container" style={{ maxWidth: "860px" }}>
          <div className="section-header">
            <span className="section-tag">{t("faqs", lang)}</span>
            <h1 className="section-title">
              {lang === "hi" ? "अक्सर पूछे जाने वाले " : "Frequently Asked "}
              <span>{lang === "hi" ? "प्रश्न" : "Questions"}</span>
            </h1>
            <p className="section-subtitle">
              {lang === "hi"
                ? "परामर्श सत्र, गोपनीयता, रीशेड्यूल और भुगतान से जुड़े सभी सामान्य प्रश्नों के उत्तर।"
                : "Clear answers on appointment booking, session confidentiality, video links, and our cancellation policies."}
            </p>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: "2rem" }}>
            <input
              type="text"
              className="form-input"
              placeholder={lang === "hi" ? "प्रश्न खोजें..." : "Search questions (e.g. confidentiality, reschedule, payment)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "0.85rem 1.25rem", borderRadius: "12px", fontSize: "0.95rem" }}
            />
          </div>

          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem", justifyContent: "center" }}>
            {[
              { id: "all", label: lang === "hi" ? "सभी प्रश्न" : "All Topics" },
              { id: "privacy", label: lang === "hi" ? "गोपनीयता व सुरक्षा" : "Privacy & Confidentiality" },
              { id: "booking", label: lang === "hi" ? "बुकिंग व समय बदलना" : "Booking & Reschedule" },
              { id: "formats", label: lang === "hi" ? "ऑनलाइन व व्यक्तिगत सत्र" : "Session Formats & Links" },
              { id: "payments", label: lang === "hi" ? "शुल्क व भुगतान" : "Payments & Refunds" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "999px",
                  border: activeCategory === cat.id ? "2px solid var(--brand-primary)" : "1px solid var(--border)",
                  background: activeCategory === cat.id ? "rgba(26, 58, 143, 0.1)" : "transparent",
                  color: activeCategory === cat.id ? "var(--brand-primary)" : "var(--text-muted)",
                  fontWeight: activeCategory === cat.id ? 700 : 500,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ Accordion List */}
          {filteredFaqs.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              <p>No questions matched your search criteria.</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                const question = lang === "hi" ? faq.questionHi : faq.questionEn;
                const answer = lang === "hi" ? faq.answerHi : faq.answerEn;

                return (
                  <div
                    key={faq.id}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      border: isOpen ? "1.5px solid var(--brand-primary)" : "1px solid var(--border)",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                      style={{
                        width: "100%",
                        padding: "1.25rem 1.5rem",
                        background: "transparent",
                        border: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        textAlign: "left",
                        gap: "1rem",
                      }}
                    >
                      <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {question}
                      </span>
                      <span
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: 700,
                          color: "var(--brand-primary)",
                          transform: isOpen ? "rotate(45deg)" : "none",
                          transition: "transform 0.2s ease",
                        }}
                      >
                        +
                      </span>
                    </button>

                    {isOpen && (
                      <div
                        style={{
                          padding: "0 1.5rem 1.25rem",
                          color: "var(--text-muted)",
                          fontSize: "0.92rem",
                          lineHeight: 1.7,
                          borderTop: "1px dashed var(--border)",
                          paddingTop: "1rem",
                        }}
                      >
                        {answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Need More Assistance Banner */}
          <div
            className="card"
            style={{
              marginTop: "3rem",
              textAlign: "center",
              padding: "2rem",
              background: "linear-gradient(135deg, rgba(26,58,143,0.05) 0%, rgba(201,168,76,0.08) 100%)",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
              {lang === "hi" ? "क्या आपका प्रश्न यहाँ नहीं मिला?" : "Have More Questions?"}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 1.25rem" }}>
              {lang === "hi"
                ? "हमारी टीम से सीधे संपर्क करें या व्यक्तिगत परामर्श सत्र बुक करें।"
                : "Reach out directly via our contact form or send a message on WhatsApp for customized guidance."}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <Link href="/contact" className="btn btn-outline btn-sm">
                {t("contact", lang)}
              </Link>
              <Link href="/book" className="btn btn-primary btn-sm">
                {t("bookAppointment", lang)}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
