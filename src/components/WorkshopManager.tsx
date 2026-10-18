"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { t, Lang } from "@/translations";
import type { WorkshopItem, WorkshopRegistration } from "@/types";

interface WorkshopManagerProps {
  lang?: Lang;
}

export default function WorkshopManager({ lang = "en" }: WorkshopManagerProps) {
  const [workshops, setWorkshops] = useState<WorkshopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeWorkshopRegistrations, setActiveWorkshopRegistrations] = useState<{
    workshop: WorkshopItem;
    registrations: WorkshopRegistration[];
  } | null>(null);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // New workshop form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("11:00 AM");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [mode, setMode] = useState<"online" | "in_person">("online");
  const [meetingLink, setMeetingLink] = useState("");
  const [venue, setVenue] = useState("");
  const [fee, setFee] = useState<number>(0);
  const [maxSeats, setMaxSeats] = useState<number>(30);
  const [saving, setSaving] = useState(false);

  const loadWorkshops = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "workshops"), limit(100)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkshopItem));
      setWorkshops(list.sort((a, b) => (b.date || "").localeCompare(a.date || "")));
    } catch (err) {
      console.error("Error loading workshops:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkshops();
  }, []);

  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    try {
      const item: Omit<WorkshopItem, "id"> = {
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        durationMinutes: Number(durationMinutes) || 60,
        mode,
        meetingLink: mode === "online" ? meetingLink.trim() : "",
        venue: mode === "in_person" ? venue.trim() : "",
        fee: Number(fee) || 0,
        maxSeats: Number(maxSeats) || 30,
        bannerImage: "",
        status: "upcoming",
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, "workshops"), item);
      setWorkshops((prev) => [{ id: ref.id, ...item }, ...prev]);
      setShowCreateModal(false);
      // reset
      setTitle("");
      setDescription("");
      setDate("");
    } catch (err: any) {
      alert("Failed to create workshop: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkshop = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workshop?")) return;
    try {
      await deleteDoc(doc(db, "workshops", id));
      setWorkshops((prev) => prev.filter((w) => w.id !== id));
      if (activeWorkshopRegistrations?.workshop.id === id) {
        setActiveWorkshopRegistrations(null);
      }
    } catch {
      alert("Failed to delete workshop.");
    }
  };

  const handleViewRegistrations = async (w: WorkshopItem) => {
    setLoadingRegs(true);
    try {
      const q = query(collection(db, "workshopRegistrations"), where("workshopId", "==", w.id));
      const snap = await getDocs(q);
      const regs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WorkshopRegistration));
      setActiveWorkshopRegistrations({ workshop: w, registrations: regs });
    } catch (err) {
      console.error("Error loading registrations:", err);
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleAttendanceChange = async (regId: string, att: "attended" | "absent" | "pending") => {
    try {
      await updateDoc(doc(db, "workshopRegistrations", regId), { attendance: att });
      if (activeWorkshopRegistrations) {
        setActiveWorkshopRegistrations({
          ...activeWorkshopRegistrations,
          registrations: activeWorkshopRegistrations.registrations.map((r) =>
            r.id === regId ? { ...r, attendance: att } : r
          ),
        });
      }
    } catch {
      alert("Failed to update attendance.");
    }
  };

  const handleExportCsv = (w: WorkshopItem, regs: WorkshopRegistration[]) => {
    const headers = ["Name", "Email", "Phone", "Status", "Payment Status", "UTR", "Receipt No", "Attendance", "Registered At"];
    const rows = regs.map((r) => [
      `"${r.name || ""}"`,
      `"${r.email || ""}"`,
      `"${r.phone || ""}"`,
      r.status,
      r.paymentStatus,
      `"${r.utr || ""}"`,
      `"${r.receiptNumber || ""}"`,
      r.attendance,
      r.registeredAt,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `workshop_attendees_${w.title.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem", color: "var(--brand-primary)" }}>
            👥 {t("workshops", lang)}
          </h2>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
            Create group webinars, interactive workshops, capacity caps, and manage attendees.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary btn-sm"
        >
          + Create Workshop
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>{t("loading", lang)}</div>
      ) : workshops.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🎓</div>
          <h3>No Workshops Created Yet</h3>
          <p style={{ margin: "0 0 1rem", fontSize: "0.85rem" }}>
            Schedule a webinar or interactive group guidance session.
          </p>
          <button type="button" onClick={() => setShowCreateModal(true)} className="btn btn-outline btn-sm">
            Create First Workshop
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {workshops.map((w) => (
            <div key={w.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                    <span className="badge badge-primary">{w.mode === "online" ? "🌐 Online Video" : "🏢 In-Person"}</span>
                    <span className="badge badge-outline">
                      {w.fee > 0 ? `₹${w.fee}` : "Free"}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Max Seats: <strong>{w.maxSeats}</strong>
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.4rem", color: "var(--text-primary)" }}>
                    {w.title}
                  </h3>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    {w.description}
                  </p>
                  <div style={{ fontSize: "0.825rem", color: "var(--text-muted)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <span>📅 <strong>Date:</strong> {w.date}</span>
                    <span>⏰ <strong>Time:</strong> {w.time} ({w.durationMinutes} mins)</span>
                    {w.mode === "online" && w.meetingLink && (
                      <span>🔗 <strong>Link:</strong> <a href={w.meetingLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Join Link</a></span>
                    )}
                    {w.mode === "in_person" && w.venue && (
                      <span>📍 <strong>Venue:</strong> {w.venue}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewRegistrations(w)}
                  >
                    📋 Attendees
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteWorkshop(w.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendees Modal */}
      {activeWorkshopRegistrations && (
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
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setActiveWorkshopRegistrations(null)}
              aria-label="Close"
              style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
            >
              ✕
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>
                  👥 Attendees: {activeWorkshopRegistrations.workshop.title}
                </h3>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Total Registrations: {activeWorkshopRegistrations.registrations.length} / {activeWorkshopRegistrations.workshop.maxSeats} capacity
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() =>
                  handleExportCsv(
                    activeWorkshopRegistrations.workshop,
                    activeWorkshopRegistrations.registrations
                  )
                }
              >
                📥 {t("exportAttendeesCsv", lang)}
              </button>
            </div>

            {loadingRegs ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>{t("loading", lang)}</div>
            ) : activeWorkshopRegistrations.registrations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                No registrations received yet.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="dash-table" style={{ width: "100%", fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeWorkshopRegistrations.registrations.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.name}</strong>
                        </td>
                        <td>
                          <div>{r.email}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{r.phone}</div>
                        </td>
                        <td>
                          <span className={`badge ${r.status === "confirmed" ? "badge-success" : "badge-outline"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          <div>{r.paymentStatus}</div>
                          {r.utr && <div style={{ fontSize: "0.75rem", color: "var(--brand-primary)" }}>UTR: {r.utr}</div>}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "0.35rem" }}>
                            <button
                              type="button"
                              onClick={() => handleAttendanceChange(r.id, "attended")}
                              style={{
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #10b981",
                                background: r.attendance === "attended" ? "#10b981" : "transparent",
                                color: r.attendance === "attended" ? "#fff" : "#10b981",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Attended
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttendanceChange(r.id, "absent")}
                              style={{
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                border: "1px solid #ef4444",
                                background: r.attendance === "absent" ? "#ef4444" : "transparent",
                                color: r.attendance === "absent" ? "#fff" : "#ef4444",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Workshop Modal */}
      {showCreateModal && (
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
            style={{
              background: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              aria-label="Close"
              style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 1.25rem" }}>
              🎓 Schedule New Workshop / Webinar
            </h3>

            <form onSubmit={handleCreateWorkshop} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navigating College Admissions & CUET Strategies"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="What participants will learn, target students (Class 10-12, Graduates), key takeaways..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Time</label>
                  <input
                    type="text"
                    value={time}
                    placeholder="e.g. 11:00 AM - 12:30 PM"
                    onChange={(e) => setTime(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Duration (Min)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Fee (INR, 0=Free)</label>
                  <input
                    type="number"
                    min="0"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Seat Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(Number(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Mode</label>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      checked={mode === "online"}
                      onChange={() => setMode("online")}
                    />
                    Online Video
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      checked={mode === "in_person"}
                      onChange={() => setMode("in_person")}
                    />
                    In-Person
                  </label>
                </div>
              </div>

              {mode === "online" ? (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Meeting Link (Google Meet / Zoom)</label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xyz-abc"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="form-input"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Venue Location / Office Address</label>
                  <input
                    type="text"
                    placeholder="Conference Room A, Main Campus"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="form-input"
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline btn-sm">
                  {t("cancel", lang)}
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
                  {saving ? t("loading", lang) : "Publish Workshop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
