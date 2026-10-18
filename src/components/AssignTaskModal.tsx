"use client";
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { t, Lang } from "@/translations";
import type { ClientTask } from "@/types";

interface AssignTaskModalProps {
  isOpen: boolean;
  userId: string;
  clientName: string;
  onClose: () => void;
  onSuccess?: () => void;
  lang?: Lang;
}

export default function AssignTaskModal({
  isOpen,
  userId,
  clientName,
  onClose,
  onSuccess,
  lang = "en",
}: AssignTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a task title.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const taskData: Omit<ClientTask, "id"> = {
        userId,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || "",
        completed: false,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "clientTasks"), taskData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to assign task.");
    } finally {
      setSaving(false);
    }
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
      }}
    >
      <div
        style={{
          background: "var(--card-bg, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
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

        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
          📝 Assign Action Step / Task
        </h2>
        <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Client: <strong>{clientName}</strong>
        </p>

        {error && (
          <div style={{ padding: "0.6rem 0.85rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Complete RIASEC Career Assessment Worksheet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Task Details &amp; Instructions</label>
            <textarea
              rows={3}
              placeholder="Specific guidelines for the client, instructions, or reflection questions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Due Date (Optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              {t("cancel", lang)}
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? t("loading", lang) : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
