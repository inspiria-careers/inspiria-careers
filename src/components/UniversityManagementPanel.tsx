"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSite } from "@/contexts/SiteContext";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/lib/auditLog";
import {
  INTERNATIONAL_UNIVERSITIES,
  UniversityItem,
} from "@/data/internationalUniversities";

interface UniversityManagementPanelProps {
  viewerRole: "counsellor" | "admin";
}

const DEFAULT_UNIVERSITY_FORM: UniversityItem = {
  id: "",
  rank: 1,
  name: "",
  nameHi: "",
  country: "USA",
  countryHi: "संयुक्त राज्य अमेरिका (USA)",
  flag: "🏛️",
  badge: "Global Excellence",
  badgeHi: "वैश्विक उत्कृष्टता",
  coreStrengths: ["Computer Science", "Engineering"],
  coreStrengthsHi: ["कंप्यूटर साइंस", "इंजीनियरिंग"],
  courseDuration: "4 Years (Undergraduate)",
  courseDurationHi: "4 वर्ष (स्नातक)",
  internshipsAndIndustry: "Comprehensive research and industry work placement opportunities.",
  internshipsAndIndustryHi: "व्यापक अनुसंधान और उद्योग कार्य अनुभव के अवसर।",
  tuitionFees: {
    tuition: "$50,000/year",
    livingAndHousing: "$20,000/year",
    totalCoa: "$70,000/year",
    currency: "USD",
  },
  scholarshipsAndAid: "Need-based and merit aid available for international students.",
  scholarshipsAndAidHi: "अंतर्राष्ट्रीय छात्रों के लिए आवश्यकता-आधारित और योग्यता सहायता उपलब्ध।",
  aidType: "Need-Blind",
  admissionDeadlines: {
    earlyDeadline: "Nov 1",
    regularDeadline: "Jan 1",
    decisionRelease: "Mid-March",
    portal: "Common App",
  },
  counselorTip: "Focus on demonstrated academic curiosity, impact, and authentic personal essays.",
  counselorTipHi: "शैक्षणिक जिज्ञासा, प्रभाव और प्रामाणिक निबंधों पर ध्यान केंद्रित करें।",
};

export default function UniversityManagementPanel({ viewerRole }: UniversityManagementPanelProps) {
  const { universities, updateUniversities, lang } = useSite();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("All");
  const [editingUniversity, setEditingUniversity] = useState<UniversityItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UniversityItem>(DEFAULT_UNIVERSITY_FORM);
  const [strengthsInputEn, setStrengthsInputEn] = useState("");
  const [strengthsInputHi, setStrengthsInputHi] = useState("");

  const list = universities && universities.length > 0 ? universities : INTERNATIONAL_UNIVERSITIES;

  const filtered = useMemo(() => {
    return list.filter((u) => {
      if (filterCountry !== "All" && u.country !== filterCountry) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        u.name.toLowerCase().includes(q) ||
        u.nameHi.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q) ||
        u.counselorTip.toLowerCase().includes(q)
      );
    });
  }, [list, filterCountry, search]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    list.forEach((u) => set.add(u.country));
    return ["All", ...Array.from(set)];
  }, [list]);

  const handleOpenEdit = (uni: UniversityItem) => {
    setIsCreating(false);
    setFormData(JSON.parse(JSON.stringify(uni)));
    setStrengthsInputEn((uni.coreStrengths || []).join(", "));
    setStrengthsInputHi((uni.coreStrengthsHi || []).join(", "));
    setEditingUniversity(uni);
  };

  const handleOpenCreate = () => {
    setIsCreating(true);
    const newUni: UniversityItem = {
      ...DEFAULT_UNIVERSITY_FORM,
      id: "uni-" + Date.now(),
      rank: list.length + 1,
    };
    setFormData(newUni);
    setStrengthsInputEn(newUni.coreStrengths.join(", "));
    setStrengthsInputHi(newUni.coreStrengthsHi.join(", "));
    setEditingUniversity(newUni);
  };

  const handleCloseModal = () => {
    setEditingUniversity(null);
    setIsCreating(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("University name is required.");
      return;
    }

    try {
      setSaving(true);
      const cleanedStrengthsEn = strengthsInputEn
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanedStrengthsHi = strengthsInputHi
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const finalItem: UniversityItem = {
        ...formData,
        id: formData.id || "uni-" + Date.now(),
        name: formData.name.trim(),
        nameHi: formData.nameHi.trim() || formData.name.trim(),
        country: formData.country.trim(),
        countryHi: formData.countryHi.trim() || formData.country.trim(),
        flag: formData.flag.trim() || "🏛️",
        badge: formData.badge.trim() || "Global Excellence",
        badgeHi: formData.badgeHi.trim() || formData.badge.trim(),
        coreStrengths: cleanedStrengthsEn.length > 0 ? cleanedStrengthsEn : ["General Academics"],
        coreStrengthsHi: cleanedStrengthsHi.length > 0 ? cleanedStrengthsHi : ["सामान्य शिक्षा"],
        courseDuration: formData.courseDuration.trim(),
        courseDurationHi: formData.courseDurationHi.trim() || formData.courseDuration.trim(),
        internshipsAndIndustry: formData.internshipsAndIndustry.trim(),
        internshipsAndIndustryHi:
          formData.internshipsAndIndustryHi.trim() || formData.internshipsAndIndustry.trim(),
        tuitionFees: {
          tuition: formData.tuitionFees?.tuition?.trim() || "Contact University",
          livingAndHousing: formData.tuitionFees?.livingAndHousing?.trim() || "Variable",
          totalCoa: formData.tuitionFees?.totalCoa?.trim() || "Contact University",
          currency: formData.tuitionFees?.currency?.trim() || "USD",
        },
        scholarshipsAndAid: formData.scholarshipsAndAid.trim(),
        scholarshipsAndAidHi:
          formData.scholarshipsAndAidHi.trim() || formData.scholarshipsAndAid.trim(),
        aidType: formData.aidType || "Need-Blind",
        admissionDeadlines: {
          earlyDeadline: formData.admissionDeadlines?.earlyDeadline?.trim() || undefined,
          regularDeadline: formData.admissionDeadlines?.regularDeadline?.trim() || "Rolling",
          decisionRelease: formData.admissionDeadlines?.decisionRelease?.trim() || undefined,
          portal: formData.admissionDeadlines?.portal?.trim() || "Direct / Common App",
        },
        counselorTip: formData.counselorTip.trim(),
        counselorTipHi: formData.counselorTipHi.trim() || formData.counselorTip.trim(),
      };

      let updatedList: UniversityItem[];
      if (isCreating) {
        updatedList = [...list, finalItem];
      } else {
        updatedList = list.map((u) => (u.id === finalItem.id ? finalItem : u));
      }

      await updateUniversities(updatedList);

      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: viewerRole,
        action: isCreating ? "ADD_UNIVERSITY" : "UPDATE_UNIVERSITY",
        details: `${isCreating ? "Added" : "Updated"} university ${finalItem.name} (${finalItem.country})`,
        targetId: finalItem.id,
      });

      setFeedbackMsg(
        lang === "hi"
          ? `✓ विश्वविद्यालय "${finalItem.name}" का विवरण सफलतापूर्वक सहेजा गया!`
          : `✓ Successfully saved details for "${finalItem.name}"!`
      );
      setTimeout(() => setFeedbackMsg(null), 4000);
      handleCloseModal();
    } catch (err: any) {
      console.error("Error saving university:", err);
      alert("Failed to save university details: " + (err?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uni: UniversityItem) => {
    if (
      !confirm(
        `Are you sure you want to remove "${uni.name}" from the university admissions guide?`
      )
    ) {
      return;
    }

    try {
      const updatedList = list.filter((u) => u.id !== uni.id);
      await updateUniversities(updatedList);

      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: viewerRole,
        action: "DELETE_UNIVERSITY",
        details: `Deleted university ${uni.name}`,
        targetId: uni.id,
      });

      setFeedbackMsg(
        lang === "hi"
          ? `✓ विश्वविद्यालय "${uni.name}" हटा दिया गया।`
          : `✓ University "${uni.name}" removed.`
      );
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch {
      alert("Failed to delete university.");
    }
  };

  const handleResetToDefaults = async () => {
    if (
      !confirm(
        "Reset to default Top 10 International Universities (MIT, Oxford, Stanford, Cambridge, NUS, Harvard, Caltech, ETH Zurich, Imperial College, Toronto)? Any custom additions will be restored."
      )
    ) {
      return;
    }

    try {
      await updateUniversities(INTERNATIONAL_UNIVERSITIES);
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: viewerRole,
        action: "RESET_UNIVERSITIES",
        details: "Reset universities guide to default top 10 international universities",
      });
      setFeedbackMsg("✓ Reset to default Top 10 International Universities!");
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch {
      alert("Failed to reset universities.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="dash-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>🏛️ {lang === "hi" ? "अंतर्राष्ट्रीय विश्वविद्यालय गाइड प्रबंधन" : "International Universities Guide"}</h1>
          <p>
            {lang === "hi"
              ? "काउंसलर व एडमिन द्वारा शीर्ष विश्वविद्यालयों के प्रवेश मानदंड, ट्यूशन फीस, वित्तीय सहायता व सुझावों का संपादन।"
              : "Manage top international admissions criteria, cost of attendance (COA), scholarships, key deadlines, and insider tips."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/universities" target="_blank" className="btn btn-outline btn-sm">
            👁️ {lang === "hi" ? "लाइव पेज देखें" : "View Live Page"}
          </Link>
          <button type="button" onClick={handleResetToDefaults} className="btn btn-ghost btn-sm" title="Restore default 10 universities">
            🔄 {lang === "hi" ? "डिफ़ॉल्ट 10 रीसेट" : "Reset Defaults"}
          </button>
          <button type="button" onClick={handleOpenCreate} className="btn btn-primary btn-sm">
            + {lang === "hi" ? "विश्वविद्यालय जोड़ें" : "Add University"}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
          {feedbackMsg}
        </div>
      )}

      {/* Filter and stats row */}
      <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", flex: 1, minWidth: "260px" }}>
            <input
              type="text"
              placeholder={lang === "hi" ? "विश्वविद्यालय या देश खोजें..." : "Search university, country, or tip..."}
              className="form-input"
              style={{ maxWidth: "300px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="form-select"
              style={{ maxWidth: "160px" }}
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Showing <strong>{filtered.length}</strong> of <strong>{list.length}</strong> universities
          </div>
        </div>
      </div>

      {/* Universities Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
        {filtered.map((u) => (
          <div
            key={u.id}
            className="card"
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderTop: "3px solid var(--brand-primary)",
            }}
          >
            <div>
              {/* Header: Rank, Flag, Name */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{u.flag}</span>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>
                      {u.name}
                    </h3>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {u.country} • Rank #{u.rank}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "12px",
                    background: "rgba(26,58,143,0.1)",
                    color: "var(--brand-primary)",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {u.aidType}
                </span>
              </div>

              {/* Distinction Badge */}
              {u.badge && (
                <div style={{ fontSize: "0.8rem", color: "var(--brand-secondary)", fontWeight: 600, marginBottom: "0.75rem" }}>
                  ⭐ {u.badge}
                </div>
              )}

              {/* COA & Deadlines info box */}
              <div
                style={{
                  background: "var(--surface-2)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem",
                  fontSize: "0.82rem",
                  marginBottom: "0.75rem",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block" }}>TOTAL COA:</span>
                  <strong>{u.tuitionFees?.totalCoa || "N/A"}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", display: "block" }}>REGULAR DEADLINE:</span>
                  <strong>{u.admissionDeadlines?.regularDeadline || "Rolling"}</strong>
                </div>
              </div>

              {/* Core Strengths */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.75rem" }}>
                {(u.coreStrengths || []).slice(0, 4).map((str, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "0.72rem",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "6px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {str}
                  </span>
                ))}
              </div>

              {/* Counselor Tip Snippet */}
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  margin: "0 0 1rem",
                }}
              >
                &ldquo;{u.counselorTip}&rdquo;
              </p>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--border)",
                paddingTop: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              <Link
                href={`/universities#uni-${u.id}`}
                target="_blank"
                style={{ fontSize: "0.78rem", color: "var(--brand-primary)", textDecoration: "underline" }}
              >
                View on Site ↗
              </Link>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(u)}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(u)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "var(--error)" }}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── EDIT / CREATE MODAL POPUP WINDOW ── */}
      {editingUniversity && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 9999,
          }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: "780px", background: "var(--surface)", maxHeight: "90vh", overflowY: "auto", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--brand-primary)" }}>
                {isCreating ? "➕ Add New University" : `✏️ Edit Details: ${formData.name}`}
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* SECTION 1: IDENTITY */}
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                  1. University Identity &amp; Ranking
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Global Rank *</label>
                    <input
                      type="number"
                      min={1}
                      className="form-input"
                      value={formData.rank}
                      onChange={(e) => setFormData({ ...formData, rank: Number(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">University Name (English) *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Stanford University"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Flag Emoji *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.flag}
                      onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                      placeholder="🇺🇸"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Name (Hindi / हिंदी)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.nameHi}
                      onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                      placeholder="e.g. स्टैनफोर्ड विश्वविद्यालय"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country (English) *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="USA / UK / Canada / Singapore"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Distinction Badge (English)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="e.g. World #1 in Tech & Innovation"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Distinction Badge (Hindi)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.badgeHi}
                      onChange={(e) => setFormData({ ...formData, badgeHi: e.target.value })}
                      placeholder="e.g. विश्व #1 प्रौद्योगिकी एवं नवाचार"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ACADEMIC STRENGTHS */}
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                  2. Academic Strengths &amp; Programs
                </h4>
                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <label className="form-label">Core Strengths (English, comma-separated) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={strengthsInputEn}
                    onChange={(e) => setStrengthsInputEn(e.target.value)}
                    placeholder="Computer Science, Engineering, Physical Sciences, Economics"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <label className="form-label">Core Strengths (Hindi, comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={strengthsInputHi}
                    onChange={(e) => setStrengthsInputHi(e.target.value)}
                    placeholder="कंप्यूटर साइंस, इंजीनियरिंग, भौतिक विज्ञान"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Course Duration (English) *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.courseDuration}
                      onChange={(e) => setFormData({ ...formData, courseDuration: e.target.value })}
                      placeholder="e.g. 4 Years (B.S.)"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course Duration (Hindi)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.courseDurationHi}
                      onChange={(e) => setFormData({ ...formData, courseDurationHi: e.target.value })}
                      placeholder="e.g. 4 वर्ष (बी.एस.)"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: INTERNSHIPS & INDUSTRY */}
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                  3. Internships &amp; Industry Integration
                </h4>
                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                  <label className="form-label">Industry &amp; Research Opportunities (English)</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={formData.internshipsAndIndustry}
                    onChange={(e) => setFormData({ ...formData, internshipsAndIndustry: e.target.value })}
                    placeholder="Details about co-op, research initiatives, work-study, industry ties..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry &amp; Research Opportunities (Hindi)</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={formData.internshipsAndIndustryHi}
                    onChange={(e) => setFormData({ ...formData, internshipsAndIndustryHi: e.target.value })}
                    placeholder="अनुसंधान और उद्योग कार्य अनुभव का विवरण..."
                  />
                </div>
              </div>

              {/* SECTION 4: FINANCIALS & SCHOLARSHIPS */}
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                  4. Tuition Fees, Total COA &amp; Financial Aid Strategy
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Tuition &amp; Fees *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.tuitionFees?.tuition || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tuitionFees: { ...formData.tuitionFees, tuition: e.target.value },
                        })
                      }
                      placeholder="~$64,310/year"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Living &amp; Housing *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.tuitionFees?.livingAndHousing || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tuitionFees: { ...formData.tuitionFees, livingAndHousing: e.target.value },
                        })
                      }
                      placeholder="~$25,000/year"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total COA *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.tuitionFees?.totalCoa || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tuitionFees: { ...formData.tuitionFees, totalCoa: e.target.value },
                        })
                      }
                      placeholder="~$89,310/year"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aid Classification *</label>
                    <select
                      className="form-select"
                      value={formData.aidType}
                      onChange={(e) => setFormData({ ...formData, aidType: e.target.value as any })}
                    >
                      <option value="Need-Blind">Need-Blind</option>
                      <option value="Need-Met">Need-Met</option>
                      <option value="Merit-Based">Merit-Based</option>
                      <option value="Subsidized Grant">Subsidized Grant</option>
                      <option value="Low Tuition">Low Tuition</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Scholarships &amp; Aid Strategy (English)</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      value={formData.scholarshipsAndAid}
                      onChange={(e) => setFormData({ ...formData, scholarshipsAndAid: e.target.value })}
                      placeholder="Eligibility criteria, family income thresholds, aid coverage..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scholarships &amp; Aid Strategy (Hindi)</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      value={formData.scholarshipsAndAidHi}
                      onChange={(e) => setFormData({ ...formData, scholarshipsAndAidHi: e.target.value })}
                      placeholder="छात्रवृत्ति एवं वित्तीय सहायता की शर्तें..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: DEADLINES */}
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                  5. Key Admission Deadlines &amp; Application Portal
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Early Action / Decision</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.admissionDeadlines?.earlyDeadline || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          admissionDeadlines: {
                            ...formData.admissionDeadlines,
                            earlyDeadline: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Nov 1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Regular Action / Decision *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.admissionDeadlines?.regularDeadline || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          admissionDeadlines: {
                            ...formData.admissionDeadlines,
                            regularDeadline: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Jan 4"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Decision Release</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.admissionDeadlines?.decisionRelease || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          admissionDeadlines: {
                            ...formData.admissionDeadlines,
                            decisionRelease: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Mid-March"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Portal *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.admissionDeadlines?.portal || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          admissionDeadlines: {
                            ...formData.admissionDeadlines,
                            portal: e.target.value,
                          },
                        })
                      }
                      placeholder="Common App / UCAS"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: COUNSELOR'S INSIDER TIP */}
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                  6. Counselor&apos;s Insider Strategy &amp; Application Tip
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div className="form-group">
                    <label className="form-label">Counselor&apos;s Tip (English) *</label>
                    <textarea
                      rows={3}
                      className="form-textarea"
                      value={formData.counselorTip}
                      onChange={(e) => setFormData({ ...formData, counselorTip: e.target.value })}
                      placeholder="Insider guidance, what this admissions committee prioritizes..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Counselor&apos;s Tip (Hindi)</label>
                    <textarea
                      rows={3}
                      className="form-textarea"
                      value={formData.counselorTipHi}
                      onChange={(e) => setFormData({ ...formData, counselorTipHi: e.target.value })}
                      placeholder="काउंसलर का विशेष सुझाव और चयन रणनीति..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving to Site..." : isCreating ? "Add University" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
