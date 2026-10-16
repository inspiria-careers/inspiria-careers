"use client";
import React, { useState, useEffect } from "react";
import { ServiceDetail, saveServiceDetail } from "@/services/serviceDetailService";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceDetailModalProps {
  service: ServiceDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onBookGuidance: (service: ServiceDetail) => void;
  onServiceUpdated?: (updated: ServiceDetail) => void;
}

export default function ServiceDetailModal({
  service,
  isOpen,
  onClose,
  onBookGuidance,
  onServiceUpdated,
}: ServiceDetailModalProps) {
  const { user, role } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ServiceDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check if current user has staff privileges
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@inspiriacareers.com").toLowerCase();
  const principalEmail = (process.env.NEXT_PUBLIC_PRINCIPAL_EMAIL || "principal@inspiriacareers.com").toLowerCase();
  const userEmail = (user?.email || "").toLowerCase();

  const isStaff =
    role === "admin" ||
    role === "principal" ||
    userEmail === adminEmail ||
    userEmail === principalEmail;

  useEffect(() => {
    if (service) {
      setEditedData({ ...service });
      setIsEditing(false);
      setSaveSuccess(false);
    }
  }, [service]);

  if (!isOpen || !service || !editedData) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedData) return;

    try {
      setSaving(true);
      await saveServiceDetail(editedData);
      setSaveSuccess(true);
      setIsEditing(false);
      if (onServiceUpdated) {
        onServiceUpdated(editedData);
      }
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      alert("Error saving service details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddGuideline = () => {
    setEditedData((prev) =>
      prev ? { ...prev, guidelines: [...prev.guidelines, "New guideline or procedural requirement"] } : null
    );
  };

  const handleRemoveGuideline = (index: number) => {
    setEditedData((prev) =>
      prev ? { ...prev, guidelines: prev.guidelines.filter((_, i) => i !== index) } : null
    );
  };

  const handleUpdateGuideline = (index: number, val: string) => {
    setEditedData((prev) => {
      if (!prev) return null;
      const copy = [...prev.guidelines];
      copy[index] = val;
      return { ...prev, guidelines: copy };
    });
  };

  const handleAddPrerequisite = () => {
    setEditedData((prev) =>
      prev ? { ...prev, prerequisites: [...prev.prerequisites, "New prerequisite or document requirement"] } : null
    );
  };

  const handleRemovePrerequisite = (index: number) => {
    setEditedData((prev) =>
      prev ? { ...prev, prerequisites: prev.prerequisites.filter((_, i) => i !== index) } : null
    );
  };

  const handleUpdatePrerequisite = (index: number, val: string) => {
    setEditedData((prev) => {
      if (!prev) return null;
      const copy = [...prev.prerequisites];
      copy[index] = val;
      return { ...prev, prerequisites: copy };
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 14, 35, 0.78)",
        backdropFilter: "blur(6px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          color: "#0f172a",
          borderRadius: 18,
          maxWidth: "680px",
          width: "100%",
          padding: "2rem",
          boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
          maxHeight: "92vh",
          overflowY: "auto",
          position: "relative",
          border: "1px solid rgba(0, 158, 169, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            right: "1.25rem",
            top: "1.25rem",
            background: "#f1f5f9",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            cursor: "pointer",
            fontSize: "1.1rem",
            color: "#475569",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          title="Close Modal"
        >
          ✕
        </button>

        {/* Staff Edit Badge & Button */}
        {isStaff && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span
              style={{
                background: "rgba(0,158,169,0.1)",
                color: "#009ea9",
                border: "1px solid rgba(0,158,169,0.3)",
                padding: "3px 8px",
                borderRadius: 4,
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              🛡️ Staff Controls Active
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              style={{
                background: isEditing ? "#f1f5f9" : "rgba(201,168,76,0.15)",
                color: isEditing ? "#475569" : "#b8860b",
                border: "1px solid rgba(201,168,76,0.4)",
                padding: "3px 10px",
                borderRadius: 6,
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {isEditing ? "Cancel Editing" : "✏️ Edit Service Details"}
            </button>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #4ade80",
              color: "#15803d",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              fontSize: "0.85rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>✅</span>
            <span>Service details updated live across the entire website and saved to Firestore!</span>
          </div>
        )}

        {isEditing ? (
          /* ── EDIT MODE (FOR PRINCIPAL MA'AM & ADMIN) ── */
          <form onSubmit={handleSave}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <input
                type="text"
                value={editedData.icon}
                onChange={(e) => setEditedData({ ...editedData, icon: e.target.value })}
                style={{ width: 50, fontSize: "1.5rem", textAlign: "center", padding: "4px", borderRadius: 6, border: "1.5px solid #cbd5e1" }}
                title="Service Icon / Emoji"
              />
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={editedData.title}
                  onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                  style={{ width: "100%", fontWeight: 700, fontSize: "1.1rem", padding: "6px 8px", borderRadius: 6, border: "1.5px solid #cbd5e1", color: "#002147" }}
                  placeholder="Service Title..."
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3 }}>Badge / Step Tag</label>
                <input
                  type="text"
                  value={editedData.badge || ""}
                  onChange={(e) => setEditedData({ ...editedData, badge: e.target.value })}
                  style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  placeholder="e.g. Step 01 · Onboarding"
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3 }}>Category Heading</label>
                <input
                  type="text"
                  value={editedData.category}
                  onChange={(e) => setEditedData({ ...editedData, category: e.target.value })}
                  style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "0.85rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3 }}>Comprehensive Description</label>
              <textarea
                rows={3}
                value={editedData.description}
                onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: "0.88rem", lineHeight: 1.5 }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3 }}>Important Dates & Deadlines Note</label>
              <input
                type="text"
                value={editedData.deadlines || ""}
                onChange={(e) => setEditedData({ ...editedData, deadlines: e.target.value })}
                style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1.5px solid #cbd5e1", fontSize: "0.85rem" }}
                placeholder="e.g. Portal active for 30 days..."
              />
            </div>

            {/* Editable Guidelines */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#002147" }}>Official Guidelines & Step-by-Step Procedure</label>
                <button
                  type="button"
                  onClick={handleAddGuideline}
                  style={{ background: "#e0f2fe", color: "#0284c7", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                >
                  + Add Point
                </button>
              </div>
              {editedData.guidelines.map((point, idx) => (
                <div key={idx} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleUpdateGuideline(idx, e.target.value)}
                    style={{ flex: 1, padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveGuideline(idx)}
                    style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 4, padding: "0 8px", cursor: "pointer", fontSize: "0.9rem" }}
                    title="Remove point"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Editable Prerequisites */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#002147" }}>Prerequisites & Mandatory Documents</label>
                <button
                  type="button"
                  onClick={handleAddPrerequisite}
                  style={{ background: "#fef3c7", color: "#d97706", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                >
                  + Add Document
                </button>
              </div>
              {editedData.prerequisites.map((docItem, idx) => (
                <div key={idx} style={{ display: "flex", gap: "0.4rem", marginBottom: "0.4rem" }}>
                  <input
                    type="text"
                    value={docItem}
                    onChange={(e) => handleUpdatePrerequisite(idx, e.target.value)}
                    style={{ flex: 1, padding: "5px 8px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePrerequisite(idx)}
                    style={{ background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 4, padding: "0 8px", cursor: "pointer", fontSize: "0.9rem" }}
                    title="Remove document"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: 8,
                  border: "none",
                  background: "#002147",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {saving ? "Saving to Firestore..." : "💾 Save Changes Live"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedData({ ...service });
                  setIsEditing(false);
                }}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* ── VIEW MODE (STUDENTS, PARENTS & REGULAR VISITORS) ── */
          <div>
            {/* Header with Icon, Badge & Category */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", marginBottom: "1rem" }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(0,158,169,0.15), rgba(255,204,0,0.15))",
                  border: "1.5px solid #009ea9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.85rem",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                {editedData.icon}
              </div>
              <div style={{ paddingRight: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: 3 }}>
                  <span
                    style={{
                      background: "#002147",
                      color: "#ffcc00",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 4,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {editedData.badge || "Advisory Guide"}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
                    {editedData.category}
                  </span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.35rem",
                    color: "#002147",
                    fontWeight: 800,
                    fontFamily: "Playfair Display, serif",
                    lineHeight: 1.3,
                  }}
                >
                  {editedData.title}
                </h3>
              </div>
            </div>

            {/* Description Card */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "1rem 1.15rem",
                marginBottom: "1.25rem",
                lineHeight: 1.6,
                fontSize: "0.92rem",
                color: "#334155",
              }}
            >
              {editedData.description}
            </div>

            {/* Deadlines & Notification Timeline Banner */}
            {editedData.deadlines && (
              <div
                style={{
                  background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                  border: "1px solid #fde68a",
                  borderRadius: 10,
                  padding: "0.85rem 1rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.6rem",
                }}
              >
                <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>📅</span>
                <div>
                  <strong style={{ display: "block", color: "#92400e", fontSize: "0.85rem", marginBottom: 2 }}>
                    Timeline &amp; Critical Deadlines
                  </strong>
                  <span style={{ color: "#78350f", fontSize: "0.84rem", lineHeight: 1.4 }}>
                    {editedData.deadlines}
                  </span>
                </div>
              </div>
            )}

            {/* Two-Column Grid: Guidelines & Prerequisites */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              {/* Guidelines Column */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "1rem",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.65rem" }}>
                  <span style={{ color: "#009ea9", fontSize: "1rem" }}>📘</span>
                  <h4 style={{ margin: 0, fontSize: "0.88rem", color: "#002147", fontWeight: 700 }}>
                    Official Guidelines &amp; Protocol
                  </h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
                  {editedData.guidelines.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "0.45rem" }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prerequisites & Documents Column */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "1rem",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.65rem" }}>
                  <span style={{ color: "#b8860b", fontSize: "1rem" }}>📂</span>
                  <h4 style={{ margin: 0, fontSize: "0.88rem", color: "#002147", fontWeight: 700 }}>
                    Required Documents &amp; Preparation
                  </h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem", color: "#475569", lineHeight: 1.5 }}>
                  {editedData.prerequisites.map((docItem, idx) => (
                    <li key={idx} style={{ marginBottom: "0.45rem" }}>
                      {docItem}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBookGuidance(editedData);
                }}
                style={{
                  flex: 1,
                  padding: "0.85rem 1.5rem",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #002147, #009ea9)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 15px rgba(0,33,71,0.25)",
                  transition: "all 0.2s ease",
                }}
              >
                <span>📝</span> {editedData.actionLinkText || "Book Guidance for this Service"} →
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "0.85rem 1.5rem",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
