"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite, defaultNavLinks, defaultHomeOptions } from "@/contexts/SiteContext";
import RenderIcon from "@/components/RenderIcon";
import Image from "next/image";
import Link from "next/link";

interface UserDoc {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  category: string;
  authorName?: string;
  createdAt: string;
}

interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  message: string;
  createdAt: string;
}

type AdminView = "overview" | "users" | "posts" | "messages" | "settings";

export default function AdminPage() {
  const { user, role, loading, logout } = useAuth();
  const { settings, updateSettings } = useSite();
  const router = useRouter();

  const [view, setView] = useState<AdminView>("overview");
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({ ...settings });
  const [settingsTab, setSettingsTab] = useState<
    "dev" | "branding" | "slider" | "ticker" | "goals" | "counselor" | "about" | "stats" | "services" | "payment" | "contact" | "social" | "cta" | "navigation" | "homeoptions" | "security"
  >("dev");
  const [showPrincipalPass, setShowPrincipalPass] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.push("/login?portal=admin");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (user && role === "admin") {
      fetchUsers();
      fetchPosts();
      fetchMessages();
    }
  }, [user, role]);

  const fetchUsers = async () => {
    let loadedUsers: UserDoc[] = [];
    try {
      const snap = await getDocs(collection(db, "users"));
      loadedUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDoc));
    } catch {}

    // Mock initial users if none found
    if (loadedUsers.length === 0) {
      loadedUsers = [
        {
          id: "u1",
          uid: "demo-principal-id",
          email: "principal@insersia.com",
          displayName: settings.principalName,
          role: "principal",
          createdAt: new Date().toISOString(),
        },
        {
          id: "u2",
          uid: "demo-admin-id",
          email: "admin@insersia.com",
          displayName: "System Administrator",
          role: "admin",
          createdAt: new Date().toISOString(),
        },
        {
          id: "u3",
          uid: "u3",
          email: "student@example.com",
          displayName: "Aarav Sharma (Student)",
          role: "user",
          createdAt: new Date().toISOString(),
        },
      ];
    }
    setUsers(loadedUsers);
  };

  const fetchPosts = async () => {
    let loadedPosts: Post[] = [];
    try {
      const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
      loadedPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
    } catch {}

    if (loadedPosts.length === 0 && typeof window !== "undefined") {
      const local = localStorage.getItem("insersia_posts");
      if (local) {
        try {
          loadedPosts = JSON.parse(local);
        } catch {}
      }
    }
    setPosts(loadedPosts);
  };

  const fetchMessages = async () => {
    let loadedMsgs: Message[] = [];
    try {
      const snap = await getDocs(query(collection(db, "contact_requests"), orderBy("createdAt", "desc")));
      loadedMsgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message));
    } catch {}

    if (loadedMsgs.length === 0 && typeof window !== "undefined") {
      const local = localStorage.getItem("insersia_contact_messages");
      if (local) {
        try {
          loadedMsgs = JSON.parse(local);
        } catch {}
      }
    }
    setMessages(loadedMsgs);
  };

  const changeRole = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
    } catch {}
    setUsers((prev) => prev.map((u) => (u.uid === uid || u.id === uid ? { ...u, role: newRole } : u)));
    setStatusMsg(`User role updated to ${newRole}`);
  };

  const deleteUser = async (uid: string) => {
    if (!confirm("Are you sure you want to remove this user?")) return;
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch {}
    setUsers((prev) => prev.filter((u) => u.uid !== uid && u.id !== uid));
    setStatusMsg("User removed.");
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post across the entire website?")) return;
    try {
      await deleteDoc(doc(db, "posts", id));
    } catch {}
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("insersia_posts") || "[]");
      localStorage.setItem("insersia_posts", JSON.stringify(existing.filter((p: Post) => p.id !== id)));
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setStatusMsg("Post deleted.");
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, "contact_requests", id));
    } catch {}
    if (typeof window !== "undefined") {
      const existing = JSON.parse(localStorage.getItem("insersia_contact_messages") || "[]");
      localStorage.setItem("insersia_contact_messages", JSON.stringify(existing.filter((m: Message) => m.id !== id)));
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setStatusMsg("Message deleted.");
  };

  // BRAND LOGO UPLOAD & RESET
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSettingsForm((prev) => ({ ...prev, siteLogo: reader.result as string }));
      setStatusMsg("Site logo selected! Click 'Save Overall Changes' to apply.");
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `branding/logo_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setSettingsForm((prev) => ({ ...prev, siteLogo: downloadUrl }));
    } catch {}
  };

  const handleResetLogo = () => {
    if (!confirm("Reset website logo to default?")) return;
    setSettingsForm((prev) => ({ ...prev, siteLogo: "/logo.jpg" }));
    setStatusMsg("Site logo reset to default. Click 'Save Overall Changes' to apply.");
  };

  // SERVICES & ICONS HANDLERS
  const handleUpdateService = (index: number, field: string, value: string) => {
    const updatedServices = [...(settingsForm.services || [])];
    updatedServices[index] = { ...updatedServices[index], [field]: value };
    setSettingsForm((prev) => ({ ...prev, services: updatedServices }));
  };

  const handleAddService = () => {
    const newService = {
      id: "s_" + Date.now(),
      icon: "🎯",
      title: "New Counseling Service",
      desc: "Personalized guidance program designed to support students in achieving their academic and life milestones.",
    };
    setSettingsForm((prev) => ({
      ...prev,
      services: [...(prev.services || []), newService],
    }));
  };

  const handleDeleteService = (index: number) => {
    if (!confirm("Are you sure you want to remove this service card from the home page?")) return;
    const updatedServices = (settingsForm.services || []).filter((_, i) => i !== index);
    setSettingsForm((prev) => ({ ...prev, services: updatedServices }));
  };

  // CUSTOM SERVICE ICON FILE UPLOAD (PNG/SVG/JPG)
  const handleServiceIconUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdateService(index, "icon", reader.result as string);
      setStatusMsg(`Custom icon uploaded for Card #${index + 1}! Click 'Save Overall Changes' below.`);
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `icons/service_${index}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      handleUpdateService(index, "icon", downloadUrl);
    } catch {}
  };

  // PASSPORT PHOTO UPLOAD
  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSettingsForm((prev) => ({ ...prev, principalPhoto: reader.result as string }));
      setStatusMsg("Passport photo selected! Click 'Save Website Changes' to apply.");
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `counselor/passport_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setSettingsForm((prev) => ({ ...prev, principalPhoto: downloadUrl }));
    } catch {}
  };

  // UPI QR CODE UPLOAD
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSettingsForm((prev) => ({ ...prev, upiQrCode: reader.result as string }));
      setStatusMsg("UPI QR code selected! Click 'Save Website Changes' to apply.");
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `payment/qr_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setSettingsForm((prev) => ({ ...prev, upiQrCode: downloadUrl }));
    } catch {}
  };

  // NAVBAR OPTIONS & MENU HANDLERS
  const handleUpdateNavLink = (index: number, field: "label" | "href", value: string) => {
    const updated = [...(settingsForm.navLinks || defaultNavLinks)];
    updated[index] = { ...updated[index], [field]: value };
    setSettingsForm((prev) => ({ ...prev, navLinks: updated }));
  };

  const handleAddNavLink = () => {
    const newLink = {
      id: "nav_" + Date.now(),
      label: "NEW OPTION",
      href: "/template",
    };
    setSettingsForm((prev) => ({
      ...prev,
      navLinks: [...(prev.navLinks || defaultNavLinks), newLink],
    }));
  };

  const handleDeleteNavLink = (index: number) => {
    const updated = (settingsForm.navLinks || defaultNavLinks).filter((_, i) => i !== index);
    setSettingsForm((prev) => ({ ...prev, navLinks: updated }));
  };

  const handleResetNavLinks = () => {
    if (!confirm("Reset navigation menu to default layout?")) return;
    setSettingsForm((prev) => ({ ...prev, navLinks: defaultNavLinks }));
    setStatusMsg("Top navigation options reset to default! Click 'Save Website Changes' to confirm.");
  };

  // HOME PAGE MODULE OPTIONS HANDLERS
  const handleUpdateHomeOption = (index: number, field: string, value: string) => {
    const updated = [...(settingsForm.homeOptions || defaultHomeOptions)];
    updated[index] = { ...updated[index], [field]: value };
    setSettingsForm((prev) => ({ ...prev, homeOptions: updated }));
  };

  const handleAddHomeOption = () => {
    const newOpt = {
      id: "opt_" + Date.now(),
      icon: "🌟",
      title: "New Guidance Feature",
      desc: "Comprehensive advisory program designed to support students in reaching their academic milestones.",
      badge: "Feature",
      href: "/template",
      btnText: "Explore Now →",
    };
    setSettingsForm((prev) => ({
      ...prev,
      homeOptions: [...(prev.homeOptions || defaultHomeOptions), newOpt],
    }));
  };

  const handleDeleteHomeOption = (index: number) => {
    const updated = (settingsForm.homeOptions || defaultHomeOptions).filter((_, i) => i !== index);
    setSettingsForm((prev) => ({ ...prev, homeOptions: updated }));
  };

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg("");
    try {
      await updateSettings(settingsForm);
      setStatusMsg("✅ All website details & settings saved successfully across the platform!");
    } catch {
      setStatusMsg("❌ Failed to update settings. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user || role !== "admin") return null;

  const navItems: { label: string; view: AdminView; icon: string; count?: number }[] = [
    { label: "Overview", view: "overview", icon: "📊" },
    { label: "Users & Roles", view: "users", icon: "👥", count: users.length },
    { label: "Post Moderation", view: "posts", icon: "📑", count: posts.length },
    { label: "Contact Inquiries", view: "messages", icon: "📬", count: messages.length },
    { label: "Global Settings", view: "settings", icon: "⚙️" },
  ];

  return (
    <div>
      <div className="dash-layout">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2rem", padding: "0 0.75rem" }}>
            <Image src="/logo.jpg" alt="Logo" width={40} height={40} style={{ borderRadius: 10, border: "2px solid #e74c3c" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Master Admin</div>
              <div style={{ color: "#e74c3c", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Super Administrator
              </div>
            </div>
          </div>

          <div className="dash-sidebar-title">Admin Controls</div>
          {navItems.map((item) => (
            <button
              key={item.view}
              className={`dash-nav-item ${view === item.view ? "active" : ""}`}
              onClick={() => {
                setView(item.view);
                setStatusMsg("");
              }}
            >
              <span>{item.icon}</span> {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    padding: "2px 7px",
                    borderRadius: 10,
                  }}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}

          <div className="dash-sidebar-title" style={{ marginTop: "2rem" }}>Quick Links</div>
          <Link href="/" className="dash-nav-item" target="_blank">
            <span>🌐</span> View Public Site
          </Link>
          <Link href="/dashboard" className="dash-nav-item" style={{ color: "var(--gold)" }}>
            <span>👩‍🏫</span> Principal Dashboard
          </Link>
          <button className="dash-nav-item" onClick={logout} style={{ color: "#e74c3c", marginTop: "1rem" }}>
            <span>🚪</span> Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="dash-main">
          {statusMsg && (
            <div
              style={{
                background: "rgba(46,204,113,0.15)",
                border: "1px solid rgba(46,204,113,0.3)",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                color: "#2ecc71",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
              }}
            >
              ✅ {statusMsg}
            </div>
          )}

          {/* VIEW: OVERVIEW */}
          {view === "overview" && (
            <div>
              <div className="dash-header">
                <h1 style={{ fontFamily: "Playfair Display, serif" }}>Administrator Control Center 🛡️</h1>
                <p style={{ color: "var(--text-muted)" }}>
                  Global oversight of users, counselor posts, contact inquiries, and website branding.
                </p>
              </div>

              <div className="dash-stats">
                {[
                  ["Total Registered Users", users.length, "👥"],
                  ["Published Articles", posts.length, "📑"],
                  ["Contact Inquiries", messages.length, "📬"],
                  ["Current Website Name", settings.siteName, "🌐"],
                ].map(([label, val, icon]) => (
                  <div key={label as string} className="stat-card">
                    <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{icon}</div>
                    <div className="stat-card-value" style={{ fontSize: typeof val === "string" ? "1.2rem" : "2rem" }}>
                      {val}
                    </div>
                    <div className="stat-card-label">{label}</div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ marginTop: "2rem" }}>
                <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>Administrator Shortcuts</h3>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button className="btn btn-gold" onClick={() => setView("users")}>
                    👥 Manage User Roles
                  </button>
                  <button className="btn btn-primary" onClick={() => setView("posts")}>
                    📑 Moderate Articles
                  </button>
                  <button className="btn btn-ghost" onClick={() => setView("messages")}>
                    📬 View Inquiries
                  </button>
                  <button className="btn btn-ghost" onClick={() => setView("settings")}>
                    ⚙️ Master Site Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: USERS */}
          {view === "users" && (
            <div className="card">
              <div className="dash-header">
                <h1 style={{ fontFamily: "Playfair Display, serif" }}>User &amp; Role Management 👥</h1>
                <p style={{ color: "var(--text-muted)" }}>
                  Assign roles to grant Counselor (Principal) or Admin privileges to any registered account.
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "0.75rem" }}>User</th>
                      <th style={{ padding: "0.75rem" }}>Email</th>
                      <th style={{ padding: "0.75rem" }}>Role</th>
                      <th style={{ padding: "0.75rem" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "0.75rem" }}>
                          <strong>{u.displayName || "Anonymous User"}</strong>
                        </td>
                        <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{u.email}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <select
                            value={u.role}
                            onChange={(e) => changeRole(u.uid || u.id, e.target.value)}
                            style={{
                              background: "rgba(255,255,255,0.08)",
                              color: u.role === "admin" ? "#e74c3c" : u.role === "principal" ? "var(--gold)" : "#fff",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              padding: "0.3rem 0.6rem",
                              fontWeight: 600,
                            }}
                          >
                            <option value="user" style={{ background: "#0c1b3a" }}>Student / User</option>
                            <option value="principal" style={{ background: "#0c1b3a" }}>Principal Ma&apos;am</option>
                            <option value="admin" style={{ background: "#0c1b3a" }}>Admin</option>
                          </select>
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <button
                            onClick={() => deleteUser(u.uid || u.id)}
                            className="btn btn-sm"
                            style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)" }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: POSTS MODERATION */}
          {view === "posts" && (
            <div>
              <div className="dash-header">
                <h1 style={{ fontFamily: "Playfair Display, serif" }}>Post &amp; Content Moderation 📑</h1>
                <p style={{ color: "var(--text-muted)" }}>Review and manage all articles published on the platform.</p>
              </div>

              {posts.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                  <p style={{ color: "var(--text-muted)" }}>No published posts to moderate.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {posts.map((p) => (
                    <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span className="badge badge-gold" style={{ marginRight: "0.5rem" }}>{p.category}</span>
                        <strong style={{ fontSize: "1.05rem" }}>{p.title}</strong>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
                          By {p.authorName || "Principal Ma'am"} &middot; {new Date(p.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link href="/posts" target="_blank" className="btn btn-ghost btn-sm">
                          View Post ↗
                        </Link>
                        <button
                          onClick={() => deletePost(p.id)}
                          className="btn btn-sm"
                          style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: INQUIRIES */}
          {view === "messages" && (
            <div>
              <div className="dash-header">
                <h1 style={{ fontFamily: "Playfair Display, serif" }}>Contact Form Inquiries 📬</h1>
                <p style={{ color: "var(--text-muted)" }}>All student and parent messages received through the website.</p>
              </div>

              {messages.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                  <p style={{ color: "var(--text-muted)" }}>No contact inquiries received yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {messages.map((m) => (
                    <div key={m.id} className="card">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <div>
                          <strong>{m.name}</strong> &middot; <span style={{ color: "var(--text-muted)" }}>{m.email}</span>
                          {m.phone && <span style={{ color: "var(--text-muted)" }}> &middot; {m.phone}</span>}
                        </div>
                        <button
                          onClick={() => deleteMessage(m.id)}
                          className="btn btn-sm"
                          style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)", padding: "0.2rem 0.5rem" }}
                        >
                          ✕ Delete
                        </button>
                      </div>
                      <span className="badge badge-gold" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
                        {m.category}
                      </span>
                      <p style={{ color: "var(--text-primary)", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: 8 }}>
                        {m.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: MASTER SETTINGS */}
          {view === "settings" && (
            <div className="card">
              <div className="dash-header" style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h1 style={{ fontFamily: "Playfair Display, serif", margin: 0 }}>Master Website Configuration ⚙️</h1>
                    <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      Customize every detail of the website dynamically — branding, hero, ticker, goals, services, counselor profile, payment gateway, and developer attribution.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveGlobalSettings}
                    className="btn btn-gold"
                    disabled={saving}
                    style={{ padding: "0.6rem 1.5rem", fontWeight: 700 }}
                  >
                    {saving ? "Saving Changes..." : "💾 Save Website Changes"}
                  </button>
                </div>
              </div>

              {/* Status Alert Notification */}
              {statusMsg && (
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderRadius: 8,
                    marginBottom: "1.5rem",
                    fontWeight: 600,
                    background: statusMsg.startsWith("❌") ? "rgba(231,76,60,0.15)" : "rgba(46,204,113,0.15)",
                    color: statusMsg.startsWith("❌") ? "#e74c3c" : "#2ecc71",
                    border: `1px solid ${statusMsg.startsWith("❌") ? "rgba(231,76,60,0.3)" : "rgba(46,204,113,0.3)"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{statusMsg}</span>
                  <button
                    type="button"
                    onClick={() => setStatusMsg("")}
                    style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1.1rem" }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* SUB-TABS NAVIGATION BAR */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  overflowX: "auto",
                  paddingBottom: "0.75rem",
                  marginBottom: "1.5rem",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {[
                  { id: "dev", label: "Developer & Attribution", icon: "🚀" },
                  { id: "security", label: "Security & Passwords", icon: "🔐" },
                  { id: "branding", label: "Portal Branding & Header", icon: "🏛️" },
                  { id: "navigation", label: "Navbar Options & Menu", icon: "🧭" },
                  { id: "homeoptions", label: "Home Page Options", icon: "📑" },
                  { id: "slider", label: "Hero Slider & Banners", icon: "🎞️" },
                  { id: "ticker", label: "Ticker & Mandate", icon: "📢" },
                  { id: "goals", label: "Strategic Goals", icon: "🎯" },
                  { id: "counselor", label: "Counselor Identity & Photo", icon: "👩‍🏫" },
                  { id: "about", label: "About Us & Story", icon: "📖" },
                  { id: "stats", label: "Portal Statistics", icon: "📊" },
                  { id: "services", label: "Guidance Services & Icons", icon: "🌟" },
                  { id: "payment", label: "Payment Gateway & Fees", icon: "💳" },
                  { id: "contact", label: "Helpline & Contact", icon: "📞" },
                  { id: "social", label: "Social Media Links", icon: "🌐" },
                  { id: "cta", label: "CTA Banner", icon: "📣" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsTab(tab.id as any)}
                    className="btn btn-sm"
                    style={{
                      whiteSpace: "nowrap",
                      background: settingsTab === tab.id ? "#009ea9" : "rgba(255,255,255,0.06)",
                      color: settingsTab === tab.id ? "#ffffff" : "var(--text-muted)",
                      border: settingsTab === tab.id ? "1px solid #009ea9" : "1px solid var(--border)",
                      fontWeight: settingsTab === tab.id ? 700 : 500,
                    }}
                  >
                    <span style={{ marginRight: 6 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSaveGlobalSettings}>
                {/* ── 1. SUB-TAB: DEVELOPER ATTRIBUTION & LEGAL ── */}
                {settingsTab === "dev" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ background: "rgba(0,158,169,0.08)", border: "1px solid #009ea9", borderRadius: 8, padding: "1rem" }}>
                      <h4 style={{ color: "#009ea9", margin: "0 0 0.4rem 0" }}>🚀 Developer Attribution &amp; Portal Credits</h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                        Change the &apos;Developed by&apos; name and link displayed in the website footer, as well as the official copyright text.
                      </p>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Developer Credit Text (&quot;Developed by ...&quot;)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.developedByText}
                          onChange={(e) => setSettingsForm({ ...settingsForm, developedByText: e.target.value })}
                          placeholder="e.g. Designed & Developed by Atul Sharma"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Developer Link URL (Website / Portfolio / GitHub)</label>
                        <input
                          type="url"
                          className="form-input"
                          value={settingsForm.developedByLink}
                          onChange={(e) => setSettingsForm({ ...settingsForm, developedByLink: e.target.value })}
                          placeholder="e.g. https://github.com/your-username or portfolio URL"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Footer Copyright &amp; Legal Notice</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settingsForm.copyrightText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, copyrightText: e.target.value })}
                        placeholder="e.g. All rights reserved. Designed for Excellence in Student Mentorship & Admission Transparency."
                      />
                    </div>

                    {/* Live Preview Box */}
                    <div style={{ background: "#002147", border: "1px solid #ffcc00", borderRadius: 8, padding: "1.25rem", color: "#ffffff", marginTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "#ffcc00", fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                        👁️ Live Footer Preview
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.85rem", color: "#cbd5e1" }}>
                        <span>© {new Date().getFullYear()} {settingsForm.siteName} - {settingsForm.divisionTitle || "e-Counselling Division"}. {settingsForm.copyrightText}</span>
                        {settingsForm.developedByText && (
                          <span style={{ color: "#94a3b8" }}>
                            Developed by{" "}
                            <span style={{ color: "#009ea9", fontWeight: 700, textDecoration: "underline" }}>
                              {settingsForm.developedByText}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 2. SUB-TAB: PORTAL BRANDING & HEADER ── */}
                {settingsTab === "branding" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Global Website Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.siteName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">e-Counselling Division Header Title</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.divisionTitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, divisionTitle: e.target.value })}
                          placeholder="e.g. e-Counselling Division"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Top Government Bar Left Notice Text</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settingsForm.topGovTextLeft}
                        onChange={(e) => setSettingsForm({ ...settingsForm, topGovTextLeft: e.target.value })}
                        placeholder="e.g. GOVERNMENT ACCREDITED COUNSELING CELL | EDUCATIONAL & CAREER GUIDANCE DIVISION"
                      />
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">National Accreditation Crest (English)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.accreditationTitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, accreditationTitle: e.target.value })}
                          placeholder="e.g. National Guidance Centre"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">National Accreditation Crest (Hindi)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.accreditationSub}
                          onChange={(e) => setSettingsForm({ ...settingsForm, accreditationSub: e.target.value })}
                          placeholder="e.g. राष्ट्रीय मार्गदर्शन प्रकोष्ठ"
                        />
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Hero Title / Tagline</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.tagline}
                          onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Sub-headline / Portal Motto</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.subtagline}
                          onChange={(e) => setSettingsForm({ ...settingsForm, subtagline: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Brand Logo Upload & Picker */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "var(--gold)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>🎨</span> Website Brand Logo &amp; Navbar/Footer Emblem
                      </h4>
                      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
                        <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", border: "2px solid var(--gold)", background: "#0c1b3a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {settingsForm.siteLogo && (settingsForm.siteLogo.startsWith("/") || settingsForm.siteLogo.startsWith("http") || settingsForm.siteLogo.startsWith("data:")) ? (
                            <img src={settingsForm.siteLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: "2rem" }}>{settingsForm.siteLogo || "🎓"}</span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: "220px" }}>
                          <input type="file" accept="image/*" className="form-input" onChange={handleLogoUpload} />
                          <input
                            type="text"
                            className="form-input"
                            style={{ marginTop: "0.5rem" }}
                            placeholder="Or logo URL / emoji (🎓, 🌟, 🦉)"
                            value={settingsForm.siteLogo}
                            onChange={(e) => setSettingsForm({ ...settingsForm, siteLogo: e.target.value })}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {["/logo.jpg", "🎓", "🌟", "🦉", "🏛️", "📖", "☀️", "💎", "🕊️", "🎯", "🚀"].map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setSettingsForm({ ...settingsForm, siteLogo: em })}
                            className="btn btn-sm"
                            style={{ background: settingsForm.siteLogo === em ? "var(--gold)" : "rgba(255,255,255,0.06)", color: settingsForm.siteLogo === em ? "#000" : "#fff", padding: "0.25rem 0.6rem" }}
                          >
                            {em === "/logo.jpg" ? "Original Logo" : em}
                          </button>
                        ))}
                        {settingsForm.siteLogo !== "/logo.jpg" && (
                          <button type="button" onClick={handleResetLogo} className="btn btn-sm" style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c" }}>
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUB-TAB: NAVBAR OPTIONS & MENU MANAGER ── */}
                {settingsTab === "navigation" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ background: "rgba(0,158,169,0.08)", border: "1px solid #009ea9", borderRadius: 8, padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                        <div>
                          <h4 style={{ color: "#009ea9", margin: "0 0 0.4rem 0" }}>🧭 Navbar Options &amp; Menu Manager</h4>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                            Add, rename, re-link, or remove options from the top navigation bar. Links can point to internal routes (e.g. <code>/database</code>, <code>/webinars</code>, <code>/template</code>) or custom pages.
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button type="button" onClick={handleAddNavLink} className="btn btn-gold btn-sm">
                            ➕ Add Navbar Option
                          </button>
                          <button type="button" onClick={handleResetNavLinks} className="btn btn-ghost btn-sm" style={{ border: "1px solid var(--border)" }}>
                            🔄 Reset to Defaults
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {(settingsForm.navLinks || defaultNavLinks).map((link, idx) => (
                        <div
                          key={link.id || idx}
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: "0.85rem 1rem",
                            display: "grid",
                            gridTemplateColumns: "60px 1.2fr 1.5fr auto",
                            gap: "1rem",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontWeight: 700, color: "var(--gold)", fontSize: "0.85rem" }}>
                            #{idx + 1}
                          </span>
                          <div>
                            <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: 2 }}>Label on Navbar</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                              value={link.label}
                              onChange={(e) => handleUpdateNavLink(idx, "label", e.target.value)}
                              placeholder="e.g. CAREER DATABASE"
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: 2 }}>Destination Route / URL</label>
                            <input
                              type="text"
                              className="form-input"
                              style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}
                              value={link.href}
                              onChange={(e) => handleUpdateNavLink(idx, "href", e.target.value)}
                              placeholder="e.g. /database or /template"
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleDeleteNavLink(idx)}
                              className="btn btn-sm"
                              style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)", padding: "0.4rem 0.75rem" }}
                              title="Delete Link"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: "rgba(255,204,0,0.06)", border: "1px solid rgba(255,204,0,0.2)", borderRadius: 8, padding: "1rem" }}>
                      <strong style={{ color: "var(--gold)", fontSize: "0.85rem", display: "block", marginBottom: "0.3rem" }}>
                        💡 Available Ready-to-Use Page Routes:
                      </strong>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/about</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/database</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/webinars</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/mentors</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/template</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/posts</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/achievements</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/news</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/gallery</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/testimonials</code>
                        <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 4 }}>/contact</code>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SUB-TAB: HOME PAGE MODULE OPTIONS ── */}
                {settingsTab === "homeoptions" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ background: "rgba(0,158,169,0.08)", border: "1px solid #009ea9", borderRadius: 8, padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                        <div>
                          <h4 style={{ color: "#009ea9", margin: "0 0 0.4rem 0" }}>📑 Home Page Guidance Modules &amp; Quick Options</h4>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                            Customize the interactive cards displayed on the Home Page linking to your specialized databases, webinars, mentor network, or templates.
                          </p>
                        </div>
                        <button type="button" onClick={handleAddHomeOption} className="btn btn-gold btn-sm">
                          ➕ Add Module Option Card
                        </button>
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Section Heading</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.homeOptionsTitle || ""}
                          onChange={(e) => setSettingsForm({ ...settingsForm, homeOptionsTitle: e.target.value })}
                          placeholder="e.g. Interactive Guidance Modules & Quick Options"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Section Subtitle</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.homeOptionsSubtitle || ""}
                          onChange={(e) => setSettingsForm({ ...settingsForm, homeOptionsSubtitle: e.target.value })}
                          placeholder="e.g. Explore our integrated career database, webinars, and mentor networks."
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {(settingsForm.homeOptions || defaultHomeOptions).map((opt, idx) => (
                        <div
                          key={opt.id || idx}
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            padding: "1.25rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                            <strong style={{ color: "var(--gold)" }}>Card #{idx + 1}: {opt.title}</strong>
                            {(settingsForm.homeOptions || defaultHomeOptions).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteHomeOption(idx)}
                                className="btn btn-sm"
                                style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)" }}
                              >
                                🗑️ Remove
                              </button>
                            )}
                          </div>

                          <div className="grid-3" style={{ marginBottom: "0.75rem" }}>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: "0.75rem" }}>Icon (Emoji)</label>
                              <input
                                type="text"
                                className="form-input"
                                value={opt.icon}
                                onChange={(e) => handleUpdateHomeOption(idx, "icon", e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: "0.75rem" }}>Title</label>
                              <input
                                type="text"
                                className="form-input"
                                value={opt.title}
                                onChange={(e) => handleUpdateHomeOption(idx, "title", e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: "0.75rem" }}>Tag Badge (Optional)</label>
                              <input
                                type="text"
                                className="form-input"
                                value={opt.badge || ""}
                                onChange={(e) => handleUpdateHomeOption(idx, "badge", e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                            <label className="form-label" style={{ fontSize: "0.75rem" }}>Description</label>
                            <textarea
                              rows={2}
                              className="form-input"
                              value={opt.desc}
                              onChange={(e) => handleUpdateHomeOption(idx, "desc", e.target.value)}
                            />
                          </div>

                          <div className="grid-2">
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: "0.75rem" }}>Link Destination URL</label>
                              <input
                                type="text"
                                className="form-input"
                                value={opt.href}
                                onChange={(e) => handleUpdateHomeOption(idx, "href", e.target.value)}
                                placeholder="e.g. /database or /webinars"
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: "0.75rem" }}>Button Text</label>
                              <input
                                type="text"
                                className="form-input"
                                value={opt.btnText || ""}
                                onChange={(e) => handleUpdateHomeOption(idx, "btnText", e.target.value)}
                                placeholder="e.g. Explore Database →"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 2B. SUB-TAB: HERO SLIDER & BANNERS ── */}
                {settingsTab === "slider" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ background: "rgba(0,158,169,0.08)", border: "1px solid #009ea9", borderRadius: 8, padding: "1rem" }}>
                      <h4 style={{ color: "#009ea9", margin: "0 0 0.4rem 0" }}>🎞️ Hero Slider &amp; Banner Customizer</h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                        Customize the interactive 3-slide rotating banner shown at the very top of your Home Page.
                      </p>
                    </div>

                    {/* Slide 1 */}
                    <div style={{ background: "rgba(0,158,169,0.06)", border: "1px solid rgba(0,158,169,0.2)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "#009ea9", marginBottom: "0.75rem" }}>Slide 1: e-Counselling Services &amp; Examination Flow</h4>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Left Column Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide1LeftTitle || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide1LeftTitle: e.target.value })}
                            placeholder="e.g. Examination Management Services"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Right Column Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide1RightTitle || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide1RightTitle: e.target.value })}
                            placeholder="e.g. Counselling & Admission Services"
                          />
                        </div>
                      </div>
                      <div className="grid-2" style={{ marginTop: "0.75rem" }}>
                        <div className="form-group">
                          <label className="form-label">Center Tagline</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide1CenterTagline || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide1CenterTagline: e.target.value })}
                            placeholder="e.g. SIMPLIFYING THE ADMISSION PROCESS"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Catered Target Exams / Boards List</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide1CateringText || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide1CateringText: e.target.value })}
                            placeholder="e.g. Catering to Examinations and Admissions in IIT's, NIT's..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Slide 2 */}
                    <div style={{ background: "rgba(0,158,169,0.06)", border: "1px solid rgba(0,158,169,0.2)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "#009ea9", marginBottom: "0.75rem" }}>Slide 2: 1-on-1 Guidance with Principal Ma&apos;am</h4>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Left Column Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide2LeftTitle || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide2LeftTitle: e.target.value })}
                            placeholder="e.g. Personalized Counseling Verticals"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Right Column Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide2RightTitle || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide2RightTitle: e.target.value })}
                            placeholder="e.g. Direct Student Solutions"
                          />
                        </div>
                      </div>
                      <div className="grid-2" style={{ marginTop: "0.75rem" }}>
                        <div className="form-group">
                          <label className="form-label">Center Tagline</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide2CenterTagline || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide2CenterTagline: e.target.value })}
                            placeholder="e.g. SENIOR EDUCATIONAL & CAREER COUNSELOR"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Slide Subtitle / Experience Summary</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide2CateringText || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide2CateringText: e.target.value })}
                            placeholder="e.g. Personalized 1-on-1 offline & online video consultation..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Slide 3 */}
                    <div style={{ background: "rgba(0,158,169,0.06)", border: "1px solid rgba(0,158,169,0.2)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "#009ea9", marginBottom: "0.75rem" }}>Slide 3: Study Abroad &amp; Global Admissions</h4>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Left Column Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide3LeftTitle || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide3LeftTitle: e.target.value })}
                            placeholder="e.g. Study Abroad & Global Admissions"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Right Column Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide3RightTitle || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide3RightTitle: e.target.value })}
                            placeholder="e.g. End-To-End Global Support"
                          />
                        </div>
                      </div>
                      <div className="grid-2" style={{ marginTop: "0.75rem" }}>
                        <div className="form-group">
                          <label className="form-label">Center Tagline</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide3CenterTagline || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide3CenterTagline: e.target.value })}
                            placeholder="e.g. GLOBAL UNIVERSITY ADMISSIONS"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Global Countries &amp; Universities List</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.slide3CateringText || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, slide3CateringText: e.target.value })}
                            placeholder="e.g. USA · UK · Canada · Australia · Germany..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 3. SUB-TAB: TICKER & MANDATE ── */}
                {settingsTab === "ticker" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Ticker Tag Badge Label</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.tickerTag}
                          onChange={(e) => setSettingsForm({ ...settingsForm, tickerTag: e.target.value })}
                          placeholder="e.g. LATEST ANNOUNCEMENTS"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mandate Button Text</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.mandateBtnText}
                          onChange={(e) => setSettingsForm({ ...settingsForm, mandateBtnText: e.target.value })}
                          placeholder="e.g. View More →"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Announcement Ticker Content (Scrolling Text)</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        value={settingsForm.tickerText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, tickerText: e.target.value })}
                        placeholder="Enter scrolling announcement text with bullet points..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Homepage e-Counselling Mandate &amp; Introduction Paragraph</label>
                      <textarea
                        className="form-input"
                        rows={5}
                        value={settingsForm.mandateText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, mandateText: e.target.value })}
                        placeholder="Enter the official mandate paragraph shown under the hero slider..."
                      />
                    </div>
                  </div>
                )}

                {/* ── 4. SUB-TAB: STRATEGIC GOALS & MANDATES ── */}
                {settingsTab === "goals" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Edit the Section Headings and the 3 Strategic Goals &amp; Mandates cards displayed on the homepage.
                    </p>

                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "var(--gold)", marginBottom: "0.75rem", fontSize: "0.95rem" }}>Home Page Section Heading</h4>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Section Tag Badge</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.goalsSectionTag || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, goalsSectionTag: e.target.value })}
                            placeholder="e.g. Core Principles"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Section Main Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.goalsSectionTitle || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, goalsSectionTitle: e.target.value })}
                            placeholder="e.g. Strategic Goals & Mandates"
                          />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginTop: "0.75rem" }}>
                        <label className="form-label">Section Subtitle / Description</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.goalsSectionSubtitle || ""}
                          onChange={(e) => setSettingsForm({ ...settingsForm, goalsSectionSubtitle: e.target.value })}
                          placeholder="e.g. Pioneering a standardized, transparent, and empathetic career guidance framework..."
                        />
                      </div>
                    </div>

                    {/* Card 1 */}
                    <div style={{ background: "rgba(0,158,169,0.06)", border: "1px solid rgba(0,158,169,0.2)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "#009ea9", marginBottom: "0.75rem" }}>Card 1: Core Principle</h4>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Icon (Emoji or Image URL)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.goal1Icon}
                            onChange={(e) => setSettingsForm({ ...settingsForm, goal1Icon: e.target.value })}
                            placeholder="e.g. 🎯"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.goal1Title}
                            onChange={(e) => setSettingsForm({ ...settingsForm, goal1Title: e.target.value })}
                            placeholder="e.g. Scientific Stream & Career Selection"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={settingsForm.goal1Desc}
                          onChange={(e) => setSettingsForm({ ...settingsForm, goal1Desc: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div style={{ background: "rgba(0,158,169,0.06)", border: "1px solid rgba(0,158,169,0.2)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "#009ea9", marginBottom: "0.75rem" }}>Card 2: Core Principle</h4>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Icon (Emoji or Image URL)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.goal2Icon}
                            onChange={(e) => setSettingsForm({ ...settingsForm, goal2Icon: e.target.value })}
                            placeholder="e.g. 🌿"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.goal2Title}
                            onChange={(e) => setSettingsForm({ ...settingsForm, goal2Title: e.target.value })}
                            placeholder="e.g. Exam Distress & Anxiety Mitigation"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={settingsForm.goal2Desc}
                          onChange={(e) => setSettingsForm({ ...settingsForm, goal2Desc: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div style={{ background: "rgba(0,158,169,0.06)", border: "1px solid rgba(0,158,169,0.2)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "#009ea9", marginBottom: "0.75rem" }}>Card 3: Core Principle</h4>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Icon (Emoji or Image URL)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.goal3Icon}
                            onChange={(e) => setSettingsForm({ ...settingsForm, goal3Icon: e.target.value })}
                            placeholder="e.g. 🏛️"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.goal3Title}
                            onChange={(e) => setSettingsForm({ ...settingsForm, goal3Title: e.target.value })}
                            placeholder="e.g. Central & Global Admission Advisory"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-input"
                          rows={2}
                          value={settingsForm.goal3Desc}
                          onChange={(e) => setSettingsForm({ ...settingsForm, goal3Desc: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 5. SUB-TAB: COUNSELOR IDENTITY & PASSPORT PHOTO ── */}
                {settingsTab === "counselor" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                      <label className="form-label">Home Page Profile Section Tag Badge</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settingsForm.counselorSectionTag || ""}
                        onChange={(e) => setSettingsForm({ ...settingsForm, counselorSectionTag: e.target.value })}
                        placeholder="e.g. About the Senior Counselor"
                      />
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Principal / Counselor Full Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.principalName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, principalName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Professional Designation / Qualifications</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.principalDesignation}
                          onChange={(e) => setSettingsForm({ ...settingsForm, principalDesignation: e.target.value })}
                          placeholder="e.g. Senior Educational & Career Counselor | M.Ed & Child Psychologist"
                        />
                      </div>
                    </div>

                    {/* Passport Photo Upload & Preview */}
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: 10, border: "1px solid var(--border)" }}>
                      <div style={{ width: 100, height: 125, borderRadius: 10, overflow: "hidden", border: "3px solid var(--gold)", flexShrink: 0, background: "#0c1b3a" }}>
                        <img src={settingsForm.principalPhoto || "/logo.jpg"} alt="Passport Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">📁 Upload Principal Ma&apos;am Passport Photo from PC</label>
                        <input type="file" accept="image/*" className="form-input" onChange={handlePassportUpload} />
                        <label className="form-label" style={{ marginTop: "0.5rem" }}>Or Paste Passport Photo Image URL</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="https://... or data:image/..."
                          value={settingsForm.principalPhoto}
                          onChange={(e) => setSettingsForm({ ...settingsForm, principalPhoto: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Counselor Badges */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "var(--gold)", marginBottom: "0.75rem" }}>Counselor Profile Badges</h4>
                      <div className="grid-3">
                        <div className="form-group">
                          <label className="form-label">Badge 1</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.counselorBadge1}
                            onChange={(e) => setSettingsForm({ ...settingsForm, counselorBadge1: e.target.value })}
                            placeholder="e.g. Academic Mentor"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Badge 2</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.counselorBadge2}
                            onChange={(e) => setSettingsForm({ ...settingsForm, counselorBadge2: e.target.value })}
                            placeholder="e.g. Adolescent Coach"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Badge 3</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.counselorBadge3}
                            onChange={(e) => setSettingsForm({ ...settingsForm, counselorBadge3: e.target.value })}
                            placeholder="e.g. Global Advisory"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 6. SUB-TAB: ABOUT US & STORY ── */}
                {settingsTab === "about" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                      <label className="form-label">About Page Section Heading Title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settingsForm.aboutTitle}
                        onChange={(e) => setSettingsForm({ ...settingsForm, aboutTitle: e.target.value })}
                        placeholder="e.g. A Decade of Dedicated Guidance"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Short Counselor Bio (Appears on Homepage Profile)</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        value={settingsForm.aboutBio}
                        onChange={(e) => setSettingsForm({ ...settingsForm, aboutBio: e.target.value })}
                        placeholder="Enter 2-3 sentences summarizing experience..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Full About Us Story &amp; Background (Supports multiple paragraphs)</label>
                      <textarea
                        className="form-input"
                        rows={7}
                        value={settingsForm.aboutContent}
                        onChange={(e) => setSettingsForm({ ...settingsForm, aboutContent: e.target.value })}
                        placeholder="Enter comprehensive counseling story, vision, and methodology..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Counselor Philosophy Quote</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={settingsForm.philosophy}
                        onChange={(e) => setSettingsForm({ ...settingsForm, philosophy: e.target.value })}
                        placeholder="e.g. Every student has unique strengths. With the right direction, encouragement, and empathy, every hurdle becomes a stepping stone to excellence."
                      />
                    </div>
                  </div>
                )}

                {/* ── 7. SUB-TAB: PORTAL STATISTICS ── */}
                {settingsTab === "stats" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Configure the 4 large portal metric counters displayed across the website.
                    </p>

                    <div className="grid-2">
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 8, padding: "1rem" }}>
                        <div className="form-group">
                          <label className="form-label">Counter 1: Value</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.studentsGuided}
                            onChange={(e) => setSettingsForm({ ...settingsForm, studentsGuided: e.target.value })}
                            placeholder="e.g. 15,000+"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Counter 1: Label</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.studentsGuidedLabel}
                            onChange={(e) => setSettingsForm({ ...settingsForm, studentsGuidedLabel: e.target.value })}
                            placeholder="e.g. Students Guided Nationwide"
                          />
                        </div>
                      </div>

                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 8, padding: "1rem" }}>
                        <div className="form-group">
                          <label className="form-label">Counter 2: Value</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.yearsExperience}
                            onChange={(e) => setSettingsForm({ ...settingsForm, yearsExperience: e.target.value })}
                            placeholder="e.g. 15+"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Counter 2: Label</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.yearsExperienceLabel}
                            onChange={(e) => setSettingsForm({ ...settingsForm, yearsExperienceLabel: e.target.value })}
                            placeholder="e.g. Years of Educational Service"
                          />
                        </div>
                      </div>

                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 8, padding: "1rem" }}>
                        <div className="form-group">
                          <label className="form-label">Counter 3: Value</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.successRate}
                            onChange={(e) => setSettingsForm({ ...settingsForm, successRate: e.target.value })}
                            placeholder="e.g. 98%"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Counter 3: Label</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.successRateLabel}
                            onChange={(e) => setSettingsForm({ ...settingsForm, successRateLabel: e.target.value })}
                            placeholder="e.g. Admission & Career Success Rate"
                          />
                        </div>
                      </div>

                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 8, padding: "1rem" }}>
                        <div className="form-group">
                          <label className="form-label">Counter 4: Value</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.statMetric4Value}
                            onChange={(e) => setSettingsForm({ ...settingsForm, statMetric4Value: e.target.value })}
                            placeholder="e.g. 100%"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Counter 4: Label</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.statMetric4Label}
                            onChange={(e) => setSettingsForm({ ...settingsForm, statMetric4Label: e.target.value })}
                            placeholder="e.g. Personalized 1-on-1 Attention"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── 8. SUB-TAB: GUIDANCE SERVICES & ICONS ── */}
                {settingsTab === "services" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem", marginBottom: "0.5rem" }}>
                      <h4 style={{ color: "var(--gold)", marginBottom: "0.75rem", fontSize: "0.95rem" }}>Home Page Guidance Offerings Heading &amp; Button</h4>
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label">Section Tag Badge</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.servicesSectionTag || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, servicesSectionTag: e.target.value })}
                            placeholder="e.g. Guidance Offerings"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Section Main Title</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.servicesSectionTitle || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, servicesSectionTitle: e.target.value })}
                            placeholder="e.g. Our Counselling Services & Verticals"
                          />
                        </div>
                      </div>
                      <div className="grid-2" style={{ marginTop: "0.75rem" }}>
                        <div className="form-group">
                          <label className="form-label">Section Subtitle / Description</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.servicesSectionSubtitle || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, servicesSectionSubtitle: e.target.value })}
                            placeholder="e.g. Comprehensive counseling solutions tailored to each student..."
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Consultation Booking Button Label</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.servicesBtnText || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, servicesBtnText: e.target.value })}
                            placeholder="e.g. 🗓️ Book a Counseling Session Now"
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
                        Add, remove, or customize service cards with emoji icons or uploaded custom PNGs.
                      </p>
                      <button type="button" onClick={handleAddService} className="btn btn-gold btn-sm">
                        ➕ Add New Service Card
                      </button>
                    </div>

                    {(settingsForm.services || []).map((srv, idx) => (
                      <div key={srv.id || idx} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "1rem", border: "1px solid rgba(201,168,76,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <RenderIcon icon={srv.icon} alt={srv.title} size={42} />
                            <strong>Card #{idx + 1}: {srv.title}</strong>
                          </div>
                          {(settingsForm.services || []).length > 1 && (
                            <button type="button" onClick={() => handleDeleteService(idx)} className="btn btn-sm" style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c" }}>
                              Delete
                            </button>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                          {["🎓", "📚", "🧠", "👨‍👩‍👧", "📝", "🌐", "🏛️", "✈️", "🎯", "💡", "🚀", "💼", "🔬", "🩺", "🎨", "🏆", "⭐", "🤝"].map((ic) => (
                            <button
                              key={ic}
                              type="button"
                              onClick={() => handleUpdateService(idx, "icon", ic)}
                              className="btn btn-sm"
                              style={{ padding: "0.15rem 0.4rem", fontSize: "1rem", background: srv.icon === ic ? "var(--gold)" : "rgba(255,255,255,0.05)" }}
                            >
                              {ic}
                            </button>
                          ))}
                        </div>
                        <div style={{ margin: "0.5rem 0" }}>
                          <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>
                            📁 Upload Custom PNG / SVG / JPG Icon (Will be standardized to uniform dimensions):
                          </label>
                          <input type="file" accept="image/*" className="form-input" style={{ fontSize: "0.8rem", padding: "0.3rem" }} onChange={(e) => handleServiceIconUpload(idx, e)} />
                        </div>
                        <div className="grid-2">
                          <input
                            type="text"
                            className="form-input"
                            value={srv.title}
                            onChange={(e) => handleUpdateService(idx, "title", e.target.value)}
                            placeholder="Title"
                          />
                          <input
                            type="text"
                            className="form-input"
                            value={srv.icon}
                            onChange={(e) => handleUpdateService(idx, "icon", e.target.value)}
                            placeholder="Icon emoji or image URL"
                          />
                        </div>
                        <div style={{ marginTop: "0.5rem" }}>
                          <textarea
                            className="form-input"
                            rows={2}
                            value={srv.desc}
                            onChange={(e) => handleUpdateService(idx, "desc", e.target.value)}
                            placeholder="Service description..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── 9. SUB-TAB: PAYMENT GATEWAY & FEES ── */}
                {settingsTab === "payment" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: 10, border: "1px solid var(--border)" }}>
                      <div>
                        <strong style={{ fontSize: "1.05rem" }}>Enable Online Session Booking Fee</strong>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
                          When enabled, candidates booking a counseling session will be prompted to pay via UPI or Bank transfer.
                        </p>
                      </div>
                      <label style={{ position: "relative", display: "inline-block", width: 52, height: 28 }}>
                        <input
                          type="checkbox"
                          checked={settingsForm.paidSessionsEnabled}
                          onChange={(e) => setSettingsForm({ ...settingsForm, paidSessionsEnabled: e.target.checked })}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            cursor: "pointer",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: settingsForm.paidSessionsEnabled ? "#009ea9" : "#334155",
                            borderRadius: 34,
                            transition: "0.3s",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              content: '""',
                              height: 20,
                              width: 20,
                              left: settingsForm.paidSessionsEnabled ? 26 : 4,
                              bottom: 4,
                              backgroundColor: "white",
                              borderRadius: "50%",
                              transition: "0.3s",
                            }}
                          />
                        </span>
                      </label>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Consultation Fee</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.sessionFee}
                          onChange={(e) => setSettingsForm({ ...settingsForm, sessionFee: e.target.value })}
                          placeholder="e.g. ₹999 or ₹1,499"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Counselor / Business UPI ID</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.upiId}
                          onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                          placeholder="e.g. counselor@okhdfcbank"
                        />
                      </div>
                    </div>

                    {/* QR Code Upload */}
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: 10, border: "1px solid var(--border)" }}>
                      <div style={{ width: 90, height: 90, borderRadius: 8, overflow: "hidden", border: "2px solid var(--gold)", flexShrink: 0, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {settingsForm.upiQrCode ? (
                          <img src={settingsForm.upiQrCode} alt="QR Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                          <span style={{ color: "#000", fontSize: "0.75rem", textAlign: "center", padding: "0.25rem" }}>No QR Uploaded</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">📁 Upload UPI QR Code Image from PC</label>
                        <input type="file" accept="image/*" className="form-input" onChange={handleQrUpload} />
                        <label className="form-label" style={{ marginTop: "0.5rem" }}>Or Paste QR Code Image URL</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="https://... or data:image/..."
                          value={settingsForm.upiQrCode}
                          onChange={(e) => setSettingsForm({ ...settingsForm, upiQrCode: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Bank Account Holder Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.bankHolderName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bankHolderName: e.target.value })}
                          placeholder="e.g. Insersia Educational Services"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Bank Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.bankName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                          placeholder="e.g. HDFC Bank"
                        />
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Bank Account Number</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.bankAccountNumber}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bankAccountNumber: e.target.value })}
                          placeholder="e.g. 50200012345678"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Bank IFSC Code</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.bankIfsc}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bankIfsc: e.target.value })}
                          placeholder="e.g. HDFC0001234"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Payment Instructions for Candidate</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={settingsForm.paymentInstructions}
                        onChange={(e) => setSettingsForm({ ...settingsForm, paymentInstructions: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* ── 10. SUB-TAB: HELPLINE & CONTACT ── */}
                {settingsTab === "contact" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Official Contact Email</label>
                        <input
                          type="email"
                          className="form-input"
                          value={settingsForm.contactEmail}
                          onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Helpline Phone Number</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.contactPhone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">WhatsApp Counseling Helpline</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.whatsappNumber}
                          onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                          placeholder="+91 99999 99999"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Office Working Hours</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.officeHours}
                          onChange={(e) => setSettingsForm({ ...settingsForm, officeHours: e.target.value })}
                          placeholder="Monday to Saturday, 9:00 AM - 6:00 PM IST"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Physical Office / Postal Address</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settingsForm.contactAddress}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactAddress: e.target.value })}
                        placeholder="e.g. New Delhi, India"
                      />
                    </div>
                  </div>
                )}

                {/* ── 11. SUB-TAB: SOCIAL MEDIA LINKS ── */}
                {settingsTab === "social" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Provide links to social media profiles. Icons will be displayed automatically in the navbar and footer.
                    </p>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">📘 Facebook Profile / Page URL</label>
                        <input
                          type="url"
                          className="form-input"
                          value={settingsForm.facebookUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">📸 Instagram Profile URL</label>
                        <input
                          type="url"
                          className="form-input"
                          value={settingsForm.instagramUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">▶️ YouTube Channel URL</label>
                        <input
                          type="url"
                          className="form-input"
                          value={settingsForm.youtubeUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, youtubeUrl: e.target.value })}
                          placeholder="https://youtube.com/@..."
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">💼 LinkedIn Profile URL</label>
                        <input
                          type="url"
                          className="form-input"
                          value={settingsForm.linkedinUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, linkedinUrl: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">✖️ Twitter / X Profile URL</label>
                      <input
                        type="url"
                        className="form-input"
                        value={settingsForm.twitterUrl}
                        onChange={(e) => setSettingsForm({ ...settingsForm, twitterUrl: e.target.value })}
                        placeholder="https://x.com/..."
                      />
                    </div>
                  </div>
                )}

                {/* ── 12. SUB-TAB: CTA BANNER ── */}
                {settingsTab === "cta" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">CTA Badge Tag Label</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.ctaTag}
                          onChange={(e) => setSettingsForm({ ...settingsForm, ctaTag: e.target.value })}
                          placeholder="e.g. Official Advisory Portal"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CTA Primary Button Text</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.ctaBtnText}
                          onChange={(e) => setSettingsForm({ ...settingsForm, ctaBtnText: e.target.value })}
                          placeholder="e.g. 🗓️ Book Consultation Session"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">CTA Heading Title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settingsForm.ctaTitle}
                        onChange={(e) => setSettingsForm({ ...settingsForm, ctaTitle: e.target.value })}
                        placeholder="e.g. Ready to Plan Your Educational & Career Future?"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">CTA Description Text</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        value={settingsForm.ctaDesc}
                        onChange={(e) => setSettingsForm({ ...settingsForm, ctaDesc: e.target.value })}
                        placeholder="Enter description text..."
                      />
                    </div>
                  </div>
                )}

                {/* ── 15. SUB-TAB: SECURITY & PASSWORD MANAGEMENT ── */}
                {settingsTab === "security" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div style={{ background: "rgba(0,158,169,0.08)", border: "1px solid #009ea9", borderRadius: 8, padding: "1rem" }}>
                      <h4 style={{ color: "#009ea9", margin: "0 0 0.4rem 0" }}>🔐 Portal Access &amp; Security Password Management</h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
                        As the Master Administrator, you have full control over portal security. You can change the authorization password for Principal Ma&apos;am as well as your own Master Admin password. When saved, the new passwords take effect immediately across all devices.
                      </p>
                    </div>

                    {/* Principal Ma'am Password Card */}
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(201,168,76,0.4)",
                        borderRadius: 12,
                        padding: "1.25rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1.5rem" }}>👩‍🏫</span>
                          <div>
                            <h4 style={{ color: "var(--gold)", margin: 0, fontSize: "1rem" }}>Principal Ma&apos;am Counselor Password</h4>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                              Required for Principal Ma&apos;am to access the Counselor Dashboard (/dashboard)
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";
                            let randomPass = "Principal@";
                            for (let i = 0; i < 4; i++) randomPass += chars.charAt(Math.floor(Math.random() * chars.length));
                            setSettingsForm({ ...settingsForm, principalPassword: randomPass });
                            setStatusMsg(`Generated new password for Principal Ma'am: ${randomPass}. Click 'Save Website Changes' to apply.`);
                          }}
                          className="btn btn-sm"
                          style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", border: "1px solid rgba(201,168,76,0.3)", fontSize: "0.78rem" }}
                        >
                          🎲 Generate New Password
                        </button>
                      </div>

                      <div className="form-group" style={{ position: "relative" }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Active Security Password for Principal Ma&apos;am</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showPrincipalPass ? "text" : "password"}
                            className="form-input"
                            value={settingsForm.principalPassword || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, principalPassword: e.target.value })}
                            placeholder="Enter new password for Principal Ma'am..."
                            style={{ paddingRight: "2.5rem", borderColor: "rgba(201,168,76,0.4)", fontSize: "0.95rem", letterSpacing: showPrincipalPass ? "normal" : "0.1em" }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPrincipalPass(!showPrincipalPass)}
                            style={{
                              position: "absolute",
                              right: "0.75rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "#94a3b8",
                              cursor: "pointer",
                              fontSize: "1rem",
                              padding: "4px",
                            }}
                            title={showPrincipalPass ? "Hide password" : "Show password"}
                          >
                            {showPrincipalPass ? "👁️" : "🔒"}
                          </button>
                        </div>
                        <small style={{ color: "#94a3b8", fontSize: "0.78rem", display: "block", marginTop: "0.3rem" }}>
                          💡 If Principal Ma&apos;am forgets her password, you can change it here anytime and share the new password with her.
                        </small>
                      </div>
                    </div>

                    {/* Master Admin Password Card */}
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(0,158,169,0.4)",
                        borderRadius: 12,
                        padding: "1.25rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1.5rem" }}>🛡️</span>
                          <div>
                            <h4 style={{ color: "#2dd4bf", margin: 0, fontSize: "1rem" }}>Master Administrator Password</h4>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                              Required to enter this Master Admin Panel (/admin)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="form-group" style={{ position: "relative" }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>Active Security Password for Master Admin</label>
                        <div style={{ position: "relative" }}>
                          <input
                            type={showAdminPass ? "text" : "password"}
                            className="form-input"
                            value={settingsForm.adminPassword || ""}
                            onChange={(e) => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })}
                            placeholder="Enter new password for Master Admin..."
                            style={{ paddingRight: "2.5rem", borderColor: "rgba(0,158,169,0.4)", fontSize: "0.95rem", letterSpacing: showAdminPass ? "normal" : "0.1em" }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPass(!showAdminPass)}
                            style={{
                              position: "absolute",
                              right: "0.75rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              color: "#94a3b8",
                              cursor: "pointer",
                              fontSize: "1rem",
                              padding: "4px",
                            }}
                            title={showAdminPass ? "Hide password" : "Show password"}
                          >
                            {showAdminPass ? "👁️" : "🔒"}
                          </button>
                        </div>
                        <small style={{ color: "#94a3b8", fontSize: "0.78rem", display: "block", marginTop: "0.3rem" }}>
                          ⚠️ Note: Remember this password carefully. You can also configure it in your Vercel Environment Variables (<code>NEXT_PUBLIC_ADMIN_PASSWORD</code>).
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Save Action Bar */}
                <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Changes saved here are instantly reflected across all portal pages.
                  </span>
                  <button type="submit" className="btn btn-gold" disabled={saving} style={{ padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: 700 }}>
                    {saving ? "Saving Changes..." : "💾 Save Website Changes"}
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
