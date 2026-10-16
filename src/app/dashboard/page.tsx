"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite, defaultNavLinks, defaultHomeOptions } from "@/contexts/SiteContext";
import RenderIcon from "@/components/RenderIcon";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  createdAt: string;
  imageUrl?: string;
  videoUrl?: string;
  pdfUrl?: string;
  tags: string[];
  authorName?: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  date?: string;
  timeSlot?: string;
  message: string;
  createdAt: string;
  read?: boolean;
  isPaidSession?: boolean;
  amount?: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentStatus?: string;
}

interface Achievement {
  id?: string;
  year: string;
  icon: string;
  title: string;
  org: string;
  desc: string;
  category: string;
}

interface GalleryItem {
  id?: string;
  type: "photo" | "video";
  url: string;
  caption: string;
  category: string;
  emoji?: string;
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: "a1", year: "2024", icon: "🏆", title: "National Career Counselor of the Year", org: "All India Education Council & EdTech Forum", desc: "Recognized for exemplary contributions toward empowering students across India.", category: "Award" },
  { id: "a2", year: "2023", icon: "🎖️", title: "Excellence in Adolescent Guidance", org: "Ministry of Education & National Guidance Cell", desc: "Honored for pioneering holistic counseling interventions reducing student exam distress.", category: "Recognition" },
  { id: "a3", year: "2022", icon: "📚", title: "Bestselling Author - 'Navigating Your True Calling'", org: "National Academic Press", desc: "Authored an acclaimed practical guide for Indian students navigating college streams.", category: "Publication" },
  { id: "a4", year: "2021", icon: "🎙️", title: "Keynote Speaker at TEDx University", org: "TEDx Youth Chapter", desc: "Delivered a viral talk on 'Redefining Success: Beyond Marks and Medals'.", category: "Speaker" },
  { id: "a5", year: "2020", icon: "💡", title: "Pioneer in Digital Pan-India Counseling", org: "EdTech Innovation Summit", desc: "Conducted remote crisis intervention during the pandemic.", category: "Innovation" },
  { id: "a6", year: "2018", icon: "🏫", title: "Distinguished Principal of the Year", org: "National CBSE School Leaders Forum", desc: "Conferred regional leadership award for transforming school guidance.", category: "Award" },
];

const INITIAL_GALLERY_ITEMS: GalleryItem[] = [
  { id: "g1", type: "photo", url: "/logo.jpg", emoji: "🎓", caption: "Annual Higher Education & Career Fair 2024", category: "Events" },
  { id: "g2", type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", emoji: "🎤", caption: "Keynote Address: Overcoming Exam Fear & Finding True Passion", category: "Speaking" },
  { id: "g3", type: "photo", url: "/logo.jpg", emoji: "🏆", caption: "National Counseling Excellence Award Ceremony", category: "Awards" },
  { id: "g4", type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", emoji: "💻", caption: "All-India Career Orientation Webinar (2500+ attendees)", category: "Online" },
  { id: "g5", type: "photo", url: "/logo.jpg", emoji: "📚", caption: "Interactive Academic Strategy Workshop with Students", category: "Workshops" },
  { id: "g6", type: "photo", url: "/logo.jpg", emoji: "👨‍👩‍👧", caption: "Parent-Child Empathy Counseling Forum", category: "Sessions" },
];

type DashView = "overview" | "newpost" | "myposts" | "achievements" | "gallery" | "messages" | "settings";

export default function DashboardPage() {
  const { user, role, loading, logout } = useAuth();
  const { settings, updateSettings } = useSite();
  const router = useRouter();

  const [view, setView] = useState<DashView>("overview");
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(INITIAL_GALLERY_ITEMS);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  // Post form state
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "Career Guidance",
    tags: "",
    imageUrl: "",
    videoUrl: "",
    pdfUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Achievement form state
  const [achieveForm, setAchieveForm] = useState<Achievement>({
    year: new Date().getFullYear().toString(),
    icon: "🏆",
    title: "",
    org: "",
    desc: "",
    category: "Award",
  });

  // Gallery form state
  const [galleryForm, setGalleryForm] = useState<GalleryItem>({
    type: "photo",
    url: "",
    caption: "",
    category: "Events",
    emoji: "📸",
  });
  const [galleryPhotoFile, setGalleryPhotoFile] = useState<File | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({ ...settings });
  const [settingsTab, setSettingsTab] = useState<
    "ticker" | "goals" | "counselor" | "services" | "stats" | "slider" | "branding" | "about" | "payment" | "contact" | "social" | "cta" | "dev" | "navigation" | "homeoptions"
  >("ticker");

  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  useEffect(() => {
    if (!loading && (!user || (role !== "principal" && role !== "admin"))) {
      router.push("/login");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchMessages();
      fetchAchievements();
      fetchGallery();
    }
  }, [user]);

  const fetchPosts = async () => {
    let loadedPosts: Post[] = [];
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      loadedPosts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
    } catch {}

    if (loadedPosts.length === 0 && typeof window !== "undefined") {
      const local = localStorage.getItem("insersia_posts");
      if (local) {
        try { loadedPosts = JSON.parse(local); } catch {}
      }
    }
    setPosts(loadedPosts);
  };

  const fetchMessages = async () => {
    let loadedMsgs: ContactMessage[] = [];
    try {
      const q = query(collection(db, "contact_requests"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      loadedMsgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContactMessage));
    } catch {}

    if (loadedMsgs.length === 0 && typeof window !== "undefined") {
      const local = localStorage.getItem("insersia_contact_messages");
      if (local) {
        try { loadedMsgs = JSON.parse(local); } catch {}
      }
    }
    setMessages(loadedMsgs);
  };

  const fetchAchievements = async () => {
    let loaded = INITIAL_ACHIEVEMENTS;
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("insersia_achievements");
      if (local) {
        try { loaded = JSON.parse(local); } catch {}
      }
    }
    try {
      const q = query(collection(db, "achievements"), orderBy("year", "desc"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement));
        loaded = [...remote, ...loaded.filter((l) => !remote.some((r) => r.title === l.title))];
      }
    } catch {}
    setAchievements(loaded);
  };

  const fetchGallery = async () => {
    let loaded = INITIAL_GALLERY_ITEMS;
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("insersia_gallery");
      if (local) {
        try { loaded = JSON.parse(local); } catch {}
      }
    }
    try {
      const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const remote = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
        loaded = [...remote, ...loaded.filter((l) => !remote.some((r) => r.url === l.url))];
      }
    } catch {}
    setGalleryItems(loaded);
  };

  // POST HANDLERS
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setStatusMsg("Title and content are required.");
      setStatusType("error");
      return;
    }
    try {
      setSaving(true);
      setStatusMsg("");

      let finalImageUrl = form.imageUrl;
      let finalPdfUrl = form.pdfUrl;

      if (imageFile) {
        try {
          const imgRef = ref(storage, `posts/images/${Date.now()}_${imageFile.name}`);
          await uploadBytes(imgRef, imageFile);
          finalImageUrl = await getDownloadURL(imgRef);
        } catch {
          finalImageUrl = await new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(imageFile);
          });
        }
      }

      if (pdfFile) {
        try {
          const pdfRef = ref(storage, `posts/pdfs/${Date.now()}_${pdfFile.name}`);
          await uploadBytes(pdfRef, pdfFile);
          finalPdfUrl = await getDownloadURL(pdfRef);
        } catch {
          finalPdfUrl = URL.createObjectURL(pdfFile);
        }
      }

      const newPost: Post = {
        id: "post_" + Date.now(),
        title: form.title,
        excerpt: form.excerpt || form.content.slice(0, 150) + "...",
        content: form.content,
        category: form.category,
        videoUrl: form.videoUrl,
        imageUrl: finalImageUrl,
        pdfUrl: finalPdfUrl,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        authorName: settings.principalName,
        createdAt: new Date().toISOString(),
      };

      try {
        const docRef = await addDoc(collection(db, "posts"), newPost);
        newPost.id = docRef.id;
      } catch {}

      if (typeof window !== "undefined") {
        const existing = JSON.parse(localStorage.getItem("insersia_posts") || "[]");
        localStorage.setItem("insersia_posts", JSON.stringify([newPost, ...existing]));
      }

      setPosts((prev) => [newPost, ...prev]);
      setStatusMsg("Post published successfully! It is now live on the Posts page.");
      setStatusType("success");
      setForm({
        title: "",
        excerpt: "",
        content: "",
        category: "Career Guidance",
        tags: "",
        imageUrl: "",
        videoUrl: "",
        pdfUrl: "",
      });
      setImageFile(null);
      setPdfFile(null);
      setTimeout(() => setView("myposts"), 1500);
    } catch (err: unknown) {
      setStatusMsg(err instanceof Error ? err.message : "Failed to publish post.");
      setStatusType("error");
    } finally {
      setSaving(false);
    }
  };

  // DELETE POST
  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to permanently remove this article from the website?")) return;
    try { await deleteDoc(doc(db, "posts", id)); } catch {}

    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("insersia_posts", JSON.stringify(updated));
    }
    setStatusMsg("Article removed successfully.");
    setStatusType("success");
  };

  // ACHIEVEMENT HANDLERS
  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achieveForm.title || !achieveForm.org) {
      setStatusMsg("Title and organization are required.");
      setStatusType("error");
      return;
    }
    const newAchieve: Achievement = {
      id: "achieve_" + Date.now(),
      ...achieveForm,
    };
    try {
      await addDoc(collection(db, "achievements"), newAchieve);
    } catch {}

    const updated = [newAchieve, ...achievements];
    setAchievements(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("insersia_achievements", JSON.stringify(updated));
    }
    setStatusMsg("Achievement added successfully! Live on the Achievements page.");
    setStatusType("success");
    setAchieveForm({
      year: new Date().getFullYear().toString(),
      icon: "🏆",
      title: "",
      org: "",
      desc: "",
      category: "Award",
    });
  };

  // DELETE ACHIEVEMENT
  const handleDeleteAchievement = async (idOrTitle: string) => {
    if (!confirm("Are you sure you want to remove this achievement from the website?")) return;
    const updated = achievements.filter((a) => a.id !== idOrTitle && a.title !== idOrTitle);
    setAchievements(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("insersia_achievements", JSON.stringify(updated));
    }
    try { await deleteDoc(doc(db, "achievements", idOrTitle)); } catch {}
    setStatusMsg("Achievement removed successfully.");
    setStatusType("success");
  };

  // GALLERY HANDLERS
  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = galleryForm.url;

    if (galleryForm.type === "photo" && galleryPhotoFile) {
      try {
        const photoRef = ref(storage, `gallery/${Date.now()}_${galleryPhotoFile.name}`);
        await uploadBytes(photoRef, galleryPhotoFile);
        finalUrl = await getDownloadURL(photoRef);
      } catch {
        finalUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(galleryPhotoFile);
        });
      }
    }

    if (!finalUrl.trim() && !galleryForm.emoji) {
      setStatusMsg("Please provide an image file, video link, or emoji.");
      setStatusType("error");
      return;
    }

    const newItem: GalleryItem = {
      id: "gallery_" + Date.now(),
      ...galleryForm,
      url: finalUrl,
    };

    try {
      await addDoc(collection(db, "gallery"), { ...newItem, createdAt: new Date().toISOString() });
    } catch {}

    const updated = [newItem, ...galleryItems];
    setGalleryItems(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("insersia_gallery", JSON.stringify(updated));
    }
    setStatusMsg("Gallery media added successfully! Live on the Gallery page.");
    setStatusType("success");
    setGalleryForm({ type: "photo", url: "", caption: "", category: "Events", emoji: "📸" });
    setGalleryPhotoFile(null);
  };

  // DELETE GALLERY ITEM
  const handleDeleteGalleryItem = (idOrCaption: string) => {
    if (!confirm("Are you sure you want to remove this photo/video from the gallery?")) return;
    const updated = galleryItems.filter((g) => g.id !== idOrCaption && g.caption !== idOrCaption && g.url !== idOrCaption);
    setGalleryItems(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("insersia_gallery", JSON.stringify(updated));
    }
    try { deleteDoc(doc(db, "gallery", idOrCaption)); } catch {}
    setStatusMsg("Media item removed from gallery.");
    setStatusType("success");
  };

  // PASSPORT PHOTO UPLOAD & REMOVAL
  const handlePassportPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSettingsForm((prev) => ({ ...prev, principalPhoto: reader.result as string }));
      setStatusMsg("Passport photo selected! Click 'Save Settings' to apply.");
      setStatusType("success");
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `profile/passport_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setSettingsForm((prev) => ({ ...prev, principalPhoto: downloadUrl }));
    } catch {}
  };

  // REMOVE PASSPORT PHOTO
  const handleRemovePassportPhoto = () => {
    if (!confirm("Remove current passport photo and reset to default?")) return;
    setSettingsForm((prev) => ({ ...prev, principalPhoto: "/logo.jpg" }));
    setStatusMsg("Passport photo removed. Click 'Save All Settings' below to confirm.");
    setStatusType("success");
  };

  // QR CODE UPLOAD & REMOVAL
  const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSettingsForm((prev) => ({ ...prev, upiQrCode: reader.result as string }));
      setStatusMsg("UPI QR Code selected! Click 'Save Settings' to apply.");
      setStatusType("success");
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `profile/upi_qr_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setSettingsForm((prev) => ({ ...prev, upiQrCode: downloadUrl }));
    } catch {}
  };

  // REMOVE QR CODE
  const handleRemoveQrCode = () => {
    if (!confirm("Remove current UPI QR Code?")) return;
    setSettingsForm((prev) => ({ ...prev, upiQrCode: "" }));
    setStatusMsg("UPI QR Code removed. Click 'Save All Settings' below to confirm.");
    setStatusType("success");
  };

  // DELETE MESSAGE
  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Delete this inquiry?")) return;
    try { await deleteDoc(doc(db, "contact_requests", id)); } catch {}
    const updated = messages.filter((m) => m.id !== id);
    setMessages(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("insersia_contact_messages", JSON.stringify(updated));
    }
    setStatusMsg("Inquiry deleted.");
    setStatusType("success");
  };

  // BRAND LOGO UPLOAD & RESET
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSettingsForm((prev) => ({ ...prev, siteLogo: reader.result as string }));
      setStatusMsg("Site logo selected! Click 'Save All Settings' to apply.");
      setStatusType("success");
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
    setStatusMsg("Site logo reset to default. Click 'Save All Settings' to confirm.");
    setStatusType("success");
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
      setStatusMsg(`Custom icon uploaded for Card #${index + 1}! Click 'Save All Settings' below to apply.`);
      setStatusType("success");
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `icons/service_${index}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      handleUpdateService(index, "icon", downloadUrl);
    } catch {}
  };

  // CUSTOM ACHIEVEMENT ICON FILE UPLOAD
  const handleAchievementIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAchieveForm((prev) => ({ ...prev, icon: reader.result as string }));
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `icons/achievement_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setAchieveForm((prev) => ({ ...prev, icon: downloadUrl }));
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
    if (!confirm("Reset top navigation menu to default layout?")) return;
    setSettingsForm((prev) => ({ ...prev, navLinks: defaultNavLinks }));
    setStatusMsg("Top navigation options reset to default! Click 'Save All Settings' below to confirm.");
    setStatusType("success");
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg("");
    try {
      await updateSettings(settingsForm);
      setStatusMsg("All website settings, payment details, and social links updated successfully!");
      setStatusType("success");
    } catch {
      setStatusMsg("Failed to update settings.");
      setStatusType("error");
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

  if (!user || (role !== "principal" && role !== "admin")) return null;

  const navItems: { label: string; view: DashView; icon: string; count?: number }[] = [
    { label: "Overview", view: "overview", icon: "📊" },
    { label: "New Post", view: "newpost", icon: "✍️" },
    { label: "My Posts", view: "myposts", icon: "📑", count: posts.length },
    { label: "Achievements", view: "achievements", icon: "🏆", count: achievements.length },
    { label: "Gallery Media", view: "gallery", icon: "🖼️", count: galleryItems.length },
    { label: "Bookings & Inquiries", view: "messages", icon: "📬", count: messages.filter((m) => !m.read).length },
    { label: "Home Page & Site Settings", view: "settings", icon: "⚙️" },
  ];

  return (
    <div>
      <div className="dash-layout">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "2rem", padding: "0 0.75rem" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                overflow: "hidden",
                border: "2px solid var(--gold)",
                flexShrink: 0,
                background: "#0c1b3a",
              }}
            >
              <img
                src={settings.principalPhoto || "/logo.jpg"}
                alt={settings.principalName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{settings.principalName}</div>
              <div style={{ color: "var(--gold)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Counselor Panel
              </div>
            </div>
          </div>

          <div className="dash-sidebar-title">Management</div>
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
                    background: item.view === "messages" ? "#e74c3c" : "rgba(201,168,76,0.3)",
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

          <div className="dash-sidebar-title" style={{ marginTop: "2rem" }}>Quick Navigation</div>
          <Link href="/" className="dash-nav-item" target="_blank">
            <span>🌐</span> View Home Page
          </Link>
          <Link href="/about" className="dash-nav-item" target="_blank">
            <span>👤</span> View About Page
          </Link>
          <Link href="/achievements" className="dash-nav-item" target="_blank">
            <span>🏆</span> View Achievements
          </Link>
          <Link href="/gallery" className="dash-nav-item" target="_blank">
            <span>🖼️</span> View Gallery
          </Link>
          <Link href="/contact" className="dash-nav-item" target="_blank">
            <span>💬</span> Test Book a Session
          </Link>
          {role === "admin" && (
            <Link href="/admin" className="dash-nav-item" style={{ color: "var(--gold)" }}>
              <span>🛡️</span> Admin Panel
            </Link>
          )}
          <button className="dash-nav-item" onClick={logout} style={{ color: "#e74c3c", marginTop: "1rem" }}>
            <span>🚪</span> Logout
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="dash-main">
          {statusMsg && (
            <div
              style={{
                background: statusType === "success" ? "rgba(46,204,113,0.15)" : "rgba(231,76,60,0.15)",
                border: `1px solid ${statusType === "success" ? "rgba(46,204,113,0.4)" : "rgba(231,76,60,0.4)"}`,
                borderRadius: 8,
                padding: "0.85rem 1.25rem",
                color: statusType === "success" ? "#2ecc71" : "#e74c3c",
                fontSize: "0.9rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>{statusType === "success" ? "✅" : "⚠️"}</span> {statusMsg}
            </div>
          )}

          {/* VIEW: OVERVIEW */}
          {view === "overview" && (
            <div>
              <div className="dash-header">
                <h1 style={{ fontFamily: "Playfair Display, serif" }}>Welcome back, {settings.principalName} ✨</h1>
                <p style={{ color: "var(--text-muted)" }}>
                  Full management of articles, achievements, photo/video gallery, session bookings, and payments.
                </p>
              </div>

              <div className="dash-stats">
                {[
                  ["Total Articles", posts.length, "📝"],
                  ["Honors & Awards", achievements.length, "🏆"],
                  ["Gallery Media", galleryItems.length, "🖼️"],
                  ["Session Bookings", messages.length, "📬"],
                ].map(([label, val, icon]) => (
                  <div key={label as string} className="stat-card">
                    <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{icon}</div>
                    <div className="stat-card-value">{val}</div>
                    <div className="stat-card-label">{label}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions & Shortcuts */}
              <div className="card" style={{ marginTop: "2rem" }}>
                <h3 style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "1.2rem" }}>Shortcuts &amp; Controls</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  Quickly manage articles, achievements, gallery media, and student session appointments.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button className="btn btn-gold" onClick={() => setView("newpost")}>
                    ✍️ Create New Post
                  </button>
                  <button className="btn btn-primary" onClick={() => setView("achievements")}>
                    🏆 Add / Remove Achievements
                  </button>
                  <button className="btn btn-primary" onClick={() => setView("gallery")}>
                    🖼️ Manage Gallery Media
                  </button>
                  <button className="btn btn-ghost" onClick={() => setView("messages")}>
                    📬 View Bookings &amp; Inquiries ({messages.filter((m) => !m.read).length} new)
                  </button>
                </div>
              </div>

              {/* DEDICATED HOME PAGE CUSTOMIZATION HUB */}
              <div className="card" style={{ marginTop: "1.5rem", border: "1px solid #009ea9", background: "rgba(0,158,169,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <h3 style={{ fontWeight: 800, margin: 0, fontSize: "1.2rem", color: "#009ea9" }}>
                      🏠 Home Page All Details Customizer
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                      Click any section below to directly update that specific part of the Home Page. All changes update instantly!
                    </p>
                  </div>
                  <button
                    className="btn btn-teal btn-sm"
                    onClick={() => {
                      setView("settings");
                      setSettingsTab("ticker");
                    }}
                  >
                    ⚙️ Open Full Settings Suite
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "0.75rem",
                    marginTop: "1rem",
                  }}
                >
                  {[
                    { label: "Announcements & Ticker", icon: "📢", tab: "ticker", desc: "Change marquee text & mandate" },
                    { label: "Strategic Goals", icon: "🎯", tab: "goals", desc: "Edit 3 Core Principle cards" },
                    { label: "Passport Photo & Bio", icon: "👩‍🏫", tab: "counselor", desc: "Upload PC photo, badges, name" },
                    { label: "Guidance Offerings", icon: "🌟", tab: "services", desc: "Manage service cards & custom PNGs" },
                    { label: "Portal Statistics", icon: "📊", tab: "stats", desc: "Students guided, years, success rate" },
                    { label: "Hero Slider & Banners", icon: "🎞️", tab: "slider", desc: "Slider headlines, exams, taglines" },
                    { label: "Payment & Session Fees", icon: "💳", tab: "payment", desc: "Enable fee, UPI ID, QR code" },
                    { label: "Helpline & Contact", icon: "📞", tab: "contact", desc: "WhatsApp, phone, office hours" },
                    { label: "Social Media Links", icon: "🌐", tab: "social", desc: "Facebook, Instagram, YouTube, etc." },
                    { label: "Bottom CTA Banner", icon: "📣", tab: "cta", desc: "Call to action headline & button" },
                    { label: "Portal Branding", icon: "🏛️", tab: "branding", desc: "Site name, division title, logo" },
                    { label: "About Us Story", icon: "📖", tab: "about", desc: "Senior counselor full story" },
                  ].map((btn) => (
                    <button
                      key={btn.tab}
                      type="button"
                      onClick={() => {
                        setView("settings");
                        setSettingsTab(btn.tab as any);
                      }}
                      className="btn"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: 8,
                        padding: "0.85rem 1rem",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.6rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{ fontSize: "1.35rem", lineHeight: 1 }}>{btn.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#002147" }}>{btn.label}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>{btn.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ACHIEVEMENTS */}
          {view === "achievements" && (
            <div>
              <div className="card" style={{ marginBottom: "2rem" }}>
                <div className="dash-header">
                  <h1 style={{ fontFamily: "Playfair Display, serif" }}>Add New Achievement / Honor 🏆</h1>
                  <p style={{ color: "var(--text-muted)" }}>
                    Add your national awards, published books, keynote speeches, or educational milestones to appear on the Achievements page.
                  </p>
                </div>

                <form onSubmit={handleAddAchievement}>
                  <div className="grid-3">
                    <div className="form-group">
                      <label className="form-label">Year</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 2026"
                        value={achieveForm.year}
                        onChange={(e) => setAchieveForm({ ...achieveForm, year: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Icon / Emoji</label>
                      <select
                        className="form-input"
                        value={achieveForm.icon}
                        onChange={(e) => setAchieveForm({ ...achieveForm, icon: e.target.value })}
                      >
                        <option value="🏆">🏆 Trophy (Award)</option>
                        <option value="🎖️">🎖️ Medal (Recognition)</option>
                        <option value="📚">📚 Book (Publication)</option>
                        <option value="🎙️">🎙️ Mic (Keynote / TEDx)</option>
                        <option value="💡">💡 Lightbulb (Innovation)</option>
                        <option value="🏫">🏫 School (Institution)</option>
                        <option value="🌏">🌏 Globe (International)</option>
                        <option value="📄">📄 Paper (Research)</option>
                        <option value="🥇">🥇 1st Place / Gold</option>
                        <option value="⭐">⭐ Star Honor</option>
                        <option value="🎓">🎓 Academic Honor</option>
                      </select>
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                        {["🏆", "🎖️", "🥇", "📚", "🎙️", "💡", "🏫", "🌏", "📄", "⭐", "🎓", "🏅"].map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setAchieveForm({ ...achieveForm, icon: ic })}
                            className="btn btn-sm"
                            style={{
                              padding: "0.2rem 0.45rem",
                              fontSize: "1rem",
                              background: achieveForm.icon === ic ? "var(--gold)" : "rgba(255,255,255,0.06)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                      <div style={{ marginTop: "0.5rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                          Or Upload Custom PNG/SVG Badge File:
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-input"
                          style={{ fontSize: "0.8rem", padding: "0.3rem" }}
                          onChange={handleAchievementIconUpload}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-input"
                        value={achieveForm.category}
                        onChange={(e) => setAchieveForm({ ...achieveForm, category: e.target.value })}
                      >
                        <option>Award</option>
                        <option>Recognition</option>
                        <option>Publication</option>
                        <option>Speaker</option>
                        <option>Innovation</option>
                        <option>International</option>
                        <option>Research</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Achievement Title *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. National Counseling Excellence Award"
                        value={achieveForm.title}
                        onChange={(e) => setAchieveForm({ ...achieveForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Issuer / Organization *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Ministry of Education / NCERT"
                        value={achieveForm.org}
                        onChange={(e) => setAchieveForm({ ...achieveForm, org: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brief Description of the Honor</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Recognized for outstanding mentorship impact and career guidance across India..."
                      value={achieveForm.desc}
                      onChange={(e) => setAchieveForm({ ...achieveForm, desc: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-gold">
                    ➕ Add Achievement to Website
                  </button>
                </form>
              </div>

              {/* Achievements List */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.3rem" }}>
                  Current Achievements ({achievements.length})
                </h2>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Click &apos;Delete&apos; on any item to remove it from the website
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {achievements.map((a, idx) => (
                  <div key={idx} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <RenderIcon icon={a.icon || "🏆"} alt={a.title} size={46} />
                      <div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span className="badge badge-gold">{a.category}</span>
                          <strong style={{ color: "var(--gold)" }}>{a.year}</strong>
                        </div>
                        <h4 style={{ fontSize: "1.05rem", margin: "0.2rem 0" }}>{a.title}</h4>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{a.org}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAchievement(a.id || a.title)}
                      className="btn btn-sm"
                      style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)" }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: GALLERY MANAGER */}
          {view === "gallery" && (
            <div>
              <div className="card" style={{ marginBottom: "2rem" }}>
                <div className="dash-header">
                  <h1 style={{ fontFamily: "Playfair Display, serif" }}>Upload Gallery Photos &amp; Video Links 🖼️</h1>
                  <p style={{ color: "var(--text-muted)" }}>
                    Upload event photographs or add YouTube/Vimeo video links to showcase seminars, student sessions, and ceremonies.
                  </p>
                </div>

                <form onSubmit={handleAddGalleryItem}>
                  <div className="grid-3">
                    <div className="form-group">
                      <label className="form-label">Media Type</label>
                      <select
                        className="form-input"
                        value={galleryForm.type}
                        onChange={(e) => setGalleryForm({ ...galleryForm, type: e.target.value as "photo" | "video" })}
                      >
                        <option value="photo">📸 Photo (Image Upload)</option>
                        <option value="video">🎥 Video (YouTube / Vimeo Link)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-input"
                        value={galleryForm.category}
                        onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                      >
                        <option>Events</option>
                        <option>Workshops</option>
                        <option>Awards</option>
                        <option>Speaking</option>
                        <option>Sessions</option>
                        <option>Online</option>
                        <option>Achievements</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Icon / Emoji</label>
                      <input
                        type="text"
                        className="form-input"
                        value={galleryForm.emoji}
                        onChange={(e) => setGalleryForm({ ...galleryForm, emoji: e.target.value })}
                        placeholder="📸, 🎥, 🎓, 🏆"
                      />
                      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                        {["📸", "🎥", "🎤", "💻", "📚", "👨‍👩‍👧", "🏆", "🎓", "🌟", "🏛️"].map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setGalleryForm({ ...galleryForm, emoji: ic })}
                            className="btn btn-sm"
                            style={{
                              padding: "0.2rem 0.45rem",
                              fontSize: "1rem",
                              background: galleryForm.emoji === ic ? "var(--gold)" : "rgba(255,255,255,0.06)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {galleryForm.type === "photo" ? (
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Upload Photo File (JPG/PNG)</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-input"
                          onChange={(e) => setGalleryPhotoFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Or Image URL</label>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://example.com/event.jpg"
                          value={galleryForm.url}
                          onChange={(e) => setGalleryForm({ ...galleryForm, url: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Video URL (YouTube or Vimeo Link) *</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={galleryForm.url}
                        onChange={(e) => setGalleryForm({ ...galleryForm, url: e.target.value })}
                        required
                      />
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                        Visitors will be able to play this video right inside the Gallery page!
                      </p>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Caption / Description *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Keynote speech at Annual Education Summit 2024"
                      value={galleryForm.caption}
                      onChange={(e) => setGalleryForm({ ...galleryForm, caption: e.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-gold">
                    ➕ Add {galleryForm.type === "video" ? "Video" : "Photo"} to Gallery
                  </button>
                </form>
              </div>

              {/* Gallery Items List with Delete */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.3rem" }}>
                  Current Gallery Media ({galleryItems.length})
                </h2>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Click &apos;Delete&apos; to permanently remove any photo or video
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {galleryItems.map((item, idx) => (
                  <div key={idx} className="card card-gold" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span className="badge badge-gold">{item.category}</span>
                        <span className={`badge ${item.type === "video" ? "badge-red" : "badge-blue"}`}>
                          {item.type === "video" ? "🎥 Video" : "📸 Photo"}
                        </span>
                      </div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem", margin: "0.5rem 0" }}>{item.caption}</p>
                      {item.url && item.url.startsWith("http") && item.type === "photo" && (
                        <div style={{ height: 120, borderRadius: 8, overflow: "hidden", margin: "0.5rem 0" }}>
                          <img src={item.url} alt={item.caption} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteGalleryItem(item.id || item.caption || item.url)}
                      className="btn btn-sm"
                      style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)", marginTop: "1rem" }}
                    >
                      🗑️ Delete Media
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: NEW POST */}
          {view === "newpost" && (
            <div className="card">
              <div className="dash-header">
                <h1 style={{ fontFamily: "Playfair Display, serif" }}>Publish New Article / Post ✍️</h1>
                <p style={{ color: "var(--text-muted)" }}>
                  Share guidance, motivational thoughts, career pathways, videos, or study documents with students &amp; parents.
                </p>
              </div>

              <form onSubmit={handleCreatePost}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Article Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. How to Choose Between Science, Commerce &amp; Humanities"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option>Career Guidance</option>
                      <option>Academic Success</option>
                      <option>Exam Strategies (JEE/NEET/Boards)</option>
                      <option>Mental Wellness &amp; Motivation</option>
                      <option>Parent Counseling</option>
                      <option>Study Abroad</option>
                      <option>Announcements &amp; News</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Short Summary / Excerpt</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief 1-2 sentence overview of what students will learn from this post"
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Article Content *</label>
                  <textarea
                    className="form-input"
                    rows={8}
                    placeholder="Write your comprehensive guidance here. You can include paragraphs, bullet points, tips, and encouraging words..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">📸 Image (Upload File OR Image URL)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    <input
                      type="url"
                      className="form-input"
                      style={{ marginTop: "0.5rem" }}
                      placeholder="Or enter image URL (https://...)"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">📄 Document / PDF Attachment</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="form-input"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    />
                    <input
                      type="url"
                      className="form-input"
                      style={{ marginTop: "0.5rem" }}
                      placeholder="Or enter document download URL"
                      value={form.pdfUrl}
                      onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">🎥 Video Link (YouTube / Vimeo embed)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={form.videoUrl}
                      onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">🏷️ Tags (comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Career, Class 12, Motivation, Engineering"
                      value={form.tags}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? "Publishing..." : "🚀 Publish Post"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setForm({
                        title: "",
                        excerpt: "",
                        content: "",
                        category: "Career Guidance",
                        tags: "",
                        imageUrl: "",
                        videoUrl: "",
                        pdfUrl: "",
                      });
                      setImageFile(null);
                      setPdfFile(null);
                    }}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW: MY POSTS */}
          {view === "myposts" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                  <h1 style={{ fontFamily: "Playfair Display, serif" }}>My Published Articles 📑</h1>
                  <p style={{ color: "var(--text-muted)" }}>Total {posts.length} articles published on your website.</p>
                </div>
                <button className="btn btn-gold" onClick={() => setView("newpost")}>
                  + Write New Post
                </button>
              </div>

              {posts.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📝</div>
                  <h3>No articles published yet</h3>
                  <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    Start inspiring students and parents with your first counseling post.
                  </p>
                  <button className="btn btn-gold" style={{ marginTop: "1rem" }} onClick={() => setView("newpost")}>
                    Create Your First Post
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {posts.map((p) => (
                    <div key={p.id} className="card" style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                      {p.imageUrl && (
                        <div
                          style={{
                            width: 120,
                            height: 90,
                            borderRadius: 8,
                            overflow: "hidden",
                            flexShrink: 0,
                            background: "rgba(255,255,255,0.05)",
                          }}
                        >
                          <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span className="badge badge-gold">{p.category}</span>
                          {p.videoUrl && <span className="badge">🎥 Video</span>}
                          {p.pdfUrl && <span className="badge">📄 Document</span>}
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginLeft: "auto" }}>
                            {new Date(p.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "1.15rem", marginBottom: "0.5rem" }}>{p.title}</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                          {p.excerpt}
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <Link href="/posts" className="btn btn-ghost btn-sm" target="_blank">
                            View on Site ↗
                          </Link>
                          <button
                            onClick={() => handleDeletePost(p.id)}
                            className="btn btn-sm"
                            style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)" }}
                          >
                            🗑️ Delete Article
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: BOOKINGS & INQUIRIES */}
          {view === "messages" && (
            <div>
              <div className="dash-header">
                <h1 style={{ fontFamily: "Playfair Display, serif" }}>Session Bookings &amp; Inquiries 📬</h1>
                <p style={{ color: "var(--text-muted)" }}>
                  Review student counseling bookings, payment verifications (UTR numbers), and contact messages.
                </p>
              </div>

              {messages.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
                  <h3>No session requests yet</h3>
                  <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    When visitors book a session or send inquiries, they will appear here automatically.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="card"
                      style={{
                        borderLeft: `5px solid ${m.isPaidSession ? "var(--gold)" : "#3498db"}`,
                        background: m.isPaidSession ? "linear-gradient(135deg, rgba(201,168,76,0.06), rgba(14,31,69,0.5))" : undefined,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <div>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                            <strong style={{ fontSize: "1.1rem" }}>{m.name}</strong>
                            {m.isPaidSession ? (
                              <span className="badge badge-gold">💳 Paid Session ({m.amount})</span>
                            ) : (
                              <span className="badge badge-blue">🎁 Free Session</span>
                            )}
                            {m.paymentStatus && (
                              <span className="badge" style={{ background: "rgba(46,204,113,0.15)", color: "#2ecc71" }}>
                                {m.paymentStatus}
                              </span>
                            )}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            📧 {m.email} {m.phone && ` · 📞 ${m.phone}`}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleDeleteMessage(m.id)}
                            className="btn btn-sm"
                            style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)", padding: "0.2rem 0.5rem" }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {(m.date || m.timeSlot) && (
                        <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.6rem 1rem", borderRadius: 8, margin: "0.75rem 0", fontSize: "0.85rem" }}>
                          📅 <strong>Requested Slot:</strong> {m.date || "Any date"} at {m.timeSlot || "Standard hours"}
                        </div>
                      )}

                      {m.transactionId && (
                        <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid var(--border-gold)", padding: "0.6rem 1rem", borderRadius: 8, margin: "0.75rem 0", fontSize: "0.85rem" }}>
                          💳 <strong>Payment Method:</strong> {m.paymentMethod || "UPI"} &nbsp;·&nbsp;
                          <strong>UTR / Transaction ID:</strong> <code style={{ color: "var(--gold)", fontWeight: 700 }}>{m.transactionId}</code>
                        </div>
                      )}

                      <span className="badge badge-gold" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
                        Topic: {m.category}
                      </span>
                      <p style={{ color: "var(--text-primary)", background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: 8, fontSize: "0.95rem", lineHeight: 1.7 }}>
                        {m.message}
                      </p>
                      <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem" }}>
                        <a href={`mailto:${m.email}?subject=Confirming Your Counseling Session with Principal Ma'am`} className="btn btn-gold btn-sm">
                          Confirm via Email ✉️
                        </a>
                        {m.phone && (
                          <a href={`https://wa.me/${m.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: "#25D366", color: "#fff" }}>
                            WhatsApp Client 💬
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: WEBSITE SETTINGS */}
          {view === "settings" && (
            <div className="card">
              <div className="dash-header" style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h1 style={{ fontFamily: "Playfair Display, serif", margin: 0 }}>Home Page &amp; Website Customization ⚙️</h1>
                    <p style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      Principal Ma&apos;am can customize every detail of the Home Page and website dynamically — Announcements, Mandates, Strategic Goals, Guidance Services, Passport Photo, Consultation Fees, and Helplines.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="btn btn-gold"
                    disabled={saving}
                    style={{ padding: "0.6rem 1.5rem", fontWeight: 700 }}
                  >
                    {saving ? "Saving Changes..." : "💾 Save Home Page Changes"}
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
                    background: statusType === "error" ? "rgba(231,76,60,0.15)" : "rgba(46,204,113,0.15)",
                    color: statusType === "error" ? "#e74c3c" : "#2ecc71",
                    border: `1px solid ${statusType === "error" ? "rgba(231,76,60,0.3)" : "rgba(46,204,113,0.3)"}`,
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
                  { id: "ticker", label: "Ticker & Mandate", icon: "📢" },
                  { id: "navigation", label: "Navbar Options & Menu", icon: "🧭" },
                  { id: "homeoptions", label: "Home Page Options", icon: "📑" },
                  { id: "goals", label: "Strategic Goals", icon: "🎯" },
                  { id: "counselor", label: "Counselor Profile & Photo", icon: "👩‍🏫" },
                  { id: "services", label: "Home Page Services & Icons", icon: "🌟" },
                  { id: "stats", label: "Portal Statistics", icon: "📊" },
                  { id: "slider", label: "Hero Slider & Banners", icon: "🎞️" },
                  { id: "branding", label: "Portal Branding & Header", icon: "🏛️" },
                  { id: "about", label: "About Us & Story", icon: "📖" },
                  { id: "payment", label: "Payment Gateway & Fees", icon: "💳" },
                  { id: "contact", label: "Helpline & Contact", icon: "📞" },
                  { id: "social", label: "Social Media Links", icon: "🌐" },
                  { id: "cta", label: "Home Page CTA Banner", icon: "📣" },
                  { id: "dev", label: "Developer & Legal", icon: "🚀" },
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

              <form onSubmit={handleSaveSettings}>
                {/* ── 1. SUB-TAB: TICKER & MANDATE (HOME PAGE TOP) ── */}
                {settingsTab === "ticker" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ background: "rgba(0,158,169,0.08)", border: "1px solid #009ea9", borderRadius: 8, padding: "1rem" }}>
                      <h4 style={{ color: "#009ea9", margin: "0 0 0.4rem 0" }}>📢 Announcement Ticker &amp; Homepage Mandate</h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                        These texts appear directly beneath the Hero Slider on your Home Page. You can update the live announcements anytime.
                      </p>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Ticker Badge Tag Label</label>
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
                      <label className="form-label">Announcement Ticker Content (Scrolling Text on Home Page)</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        value={settingsForm.tickerText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, tickerText: e.target.value })}
                        placeholder="Enter scrolling announcement text with bullet points (·)..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Homepage e-Counselling Mandate &amp; Introduction Paragraph</label>
                      <textarea
                        className="form-input"
                        rows={5}
                        value={settingsForm.mandateText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, mandateText: e.target.value })}
                        placeholder="Enter the official introductory mandate paragraph displayed on your Home Page..."
                      />
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

                {/* ── 2. SUB-TAB: STRATEGIC GOALS & MANDATES ── */}
                {settingsTab === "goals" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ background: "rgba(0,158,169,0.08)", border: "1px solid #009ea9", borderRadius: 8, padding: "1rem" }}>
                      <h4 style={{ color: "#009ea9", margin: "0 0 0.4rem 0" }}>🎯 Strategic Goals &amp; Core Principles</h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                        Customize the Section Heading and the 3 main Core Principle Cards featured prominently on the Home Page.
                      </p>
                    </div>

                    {/* Section Header Controls */}
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
                      <h4 style={{ color: "#009ea9", marginBottom: "0.75rem" }}>Goal Card 1</h4>
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
                      <h4 style={{ color: "#009ea9", marginBottom: "0.75rem" }}>Goal Card 2</h4>
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
                      <h4 style={{ color: "#009ea9", marginBottom: "0.75rem" }}>Goal Card 3</h4>
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

                {/* ── 3. SUB-TAB: COUNSELOR IDENTITY & PASSPORT PHOTO ── */}
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
                        <label className="form-label">Professional Designation / Credentials</label>
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
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: 10, border: "1px solid var(--border)", flexWrap: "wrap" }}>
                      <div style={{ width: 110, height: 140, borderRadius: 10, overflow: "hidden", border: "3px solid var(--gold)", flexShrink: 0, background: "#0c1b3a" }}>
                        <img src={settingsForm.principalPhoto || "/logo.jpg"} alt="Passport Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: "240px" }}>
                        <label className="form-label" style={{ fontWeight: 600 }}>📁 Upload Passport Photo directly from your device</label>
                        <input type="file" accept="image/*" className="form-input" onChange={handlePassportPhotoUpload} />
                        <label className="form-label" style={{ marginTop: "0.5rem" }}>Or enter Image URL</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="https://... or data:image/..."
                          value={settingsForm.principalPhoto}
                          onChange={(e) => setSettingsForm({ ...settingsForm, principalPhoto: e.target.value })}
                        />
                        {settingsForm.principalPhoto && settingsForm.principalPhoto !== "/logo.jpg" && (
                          <button
                            type="button"
                            onClick={handleRemovePassportPhoto}
                            className="btn btn-sm"
                            style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)", marginTop: "0.5rem" }}
                          >
                            🗑️ Remove Photo &amp; Reset to Default
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Counselor Badges */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "var(--gold)", marginBottom: "0.75rem" }}>Home Page Profile Badges</h4>
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

                {/* ── 4. SUB-TAB: HOME PAGE SERVICES & ICONS ── */}
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
                        Customize the guidance offerings cards on the Home Page. Upload custom PNG icons or pick from preset emojis!
                      </p>
                      <button type="button" onClick={handleAddService} className="btn btn-gold btn-sm">
                        ➕ Add New Service Card
                      </button>
                    </div>

                    {(settingsForm.services || []).map((service, idx) => (
                      <div
                        key={service.id || idx}
                        style={{
                          background: "rgba(0,0,0,0.25)",
                          border: "1px solid rgba(201,168,76,0.25)",
                          borderRadius: 10,
                          padding: "1.25rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <RenderIcon icon={service.icon} alt={service.title} size={50} />
                            <div>
                              <strong style={{ fontSize: "1.05rem" }}>Card #{idx + 1}: {service.title || "Untitled Service"}</strong>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                Current Icon: {service.icon.startsWith("data:") || service.icon.startsWith("http") || service.icon.startsWith("/") ? "Custom Uploaded Image" : service.icon}
                              </div>
                            </div>
                          </div>
                          {(settingsForm.services || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteService(idx)}
                              className="btn btn-sm"
                              style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)" }}
                            >
                              🗑️ Remove Card
                            </button>
                          )}
                        </div>

                        {/* Quick 1-click icon picker */}
                        <div style={{ marginBottom: "0.75rem" }}>
                          <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--gold)" }}>
                            Click to change emoji preset:
                          </label>
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                            {["🎓", "📚", "🧠", "👨‍👩‍👧", "📝", "🌐", "🏛️", "✈️", "🎯", "💡", "🚀", "💼", "🔬", "🩺", "🎨", "🏆", "⭐", "🤝", "💬", "📋"].map((ic) => (
                              <button
                                key={ic}
                                type="button"
                                onClick={() => handleUpdateService(idx, "icon", ic)}
                                className="btn btn-sm"
                                style={{
                                  padding: "0.2rem 0.5rem",
                                  fontSize: "1.1rem",
                                  background: service.icon === ic ? "var(--gold)" : "rgba(255,255,255,0.05)",
                                  border: service.icon === ic ? "1px solid var(--gold)" : "1px solid rgba(255,255,255,0.1)",
                                }}
                              >
                                {ic}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom PNG/SVG Upload Box */}
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed var(--border)", borderRadius: 8, padding: "0.75rem 1rem", margin: "0.75rem 0", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: "220px" }}>
                            <label className="form-label" style={{ fontSize: "0.8rem", color: "var(--gold)", marginBottom: "0.25rem" }}>
                              📁 Upload Your Own Custom Icon (PNG / SVG / JPG / WebP):
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              className="form-input"
                              style={{ padding: "0.35rem 0.6rem", fontSize: "0.85rem" }}
                              onChange={(e) => handleServiceIconUpload(idx, e)}
                            />
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                              ✨ All uploaded icons will display at the exact same uniform size and alignment on your Home Page!
                            </span>
                          </div>
                          {(service.icon.startsWith("data:") || service.icon.startsWith("http") || service.icon.startsWith("/")) && (
                            <button
                              type="button"
                              onClick={() => handleUpdateService(idx, "icon", "🎓")}
                              className="btn btn-sm"
                              style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)" }}
                            >
                              🔄 Revert to Emoji
                            </button>
                          )}
                        </div>

                        <div className="grid-2" style={{ marginTop: "0.75rem" }}>
                          <div className="form-group">
                            <label className="form-label">Service Title</label>
                            <input
                              type="text"
                              className="form-input"
                              value={service.title}
                              onChange={(e) => handleUpdateService(idx, "title", e.target.value)}
                              placeholder="e.g. Career Counseling"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Custom Icon / Emoji Symbol / Image URL</label>
                            <input
                              type="text"
                              className="form-input"
                              value={service.icon}
                              onChange={(e) => handleUpdateService(idx, "icon", e.target.value)}
                              placeholder="Type emoji or paste image URL"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-group" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                          <label className="form-label">Service Description</label>
                          <textarea
                            className="form-input"
                            rows={2}
                            value={service.desc}
                            onChange={(e) => handleUpdateService(idx, "desc", e.target.value)}
                            placeholder="Brief description of how this service helps students..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── 5. SUB-TAB: PORTAL STATISTICS & METRICS ── */}
                {settingsTab === "stats" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ background: "rgba(0,158,169,0.08)", border: "1px solid #009ea9", borderRadius: 8, padding: "1rem" }}>
                      <h4 style={{ color: "#009ea9", margin: "0 0 0.4rem 0" }}>📊 Home Page Statistics &amp; Counter Numbers</h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                        These 4 large counters appear in the navy blue banner on your Home Page and on your About page.
                      </p>
                    </div>

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

                {/* ── 5B. SUB-TAB: HERO SLIDER & BANNERS ── */}
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

                {/* ── 6. SUB-TAB: PORTAL BRANDING & TAGLINES ── */}
                {settingsTab === "branding" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Website Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.siteName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Division Header Title</label>
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
                      <label className="form-label">Top Government Bar Text (Top Bar)</label>
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
                        <label className="form-label">Sub-headline / Motto</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.subtagline}
                          onChange={(e) => setSettingsForm({ ...settingsForm, subtagline: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Brand Logo Upload */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 10, padding: "1.25rem" }}>
                      <h4 style={{ color: "var(--gold)", marginBottom: "0.75rem" }}>
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
                            placeholder="Or logo URL / emoji"
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

                {/* ── 7. SUB-TAB: ABOUT US & STORY ── */}
                {settingsTab === "about" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                      <label className="form-label">About Section Headline Title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settingsForm.aboutTitle}
                        onChange={(e) => setSettingsForm({ ...settingsForm, aboutTitle: e.target.value })}
                        placeholder="e.g. A Decade of Dedicated Guidance"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Short Summary (Featured on Home Page Counselor Section)</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        value={settingsForm.aboutBio}
                        onChange={(e) => setSettingsForm({ ...settingsForm, aboutBio: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Full About Us Story &amp; Vision (Featured on About Page)</label>
                      <textarea
                        className="form-input"
                        rows={7}
                        value={settingsForm.aboutContent}
                        onChange={(e) => setSettingsForm({ ...settingsForm, aboutContent: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Counseling Philosophy Quote (Appears on Home &amp; About Pages)</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={settingsForm.philosophy}
                        onChange={(e) => setSettingsForm({ ...settingsForm, philosophy: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* ── 8. SUB-TAB: CONSULTATION FEES & PAYMENT GATEWAY ── */}
                {settingsTab === "payment" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: 10, border: "1px solid var(--border)" }}>
                      <div>
                        <strong style={{ fontSize: "1.05rem" }}>Enable Online Session Booking Fee</strong>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
                          Toggle on to require UPI / Bank payment before appointment confirmation.
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
                        <label className="form-label">Session Consultation Fee</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.sessionFee}
                          onChange={(e) => setSettingsForm({ ...settingsForm, sessionFee: e.target.value })}
                          placeholder="e.g. ₹999 or ₹1,499"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Counselor UPI ID (GPay / PhonePe / Paytm)</label>
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
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", background: "rgba(0,0,0,0.3)", padding: "1.25rem", borderRadius: 10, border: "1px solid var(--border)", flexWrap: "wrap" }}>
                      <div style={{ width: 90, height: 90, background: "#fff", padding: 5, borderRadius: 8, flexShrink: 0, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {settingsForm.upiQrCode ? (
                          <img src={settingsForm.upiQrCode} alt="UPI QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                          <span style={{ color: "#333", fontSize: "0.75rem" }}>No QR Code</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <label className="form-label">Upload or Change UPI QR Code</label>
                        <input type="file" accept="image/*" className="form-input" onChange={handleQrCodeUpload} />
                        {settingsForm.upiQrCode && (
                          <button
                            type="button"
                            onClick={handleRemoveQrCode}
                            className="btn btn-sm"
                            style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.3)", marginTop: "0.5rem" }}
                          >
                            🗑️ Remove QR Code Image
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bank Details */}
                    <h4 style={{ color: "var(--gold)", fontSize: "0.95rem", margin: "0.5rem 0" }}>
                      Alternative Bank Account Transfer Details (Optional)
                    </h4>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Account Holder Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.bankHolderName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bankHolderName: e.target.value })}
                          placeholder="e.g. Inspiria Educational Services"
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
                        <label className="form-label">IFSC Code</label>
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

                {/* ── 9. SUB-TAB: HELPLINES & CONTACT ── */}
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

                {/* ── 10. SUB-TAB: SOCIAL MEDIA CHANNELS ── */}
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

                {/* ── 11. SUB-TAB: HOME PAGE CTA BANNER ── */}
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
                        placeholder="Enter description text displayed on the bottom banner..."
                      />
                    </div>
                  </div>
                )}

                {/* ── 12. SUB-TAB: DEVELOPER ATTRIBUTION & LEGAL ── */}
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
                  </div>
                )}

                {/* Bottom Save Action Bar */}
                <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Changes saved here are instantly reflected across your Home Page and all portal pages.
                  </span>
                  <button type="submit" className="btn btn-gold" disabled={saving} style={{ padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: 700 }}>
                    {saving ? "Saving Changes..." : "💾 Save Home Page Changes"}
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
