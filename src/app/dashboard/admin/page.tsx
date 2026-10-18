"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useSite, SiteProfile, ServiceItem, GalleryItem } from "@/contexts/SiteContext";
import { logAuditEvent, AuditLogEntry } from "@/lib/auditLog";
import { formatInr } from "@/lib/paymentUtils";
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
  const { profile, services, gallery, updateProfile, updateServices, updateGallery, lang } = useSite();

  const [activeTab, setActiveTab] = useState<
    "users" | "counsellor" | "services" | "gallery" | "settings" | "booking" | "faqs" | "features" | "theme" | "audit" | "export"
  >("users");

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

  // Services management state (Admin full control)
  const [servicesList, setServicesList] = useState<ServiceItem[]>(services);
  const [newService, setNewService] = useState<{ icon: string; title: string; description: string; fee?: number }>({
    icon: "🎯",
    title: "",
    description: "",
    fee: undefined,
  });
  const [savingServices, setSavingServices] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceForm, setEditServiceForm] = useState<{ icon: string; title: string; description: string; fee?: number }>({
    icon: "🎯",
    title: "",
    description: "",
    fee: undefined,
  });

  // Gallery management state (Admin full control)
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(gallery);
  const [newGalleryItem, setNewGalleryItem] = useState<{ type: "photo" | "video"; url: string; caption: string; category: string }>({
    type: "photo",
    url: "",
    caption: "",
    category: "Campus & Seminars",
  });
  const [savingGallery, setSavingGallery] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  useEffect(() => {
    setServicesList(services);
  }, [services]);

  useEffect(() => {
    setGalleryList(gallery);
  }, [gallery]);

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

  // Admin Services Handlers
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.title.trim() || !newService.description.trim()) return;

    const item: ServiceItem = {
      id: "srv_" + Date.now(),
      icon: newService.icon || "🎯",
      title: newService.title.trim(),
      description: newService.description.trim(),
      fee: newService.fee || undefined,
    };

    const updated = [...servicesList, item];
    setServicesList(updated);
    setNewService({ icon: "🎯", title: "", description: "", fee: undefined });

    try {
      setSavingServices(true);
      await updateServices(updated);
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "admin",
        action: "ADMIN_ADD_SERVICE",
        details: `Added new service: ${item.title} (Fee: ${item.fee || "Standard/Included"})`,
        targetId: item.id,
      });
    } finally {
      setSavingServices(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    const updated = servicesList.filter((s) => s.id !== id);
    setServicesList(updated);
    await updateServices(updated);
    await logAuditEvent({
      actorUid: user?.uid || "",
      actorEmail: user?.email || null,
      actorRole: role || "admin",
      action: "ADMIN_DELETE_SERVICE",
      details: `Deleted service ${id}`,
      targetId: id,
    });
  };

  const handleStartEditService = (s: ServiceItem) => {
    setEditingServiceId(s.id);
    setEditServiceForm({
      icon: s.icon,
      title: s.title,
      description: s.description,
      fee: s.fee,
    });
  };

  const handleSaveEditService = async (id: string) => {
    if (!editServiceForm.title.trim() || !editServiceForm.description.trim()) {
      alert("Service title and description are required.");
      return;
    }
    const updated = servicesList.map((s) =>
      s.id === id
        ? {
            ...s,
            icon: editServiceForm.icon || "🎯",
            title: editServiceForm.title.trim(),
            description: editServiceForm.description.trim(),
            fee: editServiceForm.fee !== undefined && editServiceForm.fee !== null && Number(editServiceForm.fee) > 0 ? Number(editServiceForm.fee) : undefined,
          }
        : s
    );
    setServicesList(updated);
    setEditingServiceId(null);
    try {
      setSavingServices(true);
      await updateServices(updated);
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "admin",
        action: "ADMIN_UPDATE_SERVICE",
        details: `Updated service ${id} (${editServiceForm.title})`,
        targetId: id,
      });
    } finally {
      setSavingServices(false);
    }
  };

  // Admin Gallery Handlers
  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryItem.url.trim()) {
      alert("Please upload a photo or enter a video link first.");
      return;
    }

    const item: GalleryItem = {
      id: "gal_" + Date.now(),
      type: newGalleryItem.type,
      url: newGalleryItem.url.trim(),
      caption: newGalleryItem.caption.trim(),
      category: newGalleryItem.category.trim() || "Campus & Seminars",
    };

    const updated = [item, ...galleryList];
    setGalleryList(updated);
    setNewGalleryItem({ type: "photo", url: "", caption: "", category: "Campus & Seminars" });

    try {
      setSavingGallery(true);
      await updateGallery(updated);
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "admin",
        action: "ADMIN_ADD_GALLERY_ITEM",
        details: `Added ${item.type} to gallery: ${item.caption || item.id}`,
        targetId: item.id,
      });
    } finally {
      setSavingGallery(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (!confirm("Remove this media item from the gallery?")) return;
    const updated = galleryList.filter((g) => g.id !== id);
    setGalleryList(updated);
    await updateGallery(updated);
    await logAuditEvent({
      actorUid: user?.uid || "",
      actorEmail: user?.email || null,
      actorRole: role || "admin",
      action: "ADMIN_DELETE_GALLERY_ITEM",
      details: `Removed gallery item ${id}`,
      targetId: id,
    });
  };

  // Admin FAQ Handlers
  const handleAddFaq = () => {
    const newFaq = {
      id: "faq-" + Date.now(),
      category: "booking" as const,
      questionEn: "New Question Title",
      questionHi: "नया प्रश्न",
      answerEn: "Detailed answer explaining the process...",
      answerHi: "विस्तृत उत्तर यहाँ लिखें...",
    };
    setFormData({
      ...formData,
      faqList: [...(formData.faqList || []), newFaq],
    });
  };

  const handleDeleteFaq = (id: string) => {
    setFormData({
      ...formData,
      faqList: (formData.faqList || []).filter((f) => f.id !== id),
    });
  };

  // Admin Helpline Handlers
  const handleAddHelpline = () => {
    const newHelp = {
      id: "help-" + Date.now(),
      name: "Emergency Support Helpline",
      number: "112",
      descEn: "24x7 Emergency Services",
      descHi: "24x7 आपातकालीन सहायता",
      available: "24x7",
    };
    setFormData({
      ...formData,
      emergencyHelplines: [...(formData.emergencyHelplines || []), newHelp],
    });
  };

  const handleDeleteHelpline = (id: string) => {
    setFormData({
      ...formData,
      emergencyHelplines: (formData.emergencyHelplines || []).filter((h) => h.id !== id),
    });
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
            👥 Users &amp; Roles
          </button>
          <button
            className={`dash-nav-item${activeTab === "counsellor" ? " active" : ""}`}
            onClick={() => setActiveTab("counsellor")}
          >
            👩‍🏫 Counsellor &amp; Bio
          </button>
          <button
            className={`dash-nav-item${activeTab === "services" ? " active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            🎯 Services &amp; Fees ({servicesList.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "gallery" ? " active" : ""}`}
            onClick={() => setActiveTab("gallery")}
          >
            🖼️ Gallery &amp; Media ({galleryList.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "settings" ? " active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Branding &amp; Footer
          </button>
          <button
            className={`dash-nav-item${activeTab === "booking" ? " active" : ""}`}
            onClick={() => setActiveTab("booking")}
          >
            📅 Booking &amp; Payments
          </button>
          <button
            className={`dash-nav-item${activeTab === "faqs" ? " active" : ""}`}
            onClick={() => setActiveTab("faqs")}
          >
            ❓ FAQs &amp; Helplines
          </button>
          <button
            className={`dash-nav-item${activeTab === "features" ? " active" : ""}`}
            onClick={() => setActiveTab("features")}
          >
            ⚡ Features &amp; Mode
          </button>
          <button
            className={`dash-nav-item${activeTab === "theme" ? " active" : ""}`}
            onClick={() => setActiveTab("theme")}
          >
            🎨 Theme &amp; Colors
          </button>
          <button
            className={`dash-nav-item${activeTab === "audit" ? " active" : ""}`}
            onClick={() => setActiveTab("audit")}
          >
            📋 Audit Logs
          </button>
          <button
            className={`dash-nav-item${activeTab === "export" ? " active" : ""}`}
            onClick={() => setActiveTab("export")}
          >
            📥 Data Exports (CSV)
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
                <h1>⚙️ Site &amp; Footer Settings</h1>
                <p>Modify organization information, contact channels, announcements, and all footer details.</p>
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
                    <div className="form-group">
                      <label className="form-label">Twitter / X Profile URL</label>
                      <input
                        type="url"
                        className="form-input"
                        value={formData.twitter || ""}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        placeholder="https://x.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Information & Customization Card */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    🦶 Footer Information &amp; Customization
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                    Control every detail displayed in the website footer across all pages (brand tagline, legal links, registration number, disclaimer, and bottom copyright bar).
                  </p>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Footer Brand Tagline / Mission Note</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.footerTagline || ""}
                      onChange={(e) => setFormData({ ...formData, footerTagline: e.target.value })}
                      placeholder="Empowering students and individuals to make informed academic and career choices."
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Shown directly beneath the site name in the footer's first column (falls back to sub-tagline if left blank).
                    </span>
                  </div>

                  <div className="grid-2" style={{ gap: "1rem", marginBottom: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Privacy Policy Link URL / Path</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.privacyPolicyUrl || ""}
                        onChange={(e) => setFormData({ ...formData, privacyPolicyUrl: e.target.value })}
                        placeholder="/privacy"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Terms of Service Link URL / Path</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.termsOfServiceUrl || ""}
                        onChange={(e) => setFormData({ ...formData, termsOfServiceUrl: e.target.value })}
                        placeholder="/privacy"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Professional Registration Number (Displayed in Footer)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.professionalRegNumber || ""}
                      onChange={(e) => setFormData({ ...formData, professionalRegNumber: e.target.value })}
                      placeholder="e.g. RCI Registration No. CRR-12345 or NCS ID: NC-67890"
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Displayed in the footer Contact &amp; Legal column to establish trust and official compliance.
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Footer Confidentiality &amp; Crisis Disclaimer Note</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={formData.footerDisclaimer || ""}
                      onChange={(e) => setFormData({ ...formData, footerDisclaimer: e.target.value })}
                      placeholder="Leave blank to use the default Tele-MANAS (14416) emergency &amp; confidentiality notice, or enter a custom notice..."
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Custom disclaimer banner appearing above the bottom copyright bar.
                    </span>
                  </div>

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
                      <label className="form-label">Designed &amp; Developed By Attribution</label>
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
                    {savingSettings ? "Saving Settings..." : "💾 Save Site & Footer Branding"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: COUNSELLOR BIO & CREDENTIALS */}
          {activeTab === "counsellor" && (
            <div>
              <div className="dash-header">
                <h1>👩‍🏫 Counsellor Identity &amp; Bio</h1>
                <p>Edit Principal / Counsellor details, biography, qualifications, badges, and achievements shown on the homepage and about page.</p>
              </div>

              {saveSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
                  ✓ Counsellor information saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                    Personal Details
                  </h3>
                  <div className="grid-2" style={{ gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.counsellorName}
                        onChange={(e) => setFormData({ ...formData, counsellorName: e.target.value })}
                        placeholder="e.g. Dr. Ananya Sharma"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Professional Title / Designation</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.counsellorTitle}
                        onChange={(e) => setFormData({ ...formData, counsellorTitle: e.target.value })}
                        placeholder="e.g. Senior Career Strategist & Education Consultant"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Professional Registration Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.professionalRegNumber || ""}
                        onChange={(e) => setFormData({ ...formData, professionalRegNumber: e.target.value })}
                        placeholder="e.g. RCI Registration No. CRR-12345 or NCS ID: NC-67890"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Specializations (comma separated)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.specializations}
                        onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                        placeholder="Stream Selection, NEET/JEE Counselling, Abroad Studies, Resume Building"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <ImageUploader
                      label="Counsellor Profile Photo"
                      folder="counsellor"
                      currentUrl={formData.counsellorPhoto}
                      onUploadComplete={(url: string) => setFormData({ ...formData, counsellorPhoto: url })}
                      onRemove={() => setFormData({ ...formData, counsellorPhoto: "" })}
                      helperText="Official counsellor photo. Recommended ratio 3:4 or square. Max 2 MB."
                      maxSizeMB={2}
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">About / Biography (Detailed summary)</label>
                    <textarea
                      className="form-textarea"
                      rows={5}
                      value={formData.counsellorBio}
                      onChange={(e) => setFormData({ ...formData, counsellorBio: e.target.value })}
                      placeholder="Write counsellor's guidance philosophy, experience, and mentorship background..."
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">Qualifications &amp; Certifications (1 per line)</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={formData.qualifications}
                      onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      placeholder="M.A. Applied Psychology, Delhi University&#10;Certified Global Career Counsellor (UCLA Extension)&#10;Member, National Career Development Association"
                    />
                  </div>
                </div>

                {/* Badges and Experience Metrics */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                    📊 Key Metrics &amp; Trust Badges
                  </h3>
                  <div className="grid-3" style={{ gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Years of Experience</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                        placeholder="12+"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Students Guided</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.studentsGuided}
                        onChange={(e) => setFormData({ ...formData, studentsGuided: e.target.value })}
                        placeholder="5,000+"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Success Rate</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.successRate}
                        onChange={(e) => setFormData({ ...formData, successRate: e.target.value })}
                        placeholder="98%"
                      />
                    </div>
                  </div>

                  <div className="grid-3" style={{ gap: "1rem", marginTop: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Badge 1</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.badge1}
                        onChange={(e) => setFormData({ ...formData, badge1: e.target.value })}
                        placeholder="Certified Career Mentor"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Badge 2</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.badge2}
                        onChange={(e) => setFormData({ ...formData, badge2: e.target.value })}
                        placeholder="Confidential & 1-on-1"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Badge 3</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.badge3}
                        onChange={(e) => setFormData({ ...formData, badge3: e.target.value })}
                        placeholder="Science-Backed Assessments"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={savingSettings}>
                    {savingSettings ? "Saving..." : "💾 Save Counsellor Details"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: SERVICES & PRICING */}
          {activeTab === "services" && (
            <div>
              <div className="dash-header">
                <h1>🎯 Counselling Services &amp; Consultation Fees</h1>
                <p>Manage all guidance offerings and session pricing displayed on the public website and in appointment bookings.</p>
              </div>

              {/* Standard Booking Fee Card */}
              <form onSubmit={handleSaveSettings} className="card" style={{ marginBottom: "2rem", border: "1.5px solid var(--brand-primary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.35rem" }}>
                      💰 Standard Consultation Booking Price (₹ INR)
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, maxWidth: 650, lineHeight: 1.5 }}>
                      Default booking fee for consultation appointments. When a service doesn't have an individual custom fee, this standard price will apply across the website. (Set 0 for Free).
                    </p>
                  </div>
                  {saveSuccess && (
                    <span className="badge badge-success" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
                      ✓ Booking Price Saved!
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)" }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      min={0}
                      step={50}
                      value={formData.defaultConsultationFee !== undefined ? formData.defaultConsultationFee : ""}
                      onChange={(e) => setFormData({ ...formData, defaultConsultationFee: e.target.value ? Number(e.target.value) : 0 })}
                      placeholder="e.g. 500"
                      style={{ width: "160px", fontWeight: 700, fontSize: "1.05rem" }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                    {savingSettings ? "Saving..." : "💾 Update Standard Booking Price"}
                  </button>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Current Active: <strong>{profile.defaultConsultationFee ? `₹${profile.defaultConsultationFee}` : "Free of Cost"}</strong>
                  </span>
                </div>
              </form>

              {/* Add New Service Card */}
              <form onSubmit={handleAddService} className="card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                  Add New Counselling Service
                </h3>
                <div className="grid-2" style={{ gap: "1rem" }}>
                  <div className="form-group" style={{ maxWidth: 100 }}>
                    <label className="form-label">Emoji / Icon</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newService.icon}
                      onChange={(e) => setNewService({ ...newService, icon: e.target.value })}
                      placeholder="🎯"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newService.title}
                      onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                      placeholder="e.g. Stream Selection & Subject Mapping"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Consultation Fee (₹ INR) — Optional</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    value={newService.fee !== undefined ? newService.fee : ""}
                    onChange={(e) => setNewService({ ...newService, fee: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g. 500 (Leave blank to use Standard Booking Price)"
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Leave blank to automatically use the standard consultation booking price. Enter 0 for Free.
                  </span>
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Provide a clear description of what the student will receive in this consultation..."
                    required
                  />
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={savingServices}>
                    + Add Service
                  </button>
                </div>
              </form>

              {/* Existing Services List */}
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
                  Existing Services ({servicesList.length})
                </h3>
                {servicesList.length === 0 ? (
                  <div className="empty-state">
                    <p>No services registered yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {servicesList.map((srv) => (
                      <div
                        key={srv.id}
                        style={{
                          padding: "1.25rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {editingServiceId === srv.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div className="grid-2" style={{ gap: "1rem" }}>
                              <div className="form-group" style={{ maxWidth: 100 }}>
                                <label className="form-label">Icon</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={editServiceForm.icon}
                                  onChange={(e) => setEditServiceForm({ ...editServiceForm, icon: e.target.value })}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Service Title</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={editServiceForm.title}
                                  onChange={(e) => setEditServiceForm({ ...editServiceForm, title: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Consultation Fee (₹ INR)</label>
                              <input
                                type="number"
                                className="form-input"
                                min={0}
                                value={editServiceForm.fee !== undefined ? editServiceForm.fee : ""}
                                onChange={(e) => setEditServiceForm({ ...editServiceForm, fee: e.target.value ? Number(e.target.value) : undefined })}
                                placeholder="Leave blank for Standard Price"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Description</label>
                              <textarea
                                className="form-textarea"
                                rows={3}
                                value={editServiceForm.description}
                                onChange={(e) => setEditServiceForm({ ...editServiceForm, description: e.target.value })}
                              />
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem" }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSaveEditService(srv.id)}
                                disabled={savingServices}
                              >
                                {savingServices ? "Saving..." : "✓ Save Changes"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setEditingServiceId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                            <div style={{ display: "flex", gap: "1rem" }}>
                              <span style={{ fontSize: "1.8rem" }}>{srv.icon}</span>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>{srv.title}</h4>
                                  <span className="badge badge-primary">
                                    {srv.fee !== undefined && srv.fee !== null
                                      ? (Number(srv.fee) > 0 ? formatInr(srv.fee) : "Free of Cost")
                                      : (profile.defaultConsultationFee ? `${formatInr(profile.defaultConsultationFee)} (Standard)` : "Free / Included")}
                                  </span>
                                </div>
                                <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                  {srv.description}
                                </p>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleStartEditService(srv)}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteService(srv.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: GALLERY */}
          {activeTab === "gallery" && (
            <div>
              <div className="dash-header">
                <h1>🖼️ Gallery &amp; Media Manager</h1>
                <p>Upload photos and seminar/workshop videos for the public gallery.</p>
              </div>

              {/* Add Gallery Item Card */}
              <form onSubmit={handleAddGalleryItem} className="card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                  Add Media to Gallery
                </h3>
                <div className="grid-2" style={{ gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Media Type</label>
                    <select
                      className="form-select"
                      value={newGalleryItem.type}
                      onChange={(e) => setNewGalleryItem({ ...newGalleryItem, type: e.target.value as "photo" | "video" })}
                    >
                      <option value="photo">Photo / Image</option>
                      <option value="video">Video (YouTube / Vimeo / MP4)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newGalleryItem.category}
                      onChange={(e) => setNewGalleryItem({ ...newGalleryItem, category: e.target.value })}
                      placeholder="e.g. Seminars, Student Guidance, Campus Events"
                    />
                  </div>
                </div>

                {newGalleryItem.type === "photo" ? (
                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <ImageUploader
                      label="Upload Gallery Photo *"
                      folder="gallery"
                      currentUrl={newGalleryItem.url}
                      onUploadComplete={(url: string) => setNewGalleryItem({ ...newGalleryItem, url })}
                      onRemove={() => setNewGalleryItem({ ...newGalleryItem, url: "" })}
                      helperText="Click to browse or drag & drop a photo from your computer or phone. Max 5 MB, auto-compressed."
                      maxSizeMB={5}
                    />
                  </div>
                ) : (
                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">Video Embed or Stream Link (YouTube / Vimeo / MP4) *</label>
                    <input
                      type="url"
                      className="form-input"
                      value={newGalleryItem.url}
                      onChange={(e) => setNewGalleryItem({ ...newGalleryItem, url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                  </div>
                )}

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Caption / Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newGalleryItem.caption}
                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, caption: e.target.value })}
                    placeholder="e.g. Career Guidance Seminar 2026"
                  />
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={savingGallery}>
                    {savingGallery ? "Adding..." : "+ Add to Gallery"}
                  </button>
                </div>
              </form>

              {/* Gallery Items Grid */}
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
                  Gallery Items ({galleryList.length})
                </h3>
                {galleryList.length === 0 ? (
                  <div className="empty-state">
                    <p>No gallery items uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid-3" style={{ gap: "1.25rem" }}>
                    {galleryList.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        {item.type === "photo" ? (
                          <img
                            src={item.url}
                            alt={item.caption || "Gallery"}
                            style={{ width: "100%", height: "180px", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "180px", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                            🎥 Video Embed
                          </div>
                        )}
                        <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                          <div>
                            <span className="badge badge-secondary" style={{ fontSize: "0.72rem", marginBottom: "0.35rem", display: "inline-block" }}>
                              {item.category}
                            </span>
                            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{item.caption || "No caption"}</div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ marginTop: "0.75rem", alignSelf: "flex-end" }}
                            onClick={() => handleDeleteGalleryItem(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: BOOKING RULES & PAYMENTS */}
          {activeTab === "booking" && (
            <div>
              <div className="dash-header">
                <h1>📅 Booking Rules &amp; Payments</h1>
                <p>Configure appointment durations, cancellation cutoff windows, UPI QR code, payee credentials, and client consent terms.</p>
              </div>

              {saveSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
                  ✓ Booking and payment settings saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                {/* Standard Consultation Fee & Manual QR Payments */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    💳 Consultation Fees &amp; UPI QR Payments
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                    Zero payment gateway fees. Clients scan the verified UPI QR code, pay via UPI, and submit their 12-digit bank UTR reference number for verification.
                  </p>

                  <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontSize: "0.92rem", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!formData.paymentsEnabled}
                        onChange={(e) => setFormData({ ...formData, paymentsEnabled: e.target.checked })}
                      />
                      Enable Consultation Fees &amp; Manual QR Payments (Status: {formData.paymentsEnabled ? "🟢 ACTIVE" : "🔴 OFF / DISABLED"})
                    </label>
                  </div>

                  <div className="grid-2" style={{ gap: "1.25rem" }}>
                    <div>
                      <ImageUploader
                        label="Official Payment QR Code Image *"
                        folder="payments/qr"
                        currentUrl={formData.paymentQr}
                        onUploadComplete={(url: string) => setFormData({ ...formData, paymentQr: url })}
                        onRemove={() => setFormData({ ...formData, paymentQr: "" })}
                        helperText="Upload Google Pay / PhonePe / Paytm / BHIM QR code."
                        maxSizeMB={2}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className="form-group">
                        <label className="form-label">Standard Consultation Booking Fee (₹ INR)</label>
                        <input
                          type="number"
                          className="form-input"
                          min={0}
                          value={formData.defaultConsultationFee !== undefined ? formData.defaultConsultationFee : ""}
                          onChange={(e) => setFormData({ ...formData, defaultConsultationFee: e.target.value ? Number(e.target.value) : 0 })}
                          placeholder="e.g. 500 (0 for Free)"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">UPI ID (VPA) *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.upiId || ""}
                          onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                          placeholder="e.g. counsellor@oksbi or 9876543210@paytm"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Payee Name (Account Holder Name) *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.payeeName || ""}
                          onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                          placeholder="e.g. Dr. Ananya Sharma / Inspiria Careers"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: "1.25rem" }}>
                    <label className="form-label">Refund &amp; Cancellation Policy Note (Visible to Clients)</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={formData.refundPolicyText || ""}
                      onChange={(e) => setFormData({ ...formData, refundPolicyText: e.target.value })}
                      placeholder="e.g. 100% refund if cancelled at least 24 hours prior to appointment slot..."
                    />
                  </div>
                </div>

                {/* Scheduling Parameters */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                    ⏱️ Session Duration &amp; Cancellation Windows
                  </h3>
                  <div className="grid-3" style={{ gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Cancellation Cutoff Hours</label>
                      <input
                        type="number"
                        className="form-input"
                        min={1}
                        value={formData.cancellationCutoffHours}
                        onChange={(e) => setFormData({ ...formData, cancellationCutoffHours: Number(e.target.value) || 24 })}
                        placeholder="24"
                      />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Clients cannot cancel or reschedule after this cutoff.
                      </span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Slot Duration (Minutes)</label>
                      <input
                        type="number"
                        className="form-input"
                        min={15}
                        step={15}
                        value={formData.slotDurationMinutes || 45}
                        onChange={(e) => setFormData({ ...formData, slotDurationMinutes: Number(e.target.value) || 45 })}
                        placeholder="45"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Buffer Between Slots (Minutes)</label>
                      <input
                        type="number"
                        className="form-input"
                        min={0}
                        step={5}
                        value={formData.slotBufferMinutes || 15}
                        onChange={(e) => setFormData({ ...formData, slotBufferMinutes: Number(e.target.value) || 15 })}
                        placeholder="15"
                      />
                    </div>
                  </div>
                </div>

                {/* Informed Consent Terms */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    📜 Client Informed Consent Form
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
                    Mandatory consent text that clients must agree to during their clinical intake or first appointment booking.
                  </p>
                  <div className="form-group">
                    <label className="form-label">Consent Version</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: "120px" }}
                      min={1}
                      value={formData.consentVersion || 1}
                      onChange={(e) => setFormData({ ...formData, consentVersion: Number(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">Consent Agreement Text</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      value={formData.consentText || ""}
                      onChange={(e) => setFormData({ ...formData, consentText: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={savingSettings}>
                    {savingSettings ? "Saving..." : "💾 Save Booking & Payment Rules"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: FAQS & HELPLINES */}
          {activeTab === "faqs" && (
            <div>
              <div className="dash-header">
                <h1>❓ FAQs &amp; Emergency Directory</h1>
                <p>Manage bilingual frequently asked questions and official 24x7 crisis helplines.</p>
              </div>

              {saveSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
                  ✓ FAQs and Helplines saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                {/* FAQs Section */}
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", margin: 0 }}>
                        Frequently Asked Questions ({(formData.faqList || []).length})
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
                        Bilingual Q&amp;A shown on the FAQs page and booking modal.
                      </p>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddFaq}>
                      + Add New FAQ
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {(formData.faqList || []).map((faq, idx) => (
                      <div
                        key={faq.id}
                        style={{
                          padding: "1rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <span className="badge badge-primary">FAQ #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteFaq(faq.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid-2" style={{ gap: "1rem", marginBottom: "0.75rem" }}>
                          <div className="form-group">
                            <label className="form-label">Question (English)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={faq.questionEn}
                              onChange={(e) => {
                                const list = [...(formData.faqList || [])];
                                list[idx] = { ...list[idx], questionEn: e.target.value };
                                setFormData({ ...formData, faqList: list });
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Question (Hindi / हिन्दी)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={faq.questionHi}
                              onChange={(e) => {
                                const list = [...(formData.faqList || [])];
                                list[idx] = { ...list[idx], questionHi: e.target.value };
                                setFormData({ ...formData, faqList: list });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid-2" style={{ gap: "1rem" }}>
                          <div className="form-group">
                            <label className="form-label">Answer (English)</label>
                            <textarea
                              className="form-textarea"
                              rows={2}
                              value={faq.answerEn}
                              onChange={(e) => {
                                const list = [...(formData.faqList || [])];
                                list[idx] = { ...list[idx], answerEn: e.target.value };
                                setFormData({ ...formData, faqList: list });
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Answer (Hindi / हिन्दी)</label>
                            <textarea
                              className="form-textarea"
                              rows={2}
                              value={faq.answerHi}
                              onChange={(e) => {
                                const list = [...(formData.faqList || [])];
                                list[idx] = { ...list[idx], answerHi: e.target.value };
                                setFormData({ ...formData, faqList: list });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Helplines Section */}
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", margin: 0 }}>
                        Emergency Helplines ({(formData.emergencyHelplines || []).length})
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
                        Displayed on the /emergency page and trust &amp; safety disclaimers.
                      </p>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddHelpline}>
                      + Add Helpline
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {(formData.emergencyHelplines || []).map((help, idx) => (
                      <div
                        key={help.id}
                        style={{
                          padding: "1rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                          <span className="badge badge-secondary">Helpline #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteHelpline(help.id)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid-3" style={{ gap: "1rem", marginBottom: "0.75rem" }}>
                          <div className="form-group">
                            <label className="form-label">Organization / Helpline Name</label>
                            <input
                              type="text"
                              className="form-input"
                              value={help.name}
                              onChange={(e) => {
                                const list = [...(formData.emergencyHelplines || [])];
                                list[idx] = { ...list[idx], name: e.target.value };
                                setFormData({ ...formData, emergencyHelplines: list });
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Phone / Toll-Free Number</label>
                            <input
                              type="text"
                              className="form-input"
                              value={help.number}
                              onChange={(e) => {
                                const list = [...(formData.emergencyHelplines || [])];
                                list[idx] = { ...list[idx], number: e.target.value };
                                setFormData({ ...formData, emergencyHelplines: list });
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Availability Hours</label>
                            <input
                              type="text"
                              className="form-input"
                              value={help.available}
                              onChange={(e) => {
                                const list = [...(formData.emergencyHelplines || [])];
                                list[idx] = { ...list[idx], available: e.target.value };
                                setFormData({ ...formData, emergencyHelplines: list });
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid-2" style={{ gap: "1rem" }}>
                          <div className="form-group">
                            <label className="form-label">Description (English)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={help.descEn}
                              onChange={(e) => {
                                const list = [...(formData.emergencyHelplines || [])];
                                list[idx] = { ...list[idx], descEn: e.target.value };
                                setFormData({ ...formData, emergencyHelplines: list });
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Description (Hindi)</label>
                            <input
                              type="text"
                              className="form-input"
                              value={help.descHi}
                              onChange={(e) => {
                                const list = [...(formData.emergencyHelplines || [])];
                                list[idx] = { ...list[idx], descHi: e.target.value };
                                setFormData({ ...formData, emergencyHelplines: list });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={savingSettings}>
                    {savingSettings ? "Saving..." : "💾 Save FAQs & Helplines"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: FEATURE FLAGS & MAINTENANCE MODE */}
          {activeTab === "features" && (
            <div>
              <div className="dash-header">
                <h1>⚡ Feature Flags &amp; Maintenance Mode</h1>
                <p>Toggle optional modules and manage system maintenance state.</p>
              </div>

              {saveSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
                  ✓ Feature settings saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                {/* Maintenance Mode */}
                <div className="card" style={{ border: "1.5px solid #d97706" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d97706", marginBottom: "0.5rem" }}>
                    🚧 Scheduled Maintenance Mode
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
                    When active, public appointment booking is temporarily paused with an emergency safety notice banner. Administrators and Counsellors retain full dashboard access.
                  </p>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem" }}>
                    <input
                      type="checkbox"
                      checked={!!formData.maintenanceMode}
                      onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                    />
                    Enable Maintenance Mode (Status: {formData.maintenanceMode ? "🟡 ACTIVE (Bookings Paused)" : "🟢 INACTIVE (Normal Operations)"})
                  </label>
                  {formData.maintenanceMode && (
                    <div className="form-group" style={{ marginTop: "1rem" }}>
                      <label className="form-label">Maintenance Notice Banner Text</label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        value={formData.maintenanceNoticeText || ""}
                        onChange={(e) => setFormData({ ...formData, maintenanceNoticeText: e.target.value })}
                        placeholder="We are currently performing scheduled maintenance..."
                      />
                    </div>
                  )}
                </div>

                {/* Modular Add-on Flags */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                    🧩 Modular System Add-ons
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Messaging */}
                    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={!!formData.messagingEnabled}
                          onChange={(e) => setFormData({ ...formData, messagingEnabled: e.target.checked })}
                        />
                        💬 Secure Async Client-Counsellor Messaging
                      </label>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0.5rem 1.7rem" }}>
                        Enables private asynchronous messaging threads between verified clients and the counsellor.
                      </p>
                      {formData.messagingEnabled && (
                        <div style={{ marginLeft: "1.7rem", marginTop: "0.5rem", maxWidth: 400 }}>
                          <label className="form-label" style={{ fontSize: "0.8rem" }}>
                            Counsellor Expected Response Time Notice
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.messagingResponseTimeText || ""}
                            onChange={(e) => setFormData({ ...formData, messagingResponseTimeText: e.target.value })}
                            placeholder="1-2 working days / 24 घंटे"
                          />
                        </div>
                      )}
                    </div>

                    {/* Reminders */}
                    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={!!formData.smsRemindersEnabled}
                          onChange={(e) => setFormData({ ...formData, smsRemindersEnabled: e.target.checked })}
                        />
                        📱 WhatsApp / SMS Appointment Reminders (Dry-Run / Live)
                      </label>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0 1.7rem" }}>
                        Sends transactional appointment logistics 24 hours prior to scheduled session.
                      </p>
                    </div>

                    {/* Session Feedback */}
                    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={!!formData.feedbackEnabled}
                          onChange={(e) => setFormData({ ...formData, feedbackEnabled: e.target.checked })}
                        />
                        📝 Private Clinical Session Feedback &amp; Follow-up
                      </label>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0 1.7rem" }}>
                        Enables private session outcome reflection questions visible strictly to counsellor.
                      </p>
                    </div>

                    {/* Newsletter */}
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={!!formData.newsletterEnabled}
                          onChange={(e) => setFormData({ ...formData, newsletterEnabled: e.target.checked })}
                        />
                        📰 Newsletter &amp; Educational Guidance Tips
                      </label>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0 1.7rem" }}>
                        Enables double opt-in guidance newsletter subscription bar in footer and articles.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={savingSettings}>
                    {savingSettings ? "Saving..." : "💾 Save Feature Settings"}
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
