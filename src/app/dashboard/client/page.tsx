"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";

interface ClientAppointment {
  id: string;
  serviceTitle: string;
  date: string;
  timeSlot: string;
  mode: string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt?: any;
}

export default function ClientDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useSite();

  const [activeTab, setActiveTab] = useState<"appointments" | "profile" | "review">("appointments");

  // Appointments state
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Profile edit state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Review submission state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      loadMyAppointments();
    }
  }, [user]);

  const loadMyAppointments = async () => {
    if (!user) return;
    try {
      setLoadingAppts(true);
      // Query by userId first, or fallback by email
      const q = query(collection(db, "appointments"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientAppointment));

      // If none found by UID and user has email, check by email
      if (list.length === 0 && user.email) {
        const qEmail = query(collection(db, "appointments"), where("clientEmail", "==", user.email));
        const snapEmail = await getDocs(qEmail);
        list = snapEmail.docs.map((d) => ({ id: d.id, ...d.data() } as ClientAppointment));
      }

      list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setAppointments(list);
    } catch (err) {
      console.error("Error loading client appointments:", err);
    } finally {
      setLoadingAppts(false);
    }
  };

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSavingProfile(true);
      setProfileSaved(false);

      // Update Firebase Auth user
      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, {
          displayName: displayName.trim(),
          photoURL: photoURL.trim() || null,
        });
      }

      // Update Firestore user document
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null,
      });

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    try {
      setSubmittingReview(true);
      await addDoc(collection(db, "reviews"), {
        userId: user?.uid || null,
        clientName: displayName || user?.displayName || "Student",
        rating,
        comment: reviewComment.trim(),
        approved: false, // Counsellor/admin moderates
        createdAt: serverTimestamp(),
      });
      setReviewSubmitted(true);
      setReviewComment("");
    } catch (err) {
      console.error("Review submission error:", err);
      alert("Failed to submit feedback.");
    } finally {
      setSubmittingReview(false);
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
              {user?.displayName || "Student / Candidate"}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{user?.email}</div>
          </div>

          <div className="dash-section-title">My Account</div>
          <button
            className={`dash-nav-item${activeTab === "appointments" ? " active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            📅 My Appointments ({appointments.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "profile" ? " active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile &amp; Photo
          </button>
          <button
            className={`dash-nav-item${activeTab === "review" ? " active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            ⭐ Submit Feedback
          </button>

          <div className="dash-section-title" style={{ marginTop: "1.5rem" }}>Services</div>
          <Link href="/book" className="dash-nav-item" style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
            + Book New Appointment
          </Link>
          <Link href="/" className="dash-nav-item">
            🌐 Public Home
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
                  <p>Track your scheduled career counselling sessions, modes, and approval status.</p>
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
                      Ready to get expert guidance? Book your first 1-on-1 personalized counselling session now.
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

          {/* TAB 2: PROFILE */}
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

          {/* TAB 3: FEEDBACK */}
          {activeTab === "review" && (
            <div>
              <div className="dash-header">
                <h1>⭐ Share Feedback &amp; Review</h1>
                <p>Tell us about your guidance session experience. Your honest review helps us continuously improve.</p>
              </div>

              <div className="card" style={{ maxWidth: "560px" }}>
                {reviewSubmitted ? (
                  <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🌟</div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                      Thank you for your valuable feedback!
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Your review has been submitted for moderation.
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
                      <div style={{ display: "flex", gap: "0.5rem", fontSize: "1.6rem", cursor: "pointer" }}>
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
                      <label className="form-label">Your Experience / Testimonial *</label>
                      <textarea
                        className="form-textarea"
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Describe how the counselling session helped you in making informed career or academic decisions..."
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
