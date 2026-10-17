"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { updateProfile as updateAuthProfile, deleteUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { validateDocumentFile, compressImage } from "@/lib/imageUtils";
import { t } from "@/translations";

interface ClientAppointment {
  id: string;
  serviceTitle: string;
  date: string;
  timeSlot: string;
  mode: string;
  notes?: string;
  counsellorNote?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt?: any;
}

interface ClientNote {
  id: string;
  title: string;
  content: string;
  sharedWithCounsellor: boolean;
  updatedAt?: any;
}

interface ClientDoc {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  sharedWithCounsellor: boolean;
  createdAt?: any;
}

export default function ClientDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { lang } = useSite();

  const [activeTab, setActiveTab] = useState<
    "appointments" | "notes" | "documents" | "review" | "profile" | "privacy"
  >("appointments");

  // Appointments state
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Private notes state
  const [notesList, setNotesList] = useState<ClientNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteShared, setNewNoteShared] = useState(false);

  // Documents state
  const [docsList, setDocsList] = useState<ClientDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docShareDefault, setDocShareDefault] = useState(false);
  const [docError, setDocError] = useState("");

  // Profile edit state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Review submission state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [displayNameChoice, setDisplayNameChoice] = useState<"full" | "first_only" | "anonymous">("full");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewHp, setReviewHp] = useState("");

  // Load appointments
  const loadMyAppointments = async () => {
    if (!user) return;
    try {
      setLoadingAppts(true);
      const q = query(collection(db, "appointments"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientAppointment));

      if (list.length === 0 && user.email) {
        const qEmail = query(collection(db, "appointments"), where("clientEmail", "==", user.email));
        const snapEmail = await getDocs(qEmail);
        list = snapEmail.docs.map((d) => ({ id: d.id, ...d.data() } as ClientAppointment));
      }

      list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setAppointments(list);
    } catch (err) {
      console.error("Error loading appointments:", err);
    } finally {
      setLoadingAppts(false);
    }
  };

  // Load private notes
  const loadNotes = async () => {
    if (!user) return;
    try {
      setLoadingNotes(true);
      const q = query(collection(db, "clientNotes"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientNote));
      setNotesList(list);
    } catch (err) {
      console.error("Error loading notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  };

  // Load documents
  const loadDocs = async () => {
    if (!user) return;
    try {
      setLoadingDocs(true);
      const q = query(collection(db, "clientDocuments"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientDoc));
      setDocsList(list);
    } catch (err) {
      console.error("Error loading docs:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      loadMyAppointments();
      loadNotes();
      loadDocs();
    }
  }, [user]);

  // Cancel Appointment
  const handleCancelAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment request?")) return;
    try {
      await updateDoc(doc(db, "appointments", id), { status: "cancelled" });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
      );
      setActionMsg("✓ Appointment cancelled successfully.");
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      alert("Failed to cancel appointment.");
    }
  };

  // Save Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newNoteTitle.trim() || !newNoteContent.trim()) return;

    try {
      const docRef = await addDoc(collection(db, "clientNotes"), {
        userId: user.uid,
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        sharedWithCounsellor: newNoteShared,
        updatedAt: serverTimestamp(),
      });
      setNotesList((prev) => [
        {
          id: docRef.id,
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          sharedWithCounsellor: newNoteShared,
        },
        ...prev,
      ]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setNewNoteShared(false);
    } catch (err) {
      alert("Failed to save note.");
    }
  };

  // Toggle Note Sharing
  const handleToggleNoteShare = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "clientNotes", id), { sharedWithCounsellor: !current });
      setNotesList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, sharedWithCounsellor: !current } : n))
      );
    } catch (err) {
      alert("Failed to update sharing preference.");
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string) => {
    if (!confirm("Delete this private note?")) return;
    try {
      await deleteDoc(doc(db, "clientNotes", id));
      setNotesList((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert("Failed to delete note.");
    }
  };

  // Upload Document (PDF or compressed Image)
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setDocError("");
    const validation = validateDocumentFile(file, 5 * 1024 * 1024);
    if (!validation.valid) {
      setDocError(validation.error || "Invalid file.");
      return;
    }

    try {
      setUploadingDoc(true);
      let fileDataUrl = "";

      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file, 1600, 0.85);
        fileDataUrl = compressed.dataUrl;
      } else {
        // Read PDF as base64
        fileDataUrl = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
      }

      const docRef = await addDoc(collection(db, "clientDocuments"), {
        userId: user.uid,
        fileName: file.name,
        fileUrl: fileDataUrl,
        fileType: file.type,
        fileSize: file.size,
        sharedWithCounsellor: docShareDefault,
        createdAt: serverTimestamp(),
      });

      setDocsList((prev) => [
        {
          id: docRef.id,
          fileName: file.name,
          fileUrl: fileDataUrl,
          fileType: file.type,
          fileSize: file.size,
          sharedWithCounsellor: docShareDefault,
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error("Doc upload error:", err);
      setDocError("Failed to upload document. Please ensure it is under 5 MB.");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  // Toggle Document Sharing
  const handleToggleDocShare = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "clientDocuments", id), { sharedWithCounsellor: !current });
      setDocsList((prev) =>
        prev.map((d) => (d.id === id ? { ...d, sharedWithCounsellor: !current } : d))
      );
    } catch (err) {
      alert("Failed to update document sharing setting.");
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDoc(doc(db, "clientDocuments", id));
      setDocsList((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert("Failed to delete document.");
    }
  };

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSavingProfile(true);
      setProfileSaved(false);

      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL.trim() || null,
        });
      }

      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null,
      });

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    if (reviewHp) {
      setReviewSubmitted(true);
      return;
    }

    try {
      setSubmittingReview(true);
      await addDoc(collection(db, "reviews"), {
        userId: user?.uid || null,
        clientName: displayName || user?.displayName || "Student",
        displayNameChoice,
        rating,
        comment: reviewComment.trim(),
        approved: false, // Counsellor/admin moderates
        createdAt: serverTimestamp(),
      });
      setReviewSubmitted(true);
      setReviewComment("");
    } catch (err) {
      alert("Failed to submit feedback.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // GDPR: Export User Data (JSON)
  const handleExportData = () => {
    const data = {
      profile: {
        uid: user?.uid,
        email: user?.email,
        displayName,
        photoURL,
      },
      appointments,
      notes: notesList,
      documents: docsList.map((d) => ({
        fileName: d.fileName,
        fileType: d.fileType,
        fileSize: d.fileSize,
        sharedWithCounsellor: d.sharedWithCounsellor,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_counselling_data_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // GDPR: Delete My Account and All Data
  const handleDeleteAccount = async () => {
    const confirmed = prompt(
      "CAUTION: This will permanently delete your account, consultation appointments, private notes, and documents. Type DELETE to confirm:"
    );
    if (confirmed !== "DELETE" || !user) return;

    try {
      // 1. Delete notes
      for (const note of notesList) {
        await deleteDoc(doc(db, "clientNotes", note.id)).catch(() => {});
      }
      // 2. Delete docs
      for (const d of docsList) {
        await deleteDoc(doc(db, "clientDocuments", d.id)).catch(() => {});
      }
      // 3. Delete appointments
      for (const a of appointments) {
        await deleteDoc(doc(db, "appointments", a.id)).catch(() => {});
      }
      // 4. Delete user doc
      await deleteDoc(doc(db, "users", user.uid)).catch(() => {});

      // 5. Delete Firebase Auth user
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      await logout();
      window.location.href = "/";
    } catch (err: any) {
      console.error("Account delete error:", err);
      alert("Could not complete full deletion. If you recently logged in, please re-authenticate and try again.");
    }
  };

  if (authLoading) {
    return (
      <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="dash-layout">
        {/* Sidebar */}
        <aside className="dash-sidebar" aria-label="Client Navigation">
          <div style={{ padding: "0 0.5rem 1rem" }}>
            <span className="badge badge-primary">{t("roleClient", lang)}</span>
            <div style={{ fontSize: "1rem", fontWeight: 700, marginTop: "0.4rem" }}>
              {displayName || user?.displayName || "Student / Candidate"}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{user?.email}</div>
          </div>

          <div className="dash-section-title">My Account</div>
          <button
            className={`dash-nav-item${activeTab === "appointments" ? " active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            📅 Appointments ({appointments.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "notes" ? " active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            📝 {t("clientNotes", lang)} ({notesList.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "documents" ? " active" : ""}`}
            onClick={() => setActiveTab("documents")}
          >
            📁 {t("clientDocuments", lang)} ({docsList.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "review" ? " active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            ⭐ Submit Feedback
          </button>
          <button
            className={`dash-nav-item${activeTab === "profile" ? " active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile &amp; Photo
          </button>
          <button
            className={`dash-nav-item${activeTab === "privacy" ? " active" : ""}`}
            onClick={() => setActiveTab("privacy")}
          >
            🛡️ Privacy &amp; Data Rights
          </button>

          <div className="dash-section-title" style={{ marginTop: "1.5rem" }}>Services</div>
          <Link href="/book" className="dash-nav-item" style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
            + Book Consultation
          </Link>
          <Link href="/" className="dash-nav-item">
            🌐 Public Website
          </Link>
        </aside>

        {/* Main Content */}
        <main className="dash-main">
          {/* TAB 1: APPOINTMENTS */}
          {activeTab === "appointments" && (
            <div>
              <div className="dash-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h1>📅 My Appointments</h1>
                  <p>Track your scheduled career counselling sessions, session modes, and counsellor confirmations.</p>
                </div>
                <Link href="/book" className="btn btn-primary btn-sm">
                  + Book Consultation
                </Link>
              </div>

              {actionMsg && (
                <div className="alert alert-info" style={{ marginBottom: "1.25rem" }}>
                  {actionMsg}
                </div>
              )}

              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Booked Sessions</h3>
                  <button className="btn btn-ghost btn-sm" onClick={loadMyAppointments} disabled={loadingAppts}>
                    🔄 Refresh
                  </button>
                </div>

                {loadingAppts ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📅</div>
                    <div className="empty-state-title">No appointments scheduled yet</div>
                    <div className="empty-state-desc">
                      Book a 1-on-1 personalized counselling session to discuss streams, admissions, or career paths.
                    </div>
                    <div style={{ marginTop: "1.5rem" }}>
                      <Link href="/book" className="btn btn-primary">
                        Book Your Consultation
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Date</th>
                          <th>Time Slot</th>
                          <th>Session Mode</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appt) => (
                          <tr key={appt.id}>
                            <td>
                              <strong>{appt.serviceTitle}</strong>
                              {appt.notes && (
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                                  "{appt.notes}"
                                </div>
                              )}
                            </td>
                            <td>{appt.date}</td>
                            <td>{appt.timeSlot}</td>
                            <td>
                              <span className="badge badge-primary">{appt.mode}</span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  appt.status === "confirmed"
                                    ? "badge-success"
                                    : appt.status === "pending"
                                    ? "badge-warning"
                                    : appt.status === "completed"
                                    ? "badge-primary"
                                    : "badge-error"
                                }`}
                              >
                                {appt.status}
                              </span>
                            </td>
                            <td>
                              {appt.status !== "cancelled" && appt.status !== "completed" && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: "var(--error)" }}
                                  onClick={() => handleCancelAppointment(appt.id)}
                                >
                                  Cancel
                                </button>
                              )}
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

          {/* TAB 2: PRIVATE NOTES */}
          {activeTab === "notes" && (
            <div>
              <div className="dash-header">
                <h1>📝 Private Notes</h1>
                <p>Record your personal questions, target colleges, or thoughts. Only you can see these unless you explicitly choose to share them with your counsellor.</p>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleCreateNote} className="card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                  Write a New Note
                </h3>
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Note Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="e.g. Questions for college admissions discussion"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Note Content</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Write points you would like to discuss or remember..."
                    required
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.88rem" }}>
                    <input
                      type="checkbox"
                      checked={newNoteShared}
                      onChange={(e) => setNewNoteShared(e.target.checked)}
                    />
                    🔗 {t("sharedWithCounsellor", lang)}
                  </label>
                  <button type="submit" className="btn btn-primary">
                    + Save Note
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
                  My Saved Notes ({notesList.length})
                </h3>
                {loadingNotes ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner" />
                  </div>
                ) : notesList.length === 0 ? (
                  <div className="empty-state">
                    <p>No notes written yet. Keep your questions and career reflections organized here.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {notesList.map((note) => (
                      <div
                        key={note.id}
                        style={{
                          padding: "1rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                          <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                            {note.title}
                          </h4>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <button
                              type="button"
                              className={`btn btn-sm ${note.sharedWithCounsellor ? "btn-secondary" : "btn-ghost"}`}
                              style={{ fontSize: "0.75rem" }}
                              onClick={() => handleToggleNoteShare(note.id, note.sharedWithCounsellor)}
                            >
                              {note.sharedWithCounsellor ? "✓ Shared with Counsellor" : "🔒 Private (Click to Share)"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: "var(--error)" }}
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", whiteSpace: "pre-line" }}>
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS VAULT */}
          {activeTab === "documents" && (
            <div>
              <div className="dash-header">
                <h1>📁 Confidential Document Vault</h1>
                <p>Upload your report cards, exam scorecards, or resume (PDF, JPG, PNG, max 5 MB). Files are strictly confidential.</p>
              </div>

              {docError && <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>{docError}</div>}

              {/* Upload Card */}
              <div className="card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                  Upload Document
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.88rem" }}>
                    <input
                      type="checkbox"
                      checked={docShareDefault}
                      onChange={(e) => setDocShareDefault(e.target.checked)}
                    />
                    🔗 Share automatically with counsellor upon upload
                  </label>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <label className="btn btn-primary" style={{ cursor: "pointer" }}>
                      {uploadingDoc ? "Uploading..." : "📤 Choose File (PDF/Image max 5MB)"}
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        onChange={handleDocumentUpload}
                        disabled={uploadingDoc}
                        style={{ display: "none" }}
                      />
                    </label>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Files are encrypted &amp; stored safely.
                    </span>
                  </div>
                </div>
              </div>

              {/* Docs List */}
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
                  Uploaded Documents ({docsList.length})
                </h3>
                {loadingDocs ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner" />
                  </div>
                ) : docsList.length === 0 ? (
                  <div className="empty-state">
                    <p>No documents uploaded yet. Upload your scorecards or resume when ready.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {docsList.map((docItem) => (
                      <div
                        key={docItem.id}
                        style={{
                          padding: "1rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>
                            📄 {docItem.fileName}
                          </h4>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            Size: {Math.round((docItem.fileSize || 0) / 1024)} KB &nbsp;|&nbsp; Type: {docItem.fileType}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${docItem.sharedWithCounsellor ? "btn-secondary" : "btn-ghost"}`}
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => handleToggleDocShare(docItem.id, docItem.sharedWithCounsellor)}
                          >
                            {docItem.sharedWithCounsellor ? "✓ Shared with Counsellor" : "🔒 Private (Click to Share)"}
                          </button>
                          <a
                            href={docItem.fileUrl}
                            download={docItem.fileName}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm"
                          >
                            📥 View
                          </a>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--error)" }}
                            onClick={() => handleDeleteDoc(docItem.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REVIEWS */}
          {activeTab === "review" && (
            <div>
              <div className="dash-header">
                <h1>⭐ Share Feedback &amp; Review</h1>
                <p>Tell us about your guidance session experience. Choose whether your name is displayed publicly or anonymously.</p>
              </div>

              <div className="card" style={{ maxWidth: "580px" }}>
                {reviewSubmitted ? (
                  <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🌟</div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                      Thank you for your valuable feedback!
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Your review has been submitted for counsellor moderation and will appear on the reviews page once approved.
                    </p>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: "1.25rem" }}
                      onClick={() => setReviewSubmitted(false)}
                    >
                      Submit Another Review
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                      <label className="form-label">Rating</label>
                      <div style={{ display: "flex", gap: "0.5rem", fontSize: "1.8rem", cursor: "pointer" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            onClick={() => setRating(star)}
                            style={{ color: star <= rating ? "#f39c12" : "#ccc" }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Name Display Preference</label>
                      <select
                        className="form-select"
                        value={displayNameChoice}
                        onChange={(e) => setDisplayNameChoice(e.target.value as any)}
                      >
                        <option value="full">Show Full Name ({displayName || "Student"})</option>
                        <option value="first_only">Show First Name Only (e.g. Rohan)</option>
                        <option value="anonymous">Keep Completely Anonymous (Verified Student)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Your Experience / Testimonial *</label>
                      <textarea
                        className="form-textarea"
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="How did the consultation session help you in making informed career or academic choices?"
                        required
                      />
                    </div>

                    {/* Honeypot field */}
                    <input
                      type="text"
                      value={reviewHp}
                      onChange={(e) => setReviewHp(e.target.value)}
                      style={{ display: "none" }}
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === "profile" && (
            <div>
              <div className="dash-header">
                <h1>👤 My Profile</h1>
                <p>Update your personal display details and profile avatar.</p>
              </div>

              {profileSaved && (
                <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
                  ✓ Profile updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="card" style={{ maxWidth: "560px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address (Read-only)</label>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ""}
                      disabled
                      style={{ opacity: 0.7 }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Avatar / Photo URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  {photoURL && (
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
                        Preview:
                      </span>
                      <img
                        src={photoURL}
                        alt="Avatar preview"
                        style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }}
                      />
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: PRIVACY & DATA RIGHTS */}
          {activeTab === "privacy" && (
            <div>
              <div className="dash-header">
                <h1>🛡️ Privacy &amp; Data Rights (DPDPA / GDPR)</h1>
                <p>You have full ownership of your data. You may download a copy or permanently delete your account at any time.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "680px" }}>
                {/* Export Data Card */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    📥 Data Portability (Export JSON)
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                    Download a full JSON archive containing your consultation appointments, private notes, documents list, and profile.
                  </p>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleExportData}>
                    📥 {t("exportData", lang)}
                  </button>
                </div>

                {/* Right to Erasure Card */}
                <div className="card" style={{ border: "1.5px solid var(--error)" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--error)", marginBottom: "0.5rem" }}>
                    ⚠️ Right to Erasure (Delete Account &amp; Data)
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                    Permanently delete your account and all associated records (consultation requests, private notes, and uploaded documents). This action is irreversible.
                  </p>
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteAccount}>
                    🗑️ {t("deleteAccount", lang)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
