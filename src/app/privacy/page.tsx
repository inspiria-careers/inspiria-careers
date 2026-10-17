"use client";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

export default function PrivacyPage() {
  const { profile, lang } = useSite();
  const siteName = profile.siteName || "Inspiria Careers";

  return (
    <div className="page-wrapper">
      <div className="container" style={{ padding: "4rem 1.25rem", maxWidth: "840px" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ marginBottom: "1.5rem" }}>
            ← {t("home", lang)}
          </Link>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
            {lang === "hi" ? "गोपनीयता नीति एवं आचार संहिता" : "Privacy Policy & Code of Ethics"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {lang === "hi" 
              ? `अंतिम अद्यतन: ${new Date().toLocaleDateString("hi-IN")}` 
              : `Last Updated: ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
          </p>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "2rem", lineHeight: 1.8 }}>
          <section>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem" }}>
              {lang === "hi" ? "1. पूर्ण गोपनीयता का वचन" : "1. Confidentiality Commitment"}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {lang === "hi"
                ? `${siteName} में परामर्श सत्रों के दौरान साझा की गई समस्त व्यक्तिगत, शैक्षणिक, पेशेवर या मानसिक स्थिति की जानकारी 100% गोपनीय रखी जाती है। किसी भी तीसरे पक्ष के साथ आपकी सहमति के बिना कोई जानकारी साझा नहीं की जाएगी।`
                : `At ${siteName}, all personal, academic, psychological, or career data shared during consultations is held in strict professional confidence. No information is disclosed to third parties without prior written consent.`}
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem" }}>
              {lang === "hi" ? "2. एकत्रित की जाने वाली जानकारी" : "2. Information We Collect"}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {lang === "hi"
                ? "हम केवल वही आवश्यक जानकारी एकत्र करते हैं जो आपको बेहतर मार्गदर्शन और अपॉइंटमेंट समय निर्धारण के लिए आवश्यक है, जैसे आपका नाम, ईमेल, फोन नंबर और शैक्षणिक पृष्ठभूमि।"
                : "We collect only information essential to provide counselling and schedule appointments, including your name, email address, contact phone number, and brief notes regarding your guidance goals."}
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem" }}>
              {lang === "hi" ? "3. डेटा सुरक्षा" : "3. Data Protection & Security"}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {lang === "hi"
                ? "आपकी जानकारी उद्योग मानक एन्क्रिप्शन और सुरक्षित क्लाउड डेटाबेस (Google Firebase) में संग्रहित की जाती है।"
                : "Your data is stored securely using industry-standard encryption protocols on Google Firebase infrastructure with role-based access restrictions."}
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem" }}>
              {lang === "hi" ? "4. आपातकालीन अस्वीकरण" : "4. Emergency Disclaimer"}
            </h2>
            <div className="alert alert-warning" style={{ fontSize: "0.9rem" }}>
              {t("emergencyDisclaimer", lang)}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.75rem" }}>
              {lang === "hi" ? "5. हमसे संपर्क करें" : "5. Contact Information"}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {profile.email ? (
                <>
                  {lang === "hi" ? "किसी भी प्रश्न के लिए संपर्क करें: " : "For questions regarding your privacy, contact: "}
                  <a href={`mailto:${profile.email}`} style={{ fontWeight: 600 }}>{profile.email}</a>
                </>
              ) : (
                t("detailsComingSoon", lang)
              )}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
