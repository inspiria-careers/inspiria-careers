"use client";
import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { t, Lang } from "@/translations";
import type { SessionNote } from "@/types";

interface SessionNotesModalProps {
  isOpen: boolean;
  appointmentId: string;
  userId?: string | null;
  clientName?: string;
  appointmentDate?: string;
  onClose: () => void;
  lang?: Lang;
}

export default function SessionNotesModal({
  isOpen,
  appointmentId,
  userId,
  clientName = "Client",
  appointmentDate = "",
  onClose,
  lang = "en",
}: SessionNotesModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "draft" | "final">("idle");
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);

  const [note, setNote] = useState<Partial<SessionNote>>({
    appointmentId,
    userId: userId || "",
    clientName,
    sessionDate: appointmentDate || new Date().toISOString().split("T")[0],
    summary: "",
    keyObservations: "",
    homeworkTasks: "",
    nextSessionRecommendation: "",
    status: "draft",
    version: 1,
    history: [],
  });

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);

  // 1. Fetch note from Firestore or restore draft from localStorage
  useEffect(() => {
    if (!isOpen || !appointmentId) return;
    setLoading(true);

    const fetchNote = async () => {
      try {
        const snap = await getDoc(doc(db, "sessionNotes", appointmentId));
        if (snap.exists()) {
          const remoteData = snap.data() as SessionNote;
          setNote(remoteData);
        } else {
          // Check localStorage draft
          const localDraft = localStorage.getItem(`ic_session_draft_${appointmentId}`);
          if (localDraft) {
            try {
              const parsed = JSON.parse(localDraft);
              setNote(parsed);
              setLastAutoSave("Restored from unsaved local draft");
            } catch {}
          } else {
            setNote({
              appointmentId,
              userId: userId || "",
              clientName,
              sessionDate: appointmentDate || new Date().toISOString().split("T")[0],
              summary: "",
              keyObservations: "",
              homeworkTasks: "",
              nextSessionRecommendation: "",
              status: "draft",
              version: 1,
              history: [],
            });
          }
        }
      } catch (err) {
        console.error("Error loading session note:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [isOpen, appointmentId, userId, clientName, appointmentDate]);

  // 2. Debounced LocalStorage Auto-save
  useEffect(() => {
    if (!isOpen) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      if (isDirtyRef.current) {
        try {
          localStorage.setItem(`ic_session_draft_${appointmentId}`, JSON.stringify(note));
          setLastAutoSave(`Draft autosaved at ${new Date().toLocaleTimeString()}`);
        } catch {}
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [note, isOpen, appointmentId]);

  if (!isOpen) return null;

  const handleChange = (field: keyof SessionNote, val: any) => {
    isDirtyRef.current = true;
    setNote((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (finalStatus: "draft" | "final") => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const currentVersion = (note.version || 1) + (finalStatus === "final" ? 1 : 0);
      const historyEntry = {
        timestamp: now,
        summary: `Saved as ${finalStatus} (v${currentVersion})`,
      };

      const payload: SessionNote = {
        id: appointmentId,
        appointmentId,
        userId: userId || "",
        clientName: clientName || note.clientName || "Client",
        sessionDate: note.sessionDate || appointmentDate || now.split("T")[0],
        summary: note.summary?.trim() || "",
        keyObservations: note.keyObservations?.trim() || "",
        homeworkTasks: note.homeworkTasks?.trim() || "",
        nextSessionRecommendation: note.nextSessionRecommendation?.trim() || "",
        status: finalStatus,
        createdAt: note.createdAt || now,
        updatedAt: now,
        version: currentVersion,
        history: [...(note.history || []), historyEntry],
      };

      await setDoc(doc(db, "sessionNotes", appointmentId), payload, { merge: true });
      localStorage.removeItem(`ic_session_draft_${appointmentId}`);
      isDirtyRef.current = false;
      setNote(payload);
      setSaveStatus(finalStatus);
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err: any) {
      console.error("Failed to save session note:", err);
      alert("Error saving session note: " + (err.message || "Failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(note, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `clinical_note_${clientName.replace(/\s+/g, "_")}_${appointmentId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <div
        id="session-note-printable"
        style={{
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "800px",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "2rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "transparent",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "var(--text-muted, #64748b)",
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span className="badge badge-primary">🔒 Counsellor-Only Clinical Record</span>
              <span className="badge badge-outline">v{note.version || 1}.0 ({note.status || "draft"})</span>
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
              {t("sessionNotes", lang)}: {clientName}
            </h2>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Session Date: <strong>{note.sessionDate || appointmentDate}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={handleExportJson} className="btn btn-outline btn-sm" title="Export Note JSON">
              📥 JSON
            </button>
            <button type="button" onClick={handlePrint} className="btn btn-outline btn-sm" title="Printable View">
              🖨️ Print
            </button>
          </div>
        </div>

        {lastAutoSave && (
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "1rem" }}>
            ⏱️ {lastAutoSave}
          </div>
        )}

        {saveStatus === "draft" && (
          <div style={{ padding: "0.6rem 1rem", background: "#f0fdf4", color: "#166534", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
            ✓ Draft saved to secure cloud.
          </div>
        )}
        {saveStatus === "final" && (
          <div style={{ padding: "0.6rem 1rem", background: "#ecfdf5", color: "#065f46", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: 600 }}>
            ✓ Note finalized and recorded in version history.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            {t("loading", lang)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Session Summary */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                📋 Session Summary &amp; Agenda Discussed *
              </label>
              <textarea
                rows={3}
                className="form-textarea"
                placeholder="Key themes explored during the session, student challenges, discussions on career streams or emotional state..."
                value={note.summary || ""}
                onChange={(e) => handleChange("summary", e.target.value)}
              />
            </div>

            {/* Key Clinical & Career Observations */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                🔍 {t("clinicalObservations", lang)} *
              </label>
              <textarea
                rows={3}
                className="form-textarea"
                placeholder="Affect, engagement, cognitive clarity, emotional resilience, specific behavioral insights, potential stressors..."
                value={note.keyObservations || ""}
                onChange={(e) => handleChange("keyObservations", e.target.value)}
              />
            </div>

            {/* Client Homework & Follow-up Action Items */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                📝 {t("homeworkTasks", lang)}
              </label>
              <textarea
                rows={2}
                className="form-textarea"
                placeholder="Tasks assigned to the client before next session (e.g. aptitude worksheet, college shortlist, daily journaling)..."
                value={note.homeworkTasks || ""}
                onChange={(e) => handleChange("homeworkTasks", e.target.value)}
              />
            </div>

            {/* Recommended Next Session Timeframe */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>
                📅 {t("nextSessionRec", lang)}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. In 2 weeks (post mock exams), or 1 month follow-up"
                value={note.nextSessionRecommendation || ""}
                onChange={(e) => handleChange("nextSessionRecommendation", e.target.value)}
              />
            </div>

            {/* Version History snippet */}
            {note.history && note.history.length > 0 && (
              <div style={{ background: "var(--surface-2, #f8fafc)", padding: "0.85rem", borderRadius: "8px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <strong>Version History:</strong>
                <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.25rem" }}>
                  {note.history.slice(-3).map((h, i) => (
                    <li key={i}>
                      {new Date(h.timestamp).toLocaleString()}: {h.summary}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "1rem", marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                🔒 Admin &amp; Client Access Strictly Blocked
              </span>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={saving}
                  onClick={() => handleSave("draft")}
                >
                  {saving ? t("loading", lang) : t("saveDraft", lang)}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={() => handleSave("final")}
                >
                  {saving ? t("loading", lang) : t("saveFinal", lang)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
