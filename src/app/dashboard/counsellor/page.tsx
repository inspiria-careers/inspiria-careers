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
  where,
  limit,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import { useSite, ServiceItem, GalleryItem, SiteProfile } from "@/contexts/SiteContext";
import { slugify } from "@/lib/imageUtils";
import { logAuditEvent } from "@/lib/auditLog";
import { formatInr, generateReceiptNumber } from "@/lib/paymentUtils";
import ImageUploader from "@/components/ImageUploader";
import IntakeViewModal from "@/components/IntakeViewModal";
import SessionNotesModal from "@/components/SessionNotesModal";
import AssignTaskModal from "@/components/AssignTaskModal";
import WorkshopManager from "@/components/WorkshopManager";
import InsightsView from "@/components/InsightsView";
import MessagingPanel from "@/components/MessagingPanel";
import CircularProgressLoader from "@/components/CircularProgressLoader";
import { sendReminder } from "@/lib/reminderService";
import { t } from "@/translations";
import type { ResourceItem, DeletionRequest, SessionFeedback, NewsletterSubscriber } from "@/types";

interface AppointmentDoc {
  id: string;
  userId?: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string;
  serviceTitle: string;
  serviceFee?: number | null;
  paymentStatus?: "not_required" | "pending" | "submitted" | "verified" | "rejected" | "refunded";
  utrNumber?: string;
  paymentDate?: string;
  paymentScreenshotUrl?: string;
  rejectionReason?: string;
  refundAmount?: number;
  refundNote?: string;
  receiptNumber?: string;
  isDuplicateUtr?: boolean;
  paymentSubmittedAt?: any;
  verifiedAt?: any;
  verifiedBy?: string;
  date: string;
  timeSlot: string;
  mode: string;
  meetingLink?: string;
  notes?: string;
  counsellorNote?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  rescheduleRequest?: {
    requestedDate: string;
    requestedSlot: string;
    reason?: string;
    status: "pending" | "approved" | "rejected";
    requestedAt?: any;
  };
  reminderSent?: boolean;
  createdAt?: any;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: "unread" | "read" | "replied";
  createdAt?: any;
}

interface PostDoc {
  id: string;
  title: string;
  slug?: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  coverImageAlt?: string;
  published: boolean;
  createdAt?: any;
}

interface ReviewDoc {
  id: string;
  userId?: string | null;
  clientName: string;
  clientPhoto?: string | null;
  displayNameChoice?: "full" | "first_only" | "anonymous";
  rating: number;
  comment: string;
  approved: boolean;
  createdAt?: any;
}

interface SharedVaultItem {
  id: string;
  userId: string;
  type: "note" | "document";
  title?: string;
  content?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  sharedWithCounsellor: boolean;
  updatedAt?: any;
  createdAt?: any;
}

export default function CounsellorDashboardPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { profile, services, gallery, updateProfile, updateServices, updateGallery, lang } = useSite();

  const [activeTab, setActiveTab] = useState<
    "overview" | "profile" | "services" | "gallery" | "appointments" | "posts" | "reviews" | "vault" | "schedule" | "inbox" | "payments" | "insights" | "workshops" | "resources" | "deletionQueue" | "clientMessaging" | "sessionFeedback" | "subscribers"
  >("overview");

  // Phase 6 States
  const [threadsList, setThreadsList] = useState<Array<{ id: string; clientId: string; clientName: string; lastMessageAt?: any; unreadByCounsellor?: boolean; archived?: boolean }>>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThreadClientName, setSelectedThreadClientName] = useState<string>("");
  const [loadingThreads, setLoadingThreads] = useState(false);

  const [feedbackList, setFeedbackList] = useState<SessionFeedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const [subscribersList, setSubscribersList] = useState<NewsletterSubscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [sendingFollowupApptId, setSendingFollowupApptId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  // Phase 5 Modals & States
  const [selectedIntakeUser, setSelectedIntakeUser] = useState<{ id: string; name: string } | null>(null);
  const [selectedNotesAppt, setSelectedNotesAppt] = useState<AppointmentDoc | null>(null);
  const [selectedTaskClient, setSelectedTaskClient] = useState<{ id: string; name: string } | null>(null);

  // Educational Resources state
  const [resourcesList, setResourcesList] = useState<ResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newResource, setNewResource] = useState<Partial<ResourceItem>>({
    title: "",
    description: "",
    category: "career",
    type: "pdf",
    url: "",
    visibility: "public",
  });
  const [savingResource, setSavingResource] = useState(false);
  const [uploadingResourceFile, setUploadingResourceFile] = useState(false);
  const [uploadedResourceFileName, setUploadedResourceFileName] = useState<string | null>(null);

  // Deletion requests queue state
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [loadingDeletions, setLoadingDeletions] = useState(false);

  // Profile state
  const [profileForm, setProfileForm] = useState<SiteProfile>(profile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    setProfileForm(profile);
  }, [profile]);

  // Services state
  const [servicesList, setServicesList] = useState<ServiceItem[]>(services);
  const [newService, setNewService] = useState<{ icon: string; title: string; description: string; fee?: number }>({
    icon: "🎯",
    title: "",
    description: "",
    fee: undefined,
  });
  const [savingServices, setSavingServices] = useState(false);
  const [savingDefaultFee, setSavingDefaultFee] = useState(false);
  const [defaultFeeSuccess, setDefaultFeeSuccess] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceForm, setEditServiceForm] = useState<{ icon: string; title: string; description: string; fee?: number }>({
    icon: "🎯",
    title: "",
    description: "",
    fee: undefined,
  });

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
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");
  const [editingMeetingLinkId, setEditingMeetingLinkId] = useState<string | null>(null);
  const [tempMeetingLink, setTempMeetingLink] = useState("");

  // Payments verification & financial state
  const [paymentFilter, setPaymentFilter] = useState<"all" | "submitted" | "verified" | "rejected" | "refunded">("all");
  const [paymentDateFrom, setPaymentDateFrom] = useState("");
  const [paymentDateTo, setPaymentDateTo] = useState("");
  const [paymentSearchQuery, setPaymentSearchQuery] = useState("");
  const [rejectModalAppt, setRejectModalAppt] = useState<AppointmentDoc | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);
  const [refundModalAppt, setRefundModalAppt] = useState<AppointmentDoc | null>(null);
  const [refundAmount, setRefundAmount] = useState<number | "">("");
  const [refundNote, setRefundNote] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [receiptModalAppt, setReceiptModalAppt] = useState<AppointmentDoc | null>(null);

  // Blocked dates state
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Messages inbox state
  const [messagesList, setMessagesList] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageFilter, setMessageFilter] = useState<"all" | "unread" | "read" | "replied">("all");

  // Posts state
  const [postsList, setPostsList] = useState<PostDoc[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    slug: "",
    category: "Career Guidance",
    excerpt: "",
    content: "",
    coverImage: "",
    coverImageAlt: "",
    published: true,
  });
  const [creatingPost, setCreatingPost] = useState(false);

  // Reviews state
  const [reviewsList, setReviewsList] = useState<ReviewDoc[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Shared vault state
  const [vaultItems, setVaultItems] = useState<SharedVaultItem[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);

  // Auto-generate slug when title changes
  const handleTitleChange = (val: string) => {
    setNewPost((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug && prev.slug !== slugify(prev.title) ? prev.slug : slugify(val),
    }));
  };

  // Load appointments
  const loadAppointments = async () => {
    try {
      setLoadingAppts(true);
      const snap = await getDocs(query(collection(db, "appointments"), limit(300)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppointmentDoc));
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
      const snap = await getDocs(query(collection(db, "posts"), limit(100)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PostDoc));
      setPostsList(list);
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Load reviews for moderation
  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const snap = await getDocs(query(collection(db, "reviews"), limit(100)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReviewDoc));
      setReviewsList(list);
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Load shared client vault
  const loadSharedVault = async () => {
    try {
      setLoadingVault(true);
      // Query shared notes
      const notesQ = query(collection(db, "clientNotes"), where("sharedWithCounsellor", "==", true), limit(100));
      const notesSnap = await getDocs(notesQ);
      const notesItems: SharedVaultItem[] = notesSnap.docs.map((d) => ({
        id: d.id,
        type: "note",
        ...d.data(),
      } as SharedVaultItem));

      // Query shared documents
      const docsQ = query(collection(db, "clientDocuments"), where("sharedWithCounsellor", "==", true), limit(100));
      const docsSnap = await getDocs(docsQ);
      const docsItems: SharedVaultItem[] = docsSnap.docs.map((d) => ({
        id: d.id,
        type: "document",
        ...d.data(),
      } as SharedVaultItem));

      setVaultItems([...notesItems, ...docsItems]);
    } catch (err) {
      console.error("Error loading shared vault:", err);
    } finally {
      setLoadingVault(false);
    }
  };

  // Load Contact form messages
  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      const snap = await getDocs(query(collection(db, "messages"), limit(100)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ContactMessage));
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setMessagesList(list);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadPosts();
    loadReviews();
    loadMessages();
  }, []);

  // Load Educational Resources
  const loadResources = async () => {
    try {
      setLoadingResources(true);
      const snap = await getDocs(query(collection(db, "resources"), limit(100)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ResourceItem));
      setResourcesList(list);
    } catch (err) {
      console.error("Error loading resources:", err);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title?.trim()) return;
    setSavingResource(true);
    try {
      const item: Omit<ResourceItem, "id"> = {
        title: newResource.title.trim(),
        description: newResource.description?.trim() || "",
        category: (newResource.category as any) || "career",
        type: (newResource.type as any) || "pdf",
        url: newResource.url?.trim() || "",
        visibility: (newResource.visibility as any) || "public",
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, "resources"), item);
      setResourcesList((prev) => [{ id: ref.id, ...item }, ...prev]);
      setShowResourceModal(false);
      setNewResource({
        title: "",
        description: "",
        category: "career",
        type: "pdf",
        url: "",
        visibility: "public",
      });
      setUploadedResourceFileName(null);
    } catch (err: any) {
      alert("Failed to create resource: " + err.message);
    } finally {
      setSavingResource(false);
    }
  };

  const handleResourceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }
    setUploadingResourceFile(true);
    try {
      const sRef = ref(storage, `resources/${Date.now()}_${file.name}`);
      await uploadBytes(sRef, file);
      const downloadUrl = await getDownloadURL(sRef);
      setNewResource((prev) => ({
        ...prev,
        url: downloadUrl,
        type: file.type.includes("pdf")
          ? "pdf"
          : file.type.startsWith("audio")
          ? "audio"
          : file.type.startsWith("video")
          ? "video"
          : prev.type || "pdf",
      }));
      setUploadedResourceFileName(file.name);
    } catch (err: any) {
      console.error("Resource file upload error:", err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadingResourceFile(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await deleteDoc(doc(db, "resources", id));
      setResourcesList((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Failed to delete resource.");
    }
  };

  // Load Deletion Requests
  const loadDeletionRequests = async () => {
    try {
      setLoadingDeletions(true);
      const snap = await getDocs(query(collection(db, "deletionRequests"), limit(100)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeletionRequest));
      setDeletionRequests(list.sort((a, b) => (b.requestedAt || "").localeCompare(a.requestedAt || "")));
    } catch (err) {
      console.error("Error loading deletion requests:", err);
    } finally {
      setLoadingDeletions(false);
    }
  };

  const handleProcessDeletion = async (reqId: string, status: "completed" | "rejected") => {
    try {
      await updateDoc(doc(db, "deletionRequests", reqId), {
        status,
        processedAt: new Date().toISOString(),
      });
      setDeletionRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status, processedAt: new Date().toISOString() } : r))
      );
    } catch {
      alert("Failed to update deletion request status.");
    }
  };

  // Phase 6 Loaders
  const loadThreads = async () => {
    setLoadingThreads(true);
    try {
      const snap = await getDocs(query(collection(db, "threads"), limit(100)));
      const list = snap.docs.map((d) => ({
        id: d.id,
        clientId: d.data().clientId || d.id,
        ...d.data(),
      } as any));
      setThreadsList(list);
    } catch (err) {
      console.error("Error loading threads:", err);
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const snap = await getDocs(query(collection(db, "sessionFeedback"), limit(100)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SessionFeedback));
      setFeedbackList(list);
    } catch (err) {
      console.error("Error loading feedback:", err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const loadSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const snap = await getDocs(query(collection(db, "subscribers"), limit(500)));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NewsletterSubscriber));
      setSubscribersList(list);
    } catch (err) {
      console.error("Error loading subscribers:", err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const handleSendFollowupNudge = async (appt: AppointmentDoc) => {
    setSendingFollowupApptId(appt.id);
    try {
      await sendReminder({
        to: appt.clientPhone,
        channel: "whatsapp",
        templateKey: "followup_nudge",
        variables: {
          clientName: appt.clientName,
          appointmentTime: appt.timeSlot,
          appointmentDate: appt.date,
          lang: lang,
        },
      });
      await updateDoc(doc(db, "appointments", appt.id), {
        followupSentAt: serverTimestamp(),
      });
      alert(lang === "hi" ? "✓ फॉलो-अप स्मरण संदेश दर्ज किया गया (Dry-run mode)" : "✓ Follow-up nudge logged (Dry-run mode)");
      loadAppointments();
    } catch (err) {
      console.error("Error sending nudge:", err);
      alert("Failed to send nudge.");
    } finally {
      setSendingFollowupApptId(null);
    }
  };

  const exportSubscribersCsv = () => {
    const headers = ["Email", "Name", "Confirmed", "Subscribed At", "Active"];
    const rows = subscribersList.map((s) => [
      `"${s.email}"`,
      `"${(s.name || "").replace(/"/g, '""')}"`,
      s.confirmed ? "Yes" : "No",
      `"${s.subscribedAt || ""}"`,
      s.active ? "Yes" : "No",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscribers_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  useEffect(() => {
    if (activeTab === "appointments" || activeTab === "overview" || activeTab === "payments" || activeTab === "insights") loadAppointments();
    if (activeTab === "posts" || activeTab === "overview") loadPosts();
    if (activeTab === "reviews" || activeTab === "overview") loadReviews();
    if (activeTab === "vault") loadSharedVault();
    if (activeTab === "inbox") loadMessages();
    if (activeTab === "resources") loadResources();
    if (activeTab === "deletionQueue") loadDeletionRequests();
    if (activeTab === "clientMessaging") loadThreads();
    if (activeTab === "sessionFeedback") { loadFeedback(); loadAppointments(); }
    if (activeTab === "subscribers") loadSubscribers();
  }, [activeTab]);

  // CSV Exporters
  const exportAppointmentsCsv = () => {
    const headers = ["ID", "Client Name", "Email", "Phone", "Service", "Date", "Time Slot", "Mode", "Status", "Fee", "Meeting Link"];
    const rows = appointments.map((a) => [
      `"${a.id}"`,
      `"${(a.clientName || "").replace(/"/g, '""')}"`,
      `"${(a.clientEmail || "").replace(/"/g, '""')}"`,
      `"${(a.clientPhone || "").replace(/"/g, '""')}"`,
      `"${(a.serviceTitle || "").replace(/"/g, '""')}"`,
      `"${a.date || ""}"`,
      `"${a.timeSlot || ""}"`,
      `"${a.mode || ""}"`,
      `"${a.status || ""}"`,
      `"${a.serviceFee || ""}"`,
      `"${(a.meetingLink || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `counselling_appointments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReviewsCsv = () => {
    const headers = ["ID", "Client Name", "Rating", "Approved", "Comment"];
    const rows = reviewsList.map((r) => [
      `"${r.id}"`,
      `"${(r.clientName || "").replace(/"/g, '""')}"`,
      `"${r.rating}"`,
      `"${r.approved ? "Yes" : "No"}"`,
      `"${(r.comment || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `client_reviews_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPaymentsCsv = () => {
    const headers = [
      "Appointment ID",
      "Receipt Number",
      "Client Name",
      "Email",
      "Phone",
      "Service",
      "Fee (INR)",
      "Payment Status",
      "UTR / Transaction ID",
      "Payment Date",
      "Duplicate UTR Flag",
      "Appointment Status",
      "Verified At",
      "Verified By",
      "Rejection Reason",
      "Refund Amount",
      "Refund Note"
    ];
    const rows = appointments
      .filter((a) => (a.serviceFee && a.serviceFee > 0) || a.paymentStatus)
      .map((a) => [
        `"${a.id}"`,
        `"${a.receiptNumber || ""}"`,
        `"${(a.clientName || "").replace(/"/g, '""')}"`,
        `"${(a.clientEmail || "").replace(/"/g, '""')}"`,
        `"${(a.clientPhone || "").replace(/"/g, '""')}"`,
        `"${(a.serviceTitle || "").replace(/"/g, '""')}"`,
        `"${a.serviceFee || 0}"`,
        `"${a.paymentStatus || "pending"}"`,
        `"${(a.utrNumber || "").replace(/"/g, '""')}"`,
        `"${a.paymentDate || ""}"`,
        `"${a.isDuplicateUtr ? "YES (DUPLICATE)" : "NO"}"`,
        `"${a.status || ""}"`,
        `"${a.verifiedAt?.toDate ? a.verifiedAt.toDate().toLocaleString() : ""}"`,
        `"${a.verifiedBy || ""}"`,
        `"${(a.rejectionReason || "").replace(/"/g, '""')}"`,
        `"${a.refundAmount || ""}"`,
        `"${(a.refundNote || "").replace(/"/g, '""')}"`,
      ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `consultation_payments_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Verify Payment
  const handleVerifyPayment = async (appt: AppointmentDoc) => {
    if (!confirm(`Verify payment of ₹${appt.serviceFee || 0} for ${appt.clientName}? This will confirm their appointment and generate an official receipt.`)) {
      return;
    }
    try {
      const receiptNo = appt.receiptNumber || generateReceiptNumber(appt.id);
      await updateDoc(doc(db, "appointments", appt.id), {
        paymentStatus: "verified",
        status: "confirmed",
        receiptNumber: receiptNo,
        verifiedAt: serverTimestamp(),
        verifiedBy: user?.email || user?.displayName || "Counsellor",
      });

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appt.id
            ? {
                ...a,
                paymentStatus: "verified",
                status: "confirmed",
                receiptNumber: receiptNo,
                verifiedBy: user?.email || "Counsellor",
              }
            : a
        )
      );

      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "VERIFY_PAYMENT",
        details: `Verified payment of ₹${appt.serviceFee} (UTR: ${appt.utrNumber}) for client ${appt.clientName}. Issued receipt ${receiptNo}.`,
        targetId: appt.id,
      });

      // Dispatch confirmation email to client
      if (appt.clientEmail) {
        fetch("/api/email/booking-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId: appt.id,
            clientName: appt.clientName,
            clientEmail: appt.clientEmail,
            serviceTitle: appt.serviceTitle,
            date: appt.date,
            timeSlot: appt.timeSlot,
            mode: appt.mode,
            meetingLink: appt.meetingLink || "",
            officeAddress: profile.address,
            counsellorName: profile.counsellorName || "Principal Ma'am",
            type: "booking_confirmed",
          }),
        }).catch((e) => console.warn("Email confirmation on verify error:", e));
      }

      alert(`✓ Payment verified! Appointment confirmed and receipt ${receiptNo} issued.`);
    } catch (err) {
      console.error("Error verifying payment:", err);
      alert("Failed to verify payment. Please check console or permissions.");
    }
  };

  // Reject Payment
  const handleConfirmRejectPayment = async () => {
    if (!rejectModalAppt) return;
    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejecting this payment (e.g. UTR not matching bank statement, incorrect amount).");
      return;
    }
    try {
      setSubmittingReject(true);
      await updateDoc(doc(db, "appointments", rejectModalAppt.id), {
        paymentStatus: "rejected",
        rejectionReason: rejectReason.trim(),
      });

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === rejectModalAppt.id
            ? {
                ...a,
                paymentStatus: "rejected",
                rejectionReason: rejectReason.trim(),
              }
            : a
        )
      );

      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "REJECT_PAYMENT",
        details: `Rejected payment for client ${rejectModalAppt.clientName}. Reason: ${rejectReason.trim()}`,
        targetId: rejectModalAppt.id,
      });

      setRejectModalAppt(null);
      setRejectReason("");
      alert("✓ Payment rejected. The client will be able to review the reason and resubmit corrected payment details.");
    } catch (err) {
      console.error("Error rejecting payment:", err);
      alert("Failed to reject payment.");
    } finally {
      setSubmittingReject(false);
    }
  };

  // Refund Payment
  const handleConfirmRefundPayment = async () => {
    if (!refundModalAppt) return;
    const amount = Number(refundAmount) || refundModalAppt.serviceFee || 0;
    try {
      setSubmittingRefund(true);
      await updateDoc(doc(db, "appointments", refundModalAppt.id), {
        paymentStatus: "refunded",
        refundAmount: amount,
        refundNote: refundNote.trim(),
        status: "cancelled",
      });

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === refundModalAppt.id
            ? {
                ...a,
                paymentStatus: "refunded",
                refundAmount: amount,
                refundNote: refundNote.trim(),
                status: "cancelled",
              }
            : a
        )
      );

      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "RECORD_REFUND",
        details: `Recorded refund of ₹${amount} for client ${refundModalAppt.clientName}. Note: ${refundNote.trim()}`,
        targetId: refundModalAppt.id,
      });

      setRefundModalAppt(null);
      setRefundAmount("");
      setRefundNote("");
      alert("✓ Refund recorded successfully and appointment marked as cancelled.");
    } catch (err) {
      console.error("Error recording refund:", err);
      alert("Failed to record refund.");
    } finally {
      setSubmittingRefund(false);
    }
  };

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileSuccess(false);
      await updateProfile(profileForm);
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "UPDATE_PROFILE",
        details: "Updated counsellor profile / credentials / brand settings",
      });
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
        actorRole: role || "counsellor",
        action: "ADD_SERVICE",
        details: `Added new service: ${item.title} (Fee: ${item.fee || "Free/Included"})`,
        targetId: item.id,
      });
    } finally {
      setSavingServices(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    const updated = servicesList.filter((s) => s.id !== id);
    setServicesList(updated);
    await updateServices(updated);
    await logAuditEvent({
      actorUid: user?.uid || "",
      actorEmail: user?.email || null,
      actorRole: role || "counsellor",
      action: "DELETE_SERVICE",
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

  const handleCancelEditService = () => {
    setEditingServiceId(null);
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
        actorRole: role || "counsellor",
        action: "UPDATE_SERVICE",
        details: `Updated service ${id} (${editServiceForm.title})`,
        targetId: id,
      });
    } finally {
      setSavingServices(false);
    }
  };

  const handleSaveDefaultFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingDefaultFee(true);
      setDefaultFeeSuccess(false);
      const newFee = Number(profileForm.defaultConsultationFee) || 0;
      await updateProfile({ defaultConsultationFee: newFee });
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "UPDATE_BOOKING_FEE",
        details: `Updated standard consultation booking price to ₹${newFee}`,
      });
      setDefaultFeeSuccess(true);
      setTimeout(() => setDefaultFeeSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving booking fee:", err);
      alert("Failed to update booking fee.");
    } finally {
      setSavingDefaultFee(false);
    }
  };

  // Add & Save Gallery Item
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
      category: newGalleryItem.category.trim() || "Events",
    };

    const updated = [...galleryList, item];
    setGalleryList(updated);
    setNewGalleryItem({ type: "photo", url: "", caption: "", category: "Events" });

    try {
      setSavingGallery(true);
      await updateGallery(updated);
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "ADD_GALLERY_ITEM",
        details: `Added gallery item: ${item.caption || item.url}`,
        targetId: item.id,
      });
    } finally {
      setSavingGallery(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    const updated = galleryList.filter((g) => g.id !== id);
    setGalleryList(updated);
    await updateGallery(updated);
  };

  // Appointment Status Change & Remarks
  const handleApptStatusChange = async (id: string, newStatus: AppointmentDoc["status"]) => {
    try {
      await updateDoc(doc(db, "appointments", id), { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "UPDATE_APPOINTMENT_STATUS",
        details: `Updated appointment ${id} status to ${newStatus}`,
        targetId: id,
      });

      // Dispatch notification email if client email is present
      const target = appointments.find((a) => a.id === id);
      if (target?.clientEmail && (newStatus === "confirmed" || newStatus === "cancelled")) {
        fetch("/api/email/booking-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId: id,
            clientName: target.clientName,
            clientEmail: target.clientEmail,
            serviceTitle: target.serviceTitle,
            date: target.date,
            timeSlot: target.timeSlot,
            mode: target.mode,
            meetingLink: target.meetingLink || "",
            officeAddress: profile.address,
            counsellorName: profile.counsellorName || "Principal Ma'am",
            type: newStatus === "confirmed" ? "booking_confirmed" : "booking_cancelled",
          }),
        }).catch((e) => console.warn("Email dispatch on status change error:", e));
      }
    } catch (err) {
      console.error("Update appointment status error:", err);
      alert("Failed to update status.");
    }
  };

  const handleSaveInternalNote = async (id: string) => {
    try {
      await updateDoc(doc(db, "appointments", id), { counsellorNote: tempNote.trim() });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, counsellorNote: tempNote.trim() } : a))
      );
      setEditingNoteId(null);
    } catch {
      alert("Failed to save note.");
    }
  };

  // Save Online Meeting Link (Google Meet / Zoom / WhatsApp)
  const handleSaveMeetingLink = async (id: string, link: string) => {
    try {
      await updateDoc(doc(db, "appointments", id), { meetingLink: link.trim() });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, meetingLink: link.trim() } : a))
      );
      setEditingMeetingLinkId(null);
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "SET_MEETING_LINK",
        details: `Updated meeting link for appointment ${id}`,
        targetId: id,
      });
    } catch {
      alert("Failed to save meeting link.");
    }
  };

  // Reschedule Approval / Rejection
  const handleApproveReschedule = async (appt: AppointmentDoc) => {
    if (!appt.rescheduleRequest) return;
    try {
      const { requestedDate, requestedSlot } = appt.rescheduleRequest;
      await updateDoc(doc(db, "appointments", appt.id), {
        date: requestedDate,
        timeSlot: requestedSlot,
        status: "confirmed",
        "rescheduleRequest.status": "approved",
      });
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appt.id
            ? {
                ...a,
                date: requestedDate,
                timeSlot: requestedSlot,
                status: "confirmed",
                rescheduleRequest: { ...a.rescheduleRequest!, status: "approved" },
              }
            : a
        )
      );
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "APPROVE_RESCHEDULE",
        details: `Approved reschedule for client ${appt.clientName} to ${requestedDate} (${requestedSlot})`,
        targetId: appt.id,
      });
      alert("✓ Reschedule approved! New date/slot is now confirmed.");
    } catch {
      alert("Failed to approve reschedule request.");
    }
  };

  const handleRejectReschedule = async (appt: AppointmentDoc) => {
    if (!appt.rescheduleRequest) return;
    try {
      await updateDoc(doc(db, "appointments", appt.id), {
        "rescheduleRequest.status": "rejected",
      });
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appt.id
            ? {
                ...a,
                rescheduleRequest: { ...a.rescheduleRequest!, status: "rejected" },
              }
            : a
        )
      );
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "REJECT_RESCHEDULE",
        details: `Rejected reschedule request for appointment ${appt.id}`,
        targetId: appt.id,
      });
    } catch {
      alert("Failed to reject reschedule request.");
    }
  };

  // Blocked Dates & Holidays Management
  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedDate) return;
    const current = profileForm.blockedDates || [];
    if (current.includes(newBlockedDate)) {
      alert("This date is already in the blocked list.");
      return;
    }
    const updated = [...current, newBlockedDate].sort();
    setProfileForm({ ...profileForm, blockedDates: updated });
    setNewBlockedDate("");
    try {
      setSavingSchedule(true);
      await updateProfile({ blockedDates: updated });
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "BLOCK_DATE",
        details: `Added holiday/blocked date: ${newBlockedDate}`,
      });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleRemoveBlockedDate = async (dStr: string) => {
    const current = profileForm.blockedDates || [];
    const updated = current.filter((d) => d !== dStr);
    setProfileForm({ ...profileForm, blockedDates: updated });
    try {
      setSavingSchedule(true);
      await updateProfile({ blockedDates: updated });
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "UNBLOCK_DATE",
        details: `Unblocked date: ${dStr}`,
      });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSaveCutoffHours = async (hours: number) => {
    const h = Math.max(1, Math.min(168, hours));
    setProfileForm({ ...profileForm, cancellationCutoffHours: h });
    await updateProfile({ cancellationCutoffHours: h });
    await logAuditEvent({
      actorUid: user?.uid || "",
      actorEmail: user?.email || null,
      actorRole: role || "counsellor",
      action: "UPDATE_CUTOFF_HOURS",
      details: `Updated cancellation cutoff to ${h} hours`,
    });
  };

  // Contact Messages status
  const handleUpdateMessageStatus = async (id: string, newStatus: "unread" | "read" | "replied") => {
    try {
      await updateDoc(doc(db, "messages", id), { status: newStatus });
      setMessagesList((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
    } catch {
      alert("Failed to update message status.");
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Permanently delete this message?")) return;
    try {
      await deleteDoc(doc(db, "messages", id));
      setMessagesList((prev) => prev.filter((m) => m.id !== id));
      await logAuditEvent({
        actorUid: user?.uid || "",
        actorEmail: user?.email || null,
        actorRole: role || "counsellor",
        action: "DELETE_MESSAGE",
        details: `Deleted contact message ${id}`,
        targetId: id,
      });
    } catch {
      alert("Failed to delete message.");
    }
  };

  // Create Article / Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    const finalSlug = (newPost.slug || slugify(newPost.title)).trim();

    try {
      setCreatingPost(true);
      await addDoc(collection(db, "posts"), {
        title: newPost.title.trim(),
        slug: finalSlug,
        category: newPost.category.trim() || "Guidance",
        excerpt: newPost.excerpt.trim() || newPost.content.substring(0, 140) + "...",
        content: newPost.content.trim(),
        coverImage: newPost.coverImage.trim() || null,
        coverImageAlt: newPost.coverImageAlt.trim() || newPost.title.trim(),
        published: newPost.published,
        authorName: profile.counsellorName || user?.displayName || "Counsellor",
        createdAt: serverTimestamp(),
      });
      setNewPost({
        title: "",
        slug: "",
        category: "Career Guidance",
        excerpt: "",
        content: "",
        coverImage: "",
        coverImageAlt: "",
        published: true,
      });
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
    } catch {
      alert("Failed to delete article.");
    }
  };

  // Review Moderation
  const handleModerateReview = async (id: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, "reviews", id), { approved });
      setReviewsList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, approved } : r))
      );
    } catch {
      alert("Failed to update review status.");
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    try {
      await deleteDoc(doc(db, "reviews", id));
      setReviewsList((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Failed to delete review.");
    }
  };

  if (authLoading) {
    return (
      <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgressLoader
          size={110}
          title={lang === "hi" ? "काउंसलर पोर्टल लोड हो रहा है..." : "Loading Counsellor Portal..."}
          subtitle={
            lang === "hi"
              ? "अपॉइंटमेंट्स और केस फाइल्स लोड हो रही हैं..."
              : "Syncing appointments & case files..."
          }
        />
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

          <div className="dash-section-title">Workspace</div>
          <button
            className={`dash-nav-item${activeTab === "overview" ? " active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Dashboard Overview
          </button>
          <button
            className={`dash-nav-item${activeTab === "insights" ? " active" : ""}`}
            onClick={() => setActiveTab("insights")}
          >
            📈 Insights &amp; Analytics
          </button>
          <button
            className={`dash-nav-item${activeTab === "appointments" ? " active" : ""}`}
            onClick={() => setActiveTab("appointments")}
          >
            📅 Appointments ({appointments.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "workshops" ? " active" : ""}`}
            onClick={() => setActiveTab("workshops")}
          >
            👥 Workshops &amp; Events
          </button>
          <button
            className={`dash-nav-item${activeTab === "resources" ? " active" : ""}`}
            onClick={() => setActiveTab("resources")}
          >
            📚 Educational Resources ({resourcesList.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "payments" ? " active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            💳 Payments to Verify ({appointments.filter((a) => a.paymentStatus === "submitted").length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "deletionQueue" ? " active" : ""}`}
            onClick={() => setActiveTab("deletionQueue")}
          >
            🗑️ Deletion Requests ({deletionRequests.filter((d) => d.status === "pending").length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "inbox" ? " active" : ""}`}
            onClick={() => setActiveTab("inbox")}
          >
            📬 Contact Inbox ({messagesList.filter((m) => m.status === "unread" || !m.status).length} new)
          </button>
          <button
            className={`dash-nav-item${activeTab === "reviews" ? " active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            ⭐ Reviews Moderation ({reviewsList.filter((r) => !r.approved).length} pending)
          </button>
          <button
            className={`dash-nav-item${activeTab === "schedule" ? " active" : ""}`}
            onClick={() => setActiveTab("schedule")}
          >
            ⏰ Availability &amp; Cutoff
          </button>
          <button
            className={`dash-nav-item${activeTab === "vault" ? " active" : ""}`}
            onClick={() => setActiveTab("vault")}
          >
            🔒 Shared Client Vault ({vaultItems.length})
          </button>
          {profile.messagingEnabled && (
            <button
              className={`dash-nav-item${activeTab === "clientMessaging" ? " active" : ""}`}
              onClick={() => setActiveTab("clientMessaging")}
            >
              💬 Client Messages ({threadsList.filter((t) => t.unreadByCounsellor).length} new)
            </button>
          )}
          {profile.feedbackEnabled && (
            <button
              className={`dash-nav-item${activeTab === "sessionFeedback" ? " active" : ""}`}
              onClick={() => setActiveTab("sessionFeedback")}
            >
              ⭐ Feedback &amp; Follow-up
            </button>
          )}
          {profile.newsletterEnabled && (
            <button
              className={`dash-nav-item${activeTab === "subscribers" ? " active" : ""}`}
              onClick={() => setActiveTab("subscribers")}
            >
              📧 Newsletter Subscribers ({subscribersList.length})
            </button>
          )}

          <div className="dash-section-title" style={{ marginTop: "1rem" }}>Website Content</div>
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
            📝 Articles &amp; Blog ({postsList.length})
          </button>

          <div className="dash-section-title" style={{ marginTop: "1.5rem" }}>Quick Links</div>
          {role === "admin" && (
            <Link href="/dashboard/admin" className="dash-nav-item">
              ⚙️ Admin Panel
            </Link>
          )}
          <Link href="/" className="dash-nav-item">
            🌐 Public Website
          </Link>
        </aside>

        {/* Main Area */}
        <main className="dash-main">
          {/* TAB 0: OVERVIEW */}
          {activeTab === "overview" && (
            <div>
              <div className="dash-header">
                <h1>📊 Counsellor Workspace Overview</h1>
                <p>Real-time operational snapshot of today's schedule, pending student requests, review approvals, and guidance articles.</p>
              </div>

              {/* Metric Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                <div className="card card-accent" style={{ padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>TODAY'S SESSIONS</div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--brand-primary)", margin: "0.25rem 0" }}>
                    {appointments.filter((a) => a.date === new Date().toISOString().split("T")[0] && a.status !== "cancelled").length}
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ width: "100%", justifyContent: "center", fontSize: "0.75rem" }}
                    onClick={() => { setApptFilter("confirmed"); setActiveTab("appointments"); }}
                  >
                    View Schedule →
                  </button>
                </div>

                <div className="card" style={{ padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>PAYMENTS TO VERIFY</div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: appointments.filter((a) => a.paymentStatus === "submitted").length > 0 ? "var(--error)" : "var(--brand-primary)", margin: "0.25rem 0" }}>
                    {appointments.filter((a) => a.paymentStatus === "submitted").length}
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ width: "100%", justifyContent: "center", fontSize: "0.75rem" }}
                    onClick={() => setActiveTab("payments")}
                  >
                    Verify Payments →
                  </button>
                </div>

                <div className="card" style={{ padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>PENDING BOOKINGS</div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#f39c12", margin: "0.25rem 0" }}>
                    {appointments.filter((a) => a.status === "pending").length}
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ width: "100%", justifyContent: "center", fontSize: "0.75rem" }}
                    onClick={() => { setApptFilter("pending"); setActiveTab("appointments"); }}
                  >
                    Review Bookings →
                  </button>
                </div>

                <div className="card" style={{ padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>PENDING REVIEWS</div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--brand-secondary)", margin: "0.25rem 0" }}>
                    {reviewsList.filter((r) => !r.approved).length}
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ width: "100%", justifyContent: "center", fontSize: "0.75rem" }}
                    onClick={() => setActiveTab("reviews")}
                  >
                    Moderate Reviews →
                  </button>
                </div>

                <div className="card" style={{ padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>CONTACT INQUIRIES</div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text)", margin: "0.25rem 0" }}>
                    {messagesList.filter((m) => m.status === "unread" || !m.status).length}
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ width: "100%", justifyContent: "center", fontSize: "0.75rem" }}
                    onClick={() => setActiveTab("inbox")}
                  >
                    Open Inbox →
                  </button>
                </div>
              </div>

              {/* Quick Export & Actions Card */}
              <div className="card" style={{ marginBottom: "2rem", padding: "1.25rem" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.75rem" }}>
                  ⚡ Quick Operations &amp; Data Exports
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab("payments")}>
                    💳 Verify Payments ({appointments.filter((a) => a.paymentStatus === "submitted").length})
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={exportPaymentsCsv}>
                    📥 Export Payments (CSV)
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={exportAppointmentsCsv}>
                    📥 Export Appointments (CSV)
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={exportReviewsCsv}>
                    📥 Export Reviews (CSV)
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setActiveTab("schedule")}>
                    ⏰ Block Holiday Dates
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setActiveTab("posts")}>
                    ✍️ Write New Guidance Article
                  </button>
                </div>
              </div>

              {/* Last 5 Posts */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                    Latest Guidance Articles (Total: {postsList.length})
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab("posts")}>
                    View All →
                  </button>
                </div>
                {postsList.length === 0 ? (
                  <div className="empty-state"><p>No articles published yet.</p></div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postsList.slice(0, 5).map((post) => (
                          <tr key={post.id}>
                            <td><strong>{post.title}</strong></td>
                            <td><span className="badge badge-primary">{post.category}</span></td>
                            <td>
                              <span className={`badge ${post.published ? "badge-success" : "badge-muted"}`}>
                                {post.published ? "Published" : "Draft"}
                              </span>
                            </td>
                            <td>
                              {post.slug && (
                                <Link href={`/posts/${post.slug}`} target="_blank" className="btn btn-ghost btn-sm">
                                  👁️ View
                                </Link>
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
                {/* Website Branding & Logo */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    🏢 Website Branding &amp; Logo
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                    Upload your official institution or counselling practice logo. This logo appears in the top navigation bar, footer, and receipts.
                  </p>

                  <div className="grid-2" style={{ gap: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Site / Practice Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.siteName || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, siteName: e.target.value })}
                        placeholder="Inspiria Careers"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tagline</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.tagline || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                        placeholder="Expert Career & Academic Guidance"
                      />
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: "1.25rem", marginTop: "1rem" }}>
                    <div>
                      <ImageUploader
                        label="Official Site Logo *"
                        folder="branding"
                        currentUrl={profileForm.siteLogo}
                        onUploadComplete={(url: string) => setProfileForm({ ...profileForm, siteLogo: url })}
                        onRemove={() => setProfileForm({ ...profileForm, siteLogo: "" })}
                        helperText="Upload official logo (PNG, SVG, or WebP). Max 2 MB, auto-compressed."
                        maxSizeMB={2}
                      />
                    </div>
                    <div>
                      <ImageUploader
                        label="Dark Theme Logo (Optional)"
                        folder="branding"
                        currentUrl={profileForm.siteLogoDark}
                        onUploadComplete={(url: string) => setProfileForm({ ...profileForm, siteLogoDark: url })}
                        onRemove={() => setProfileForm({ ...profileForm, siteLogoDark: "" })}
                        helperText="Optional logo variation for dark backgrounds."
                        maxSizeMB={2}
                      />
                    </div>
                  </div>
                </div>

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
                      <label className="form-label">Professional Registration Number (RCI / NCS / University)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={profileForm.professionalRegNumber || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, professionalRegNumber: e.target.value })}
                        placeholder="e.g. RCI Registration No. CRR-12345 or NCS ID: NC-67890"
                      />
                    </div>
                    <div className="form-group">
                      <ImageUploader
                        label="Counsellor Profile Photo"
                        folder="counsellor"
                        currentUrl={profileForm.counsellorPhoto}
                        onUploadComplete={(url: string) => setProfileForm({ ...profileForm, counsellorPhoto: url })}
                        helperText="Upload official profile photo. Max 2 MB, auto-compressed."
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

                {/* QR Code & UPI Payment Settings Card */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    💳 QR Code &amp; UPI Payment Settings
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                    Students and parents will scan this QR code or use your UPI ID to pay consultation fees directly to your bank account.
                  </p>

                  <div className="grid-2" style={{ gap: "1.25rem" }}>
                    <div>
                      <ImageUploader
                        label="Official Payment QR Code Image *"
                        folder="payments/qr"
                        currentUrl={profileForm.paymentQr}
                        onUploadComplete={(url: string) => setProfileForm({ ...profileForm, paymentQr: url })}
                        helperText="Upload your official Google Pay / PhonePe / Paytm / BHIM QR code image."
                        maxSizeMB={2}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className="form-group">
                        <label className="form-label">UPI ID (VPA) *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={profileForm.upiId || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, upiId: e.target.value })}
                          placeholder="e.g. counsellor@okhdfcbank or 9876543210@paytm"
                        />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Used for one-click copy and mobile UPI deep links (GPay/PhonePe).
                        </span>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Payee Name (Account Holder Name) *</label>
                        <input
                          type="text"
                          className="form-input"
                          value={profileForm.payeeName || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, payeeName: e.target.value })}
                          placeholder="e.g. Dr. Ananya Sharma / Inspiria Careers"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Standard Consultation Booking Fee (₹ INR)</label>
                        <input
                          type="number"
                          className="form-input"
                          min={0}
                          value={profileForm.defaultConsultationFee !== undefined ? profileForm.defaultConsultationFee : ""}
                          onChange={(e) => setProfileForm({ ...profileForm, defaultConsultationFee: e.target.value ? Number(e.target.value) : 0 })}
                          placeholder="e.g. 500 (0 for Free)"
                        />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Standard session booking fee applied across services unless a service has an individual price.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: "1.25rem" }}>
                    <label className="form-label">Refund &amp; Cancellation Policy Note (Visible to Clients)</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={profileForm.refundPolicyText || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, refundPolicyText: e.target.value })}
                      placeholder="e.g. 100% refund if cancelled at least 24 hours prior to appointment slot. Refunds are processed within 2-3 working days to original UPI account."
                    />
                  </div>
                </div>

                {/* Phase 6: Optional Add-on Feature Flags */}
                <div className="card" style={{ border: "1.5px solid var(--border-color)", marginTop: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                    ⚡ Optional Add-ons &amp; Feature Flags
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                    Enable or disable modular add-on capabilities. All features are optional, default to OFF, and turn off cleanly.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Flag 1: Messaging */}
                    <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={profileForm.messagingEnabled || false}
                          onChange={(e) => setProfileForm({ ...profileForm, messagingEnabled: e.target.checked })}
                        />
                        💬 Secure Async Client-Counsellor Messaging
                      </label>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0.5rem 1.7rem" }}>
                        Enables private asynchronous messaging threads between verified clients and the counsellor.
                      </p>
                      {profileForm.messagingEnabled && (
                        <div style={{ marginLeft: "1.7rem", marginTop: "0.5rem", maxWidth: 400 }}>
                          <label className="form-label" style={{ fontSize: "0.8rem" }}>
                            Counsellor Expected Response Time Notice
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            value={profileForm.messagingResponseTimeText || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, messagingResponseTimeText: e.target.value })}
                            placeholder="1-2 working days / 24 घंटे"
                          />
                        </div>
                      )}
                    </div>

                    {/* Flag 2: Reminders */}
                    <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={profileForm.smsRemindersEnabled || false}
                          onChange={(e) => setProfileForm({ ...profileForm, smsRemindersEnabled: e.target.checked })}
                        />
                        📱 WhatsApp &amp; SMS Reminders (Dry-Run Mode)
                      </label>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0 1.7rem" }}>
                        Allows clients to opt in for WhatsApp/SMS appointment alerts 24h prior. Runs in safe dry-run mode without external third-party SDKs.
                      </p>
                    </div>

                    {/* Flag 3: Feedback & Follow-up */}
                    <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={profileForm.feedbackEnabled || false}
                          onChange={(e) => setProfileForm({ ...profileForm, feedbackEnabled: e.target.checked })}
                        />
                        ⭐ Private Session Feedback &amp; Follow-up Queue
                      </label>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0 1.7rem" }}>
                        Enables post-session private feedback ratings and automatic follow-up tracking for clients after 7 days.
                      </p>
                    </div>

                    {/* Flag 4: Newsletter */}
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={profileForm.newsletterEnabled || false}
                          onChange={(e) => setProfileForm({ ...profileForm, newsletterEnabled: e.target.checked })}
                        />
                        📧 Career Tips &amp; Newsletter Subscription
                      </label>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0 1.7rem" }}>
                        Displays a double opt-in subscription box in the site footer with one-click unsubscribe links.
                      </p>
                    </div>

                    {/* Maintenance Mode (Phase 7 Reliability) */}
                    <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem", backgroundColor: profileForm.maintenanceMode ? "var(--warning-light, #fffbeb)" : "transparent", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, cursor: "pointer", color: profileForm.maintenanceMode ? "#b45309" : "inherit" }}>
                        <input
                          type="checkbox"
                          checked={profileForm.maintenanceMode || false}
                          onChange={(e) => setProfileForm({ ...profileForm, maintenanceMode: e.target.checked })}
                        />
                        🛠️ System Maintenance Mode (Pause New Bookings)
                      </label>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.25rem 0 0.5rem 1.7rem" }}>
                        When activated, a prominent maintenance banner is shown on the website and new appointment bookings are temporarily paused. Existing accounts and dashboards remain active.
                      </p>
                      {profileForm.maintenanceMode && (
                        <div style={{ marginLeft: "1.7rem", marginTop: "0.5rem" }}>
                          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                            Custom Maintenance Notice Message:
                          </label>
                          <textarea
                            className="form-control"
                            rows={2}
                            value={profileForm.maintenanceNoticeText || ""}
                            onChange={(e) => setProfileForm({ ...profileForm, maintenanceNoticeText: e.target.value })}
                            placeholder="We are currently performing scheduled maintenance. New bookings are paused..."
                            style={{ fontSize: "0.85rem" }}
                          />
                        </div>
                      )}
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

              {/* Standard Consultation Booking Price Card */}
              <form onSubmit={handleSaveDefaultFee} className="card" style={{ marginBottom: "2rem", border: "1.5px solid var(--brand-primary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.35rem" }}>
                      💰 Standard Consultation Booking Price (₹ INR)
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, maxWidth: 650, lineHeight: 1.5 }}>
                      Set the default fee for student and parent consultation bookings. When a service doesn't have an individual custom fee, this standard price will apply across the website. (Enter 0 for Free).
                    </p>
                  </div>
                  {defaultFeeSuccess && (
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
                      value={profileForm.defaultConsultationFee !== undefined ? profileForm.defaultConsultationFee : ""}
                      onChange={(e) => setProfileForm({ ...profileForm, defaultConsultationFee: e.target.value ? Number(e.target.value) : 0 })}
                      placeholder="e.g. 500"
                      style={{ width: "160px", fontWeight: 700, fontSize: "1.05rem" }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={savingDefaultFee}>
                    {savingDefaultFee ? "Saving..." : "💾 Update Standard Booking Price"}
                  </button>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Current Active: <strong>{profile.defaultConsultationFee ? `₹${profile.defaultConsultationFee}` : "Free of Cost"}</strong>
                  </span>
                </div>
              </form>

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
                              <label className="form-label">Consultation Fee (₹ INR, leave blank to use Standard Price)</label>
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
                                onClick={handleCancelEditService}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: "1rem",
                            }}
                          >
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
                <h1>📝 Articles &amp; Blog Management</h1>
                <p>Create guidance articles with auto-generated slugs, cover image alt-text, and category tags.</p>
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
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. How to Choose the Right Career Stream in 2026"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SEO URL Slug (Auto-generated or custom)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPost.slug}
                      onChange={(e) => setNewPost({ ...newPost, slug: slugify(e.target.value) })}
                      placeholder="how-to-choose-the-right-career-stream-2026"
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: "1rem", marginTop: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      placeholder="Career Guidance / College Selection / Entrance Exams"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={newPost.published ? "published" : "draft"}
                      onChange={(e) => setNewPost({ ...newPost, published: e.target.value === "published" })}
                    >
                      <option value="published">Published (Live to Public)</option>
                      <option value="draft">Draft (Private)</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: "1rem", marginTop: "1rem" }}>
                  <div className="form-group">
                    <ImageUploader
                      label="Article Cover Photo (Optional)"
                      folder="posts"
                      currentUrl={newPost.coverImage}
                      onUploadComplete={(url: string) => setNewPost({ ...newPost, coverImage: url })}
                      onRemove={() => setNewPost({ ...newPost, coverImage: "" })}
                      helperText="Upload a cover photo from your device. Max 3 MB, auto-compressed."
                      maxSizeMB={3}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Image Alt Text (Accessibility)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPost.coverImageAlt}
                      onChange={(e) => setNewPost({ ...newPost, coverImageAlt: e.target.value })}
                      placeholder="Students in educational counselling seminar"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Short Summary (Excerpt)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPost.excerpt}
                    onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                    placeholder="Brief 1-2 sentence preview for search & cards..."
                  />
                </div>

                <div className="form-group" style={{ marginTop: "1rem" }}>
                  <label className="form-label">Article Body *</label>
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
                    {creatingPost ? "Saving..." : (newPost.published ? "Publish Article" : "Save as Draft")}
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
                    <CircularProgressLoader
                      size={84}
                      title="लेख लोड हो रहे हैं..."
                      subtitle="Fetching published articles..."
                    />
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
                            {post.slug && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                                /{post.slug}
                              </span>
                            )}
                          </div>
                          <h4 style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "0.5rem" }}>
                            <Link href={`/posts/${post.slug || post.id}`} target="_blank" style={{ color: "var(--text)" }}>
                              {post.title} ↗
                            </Link>
                          </h4>
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
                <p>Manage and track all student/parent counselling booking requests, change statuses, and record remarks.</p>
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
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={exportAppointmentsCsv}>
                      📥 Export CSV
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={loadAppointments} disabled={loadingAppts}>
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                {loadingAppts ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <CircularProgressLoader
                      size={84}
                      title="अपॉइंटमेंट्स लोड हो रहे हैं..."
                      subtitle="Fetching client schedules & history..."
                    />
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
                          <th>Service &amp; Fee</th>
                          <th>Date &amp; Slot</th>
                          <th>Mode &amp; Meeting Link</th>
                          <th>Status</th>
                          <th>Internal Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppts.map((appt) => (
                          <tr key={appt.id}>
                            <td>
                              <strong>{appt.clientName}</strong>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                📞 <a href={`tel:${appt.clientPhone}`}>{appt.clientPhone}</a>
                                {appt.clientEmail && <div>✉️ {appt.clientEmail}</div>}
                              </div>
                              {appt.notes && (
                                <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.25rem", fontStyle: "italic" }}>
                                  "{appt.notes}"
                                </div>
                              )}
                            </td>
                            <td>
                              <div>{appt.serviceTitle}</div>
                              {profile.paymentsEnabled && appt.serviceFee && (
                                <div style={{ fontSize: "0.75rem", color: "var(--brand-primary)", marginTop: "0.2rem", fontWeight: 600 }}>
                                  Fee: ₹{appt.serviceFee} ({appt.paymentStatus || "pending"})
                                </div>
                              )}
                            </td>
                            <td>
                              <strong>{appt.date}</strong>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{appt.timeSlot}</div>

                              {/* Reschedule Request Notification */}
                              {appt.rescheduleRequest?.status === "pending" && (
                                <div
                                  style={{
                                    marginTop: "0.5rem",
                                    padding: "0.45rem",
                                    borderRadius: "var(--radius-sm)",
                                    background: "#fff9e6",
                                    border: "1px solid #f39c12",
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  <strong>⏳ Reschedule Requested:</strong>
                                  <div>New Date: {appt.rescheduleRequest.requestedDate}</div>
                                  <div>New Slot: {appt.rescheduleRequest.requestedSlot}</div>
                                  {appt.rescheduleRequest.reason && (
                                    <div style={{ fontStyle: "italic", marginTop: "0.15rem" }}>
                                      "{appt.rescheduleRequest.reason}"
                                    </div>
                                  )}
                                  <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.35rem" }}>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: "0.72rem", padding: "0.15rem 0.4rem" }}
                                      onClick={() => handleApproveReschedule(appt)}
                                    >
                                      ✓ Approve
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      style={{ color: "var(--error)", fontSize: "0.72rem", padding: "0.15rem 0.4rem" }}
                                      onClick={() => handleRejectReschedule(appt)}
                                    >
                                      ✕ Decline
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="badge badge-primary">{appt.mode}</span>
                              {appt.mode === "Online" && (
                                <div style={{ marginTop: "0.4rem" }}>
                                  {editingMeetingLinkId === appt.id ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                      <input
                                        type="url"
                                        className="form-input"
                                        style={{ fontSize: "0.75rem", padding: "0.2rem 0.4rem" }}
                                        value={tempMeetingLink}
                                        onChange={(e) => setTempMeetingLink(e.target.value)}
                                        placeholder="https://meet.google.com/..."
                                      />
                                      <div style={{ display: "flex", gap: "0.25rem" }}>
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-sm"
                                          style={{ fontSize: "0.72rem", padding: "0.15rem 0.4rem" }}
                                          onClick={() => handleSaveMeetingLink(appt.id, tempMeetingLink)}
                                        >
                                          Save Link
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-sm"
                                          style={{ fontSize: "0.72rem", padding: "0.15rem 0.4rem" }}
                                          onClick={() => setEditingMeetingLinkId(null)}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ) : appt.meetingLink ? (
                                    <div style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                      <a href={appt.meetingLink} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>
                                        🔗 Link
                                      </a>
                                      <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        style={{ padding: "0 0.2rem", fontSize: "0.75rem" }}
                                        onClick={() => {
                                          setEditingMeetingLinkId(appt.id);
                                          setTempMeetingLink(appt.meetingLink || "");
                                        }}
                                        title="Edit Link"
                                      >
                                        ✏️
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      style={{ fontSize: "0.72rem", padding: "0.15rem 0.4rem" }}
                                      onClick={() => {
                                        setEditingMeetingLinkId(appt.id);
                                        setTempMeetingLink("");
                                      }}
                                    >
                                      + Add Meeting Link
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                <select
                                  className="form-select"
                                  style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.82rem" }}
                                  value={appt.status}
                                  onChange={(e) => handleApptStatusChange(appt.id, e.target.value as any)}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                  <option value="no_show">No-Show</option>
                                </select>

                                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}
                                    onClick={() => setSelectedNotesAppt(appt)}
                                    title="Confidential Clinical Session Notes"
                                  >
                                    📝 Notes
                                  </button>
                                  {appt.userId && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}
                                        onClick={() => setSelectedIntakeUser({ id: appt.userId!, name: appt.clientName })}
                                        title="View Client Confidential Intake Profile"
                                      >
                                        📋 Intake
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        style={{ fontSize: "0.72rem", padding: "0.15rem 0.45rem" }}
                                        onClick={() => setSelectedTaskClient({ id: appt.userId!, name: appt.clientName })}
                                        title="Assign Homework Task"
                                      >
                                        ➕ Task
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              {editingNoteId === appt.id ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                  <textarea
                                    className="form-textarea"
                                    rows={2}
                                    style={{ fontSize: "0.8rem", minHeight: 60 }}
                                    value={tempNote}
                                    onChange={(e) => setTempNote(e.target.value)}
                                  />
                                  <div style={{ display: "flex", gap: "0.4rem" }}>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleSaveInternalNote(appt.id)}
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => setEditingNoteId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                                    {appt.counsellorNote || "No internal notes"}
                                  </p>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                      setEditingNoteId(appt.id);
                                      setTempNote(appt.counsellorNote || "");
                                    }}
                                  >
                                    ✏️ Edit Note
                                  </button>
                                </div>
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

          {/* TAB 6: REVIEWS MODERATION */}
          {activeTab === "reviews" && (
            <div>
              <div className="dash-header">
                <h1>⭐ Review Moderation</h1>
                <p>Approve genuine student reviews to display them on the public home page and `/reviews`. Reject or delete spam.</p>
              </div>

              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    Client Testimonials ({reviewsList.length})
                  </h3>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={exportReviewsCsv}>
                      📥 Export CSV
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={loadReviews} disabled={loadingReviews}>
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                {loadingReviews ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <CircularProgressLoader
                      size={84}
                      title="समीक्षाएं लोड हो रही हैं..."
                      subtitle="Fetching client feedback & ratings..."
                    />
                  </div>
                ) : reviewsList.length === 0 ? (
                  <div className="empty-state">
                    <p>No reviews submitted yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {reviewsList.map((rev) => (
                      <div
                        key={rev.id}
                        style={{
                          padding: "1rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "1rem",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.4rem" }}>
                            <span style={{ color: "#f39c12", fontWeight: 700 }}>
                              {"★".repeat(rev.rating || 5)}
                            </span>
                            <span className={`badge ${rev.approved ? "badge-success" : "badge-warning"}`}>
                              {rev.approved ? "Approved (Live)" : "Pending Approval"}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.92rem", color: "var(--text)", fontStyle: "italic", marginBottom: "0.5rem" }}>
                            "{rev.comment}"
                          </p>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            By <strong>{rev.clientName}</strong> ({rev.displayNameChoice || "full name"})
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {rev.approved ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleModerateReview(rev.id, false)}
                            >
                              Hide
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleModerateReview(rev.id, true)}
                            >
                              ✓ Approve
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteReview(rev.id)}
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

          {/* TAB 7: SHARED CLIENT VAULT */}
          {activeTab === "vault" && (
            <div>
              <div className="dash-header">
                <h1>🔒 Shared Client Documents &amp; Notes</h1>
                <p>Only student notes and uploaded scorecards/documents that the client has explicitly toggled <strong>"Share with Counsellor"</strong> appear here.</p>
              </div>

              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    Shared Records ({vaultItems.length})
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={loadSharedVault} disabled={loadingVault}>
                    🔄 Refresh
                  </button>
                </div>

                {loadingVault ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <CircularProgressLoader
                      size={84}
                      title="वॉल्ट लोड हो रहा है..."
                      subtitle="Decryption & client vault sync..."
                    />
                  </div>
                ) : vaultItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🔒</div>
                    <div className="empty-state-title">No shared items yet</div>
                    <p className="empty-state-desc">
                      When a student chooses to share their private session notes or academic documents with you, they will appear securely here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {vaultItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: "1rem",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span className={`badge ${item.type === "document" ? "badge-primary" : "badge-secondary"}`}>
                            {item.type === "document" ? "📄 Document" : "📝 Note"}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
                            Client ID: {item.userId}
                          </span>
                        </div>

                        {item.type === "note" ? (
                          <div>
                            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.3rem" }}>
                              {item.title || "Untitled Note"}
                            </h4>
                            <p style={{ fontSize: "0.9rem", color: "var(--text)", whiteSpace: "pre-line" }}>
                              {item.content}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.3rem" }}>
                              {item.fileName || "Uploaded Document"}
                            </h4>
                            {item.fileSize && (
                              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                Size: {Math.round(item.fileSize / 1024)} KB
                              </span>
                            )}
                            {item.fileUrl && (
                              <div style={{ marginTop: "0.5rem" }}>
                                <a
                                  href={item.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-outline btn-sm"
                                >
                                  📥 View / Download Document
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: SCHEDULE & HOLIDAYS */}
          {activeTab === "schedule" && (
            <div>
              <div className="dash-header">
                <h1>⏰ Booking Schedule &amp; Blocked Dates</h1>
                <p>Configure holidays, blocked dates when consultation booking is closed, and set the cancellation cutoff window.</p>
              </div>

              <div className="grid-2" style={{ gap: "1.5rem", alignItems: "start" }}>
                {/* Blocked Dates Manager */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    🏖️ Blocked Dates / Holidays
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                    Students will not be able to book appointments on these dates.
                  </p>

                  <form onSubmit={handleAddBlockedDate} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                    <input
                      type="date"
                      className="form-input"
                      style={{ flex: 1, minWidth: "180px" }}
                      value={newBlockedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setNewBlockedDate(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={savingSchedule}>
                      + Block Date
                    </button>
                  </form>

                  <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                      Currently Blocked Dates ({profileForm.blockedDates?.length || 0})
                    </h4>
                    {!profileForm.blockedDates || profileForm.blockedDates.length === 0 ? (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "0.75rem 0" }}>
                        No dates currently blocked. All regular working days are open for booking.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {profileForm.blockedDates.map((d) => (
                          <div
                            key={d}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.35rem 0.75rem",
                              background: "var(--surface-2)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border)",
                              fontSize: "0.85rem",
                            }}
                          >
                            📅 <strong>{d}</strong>
                            <button
                              type="button"
                              style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontWeight: 700 }}
                              onClick={() => handleRemoveBlockedDate(d)}
                              title="Unblock date"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancellation Cutoff Hours Setting */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    ⏱️ Cancellation / Reschedule Cutoff
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                    Set the minimum advance notice required for clients to cancel or request rescheduling online. Within this window, clients must contact the counsellor directly.
                  </p>

                  <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                    <label className="form-label">Cutoff Window (in Hours)</label>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <input
                        type="number"
                        className="form-input"
                        style={{ maxWidth: 140 }}
                        min={1}
                        max={168}
                        value={profileForm.cancellationCutoffHours || 24}
                        onChange={(e) => setProfileForm({ ...profileForm, cancellationCutoffHours: Number(e.target.value) || 24 })}
                      />
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>hours before session start</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSaveCutoffHours(profileForm.cancellationCutoffHours || 24)}
                  >
                    ✓ Save Cutoff Setting
                  </button>
                </div>

                {/* Smarter Scheduling Settings (Phase 5) */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                    ⚙️ Session Durations &amp; Buffers
                  </h3>
                  <div className="grid-2" style={{ gap: "1rem", marginBottom: "1rem" }}>
                    <div className="form-group">
                      <label className="form-label">Default Session Duration (Minutes)</label>
                      <select
                        className="form-select"
                        value={profileForm.slotDurationMinutes || 45}
                        onChange={(e) => setProfileForm({ ...profileForm, slotDurationMinutes: Number(e.target.value) })}
                      >
                        <option value={30}>30 Minutes</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes (1 Hour)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Buffer Between Slots (Minutes)</label>
                      <select
                        className="form-select"
                        value={profileForm.slotBufferMinutes || 15}
                        onChange={(e) => setProfileForm({ ...profileForm, slotBufferMinutes: Number(e.target.value) })}
                      >
                        <option value={10}>10 Minutes</option>
                        <option value={15}>15 Minutes</option>
                        <option value={20}>20 Minutes</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      await updateProfile({
                        slotDurationMinutes: profileForm.slotDurationMinutes,
                        slotBufferMinutes: profileForm.slotBufferMinutes,
                      });
                      alert("Slot duration and buffer updated!");
                    }}
                  >
                    ✓ Save Durations
                  </button>
                </div>

                {/* Informed Consent Versioning (Phase 5) */}
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-primary)", margin: 0 }}>
                      📜 Informed Consent &amp; Privacy Agreement
                    </h3>
                    <span className="badge badge-primary">Version {profileForm.consentVersion || 1}.0</span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                    Updating consent text prompts existing clients to review and re-accept the new version on their next booking.
                  </p>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    value={profileForm.consentText || ""}
                    onChange={(e) => setProfileForm({ ...profileForm, consentText: e.target.value })}
                    style={{ marginBottom: "1rem" }}
                  />
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={async () => {
                        await updateProfile({ consentText: profileForm.consentText });
                        alert("Consent terms saved!");
                      }}
                    >
                      Save Consent Text
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={async () => {
                        const newVersion = (profileForm.consentVersion || 1) + 1;
                        setProfileForm({ ...profileForm, consentVersion: newVersion });
                        await updateProfile({ consentVersion: newVersion, consentText: profileForm.consentText });
                        alert(`Consent version incremented to v${newVersion}.0!`);
                      }}
                    >
                      + Increment Version (v{(profileForm.consentVersion || 1) + 1}.0)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: CONTACT INBOX */}
          {activeTab === "inbox" && (
            <div>
              <div className="dash-header">
                <h1>📬 Contact Form Inquiries</h1>
                <p>Messages received from students, parents, and schools via the public `/contact` form.</p>
              </div>

              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div className="tabs" style={{ marginBottom: 0 }}>
                    {(["all", "unread", "read", "replied"] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        className={`tab-btn${messageFilter === filter ? " active" : ""}`}
                        onClick={() => setMessageFilter(filter)}
                      >
                        {filter.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={loadMessages} disabled={loadingMessages}>
                    🔄 Refresh
                  </button>
                </div>

                {loadingMessages ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <CircularProgressLoader
                      size={84}
                      title="संदेश लोड हो रहे हैं..."
                      subtitle="Fetching client correspondence..."
                    />
                  </div>
                ) : messagesList.filter((m) => messageFilter === "all" ? true : (m.status || "unread") === messageFilter).length === 0 ? (
                  <div className="empty-state">
                    <p>No {messageFilter === "all" ? "" : messageFilter} inquiries found in inbox.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {messagesList
                      .filter((m) => messageFilter === "all" ? true : (m.status || "unread") === messageFilter)
                      .map((msg) => (
                        <div
                          key={msg.id}
                          style={{
                            padding: "1rem",
                            borderRadius: "var(--radius-sm)",
                            background: (msg.status === "unread" || !msg.status) ? "var(--surface)" : "var(--surface-2)",
                            border: (msg.status === "unread" || !msg.status) ? "1.5px solid var(--brand-primary)" : "1px solid var(--border)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <div>
                              <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>{msg.name}</h4>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                {msg.email && <span style={{ marginRight: "1rem" }}>✉️ <a href={`mailto:${msg.email}`}>{msg.email}</a></span>}
                                {msg.phone && <span>📞 <a href={`tel:${msg.phone}`}>{msg.phone}</a></span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <span className={`badge ${(msg.status === "unread" || !msg.status) ? "badge-warning" : msg.status === "replied" ? "badge-success" : "badge-muted"}`}>
                                {msg.status || "unread"}
                              </span>
                              <select
                                className="form-select"
                                style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", width: "auto" }}
                                value={msg.status || "unread"}
                                onChange={(e) => handleUpdateMessageStatus(msg.id, e.target.value as any)}
                              >
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                                <option value="replied">Replied</option>
                              </select>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ color: "var(--error)", fontSize: "0.75rem" }}
                                onClick={() => handleDeleteMessage(msg.id)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: "0.9rem", color: "var(--text)", whiteSpace: "pre-line", background: "var(--surface-2)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                            {msg.message}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 10: PAYMENTS TO VERIFY */}
          {activeTab === "payments" && (() => {
            const paymentFilteredAppts = appointments.filter((a) => {
              if (!a.serviceFee && !a.paymentStatus) return false;
              if (paymentFilter !== "all" && (a.paymentStatus || "pending") !== paymentFilter) return false;
              if (paymentSearchQuery.trim()) {
                const q = paymentSearchQuery.toLowerCase();
                const matchName = (a.clientName || "").toLowerCase().includes(q);
                const matchPhone = (a.clientPhone || "").includes(q);
                const matchUtr = (a.utrNumber || "").toLowerCase().includes(q);
                const matchReceipt = (a.receiptNumber || "").toLowerCase().includes(q);
                if (!matchName && !matchPhone && !matchUtr && !matchReceipt) return false;
              }
              if (paymentDateFrom && (a.paymentDate || a.date) < paymentDateFrom) return false;
              if (paymentDateTo && (a.paymentDate || a.date) > paymentDateTo) return false;
              return true;
            });

            const pendingCount = appointments.filter((a) => a.paymentStatus === "submitted").length;
            const verifiedTotal = appointments
              .filter((a) => a.paymentStatus === "verified")
              .reduce((acc, curr) => acc + (curr.serviceFee || 0), 0);
            const rejectedCount = appointments.filter((a) => a.paymentStatus === "rejected").length;
            const refundedTotal = appointments
              .filter((a) => a.paymentStatus === "refunded")
              .reduce((acc, curr) => acc + (curr.refundAmount || curr.serviceFee || 0), 0);

            return (
              <div>
                <div className="dash-header">
                  <h1>💳 Payments to Verify &amp; Financial Records</h1>
                  <p>
                    Review client UPI payment submissions, match transaction reference numbers (UTR), confirm appointments, issue digital receipts, and record refunds.
                  </p>
                </div>

                {/* Safety banner */}
                <div
                  className="alert alert-warning"
                  style={{
                    marginBottom: "1.5rem",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.85rem",
                    padding: "1rem 1.25rem",
                    borderRadius: "var(--radius-sm)",
                    background: "#fff9e6",
                    border: "1.5px solid #f39c12",
                  }}
                >
                  <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>⚠️</span>
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "#856404" }}>
                      महत्वपूर्ण सुरक्षा सूचना (Mandatory Verification Protocol):
                    </strong>
                    <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", lineHeight: 1.5, color: "#856404" }}>
                      Appointment verify karne se pehle apni Bank ya UPI App (GPay, PhonePe, Paytm, BHIM) me client ka UTR/TR number aur amount match zaroor karein. Kabhi bhi sirf screenshot dekh kar verify na karein — bank statement me credit confirm hone ke baad hi Verify button dabayein.
                    </p>
                  </div>
                </div>

                {/* Metric Cards Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "1.75rem" }}>
                  <div className="card card-accent" style={{ padding: "1.25rem" }}>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>PENDING VERIFICATION</div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, color: pendingCount > 0 ? "var(--error)" : "var(--brand-primary)", margin: "0.25rem 0" }}>
                      {pendingCount}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Awaiting bank match</div>
                  </div>

                  <div className="card" style={{ padding: "1.25rem" }}>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>TOTAL VERIFIED (₹)</div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--brand-primary)", margin: "0.25rem 0" }}>
                      {formatInr(verifiedTotal)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {appointments.filter((a) => a.paymentStatus === "verified").length} confirmed transactions
                    </div>
                  </div>

                  <div className="card" style={{ padding: "1.25rem" }}>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>REJECTED PAYMENTS</div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--error)", margin: "0.25rem 0" }}>
                      {rejectedCount}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Flagged or incorrect UTR</div>
                  </div>

                  <div className="card" style={{ padding: "1.25rem" }}>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>REFUNDED AMOUNT</div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-muted)", margin: "0.25rem 0" }}>
                      {formatInr(refundedTotal)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {appointments.filter((a) => a.paymentStatus === "refunded").length} returned sessions
                    </div>
                  </div>
                </div>

                {/* Payments Table Card */}
                <div className="card" style={{ padding: "1.25rem" }}>
                  {/* Filters & Export Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div className="tabs" style={{ marginBottom: 0 }}>
                      {(["all", "submitted", "verified", "rejected", "refunded"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={`tab-btn${paymentFilter === st ? " active" : ""}`}
                          onClick={() => setPaymentFilter(st)}
                        >
                          {st === "submitted" ? "SUBMITTED (PENDING)" : st.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={exportPaymentsCsv}>
                        📥 Export Payments (CSV)
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={loadAppointments} disabled={loadingAppts}>
                        🔄 Refresh
                      </button>
                    </div>
                  </div>

                  {/* Search & Date Filter Bar */}
                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, minWidth: 220, fontSize: "0.85rem", padding: "0.4rem 0.75rem" }}
                      placeholder="Search by client name, phone, UTR, or receipt no..."
                      value={paymentSearchQuery}
                      onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem" }}>
                      <span>From:</span>
                      <input
                        type="date"
                        className="form-input"
                        style={{ fontSize: "0.8rem", padding: "0.35rem 0.5rem" }}
                        value={paymentDateFrom}
                        onChange={(e) => setPaymentDateFrom(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem" }}>
                      <span>To:</span>
                      <input
                        type="date"
                        className="form-input"
                        style={{ fontSize: "0.8rem", padding: "0.35rem 0.5rem" }}
                        value={paymentDateTo}
                        onChange={(e) => setPaymentDateTo(e.target.value)}
                      />
                    </div>
                    {(paymentSearchQuery || paymentDateFrom || paymentDateTo) && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setPaymentSearchQuery("");
                          setPaymentDateFrom("");
                          setPaymentDateTo("");
                        }}
                      >
                        ✕ Clear Filters
                      </button>
                    )}
                  </div>

                  {/* Table */}
                  {loadingAppts ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                      <CircularProgressLoader
                        size={84}
                        title="भुगतान रिकॉर्ड लोड हो रहे हैं..."
                        subtitle="Fetching transaction ledger & receipts..."
                      />
                    </div>
                  ) : paymentFilteredAppts.length === 0 ? (
                    <div className="empty-state">
                      <p>No payment records match the selected filter.</p>
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Client &amp; Appointment</th>
                            <th>Service &amp; Fee</th>
                            <th>Submitted Details (UTR &amp; Proof)</th>
                            <th>Verification Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentFilteredAppts.map((appt) => {
                            const isSubmitted = appt.paymentStatus === "submitted";
                            const isVerified = appt.paymentStatus === "verified";
                            const isRejected = appt.paymentStatus === "rejected";
                            const isRefunded = appt.paymentStatus === "refunded";

                            return (
                              <tr key={appt.id} style={{ background: isSubmitted ? "#fffdf5" : undefined }}>
                                <td>
                                  <strong>{appt.clientName}</strong>
                                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                    📞 <a href={`tel:${appt.clientPhone}`}>{appt.clientPhone}</a>
                                    {appt.clientEmail && <div>✉️ {appt.clientEmail}</div>}
                                  </div>
                                  <div style={{ fontSize: "0.78rem", color: "var(--text-light)", marginTop: "0.3rem" }}>
                                    📅 {appt.date} ({appt.timeSlot}) · <span className="badge badge-secondary">{appt.mode}</span>
                                  </div>
                                </td>

                                <td>
                                  <div style={{ fontWeight: 600 }}>{appt.serviceTitle}</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--brand-primary)", marginTop: "0.2rem" }}>
                                    {formatInr(appt.serviceFee || 0)}
                                  </div>
                                </td>

                                <td>
                                  {appt.utrNumber ? (
                                    <div>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <code style={{ fontSize: "0.88rem", fontWeight: 700, background: "var(--surface-2)", padding: "0.15rem 0.4rem", borderRadius: "var(--radius-sm)" }}>
                                          {appt.utrNumber}
                                        </code>
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-sm"
                                          style={{ padding: "0.1rem 0.3rem", fontSize: "0.75rem" }}
                                          title="Copy UTR Number"
                                          onClick={() => {
                                            navigator.clipboard.writeText(appt.utrNumber || "");
                                            alert(`Copied UTR: ${appt.utrNumber}`);
                                          }}
                                        >
                                          📋
                                        </button>
                                      </div>

                                      {appt.paymentDate && (
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                          Paid on: {appt.paymentDate}
                                        </div>
                                      )}

                                      {/* Anti-fraud Duplicate UTR Warning */}
                                      {appt.isDuplicateUtr && (
                                        <div
                                          style={{
                                            marginTop: "0.4rem",
                                            padding: "0.25rem 0.5rem",
                                            background: "#ffebee",
                                            border: "1px solid var(--error)",
                                            borderRadius: "var(--radius-sm)",
                                            fontSize: "0.75rem",
                                            color: "var(--error)",
                                            fontWeight: 700,
                                          }}
                                        >
                                          ⚠️ DUPLICATE UTR DETECTED (Already indexed!)
                                        </div>
                                      )}

                                      {/* Screenshot preview link */}
                                      {appt.paymentScreenshotUrl && (
                                        <div style={{ marginTop: "0.4rem" }}>
                                          <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            style={{ fontSize: "0.75rem", padding: "0.15rem 0.4rem" }}
                                            onClick={() => setPreviewImageUrl(appt.paymentScreenshotUrl || null)}
                                          >
                                            🖼️ View Screenshot
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                      No payment submitted yet
                                    </span>
                                  )}
                                </td>

                                <td>
                                  {isSubmitted && (
                                    <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                                      ⏳ Verification Pending
                                    </span>
                                  )}
                                  {isVerified && (
                                    <div>
                                      <span className="badge badge-success">✓ Verified</span>
                                      {appt.receiptNumber && (
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                          {appt.receiptNumber}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {isRejected && (
                                    <div>
                                      <span className="badge badge-error">✕ Rejected</span>
                                      {appt.rejectionReason && (
                                        <div style={{ fontSize: "0.75rem", color: "var(--error)", marginTop: "0.25rem", maxWidth: 180 }}>
                                          "{appt.rejectionReason}"
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {isRefunded && (
                                    <div>
                                      <span className="badge badge-muted">↩ Refunded</span>
                                      {appt.refundAmount && (
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                          ₹{appt.refundAmount}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {!appt.paymentStatus || appt.paymentStatus === "pending" ? (
                                    <span className="badge badge-muted">Pending from Client</span>
                                  ) : null}
                                </td>

                                <td>
                                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                    {isSubmitted && (
                                      <>
                                        <button
                                          type="button"
                                          className="btn btn-primary btn-sm"
                                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                                          onClick={() => handleVerifyPayment(appt)}
                                        >
                                          ✓ Verify &amp; Confirm
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-outline btn-sm"
                                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", color: "var(--error)" }}
                                          onClick={() => {
                                            setRejectModalAppt(appt);
                                            setRejectReason("");
                                          }}
                                        >
                                          ✕ Reject
                                        </button>
                                      </>
                                    )}

                                    {isVerified && (
                                      <>
                                        <button
                                          type="button"
                                          className="btn btn-outline btn-sm"
                                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                                          onClick={() => setReceiptModalAppt(appt)}
                                        >
                                          🧾 View Receipt
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-sm"
                                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", color: "var(--text-muted)" }}
                                          onClick={() => {
                                            setRefundModalAppt(appt);
                                            setRefundAmount(appt.serviceFee || "");
                                            setRefundNote("");
                                          }}
                                        >
                                          ↩ Record Refund
                                        </button>
                                      </>
                                    )}

                                    {isRejected && (
                                      <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        style={{ fontSize: "0.75rem" }}
                                        onClick={() => handleVerifyPayment(appt)}
                                      >
                                        Re-verify &amp; Confirm
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB: AGGREGATE INSIGHTS & ANALYTICS (Phase 5) */}
          {activeTab === "insights" && (
            <InsightsView appointments={appointments} lang={lang} />
          )}

          {/* TAB: WORKSHOPS & EVENTS (Phase 5) */}
          {activeTab === "workshops" && (
            <WorkshopManager lang={lang} />
          )}

          {/* TAB: EDUCATIONAL RESOURCES HUB (Phase 5) */}
          {activeTab === "resources" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem", color: "var(--brand-primary)" }}>
                    📚 {t("resourceHub", lang)}
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
                    Upload or link worksheets, guidance PDFs, relaxation guides, and educational materials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResourceModal(true)}
                  className="btn btn-primary btn-sm"
                >
                  + Add Resource
                </button>
              </div>

              {loadingResources ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>{t("loading", lang)}</div>
              ) : resourcesList.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📑</div>
                  <h3>No Resources Added Yet</h3>
                  <button type="button" onClick={() => setShowResourceModal(true)} className="btn btn-outline btn-sm" style={{ marginTop: "0.5rem" }}>
                    Add First Resource
                  </button>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title &amp; Description</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Visibility</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resourcesList.map((res) => (
                        <tr key={res.id}>
                          <td>
                            <strong>{res.title}</strong>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{res.description}</div>
                          </td>
                          <td>
                            <span className="badge badge-primary" style={{ textTransform: "capitalize" }}>
                              {res.category.replace("_", " ")}
                            </span>
                          </td>
                          <td><span className="badge badge-outline" style={{ textTransform: "uppercase" }}>{res.type}</span></td>
                          <td>
                            <span className={`badge ${res.visibility === "public" ? "badge-success" : "badge-secondary"}`}>
                              {res.visibility === "public" ? "🌐 Public" : "🔒 Client Only"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              {res.url && (
                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                                  🔗 Open
                                </a>
                              )}
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteResource(res.id)}>
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Resource Modal */}
              {showResourceModal && (
                <div className="modal-backdrop">
                  <div className="modal-content" style={{ maxWidth: 540 }}>
                    <div className="modal-header">
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>+ Add Educational Resource</h3>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowResourceModal(false)}>✕</button>
                    </div>
                    <form onSubmit={handleCreateResource} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                          type="text"
                          required
                          value={newResource.title || ""}
                          onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                          className="form-input"
                          placeholder="e.g. Class 12 Stream Guidance Handbook"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          rows={2}
                          value={newResource.description || ""}
                          onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                          className="form-textarea"
                          placeholder="Summary of this material..."
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="form-group">
                          <label className="form-label">Category</label>
                          <select
                            className="form-select"
                            value={newResource.category || "career"}
                            onChange={(e) => setNewResource({ ...newResource, category: e.target.value as any })}
                          >
                            <option value="career">Career</option>
                            <option value="wellness">Mental Wellness</option>
                            <option value="exam_prep">Exam Prep</option>
                            <option value="mindfulness">Mindfulness</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Format Type</label>
                          <select
                            className="form-select"
                            value={newResource.type || "pdf"}
                            onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })}
                          >
                            <option value="pdf">PDF Document</option>
                            <option value="video">Video (YouTube / MP4 / Link)</option>
                            <option value="link">Web Link</option>
                            <option value="audio">Audio Exercise</option>
                            <option value="article">Article</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Resource File or Link *</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                            <label
                              className="btn btn-outline btn-sm"
                              style={{ cursor: uploadingResourceFile ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                            >
                              <span>📁 {uploadingResourceFile ? "Uploading File..." : "Upload Document / PDF from Device"}</span>
                              <input
                                type="file"
                                accept="application/pdf,audio/*,image/*,video/*"
                                style={{ display: "none" }}
                                onChange={handleResourceFileUpload}
                                disabled={uploadingResourceFile}
                              />
                            </label>
                            {uploadedResourceFileName && (
                              <span style={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 600 }}>
                                ✅ {uploadedResourceFileName}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {lang === "hi"
                              ? "या सीधे वेब / यूट्यूब / गूगल ड्राइव लिंक दर्ज करें:"
                              : "Or enter direct Web / YouTube / Google Drive URL below:"}
                          </div>
                          <input
                            type="url"
                            value={newResource.url || ""}
                            onChange={(e) => {
                              setNewResource({ ...newResource, url: e.target.value });
                              setUploadedResourceFileName(null);
                            }}
                            className="form-input"
                            placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/..."
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Visibility</label>
                        <div style={{ display: "flex", gap: "1.5rem" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
                            <input
                              type="radio"
                              checked={newResource.visibility === "public"}
                              onChange={() => setNewResource({ ...newResource, visibility: "public" })}
                            />
                            🌐 Public on /resources
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
                            <input
                              type="radio"
                              checked={newResource.visibility === "client_only"}
                              onChange={() => setNewResource({ ...newResource, visibility: "client_only" })}
                            />
                            🔒 Client Dashboard Only
                          </label>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                        <button type="button" onClick={() => setShowResourceModal(false)} className="btn btn-outline btn-sm">
                          Cancel
                        </button>
                        <button type="submit" disabled={savingResource} className="btn btn-primary btn-sm">
                          {savingResource ? t("loading", lang) : "Save Resource"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: DELETION REQUESTS QUEUE (Phase 5 - DPDPA 2023) */}
          {activeTab === "deletionQueue" && (
            <div>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.25rem", color: "var(--brand-primary)" }}>
                  🗑️ {t("deletionRequests", lang)}
                </h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
                  Review client data erasure requests submitted under the Digital Personal Data Protection Act (DPDPA 2023).
                </p>
              </div>

              {loadingDeletions ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>{t("loading", lang)}</div>
              ) : deletionRequests.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🛡️</div>
                  <h3>No Pending Data Deletion Requests</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>Client data erasure requests will appear here for review.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Client Details</th>
                        <th>Requested Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletionRequests.map((req) => (
                        <tr key={req.id}>
                          <td>
                            <strong>{req.userName}</strong>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{req.userEmail}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>UID: {req.userId}</div>
                          </td>
                          <td>{new Date(req.requestedAt).toLocaleString()}</td>
                          <td>
                            <span className={`badge ${req.status === "completed" ? "badge-success" : req.status === "rejected" ? "badge-error" : "badge-secondary"}`}>
                              {req.status}
                            </span>
                          </td>
                          <td>
                            {req.status === "pending" ? (
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleProcessDeletion(req.id, "completed")}
                                >
                                  ✓ Mark Processed
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleProcessDeletion(req.id, "rejected")}
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: CLIENT MESSAGING (Phase 6 Part A) */}
          {activeTab === "clientMessaging" && profile.messagingEnabled && (
            <div>
              <div className="dash-header">
                <h1>💬 Client Messages</h1>
                <p>Private, confidential asynchronous communication threads with individual clients.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.25rem", minHeight: 520 }}>
                {/* Threads list */}
                <div className="card" style={{ padding: "1rem", overflowY: "auto", maxHeight: 600 }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                    Active Client Threads ({threadsList.length})
                  </h3>
                  {loadingThreads ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>Loading threads...</div>
                  ) : threadsList.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      No active client threads yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {threadsList.map((th) => (
                        <div
                          key={th.id}
                          onClick={() => {
                            setSelectedThreadId(th.clientId);
                            setSelectedThreadClientName(th.clientName || "Client");
                          }}
                          style={{
                            padding: "0.65rem 0.85rem",
                            borderRadius: 8,
                            cursor: "pointer",
                            background: selectedThreadId === th.clientId ? "var(--brand-primary, #1a3a8f)" : "var(--card-bg, #f3f4f6)",
                            color: selectedThreadId === th.clientId ? "#ffffff" : "inherit",
                            border: "1px solid var(--border-color)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "0.9rem" }}>{th.clientName || "Client"}</strong>
                            {th.unreadByCounsellor && (
                              <span className="badge badge-warning" style={{ fontSize: "0.68rem" }}>
                                New
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.72rem", opacity: 0.8, marginTop: 3 }}>
                            ID: {th.clientId.slice(0, 8)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active chat pane */}
                <div className="card" style={{ padding: "1.25rem" }}>
                  {selectedThreadId ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>
                          Chat with {selectedThreadClientName}
                        </h3>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          Client UID: {selectedThreadId}
                        </span>
                      </div>
                      <MessagingPanel
                        clientId={selectedThreadId}
                        clientName={selectedThreadClientName}
                        viewerRole="counsellor"
                      />
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted)" }}>
                      <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>💬</div>
                      <p>Select a client thread from the left to read and respond to messages.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SESSION FEEDBACK & FOLLOW-UP (Phase 6 Part E) */}
          {activeTab === "sessionFeedback" && profile.feedbackEnabled && (() => {
            const now = currentTime;
            const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
            const completedAppts = appointments.filter((a) => a.status === "completed");
            const followUpDue = completedAppts.filter((a) => {
              const apptTime = new Date(a.date).getTime();
              if (isNaN(apptTime)) return false;
              const isOlderThan7Days = now - apptTime >= SEVEN_DAYS_MS;
              if (!isOlderThan7Days) return false;
              const hasNewer = appointments.some(
                (other) => other.userId === a.userId && other.id !== a.id && new Date(other.date).getTime() > apptTime
              );
              return !hasNewer;
            });

            return (
              <div>
                <div className="dash-header">
                  <h1>⭐ Session Feedback &amp; Follow-up Queue</h1>
                  <p>Private client session ratings, qualitative takeaways, and automated follow-up tracking.</p>
                </div>

                {/* Section 1: Feedback Received */}
                <div className="card" style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    💬 Private Session Feedback ({feedbackList.length})
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                    Private client submissions. Confidential to counsellor only — never published publicly.
                  </p>

                  {loadingFeedback ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>Loading feedback...</div>
                  ) : feedbackList.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                      No session feedback received yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Rating</th>
                            <th>Helpful Aspects</th>
                            <th>Improvement Areas</th>
                            <th>Would Return</th>
                            <th>Submitted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {feedbackList.map((fb) => (
                            <tr key={fb.id}>
                              <td style={{ whiteSpace: "nowrap" }}>
                                {"⭐".repeat(fb.rating)}
                                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.3rem" }}>
                                  ({fb.rating}/5)
                                </span>
                              </td>
                              <td style={{ fontSize: "0.88rem", maxWidth: 240 }}>
                                {fb.helpfulness || <span style={{ color: "var(--text-muted)" }}>—</span>}
                              </td>
                              <td style={{ fontSize: "0.88rem", maxWidth: 240 }}>
                                {fb.improvements || <span style={{ color: "var(--text-muted)" }}>—</span>}
                              </td>
                              <td>
                                <span className={`badge ${fb.wouldReturn ? "badge-success" : "badge-secondary"}`}>
                                  {fb.wouldReturn ? "Yes" : "Maybe / No"}
                                </span>
                              </td>
                              <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                {fb.submittedAt ? new Date(fb.submittedAt).toLocaleDateString("en-IN") : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 2: Follow-up Queue */}
                <div className="card">
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    📋 Follow-up Queue ({followUpDue.length} due)
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                    Clients who attended a consultation 7+ days ago with no further bookings. Send a gentle, confidential follow-up nudge.
                  </p>

                  {followUpDue.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                      ✓ All client follow-ups are up to date!
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Client</th>
                            <th>Contact</th>
                            <th>Service</th>
                            <th>Session Date</th>
                            <th>Last Nudge</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {followUpDue.map((appt) => (
                            <tr key={appt.id}>
                              <td>
                                <strong>{appt.clientName}</strong>
                              </td>
                              <td style={{ fontSize: "0.85rem" }}>
                                <div>📞 {appt.clientPhone}</div>
                                {appt.clientEmail && <div style={{ color: "var(--text-muted)" }}>✉️ {appt.clientEmail}</div>}
                              </td>
                              <td style={{ fontSize: "0.88rem" }}>{appt.serviceTitle}</td>
                              <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>{appt.date}</td>
                              <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                {(appt as any).followupSentAt
                                  ? "✓ Nudge Sent"
                                  : "Pending"}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  style={{ fontSize: "0.78rem" }}
                                  disabled={sendingFollowupApptId === appt.id}
                                  onClick={() => handleSendFollowupNudge(appt)}
                                >
                                  {sendingFollowupApptId === appt.id ? "Sending..." : "📨 Send Nudge"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB: SUBSCRIBERS (Phase 6 Part F) */}
          {activeTab === "subscribers" && profile.newsletterEnabled && (
            <div>
              <div className="dash-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h1>📧 Newsletter Subscribers</h1>
                  <p>Subscribers collected via the double opt-in website subscription form.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={exportSubscribersCsv}
                  disabled={subscribersList.length === 0}
                >
                  📥 Export Subscribers CSV
                </button>
              </div>

              <div className="card">
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <div style={{ background: "var(--card-bg, #f3f4f6)", padding: "0.65rem 1rem", borderRadius: 8 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Subscribers</div>
                    <strong style={{ fontSize: "1.2rem" }}>{subscribersList.length}</strong>
                  </div>
                  <div style={{ background: "var(--card-bg, #f3f4f6)", padding: "0.65rem 1rem", borderRadius: 8 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Confirmed Opt-ins</div>
                    <strong style={{ fontSize: "1.2rem", color: "#10b981" }}>
                      {subscribersList.filter((s) => s.confirmed).length}
                    </strong>
                  </div>
                  <div style={{ background: "var(--card-bg, #f3f4f6)", padding: "0.65rem 1rem", borderRadius: 8 }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Active</div>
                    <strong style={{ fontSize: "1.2rem", color: "var(--brand-primary)" }}>
                      {subscribersList.filter((s) => s.active).length}
                    </strong>
                  </div>
                </div>

                {loadingSubscribers ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>Loading subscribers...</div>
                ) : subscribersList.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                    No subscribers yet.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Name</th>
                          <th>Confirmed</th>
                          <th>Status</th>
                          <th>Subscribed Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscribersList.map((sub) => (
                          <tr key={sub.id}>
                            <td>
                              <strong>{sub.email}</strong>
                            </td>
                            <td>{sub.name || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                            <td>
                              <span className={`badge ${sub.confirmed ? "badge-success" : "badge-warning"}`}>
                                {sub.confirmed ? "Confirmed" : "Pending Opt-in"}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${sub.active ? "badge-primary" : "badge-secondary"}`}>
                                {sub.active ? "Active" : "Unsubscribed"}
                              </span>
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                              {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString("en-IN") : "—"}
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

      {/* MODAL 1: REJECT PAYMENT */}
      {rejectModalAppt && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--error)" }}>
                ✕ Reject Payment Submission
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setRejectModalAppt(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Client <strong>{rejectModalAppt.clientName}</strong> submitted UTR:{" "}
                <code>{rejectModalAppt.utrNumber}</code> for ₹{rejectModalAppt.serviceFee}.
              </p>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Mandatory Rejection Reason *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this payment could not be verified (e.g. UTR not found in bank statement, amount mismatch)..."
                  required
                />
              </div>

              {/* Quick suggestion tags */}
              <div style={{ marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
                  Quick Fill Options:
                </span>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {[
                    "UTR not found in bank account statement",
                    "Amount received is less than service fee",
                    "Duplicate transaction reference number",
                    "Screenshot / UTR could not be verified",
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: "0.72rem", padding: "0.15rem 0.4rem" }}
                      onClick={() => setRejectReason(sug)}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setRejectModalAppt(null)}
                  disabled={submittingReject}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmRejectPayment}
                  disabled={submittingReject || !rejectReason.trim()}
                >
                  {submittingReject ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD REFUND */}
      {refundModalAppt && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                ↩ Record Client Refund
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setRefundModalAppt(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Recording refund for <strong>{refundModalAppt.clientName}</strong> (Service: {refundModalAppt.serviceTitle}).
                This will mark the payment as <strong>Refunded</strong> and cancel the appointment.
              </p>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Refund Amount (₹ INR) *</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : "")}
                  placeholder={`Original fee: ₹${refundModalAppt.serviceFee || 0}`}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Internal Refund Note</label>
                <input
                  type="text"
                  className="form-input"
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="e.g. Returned via Google Pay on client cancellation request"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setRefundModalAppt(null)}
                  disabled={submittingRefund}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmRefundPayment}
                  disabled={submittingRefund || !refundAmount}
                >
                  {submittingRefund ? "Recording..." : "Save Refund Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SCREENSHOT PREVIEW */}
      {previewImageUrl && (
        <div className="modal-backdrop" onClick={() => setPreviewImageUrl(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 640, background: "transparent", border: "none", boxShadow: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setPreviewImageUrl(null)}
              >
                ✕ Close Preview
              </button>
            </div>
            <img
              src={previewImageUrl}
              alt="Payment Screenshot Preview"
              style={{
                width: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "var(--radius)",
                background: "#000",
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE RECEIPT */}
      {receiptModalAppt && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                🧾 Official Consultation Payment Receipt
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setReceiptModalAppt(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "1.5rem" }} id="printable-receipt">
              {/* Receipt Header */}
              <div style={{ borderBottom: "2px solid var(--brand-primary)", paddingBottom: "1rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--brand-primary)" }}>
                    {profile.siteName || "Inspiria Careers"}
                  </h2>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {profile.counsellorName || "Career Guidance Centre"}
                  </div>
                  {profile.email && <div style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>✉️ {profile.email}</div>}
                  {profile.phone && <div style={{ fontSize: "0.78rem", color: "var(--text-light)" }}>📞 {profile.phone}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge badge-success" style={{ fontSize: "0.85rem", padding: "0.3rem 0.6rem" }}>
                    ✓ PAID &amp; VERIFIED
                  </span>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                    Receipt No:
                  </div>
                  <strong style={{ fontSize: "0.88rem", fontFamily: "monospace" }}>
                    {receiptModalAppt.receiptNumber || generateReceiptNumber(receiptModalAppt.id)}
                  </strong>
                </div>
              </div>

              {/* Client & Service Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem", fontSize: "0.88rem" }}>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>BILLED TO:</div>
                  <strong>{receiptModalAppt.clientName}</strong>
                  {receiptModalAppt.clientPhone && <div>Phone: {receiptModalAppt.clientPhone}</div>}
                  {receiptModalAppt.clientEmail && <div>Email: {receiptModalAppt.clientEmail}</div>}
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>TRANSACTION DETAILS:</div>
                  <div>Date: {receiptModalAppt.paymentDate || receiptModalAppt.date}</div>
                  <div>Mode: UPI / QR Transfer</div>
                  <div>UTR: <code>{receiptModalAppt.utrNumber || "Verified"}</code></div>
                </div>
              </div>

              {/* Service Line Items */}
              <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem", marginBottom: "0.5rem", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)" }}>
                  <span>SERVICE DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{receiptModalAppt.serviceTitle}</strong>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      Slot: {receiptModalAppt.date} ({receiptModalAppt.timeSlot}) · {receiptModalAppt.mode}
                    </div>
                  </div>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--brand-primary)" }}>
                    {formatInr(receiptModalAppt.serviceFee || 0)}
                  </span>
                </div>
              </div>

              {/* Policy & Computer Generated Disclaimer */}
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)", lineHeight: 1.5, borderTop: "1px dashed var(--border)", paddingTop: "0.75rem", textAlign: "center" }}>
                {profile.refundPolicyText && (
                  <p style={{ margin: "0 0 0.4rem" }}>Policy: {profile.refundPolicyText}</p>
                )}
                <p style={{ margin: 0 }}>
                  This is a computer-generated digital receipt issued by {profile.siteName || "Inspiria Careers"}. Valid without physical signature.
                </p>
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => window.print()}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setReceiptModalAppt(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 5 Modals */}
      <IntakeViewModal
        isOpen={!!selectedIntakeUser}
        userId={selectedIntakeUser?.id}
        clientName={selectedIntakeUser?.name}
        onClose={() => setSelectedIntakeUser(null)}
        lang={lang}
      />

      <SessionNotesModal
        isOpen={!!selectedNotesAppt}
        appointmentId={selectedNotesAppt?.id || ""}
        userId={selectedNotesAppt?.userId}
        clientName={selectedNotesAppt?.clientName}
        appointmentDate={selectedNotesAppt?.date}
        onClose={() => setSelectedNotesAppt(null)}
        lang={lang}
      />

      <AssignTaskModal
        isOpen={!!selectedTaskClient}
        userId={selectedTaskClient?.id || ""}
        clientName={selectedTaskClient?.name || ""}
        onClose={() => setSelectedTaskClient(null)}
        lang={lang}
      />
    </div>
  );
}
