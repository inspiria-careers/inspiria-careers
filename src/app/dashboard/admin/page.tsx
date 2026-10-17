"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useSite, SiteProfile } from "@/contexts/SiteContext";
import { t } from "@/translations";

interface FirestoreUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt?: any;
}

export default function AdminDashboardPage() {
  const { user, role, loading: authLoading, sendPasswordReset } = useAuth();
  const { profile, updateProfile, lang } = useSite();

  const [activeTab, setActiveTab] = useState<"users" | "theme" | "settings">("users");

  // User management state
  const [usersList, setUsersList] = useState<FirestoreUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userActionStatus, setUserActionStatus] = useState<string | null>(null);

  // Settings form state
  const [formData, setFormData] = useState<SiteProfile>(profile);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Load users from Firestore
  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const snap = await getDocs(collection(db, "users"));
      const list: FirestoreUser[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          email: data.email ?? null,
          displayName: data.displayName ?? null,
          role: (data.role as UserRole) ?? "client",
          createdAt: data.createdAt,
        };
      });
      setUsersList(list);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (targetUid: string, newRole: UserRole) => {
    try {
      setUserActionStatus(`Updating role to ${newRole}...`);
      await updateDoc(doc(db, "users", targetUid), { role: newRole });
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, role: newRole } : u))
      );
      setUserActionStatus("✓ User role updated successfully.");
      setTimeout(() => setUserActionStatus(null), 3500);
    } catch (err) {
      console.error("Error updating role:", err);
      setUserActionStatus("✕ Failed to update user role.");
    }
  };

  const handleSendResetEmail = async (email: string | null) => {
    if (!email) {
      alert("No email registered for this user.");
      return;
    }
    try {
      await sendPasswordReset(email);
      setUserActionStatus(`✓ Password reset email sent to ${email}`);
      setTimeout(() => setUserActionStatus(null), 4000);
    } catch (err) {
      alert("Failed to send password reset email.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSaveSuccess(false);
      await updateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Failed to save site settings.");
    } finally {
      setSavingSettings(false);
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
        <aside className="dash-sidebar" aria-label="Admin Navigation">
          <div style={{ padding: "0 0.5rem 1rem" }}>
            <span className="badge badge-primary">{t("roleAdmin", lang)}</span>
            <div style={{ fontSize: "1rem", fontWeight: 700, marginTop: "0.4rem" }}>
              {user?.displayName || "Administrator"}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{user?.email}</div>
          </div>

          <div className="dash-section-title">Navigation</div>
          <button
            className={`dash-nav-item${activeTab === "users" ? " active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 User &amp; Role Management
          </button>
          <button
            className={`dash-nav-item${activeTab === "theme" ? " active" : ""}`}
            onClick={() => setActiveTab("theme")}
          >
            🎨 Theme &amp; Colors
          </button>
          <button
            className={`dash-nav-item${activeTab === "settings" ? " active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Site Settings &amp; Info
          </button>

          <div className="dash-section-title" style={{ marginTop: "1.5rem" }}>Quick Links</div>
          <Link href="/dashboard/counsellor" className="dash-nav-item">
            👩‍🏫 Counsellor Panel
          </Link>
          <Link href="/" className="dash-nav-item">
            🌐 View Public Website
          </Link>
        </aside>

        {/* Main Content Area */}
        <main className="dash-main">
          {/* TAB 1: USERS & ROLES */}
          {activeTab === "users" && (
            <div>
              <div className="dash-header">
                <h1>👥 User &amp; Role Management</h1>
                <p>View registered accounts, change roles (Admin / Counsellor / Client), and trigger password resets.</p>
              </div>

              {userActionStatus && (
                <div className="alert alert-info" style={{ marginBottom: "1.25rem" }}>
                  {userActionStatus}
                </div>
              )}

              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Registered Users ({usersList.length})</h3>
                  <button className="btn btn-ghost btn-sm" onClick={loadUsers} disabled={loadingUsers}>
                    🔄 {loadingUsers ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {loadingUsers ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner" />
                  </div>
                ) : usersList.length === 0 ? (
                  <div className="empty-state">
                    <p>No registered users found in database.</p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Current Role</th>
                          <th>Change Role</th>
                          <th>Password Reset</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((u) => (
                          <tr key={u.uid}>
                            <td>
                              <strong>{u.displayName || "Anonymous User"}</strong>
                              {u.uid === user?.uid && (
                                <span className="badge badge-secondary" style={{ marginLeft: "0.5rem" }}>
                                  You
                                </span>
                              )}
                            </td>
                            <td>{u.email || "No email"}</td>
                            <td>
                              <span
                                className={`badge ${
                                  u.role === "admin"
                                    ? "badge-primary"
                                    : u.role === "counsellor"
                                    ? "badge-secondary"
                                    : "badge-muted"
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <select
                                className="form-select"
                                style={{ width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.82rem" }}
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                              >
                                <option value="client">Client</option>
                                <option value="counsellor">Counsellor</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td>
                              {u.email && (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleSendResetEmail(u.email)}
                                  title="Send password reset email to user"
                                >
                                  🔑 Send Reset Link
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

          {/* TAB 2: THEME & BRANDING */}
          {activeTab === "theme" && (
            <div>
              <div className="dash-header">
                <h1>🎨 Theme &amp; Brand Colors</h1>
                <p>Customize the 2 primary colors of the entire website. These instantly update across all components.</p>
              </div>

              {saveSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
                  ✓ Brand theme colors updated successfully!
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="card" style={{ maxWidth: "640px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div className="form-group">
                    <label className="form-label">Primary Brand Color (Dominant / Navbar / Headings)</label>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <input
                        type="color"
                        value={formData.brandPrimary || "#1a3a8f"}
                        onChange={(e) => setFormData({ ...formData, brandPrimary: e.target.value })}
                        style={{ width: 50, height: 40, border: "none", cursor: "pointer", borderRadius: 4 }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        value={formData.brandPrimary}
                        onChange={(e) => setFormData({ ...formData, brandPrimary: e.target.value })}
                        style={{ maxWidth: 140 }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Secondary Brand Color (Accent / Gold / Highlights)</label>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <input
                        type="color"
                        value={formData.brandSecondary || "#c9a84c"}
                        onChange={(e) => setFormData({ ...formData, brandSecondary: e.target.value })}
                        style={{ width: 50, height: 40, border: "none", cursor: "pointer", borderRadius: 4 }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        value={formData.brandSecondary}
                        onChange={(e) => setFormData({ ...formData, brandSecondary: e.target.value })}
                        style={{ maxWidth: 140 }}
                      />
                    </div>
                  </div>

                  <div style={{ padding: "1.25rem", background: "var(--surface-2)", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>Live Preview:</div>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: formData.brandPrimary, color: "#fff" }}
                      >
                        Primary Button
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: formData.brandSecondary, color: "#1e2a3a" }}
                      >
                        Accent Button
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                    {savingSettings ? "Saving Theme..." : "💾 Save Theme Colors"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SITE SETTINGS & CONTENT */}
          {activeTab === "settings" && (
            <div>
              <div className="dash-header">
                <h1>⚙️ Site Settings &amp; Info</h1>
                <p>Modify organization information, contact channels, announcements, and footer details.</p>
              </div>

              {saveSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
                  ✓ Site information saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                {/* Branding Card */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                    🏢 Site Branding
                  </h3>
                  <div className="grid-2" style={{ gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Site Title / Organization Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.siteName}
                        onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                        placeholder="Inspiria Careers"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Logo Image URL</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.siteLogo}
                        onChange={(e) => setFormData({ ...formData, siteLogo: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Main Tagline</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="Expert Career & Academic Guidance"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Sub-tagline</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.subTagline}
                        onChange={(e) => setFormData({ ...formData, subTagline: e.target.value })}
                        placeholder="Empowering students to make informed decisions"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">Announcement Banner Text (Optional Ticker)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.announcement}
                      onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                      placeholder="Admissions Counselling 2026-27 is now open! Limited consultation slots available."
                    />
                  </div>
                </div>

                {/* Contact Information Card */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                    📞 Contact Details
                  </h3>
                  <div className="grid-2" style={{ gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Official Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@inspiria.in"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">WhatsApp Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Office Consultation Hours</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.officeHours}
                        onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                        placeholder="Mon - Sat: 10:00 AM - 6:00 PM"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">Office Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Guidance Plaza, Education Hub"
                    />
                  </div>
                </div>

                {/* Social Media Links Card */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                    🌐 Social Media Profiles
                  </h3>
                  <div className="grid-2" style={{ gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Facebook Profile / Page URL</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Instagram Profile URL</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">YouTube Channel URL</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.youtube}
                        onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                        placeholder="https://youtube.com/@..."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">LinkedIn Profile URL</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Legal & Developer Card */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                    ⚖️ Footer Legal &amp; Attribution
                  </h3>
                  <div className="grid-2" style={{ gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Copyright Notice Text</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.copyrightText}
                        onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
                        placeholder="All rights reserved."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Developed By Attribution</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.developedBy}
                        onChange={(e) => setFormData({ ...formData, developedBy: e.target.value })}
                        placeholder="GAURAV SHUKLA"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={savingSettings}>
                    {savingSettings ? "Saving Settings..." : "💾 Save All Site Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
