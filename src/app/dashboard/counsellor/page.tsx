"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite, ServiceItem, GalleryItem, SiteProfile } from "@/contexts/SiteContext";
import { t } from "@/translations";

interface AppointmentDoc {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string;
  serviceTitle: string;
  date: string;
  timeSlot: string;
  mode: string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt?: any;
}

interface PostDoc {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  published: boolean;
  createdAt?: any;
}

export default function CounsellorDashboardPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { profile, services, gallery, updateProfile, updateServices, updateGallery, lang } = useSite();

  const [activeTab, setActiveTab] = useState<"profile" | "services" | "gallery" | "appointments" | "posts">("profile");

  // Profile state
  const [profileForm, setProfileForm] = useState<SiteProfile>(profile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    setProfileForm(profile);
  }, [profile]);

  // Services state
  const [servicesList, setServicesList] = useState<ServiceItem[]>(services);
  const [newService, setNewService] = useState({ icon: "🎯", title: "", description: "" });
  const [savingServices, setSavingServices] = useState(false);

  useEffect(() => {
    setServicesList(services);
  }, [services]);

  // Gallery state
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(gallery);
  const [newGalleryItem, setNewGalleryItem] = useState<{ type: "photo" | "video"; url: string; caption: string; category: string }>({
    type: "photo",
    url: "",
    caption: "",
    category: "Events",
  });
  const [savingGallery, setSavingGallery] = useState(false);

  useEffect(() => {
    setGalleryList(gallery);
  }, [gallery]);

  // Appointments state
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [apptFilter, setApptFilter] = useState<string>("all");

  // Posts state
  const [postsList, setPostsList] = useState<PostDoc[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", category: "Career Guidance", excerpt: "", content: "", coverImage: "", published: true });
  const [creatingPost, setCreatingPost] = useState(false);

  // Load appointments
  const loadAppointments = async () => {
    try {
      setLoadingAppts(true);
      const snap = await getDocs(collection(db, "appointments"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppointmentDoc));
      // Sort in memory by date/createdAt
      list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setAppointments(list);
    } catch (err) {
      console.error("Error loading appointments:", err);
    } finally {
      setLoadingAppts(false);
    }
  };

  // Load posts
  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      const snap = await getDocs(collection(db, "posts"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PostDoc));
      setPostsList(list);
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (activeTab === "appointments") loadAppointments();
    if (activeTab === "posts") loadPosts();
  }, [activeTab]);

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileSuccess(false);
      await updateProfile(profileForm);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error("Profile save error:", err);
      alert("Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Add & Save Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.title.trim() || !newService.description.trim()) return;

    const item: ServiceItem = {
      id: "srv_" + Date.now(),
      icon: newService.icon || "🎯",
      title: newService.title.trim(),
      description: newService.description.trim(),
    };

    const updated = [...servicesList, item];
    setServicesList(updated);
    setNewService({ icon: "🎯", title: "", description: "" });

    try {
      setSavingServices(true);
      await updateServices(updated);
    } finally {
      setSavingServices(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    const updated = servicesList.filter((s) => s.id !== id);
    setServicesList(updated);
    await updateServices(updated);
  };

  // Add & Save Gallery Item
  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryItem.url.trim()) return;

    const item: GalleryItem = {
      id: "gal_" + Date.now(),
      type: newGalleryItem.type,
      url: newGalleryItem.url.trim(),
      caption: newGalleryItem.caption.trim(),
      category: newGalleryItem.category.trim() || "General",
    };

    const updated = [...galleryList, item];
    setGalleryList(updated);
    setNewGalleryItem({ type: "photo", url: "", caption: "", category: "Events" });

    try {
      setSavingGallery(true);
      await updateGallery(updated);
    } finally {
      setSavingGallery(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    const updated = galleryList.filter((g) => g.id !== id);
    setGalleryList(updated);
    await updateGallery(updated);
  };

  // Appointment Status Change
  const handleApptStatusChange = async (id: string, newStatus: AppointmentDoc["status"]) => {
    try {
      await updateDoc(doc(db, "appointments", id), { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error("Update appointment status error:", err);
      alert("Failed to update status.");
    }
  };

  // Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    try {
      setCreatingPost(true);
      await addDoc(collection(db, "posts"), {
        title: newPost.title.trim(),
        category: newPost.category.trim(),
        excerpt: newPost.excerpt.trim() || newPost.content.substring(0, 140) + "...",
        content: newPost.content.trim(),
        coverImage: newPost.coverImage.trim() || null,
        published: newPost.published,
        authorName: profile.counsellorName || user?.displayName || "Counsellor",
        createdAt: serverTimestamp(),
      });
      setNewPost({ title: "", category: "Career Guidance", excerpt: "", content: "", coverImage: "", published: true });
      loadPosts();
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post.");
    } finally {
      setCreatingPost(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await deleteDoc(doc(db, "posts", id));
      setPostsList((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Failed to delete article.");
    }
  };

  if (authLoading) {
    return (
      <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  const filteredAppts = appointments.filter((a) => (apptFilter === "all" ? true : a.status === apptFilter));

  return (
    <div className="page-wrapper">
      <div className="dash-layout">
        {/* Sidebar */}
        <aside className="dash-sidebar" aria-label="Counsellor Navigation">
          <div style={{ padding: "0 0.5rem 1rem" }}>
            <span className="badge badge-secondary">{t("roleCounsellor", lang)}</span>
            <div style={{ fontSize: "1rem", fontWeight: 700, marginTop: "0.4rem" }}>
              {profile.counsellorName || user?.displayName || "Counsellor"}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{user?.email}</div>
          </div>

          <div className="dash-section-title">Manage Content</div>
          <button
            className={`dash-nav-item${activeTab === "profile" ? " active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile &amp; Bio
          </button>
          <button
            className={`dash-nav-item${activeTab === "services" ? " active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            🎯 Services ({servicesList.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "gallery" ? " active" : ""}`}
            onClick={() => setActiveTab("gallery")}
          >
            🖼️ Gallery ({galleryList.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "posts" ? " active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            📝 Articles &amp; Posts
          </button>
          <button
            className={`dash-nav-item${activeTab === "appointments" ? " active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            📅 Appointments ({appointments.length})
          </button>

          <div className="dash-section-title" style={{ marginTop: "1.5rem" }}>Quick Links</div>
          {role === "admin" && (
            <Link href="/dashboard/admin" className="dash-nav-item">
              ⚙️ Admin Panel
            </Link>
          )}
          <Link href="/" className="dash-nav-item">
            🌐 View Public Website
          </Link>
        </aside>

        {/* Main Area */}
        <main className="dash-main">
          {/* TAB 1: COUNSELLOR PROFILE */}
          {activeTab === "profile" && (
            <div>
              <div className="dash-header">
                <h1>👤 Counsellor Profile &amp; Credentials</h1>
                <p>All information here dynamically powers the Home page, About Us page, and Contact cards. Zero hardcoding.</p>
              </div>

              {profileSuccess && (
                <div className="alert alert-success" style={{ marginBottom: "1.25rem" }}>
                  ✓ Counsellor profile saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
                        value={profileForm.counsellorName}
                        onChange={(e) => setProfileForm({ ...profileForm, counsellorName: e.target.value })}
                        placeholder="e.g. Dr. Ananya Sharma"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Professional Title / Designation</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.counsellorTitle}
                        onChange={(e) => setProfileForm({ ...profileForm, counsellorTitle: e.target.value })}
                        placeholder="e.g. Senior Career Strategist & Education Consultant"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Profile Photo URL</label>
                      <input
                        type="url"
                        className="form-input"
                        value={profileForm.counsellorPhoto}
                        onChange={(e) => setProfileForm({ ...profileForm, counsellorPhoto: e.target.value })}
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Specializations (comma separated)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.specializations}
                        onChange={(e) => setProfileForm({ ...profileForm, specializations: e.target.value })}
                        placeholder="Stream Selection, NEET/JEE Counselling, Abroad Studies, Resume Building"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">About / Bio (Detailed summary)</label>
                    <textarea
                      className="form-textarea"
                      rows={5}
                      value={profileForm.counsellorBio}
                      onChange={(e) => setProfileForm({ ...profileForm, counsellorBio: e.target.value })}
                      placeholder="Write your professional philosophy, guidance background, and student mentorship focus..."
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="form-label">Qualifications &amp; Certifications (1 per line)</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={profileForm.qualifications}
                      onChange={(e) => setProfileForm({ ...profileForm, qualifications: e.target.value })}
                      placeholder="M.A. Applied Psychology, Delhi University&#10;Certified Global Career Counsellor (UCLA Extension)&#10;Member, National Career Development Association"
                    />
                  </div>
                </div>

                {/* Experience & Stats */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                    📊 Key Metrics &amp; Badges (Shown on Home &amp; About)
                  </h3>
                  <div className="grid-3" style={{ gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Years Experience</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.yearsExperience}
                        onChange={(e) => setProfileForm({ ...profileForm, yearsExperience: e.target.value })}
                        placeholder="12+"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Students Mentored</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.studentsGuided}
                        onChange={(e) => setProfileForm({ ...profileForm, studentsGuided: e.target.value })}
                        placeholder="5,000+"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Success Rate</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.successRate}
                        onChange={(e) => setProfileForm({ ...profileForm, successRate: e.target.value })}
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
                        value={profileForm.badge1}
                        onChange={(e) => setProfileForm({ ...profileForm, badge1: e.target.value })}
                        placeholder="Certified Career Mentor"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Badge 2</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.badge2}
                        onChange={(e) => setProfileForm({ ...profileForm, badge2: e.target.value })}
                        placeholder="Confidential & 1-on-1"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Badge 3</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.badge3}
                        onChange={(e) => setProfileForm({ ...profileForm, badge3: e.target.value })}
                        placeholder="Science-Backed Assessments"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={savingProfile}>
                    {savingProfile ? "Saving Profile..." : "💾 Save Counsellor Profile"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SERVICES */}
          {activeTab === "services" && (
            <div>
              <div className="dash-header">
                <h1>🎯 Manage Services</h1>
                <p>Add and configure counselling services. These automatically show on the public Services page and in the booking dropdown.</p>
              </div>

              {/* Add Service Card */}
              <form onSubmit={handleAddService} className="card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                  Add New Service
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
                      placeholder="e.g. Higher Education & College Admissions"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Comprehensive stream planning, entrance exams mapping, and personalized college shortlist..."
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
                    <p>No services added yet. Use the form above to add your first service.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {servicesList.map((srv) => (
                      <div
                        key={srv.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          padding: "1rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          gap: "1rem",
                        }}
                      >
                        <div style={{ display: "flex", gap: "1rem" }}>
                          <span style={{ fontSize: "1.8rem" }}>{srv.icon}</span>
                          <div>
                            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>{srv.title}</h4>
                            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                              {srv.description}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteService(srv.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GALLERY */}
          {activeTab === "gallery" && (
            <div>
              <div className="dash-header">
                <h1>🖼️ Manage Gallery</h1>
                <p>Upload photos, workshop pictures, seminar videos, or testimonials for your public gallery.</p>
              </div>

              {/* Add item */}
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
                      <option value="video">Video (MP4 / Webm / Embed)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newGalleryItem.category}
                      onChange={(e) => setNewGalleryItem({ ...newGalleryItem, category: e.target.value })}
                      placeholder="e.g. Seminars, Awards, Student Sessions"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Direct Media URL *</label>
                  <input
                    type="url"
                    className="form-input"
                    value={newGalleryItem.url}
                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, url: e.target.value })}
                    placeholder="https://example.com/session-photo.jpg"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Caption / Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newGalleryItem.caption}
                    onChange={(e) => setNewGalleryItem({ ...newGalleryItem, caption: e.target.value })}
                    placeholder="Career Guidance Workshop at National Academy, 2026"
                  />
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={savingGallery}>
                    + Add to Gallery
                  </button>
                </div>
              </form>

              {/* Gallery Items */}
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
                  Gallery Items ({galleryList.length})
                </h3>
                {galleryList.length === 0 ? (
                  <div className="empty-state">
                    <p>No gallery items yet. Add photos or videos using the form above.</p>
                  </div>
                ) : (
                  <div className="grid-3" style={{ gap: "1rem" }}>
                    {galleryList.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          overflow: "hidden",
                          background: "var(--surface)",
                        }}
                      >
                        {item.type === "video" ? (
                          <div style={{ height: 160, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                            ▶️ Video Item
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.caption || "Gallery"}
                            style={{ width: "100%", height: 160, objectFit: "cover" }}
                          />
                        )}
                        <div style={{ padding: "0.75rem" }}>
                          <span className="badge badge-primary">{item.category}</span>
                          <p style={{ fontSize: "0.85rem", margin: "0.5rem 0", color: "var(--text)" }}>
                            {item.caption || "No caption"}
                          </p>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ width: "100%", justifyContent: "center" }}
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

          {/* TAB 4: POSTS */}
          {activeTab === "posts" && (
            <div>
              <div className="dash-header">
                <h1>📝 Articles &amp; Insights</h1>
                <p>Publish helpful guidance articles for students, parents, and aspirants.</p>
              </div>

              {/* Create Post Card */}
              <form onSubmit={handleCreatePost} className="card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "1rem" }}>
                  Publish New Article
                </h3>
                <div className="grid-2" style={{ gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Article Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="e.g. How to Choose the Right Career Stream in 2026"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      placeholder="Career Guidance / College Selection / Stress Management"
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: "1rem", marginTop: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Cover Image URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={newPost.coverImage}
                      onChange={(e) => setNewPost({ ...newPost, coverImage: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Short Summary (Excerpt)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                      placeholder="Brief one-sentence summary for preview cards..."
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Article Content (Plain text or formatted) *</label>
                  <textarea
                    className="form-textarea"
                    rows={8}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="Write the full guidance article here..."
                    required
                  />
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={creatingPost}>
                    {creatingPost ? "Publishing..." : "Publish Article"}
                  </button>
                </div>
              </form>

              {/* Published Posts */}
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>
                  Existing Articles ({postsList.length})
                </h3>
                {loadingPosts ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner" />
                  </div>
                ) : postsList.length === 0 ? (
                  <div className="empty-state">
                    <p>No articles created yet. Write your first article above.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {postsList.map((post) => (
                      <div
                        key={post.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          padding: "1rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <span className="badge badge-primary">{post.category}</span>
                            <span className={`badge ${post.published ? "badge-success" : "badge-muted"}`}>
                              {post.published ? "Published" : "Draft"}
                            </span>
                          </div>
                          <h4 style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.5rem" }}>{post.title}</h4>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                            {post.excerpt}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: APPOINTMENTS */}
          {activeTab === "appointments" && (
            <div>
              <div className="dash-header">
                <h1>📅 Appointment Requests</h1>
                <p>Manage and track all student/parent counselling booking requests.</p>
              </div>

              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div className="tabs" style={{ marginBottom: 0 }}>
                    {["all", "pending", "confirmed", "completed", "cancelled"].map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        className={`tab-btn${apptFilter === filter ? " active" : ""}`}
                        onClick={() => setApptFilter(filter)}
                      >
                        {filter.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={loadAppointments} disabled={loadingAppts}>
                    🔄 Refresh
                  </button>
                </div>

                {loadingAppts ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <div className="spinner" />
                  </div>
                ) : filteredAppts.length === 0 ? (
                  <div className="empty-state">
                    <p>No {apptFilter === "all" ? "" : apptFilter} appointments found.</p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Client Details</th>
                          <th>Service</th>
                          <th>Date &amp; Slot</th>
                          <th>Mode</th>
                          <th>Status</th>
                          <th>Change Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppts.map((appt) => (
                          <tr key={appt.id}>
                            <td>
                              <strong>{appt.clientName}</strong>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                📞 {appt.clientPhone}
                                {appt.clientEmail && <div>✉️ {appt.clientEmail}</div>}
                              </div>
                              {appt.notes && (
                                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.25rem", fontStyle: "italic" }}>
                                  "{appt.notes}"
                                </div>
                              )}
                            </td>
                            <td>{appt.serviceTitle}</td>
                            <td>
                              <strong>{appt.date}</strong>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{appt.timeSlot}</div>
                            </td>
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
                              <select
                                className="form-select"
                                style={{ width: "auto", padding: "0.3rem 0.6rem", fontSize: "0.82rem" }}
                                value={appt.status}
                                onChange={(e) => handleApptStatusChange(appt.id, e.target.value as any)}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
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
        </main>
      </div>
    </div>
  );
}
