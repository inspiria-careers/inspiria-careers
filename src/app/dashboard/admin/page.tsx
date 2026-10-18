"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useSite, SiteProfile } from "@/contexts/SiteContext";
import { logAuditEvent, AuditLogEntry } from "@/lib/auditLog";
import ImageUploader from "@/components/ImageUploader";
import { t } from "@/translations";

interface FirestoreUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  disabled?: boolean;
  createdAt?: any;
}

export default function AdminDashboardPage() {
  const { user, role, loading: authLoading, sendPasswordReset } = useAuth();
  const { profile, updateProfile, lang } = useSite();

  const [activeTab, setActiveTab] = useState<"users" | "audit" | "export" | "theme" | "settings">("users");

  // User management state
  const [usersList, setUsersList] = useState<FirestoreUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userActionStatus, setUserActionStatus] = useState<string | null>(null);

  // Audit logs state
  const [auditLogsList, setAuditLogsList] = useState<(AuditLogEntry & { id: string })[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Settings form state
  const [formData, setFormData] = useState<SiteProfile>(profile);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Load users from Firestore
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const snap = await getDocs(query(collection(db, "users"), limit(200)));
      const list: FirestoreUser[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          email: data.email ?? null,
          displayName: data.displayName ?? null,
          role: (data.role as UserRole) ?? "client",
          disabled: data.disabled ?? false,
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

  // Load audit logs
  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(50));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      setAuditLogsList(list);
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "audit") loadAuditLogs();
  }, [activeTab]);

  const handleRoleChange = async (targetUid: string, newRole: UserRole) => {
    try {
      setUserActionStatus(`Updating role to ${newRole}...`);
      await updateDoc(doc(db, "users", targetUid), { role: newRole });
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, role: newRole } : u))
      );
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "admin",
        action: "CHANGE_USER_ROLE",
        details: `Changed role of user ${targetUid} to ${newRole}`,
        targetId: targetUid,
      });
      setUserActionStatus("✓ User role updated successfully.");
      setTimeout(() => setUserActionStatus(null), 3500);
    } catch (err) {
      console.error("Error updating role:", err);
      setUserActionStatus("✕ Failed to update user role.");
    }
  };

  const handleToggleUserDisabled = async (targetUid: string, currentDisabled: boolean) => {
    const nextDisabled = !currentDisabled;
    if (targetUid === user?.uid) {
      alert("You cannot disable your own administrator account.");
      return;
    }
    try {
      setUserActionStatus(nextDisabled ? "Disabling user account..." : "Enabling user account...");
      await updateDoc(doc(db, "users", targetUid), { disabled: nextDisabled });
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, disabled: nextDisabled } : u))
      );
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "admin",
        action: nextDisabled ? "DISABLE_USER" : "ENABLE_USER",
        details: `${nextDisabled ? "Disabled" : "Enabled"} account of user ${targetUid}`,
        targetId: targetUid,
      });
      setUserActionStatus(nextDisabled ? "✓ User account disabled." : "✓ User account enabled.");
      setTimeout(() => setUserActionStatus(null), 3500);
    } catch {
      alert("Failed to update user account status.");
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
    } catch {
      alert("Failed to send password reset email.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSaveSuccess(false);
      await updateProfile(formData);
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "admin",
        action: "UPDATE_SITE_SETTINGS",
        details: `Updated site configuration, branding & feature flags (paymentsEnabled: ${formData.paymentsEnabled})`,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Failed to save site settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // CSV Exporters
  const exportAppointmentsCsv = async () => {
    try {
      const snap = await getDocs(query(collection(db, "appointments"), limit(1000)));
      const appts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      const headers = ["ID", "Client Name", "Email", "Phone", "Service", "Date", "Time Slot", "Mode", "Status", "Payment Status", "Meeting Link"];
      const rows = appts.map((a) => [
        `"${a.id}"`,
        `"${(a.clientName || "").replace(/"/g, '""')}"`,
        `"${(a.clientEmail || "").replace(/"/g, '""')}"`,
        `"${(a.clientPhone || "").replace(/"/g, '""')}"`,
        `"${(a.serviceTitle || "").replace(/"/g, '""')}"`,
        `"${a.date || ""}"`,
        `"${a.timeSlot || ""}"`,
        `"${a.mode || ""}"`,
        `"${a.status || ""}"`,
        `"${a.paymentStatus || "not_required"}"`,
        `"${(a.meetingLink || "").replace(/"/g, '""')}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `all_appointments_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to export appointments.");
    }
  };

  const exportReviewsCsv = async () => {
    try {
      const snap = await getDocs(query(collection(db, "reviews"), limit(500)));
      const revs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
      const headers = ["ID", "Client Name", "Rating", "Approved", "Comment"];
      const rows = revs.map((r) => [
        `"${r.id}"`,
        `"${(r.clientName || "").replace(/"/g, '""')}"`,
        `"${r.rating}"`,
        `"${r.approved ? "Yes" : "No"}"`,
        `"${(r.comment || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `all_reviews_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert("Failed to export reviews.");
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

          <div className="dash-section-title">Administration</div>
          <button
            className={`dash-nav-item${activeTab === "users" ? " active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 User &amp; Role Management
          </button>
          <button
            className={`dash-nav-item${activeTab === "audit" ? " active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            📋 System Audit Logs
          </button>
          <button
            className={`dash-nav-item${activeTab === "export" ? " active" : ""}`}
            onClick={() => setActiveTab("export")}
          >
            📥 Data Exports (CSV)
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
            ⚙️ Site Settings &amp; Feature Flags
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
                <p>View registered accounts, change roles (Admin / Counsellor / Client), enable/disable accounts, and trigger password resets.</p>
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
                          <th>Status</th>
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
                                  u.disabled ? "badge-error" : "badge-success"
                                }`}
                              >
                                {u.disabled ? "Disabled" : "Active"}
                              </span>
                              {u.uid !== user?.uid && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  style={{
                                    marginLeft: "0.4rem",
                                    fontSize: "0.72rem",
                                    padding: "0.15rem 0.35rem",
                                    color: u.disabled ? "var(--brand-primary)" : "var(--error)",
                                  }}
                                  onClick={() => handleToggleUserDisabled(u.uid, !!u.disabled)}
                                >
                                  {u.disabled ? "Enable" : "Disable"}
                                </button>
                              )}
                            </td>
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

          {/* TAB 2: AUDIT LOGS */}
          {activeTab === "audit" && (
            <div>
              <div className="dash-header">
                <h1>📋 System Audit Logs</h1>
                <p>Immutable record of administrative operations: user role modifications, account suspensions, content deletions, and site settings updates.</p>
              </div>

              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    Recent Activity Logs ({auditLogsList.length})
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={loadAuditLogs} disabled={loadingAudit}>
                    🔄 {loadingAudit ? "Loading..." : "Refresh Logs"}
                  </button>
                </div>

                {loadingAudit ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner" />
                  </div>
                ) : auditLogsList.length === 0 ? (
                  <div className="empty-state">
                    <p>No audit events recorded yet.</p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Actor</th>
                          <th>Details</th>
                          <th>Resource / ID</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogsList.map((log) => {
                          const dateStr = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : "Just now";
                          return (
                            <tr key={log.id}>
                              <td>
                                <span className="badge badge-primary" style={{ fontSize: "0.72rem" }}>
                                  {log.action}
                                </span>
                              </td>
                              <td>
                                <strong>{log.actorEmail || "System Admin"}</strong>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Role: {log.actorRole}</div>
                              </td>
                              <td style={{ fontSize: "0.85rem", maxWidth: "300px" }}>{log.details}</td>
                              <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{log.targetId || "—"}</td>
                              <td style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{dateStr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DATA EXPORT */}
          {activeTab === "export" && (
            <div>
              <div className="dash-header">
                <h1>📥 Data Export Hub</h1>
                <p>Download full structured CSV archives for appointments, consultations, and verified client testimonials.</p>
              </div>

              <div className="grid-2" style={{ gap: "1.5rem" }}>
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    📅 Consultation Appointments
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                    Export all consultation bookings including student names, phone numbers, email addresses, session dates, time slots, session modes, fees, and current statuses.
                  </p>
                  <button type="button" className="btn btn-primary" onClick={exportAppointmentsCsv}>
                    📥 Export Appointments (CSV)
                  </button>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    ⭐ Client Reviews &amp; Testimonials
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                    Export student and parent testimonials, star ratings, moderation approval states, and review comments.
                  </p>
                  <button type="button" className="btn btn-primary" onClick={exportReviewsCsv}>
                    📥 Export Reviews (CSV)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: THEME & BRANDING */}
          {activeTab === "theme" && (() => {
            const THEME_PRESETS = [
              { name: "Calm Navy & Gold (Default)", primary: "#1a3a8f", secondary: "#c9a84c" },
              { name: "Sage Green Serenity", primary: "#2e6f40", secondary: "#d4a373" },
              { name: "Warm Terracotta & Sand", primary: "#8d4925", secondary: "#e09f3e" },
              { name: "Slate & Lavender", primary: "#3d405b", secondary: "#81b29a" },
              { name: "Emerald Trust", primary: "#0f5132", secondary: "#20c997" },
            ];

            // WCAG AA Luminance calculation
            const getLuminance = (hex: string) => {
              const clean = (hex || "#000000").replace("#", "");
              if (clean.length !== 6) return 0.2;
              const rgb = [
                parseInt(clean.substr(0, 2), 16) / 255,
                parseInt(clean.substr(2, 2), 16) / 255,
                parseInt(clean.substr(4, 2), 16) / 255,
              ].map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
              return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
            };

            const l1 = getLuminance(formData.brandPrimary || "#1a3a8f");
            const lWhite = 1.0;
            const contrastRatio = ((Math.max(l1, lWhite) + 0.05) / (Math.min(l1, lWhite) + 0.05)).toFixed(2);
            const isAccessible = parseFloat(contrastRatio) >= 4.5;

            return (
              <div>
                <div className="dash-header">
                  <h1>🎨 Theme Customiser &amp; Accessibility</h1>
                  <p>Customize the 2 primary brand colors and typography. Choose from tested calm presets or customize manually.</p>
                </div>

                {saveSuccess && (
                  <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
                    ✓ Brand theme updated successfully!
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="card" style={{ maxWidth: "680px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* Ready Presets */}
                    <div>
                      <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                        ✨ Ready Theme Presets (Click to apply)
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                        {THEME_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                brandPrimary: preset.primary,
                                brandSecondary: preset.secondary,
                              });
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{
                              justifyContent: "flex-start",
                              padding: "0.6rem 0.75rem",
                              border: formData.brandPrimary === preset.primary ? "2px solid var(--brand-primary)" : "1px solid var(--border)",
                            }}
                          >
                            <span style={{ width: 14, height: 14, borderRadius: "50%", background: preset.primary, display: "inline-block" }} />
                            <span style={{ width: 14, height: 14, borderRadius: "50%", background: preset.secondary, display: "inline-block", marginLeft: -6 }} />
                            <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color pickers */}
                    <div className="grid-2" style={{ gap: "1rem" }}>
                      <div className="form-group">
                        <label className="form-label">Primary Brand Color</label>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                          <input
                            type="color"
                            value={formData.brandPrimary || "#1a3a8f"}
                            onChange={(e) => setFormData({ ...formData, brandPrimary: e.target.value })}
                            style={{ width: 44, height: 38, border: "none", cursor: "pointer", borderRadius: 4 }}
                          />
                          <input
                            type="text"
                            className="form-input"
                            value={formData.brandPrimary}
                            onChange={(e) => setFormData({ ...formData, brandPrimary: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Secondary / Accent Color</label>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                          <input
                            type="color"
                            value={formData.brandSecondary || "#c9a84c"}
                            onChange={(e) => setFormData({ ...formData, brandSecondary: e.target.value })}
                            style={{ width: 44, height: 38, border: "none", cursor: "pointer", borderRadius: 4 }}
                          />
                          <input
                            type="text"
                            className="form-input"
                            value={formData.brandSecondary}
                            onChange={(e) => setFormData({ ...formData, brandSecondary: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Typography Selector */}
                    <div className="form-group">
                      <label className="form-label">Typography / Font Family</label>
                      <select
                        className="form-select"
                        value={formData.fontFamily || "'Inter', sans-serif"}
                        onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
                      >
                        <option value="'Inter', -apple-system, BlinkMacSystemFont, sans-serif">Inter (Modern & Clean Default)</option>
                        <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Soft & Contemporary)</option>
                        <option value="'Outfit', sans-serif">Outfit (Authoritative & Warm)</option>
                      </select>
                    </div>

                    {/* Accessibility Contrast Ratio Alert */}
                    <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", background: isAccessible ? "#d4f5e9" : "#fff3cd", border: `1px solid ${isAccessible ? "#a8e8cf" : "#ffeeba"}` }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: isAccessible ? "#1d9b5f" : "#856404" }}>
                        {isAccessible ? "✓ Good Contrast" : "⚠️ Low Contrast Warning"} (Ratio: {contrastRatio}:1 on White)
                      </div>
                      <p style={{ fontSize: "0.78rem", color: isAccessible ? "#1d9b5f" : "#856404", marginTop: "0.2rem" }}>
                        {isAccessible
                          ? "WCAG AA standard passed (4.5:1 ratio). Text on white will remain clear and readable."
                          : "Primary color might be too light for high contrast against white text. Recommended ratio is ≥ 4.5:1."}
                      </p>
                    </div>

                    {/* Live Preview Card */}
                    <div style={{ padding: "1.25rem", background: "var(--surface-2)", borderRadius: "var(--radius-sm)" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem" }}>Live Preview:</div>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ background: formData.brandPrimary, color: "#fff" }}
                        >
                          Primary Action
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ background: formData.brandSecondary, color: "#1e2a3a" }}
                        >
                          Accent Button
                        </button>
                        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: formData.brandPrimary }}>
                          Heading Sample
                        </span>
                      </div>
                    </div>

                    {/* Actions: Save & Reset */}
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                        {savingSettings ? "Saving Theme..." : "💾 Save Theme Settings"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            brandPrimary: "#1a3a8f",
                            brandSecondary: "#c9a84c",
                            fontFamily: "'Inter', sans-serif",
                          });
                        }}
                      >
                        ↺ Reset to Default
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            );
          })()}

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
                    🏢 Site Branding &amp; Logos
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
                      <label className="form-label">Logo Alt Text (Accessibility)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.siteLogoAlt || ""}
                        onChange={(e) => setFormData({ ...formData, siteLogoAlt: e.target.value })}
                        placeholder="Inspiria Careers Official Logo"
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

                  <div className="grid-3" style={{ gap: "1.25rem", marginTop: "1.25rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                    <div>
                      <ImageUploader
                        label="Primary Site Logo (Light Background) *"
                        folder="branding"
                        currentUrl={formData.siteLogo}
                        onUploadComplete={(url: string) => setFormData({ ...formData, siteLogo: url })}
                        helperText="PNG, SVG, or WebP. Transparent background recommended."
                        maxSizeMB={2}
                      />
                    </div>
                    <div>
                      <ImageUploader
                        label="Dark Mode Logo (Optional)"
                        folder="branding"
                        currentUrl={formData.siteLogoDark}
                        onUploadComplete={(url: string) => setFormData({ ...formData, siteLogoDark: url })}
                        helperText="Optimized logo version for dark theme backgrounds."
                        maxSizeMB={2}
                      />
                    </div>
                    <div>
                      <ImageUploader
                        label="Site Favicon (32x32 / SVG)"
                        folder="branding"
                        currentUrl={formData.siteFavicon}
                        onUploadComplete={(url: string) => setFormData({ ...formData, siteFavicon: url })}
                        helperText="Small browser tab icon. PNG, ICO, or SVG format."
                        maxSizeMB={1}
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

                {/* Feature Flags Card (Phase 4 Manual QR Payments) */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    💳 Consultation Fees &amp; Manual QR Payments
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
                    Zero third-party payment gateway SDKs or gateway fees. Clients scan the counsellor's official UPI QR code or pay via UPI ID and submit their 12-digit UTR transaction reference number. The counsellor verifies each transaction against their bank statement before confirming appointments.
                  </p>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.92rem", fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={!!formData.paymentsEnabled}
                      onChange={(e) => setFormData({ ...formData, paymentsEnabled: e.target.checked })}
                    />
                    Enable Consultation Fees &amp; Manual QR Payments (Status: {formData.paymentsEnabled ? "🟢 ACTIVE" : "🔴 OFF / DISABLED BY DEFAULT"})
                  </label>
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
