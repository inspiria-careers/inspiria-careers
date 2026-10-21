"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
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
import { createGoogleCalendarUrl, downloadIcsFile, parseSlotToDates } from "@/lib/calendarUtils";
import { validateUtr, createUpiDeepLink, formatInr, generateReceiptNumber } from "@/lib/paymentUtils";
import ImageUploader from "@/components/ImageUploader";
import IntakeModal from "@/components/IntakeModal";
import MessagingPanel from "@/components/MessagingPanel";
import SessionFeedbackModal from "@/components/SessionFeedbackModal";
import CircularProgressLoader from "@/components/CircularProgressLoader";
import { t } from "@/translations";
import type { ClientTask, JournalEntry, ResourceItem, ClientIntake, ReminderPreference } from "@/types";

interface ClientAppointment {
  id: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
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
  date: string;
  timeSlot: string;
  mode: string;
  meetingLink?: string;
  officeAddress?: string;
  notes?: string;
  counsellorNote?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
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
  const router = useRouter();
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const { profile, lang } = useSite();

  const [activeTab, setActiveTab] = useState<
    "appointments" | "notes" | "documents" | "tasks" | "journal" | "resources" | "review" | "profile" | "privacy" | "messages"
  >("appointments");

  // Phase 6: Messages, Feedback & Reminders state
  const [feedbackModalAppt, setFeedbackModalAppt] = useState<ClientAppointment | null>(null);
  const [reminderPref, setReminderPref] = useState<ReminderPreference | null>(null);
  const [savingReminderPref, setSavingReminderPref] = useState(false);

  // Phase 5: Tasks, Journal, Resources, Intake & Deletion
  const [tasksList, setTasksList] = useState<ClientTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskReflectionText, setTaskReflectionText] = useState<Record<string, string>>({});

  const [journalList, setJournalList] = useState<JournalEntry[]>([]);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [journalMood, setJournalMood] = useState<number>(4);
  const [journalReflection, setJournalReflection] = useState("");
  const [journalGratitude, setJournalGratitude] = useState("");
  const [journalShared, setJournalShared] = useState(false);
  const [journalSaving, setJournalSaving] = useState(false);

  const [resourcesList, setResourcesList] = useState<ResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const [intakeProfile, setIntakeProfile] = useState<ClientIntake | null>(null);
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<"idle" | "requested" | "submitting">("idle");

  // Appointments state
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Reschedule request state
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState<ClientAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [minRescheduleDate, setMinRescheduleDate] = useState("");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [rescheduleSlot, setRescheduleSlot] = useState("10:00 AM - 11:00 AM");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

  useEffect(() => {
    const now = Date.now();
    setCurrentTime(now);
    setMinRescheduleDate(new Date(now + 86400000).toISOString().split("T")[0]);
  }, []);

  // Load user reminder preferences (Phase 6 Part C)
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "reminderPreferences", user.uid))
      .then((snap) => {
        if (snap.exists()) {
          setReminderPref(snap.data() as ReminderPreference);
        } else {
          setReminderPref({
            userId: user.uid,
            optedIn: false,
            preferredChannel: "whatsapp",
            updatedAt: new Date().toISOString(),
          });
        }
      })
      .catch(() => {});
  }, [user?.uid]);

  const handleToggleReminder = async (
    optedIn: boolean,
    channel: "whatsapp" | "sms" = (reminderPref?.preferredChannel === "sms" ? "sms" : "whatsapp")
  ) => {
    if (!user?.uid) return;
    setSavingReminderPref(true);
    try {
      const updated: ReminderPreference = {
        userId: user.uid,
        optedIn,
        preferredChannel: channel,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "reminderPreferences", user.uid), updated, { merge: true });
      setReminderPref(updated);
    } catch (err) {
      console.error("Error saving reminder pref:", err);
    } finally {
      setSavingReminderPref(false);
    }
  };

  // Manual QR & UPI Payment State
  const [paymentModalAppt, setPaymentModalAppt] = useState<ClientAppointment | null>(null);
  const [paymentUtr, setPaymentUtr] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [paymentHp, setPaymentHp] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);

  // Downloadable Receipt State
  const [receiptModalAppt, setReceiptModalAppt] = useState<ClientAppointment | null>(null);

  const isWithinCutoff = (appt: ClientAppointment) => {
    if (!currentTime) return false;
    try {
      const { start } = parseSlotToDates(appt.date, appt.timeSlot);
      const cutoffHours = profile.cancellationCutoffHours || 24;
      const diffMs = start.getTime() - currentTime;
      return diffMs < cutoffHours * 60 * 60 * 1000;
    } catch {
      return false;
    }
  };

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
  const [clientPhone, setClientPhone] = useState(user?.phone || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      setClientPhone(user.phone || "");
    }
  }, [user]);

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

  // Load Phase 5 Tasks
  const loadTasks = async () => {
    if (!user) return;
    try {
      setLoadingTasks(true);
      const q = query(collection(db, "clientTasks"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClientTask));
      setTasksList(list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleToggleTask = async (task: ClientTask) => {
    try {
      const now = new Date().toISOString();
      const newStatus = !task.completed;
      await updateDoc(doc(db, "clientTasks", task.id), {
        completed: newStatus,
        completedAt: newStatus ? now : null,
      });
      setTasksList((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: newStatus, completedAt: newStatus ? now : undefined } : t))
      );
    } catch {
      alert("Failed to update task status.");
    }
  };

  const handleSaveReflection = async (taskId: string) => {
    const text = taskReflectionText[taskId]?.trim();
    if (!text) return;
    try {
      await updateDoc(doc(db, "clientTasks", taskId), { reflection: text });
      setTasksList((prev) => prev.map((t) => (t.id === taskId ? { ...t, reflection: text } : t)));
      alert("Reflection saved!");
    } catch {
      alert("Failed to save reflection.");
    }
  };

  // Load Phase 5 Journal
  const loadJournal = async () => {
    if (!user) return;
    try {
      setLoadingJournal(true);
      const q = query(collection(db, "clientJournal"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as JournalEntry));
      setJournalList(list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
    } catch (err) {
      console.error("Error loading journal:", err);
    } finally {
      setLoadingJournal(false);
    }
  };

  const handleAddJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!journalReflection.trim() && !journalGratitude.trim()) return;
    const moodLabels = ["", "Struggling", "Low", "Neutral", "Good", "Great"];
    try {
      setJournalSaving(true);
      const newEntry: Omit<JournalEntry, "id"> = {
        userId: user.uid,
        mood: journalMood,
        moodLabel: moodLabels[journalMood] || "Neutral",
        reflection: journalReflection.trim(),
        gratitude: journalGratitude.trim(),
        sharedWithCounsellor: journalShared,
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, "clientJournal"), newEntry);
      setJournalList((prev) => [{ id: ref.id, ...newEntry }, ...prev]);
      setJournalReflection("");
      setJournalGratitude("");
      setJournalShared(false);
    } catch (err) {
      console.error("Journal save error:", err);
      alert("Failed to save journal entry.");
    } finally {
      setJournalSaving(false);
    }
  };

  const handleDeleteJournalEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      await deleteDoc(doc(db, "clientJournal", id));
      setJournalList((prev) => prev.filter((j) => j.id !== id));
    } catch {
      alert("Failed to delete journal entry.");
    }
  };

  // Load Phase 5 Educational Resources
  const loadResources = async () => {
    try {
      setLoadingResources(true);
      const q = query(collection(db, "resources"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ResourceItem));
      setResourcesList(list);
    } catch (err) {
      console.error("Error loading resources:", err);
    } finally {
      setLoadingResources(false);
    }
  };

  // Load Phase 5 Intake
  const loadIntake = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "clientIntake", user.uid));
      if (snap.exists()) {
        setIntakeProfile(snap.data() as ClientIntake);
      }
    } catch (err) {
      console.error("Error loading intake profile:", err);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to submit a formal Data Deletion Request (under DPDPA 2023)? The counsellor will be notified to review and process your records.")) return;
    try {
      setDeletionStatus("submitting");
      await addDoc(collection(db, "deletionRequests"), {
        userId: user.uid,
        userName: user.displayName || displayName || "Client",
        userEmail: user.email || "",
        status: "pending",
        requestedAt: new Date().toISOString(),
      });
      setDeletionStatus("requested");
    } catch {
      alert("Failed to submit deletion request.");
      setDeletionStatus("idle");
    }
  };

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      loadMyAppointments();
      loadNotes();
      loadDocs();
      loadTasks();
      loadJournal();
      loadResources();
      loadIntake();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cancel Appointment
  const handleCancelAppointment = async (appt: ClientAppointment) => {
    if (isWithinCutoff(appt)) {
      alert(
        `Cannot cancel online within ${profile.cancellationCutoffHours || 24} hours of the session. Please contact the counsellor directly.`
      );
      return;
    }
    if (!confirm("Are you sure you want to cancel this appointment request?")) return;
    try {
      await updateDoc(doc(db, "appointments", appt.id), { status: "cancelled" });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: "cancelled" } : a))
      );
      setActionMsg("✓ Appointment cancelled successfully.");
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to cancel appointment.");
    }
  };

  // Open Reschedule Modal
  const handleOpenRescheduleModal = (appt: ClientAppointment) => {
    const nowMs = Date.now();
    setCurrentTime(nowMs);
    setMinRescheduleDate(new Date(nowMs + 86400000).toISOString().split("T")[0]);

    if (isWithinCutoff(appt)) {
      alert(
        `Rescheduling is not permitted within ${profile.cancellationCutoffHours || 24} hours of the session. Please contact your counsellor directly.`
      );
      return;
    }
    setRescheduleModalAppt(appt);
    setRescheduleDate("");
    setRescheduleReason("");
    setRescheduleError("");
  };

  // Submit Reschedule Request
  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalAppt || !rescheduleDate) return;

    const blockedDates = profile.blockedDates || [];
    if (blockedDates.includes(rescheduleDate)) {
      setRescheduleError("The chosen date is marked as unavailable/holiday by the counsellor.");
      return;
    }

    try {
      setRescheduleSubmitting(true);
      setRescheduleError("");

      const requestPayload = {
        requestedDate: rescheduleDate,
        requestedSlot: rescheduleSlot,
        reason: rescheduleReason.trim() || "Client requested reschedule",
        status: "pending" as const,
        requestedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "appointments", rescheduleModalAppt.id), {
        rescheduleRequest: requestPayload,
      });

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === rescheduleModalAppt.id ? { ...a, rescheduleRequest: requestPayload } : a
        )
      );

      setActionMsg("✓ Reschedule request submitted. Awaiting counsellor confirmation.");
      setTimeout(() => setActionMsg(null), 3500);
      setRescheduleModalAppt(null);
    } catch (err: any) {
      console.error("Reschedule submit error:", err);
      setRescheduleError("Failed to submit reschedule request.");
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // Payment Handlers
  const handleOpenPaymentModal = (appt: ClientAppointment) => {
    setPaymentModalAppt(appt);
    setPaymentUtr(appt.utrNumber || "");
    setPaymentDate(appt.paymentDate || new Date().toISOString().slice(0, 16));
    setPaymentScreenshot(appt.paymentScreenshotUrl || null);
    setPaymentError("");
    setUpiCopied(false);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalAppt(null);
    setPaymentUtr("");
    setPaymentScreenshot(null);
    setPaymentError("");
  };

  const handleCopyUpi = () => {
    if (!profile.upiId) return;
    navigator.clipboard.writeText(profile.upiId);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2500);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalAppt || !user) return;

    if (paymentHp) {
      handleClosePaymentModal();
      return;
    }

    const utrCheck = validateUtr(paymentUtr);
    if (!utrCheck.valid) {
      setPaymentError(utrCheck.error || "Please enter a valid Transaction / UTR number.");
      return;
    }
    const cleanUtr = utrCheck.formatted;

    try {
      setPaymentSubmitting(true);
      setPaymentError("");

      let isDuplicate = false;
      try {
        const trDocRef = doc(db, "trNumbers", cleanUtr);
        const trSnap = await getDoc(trDocRef);
        if (trSnap.exists() && trSnap.data().appointmentId !== paymentModalAppt.id) {
          isDuplicate = true;
        } else {
          await setDoc(trDocRef, {
            appointmentId: paymentModalAppt.id,
            userId: user.uid,
            amount: paymentModalAppt.serviceFee || 0,
            submittedAt: serverTimestamp(),
          });
        }
      } catch (errCheck) {
        console.warn("Could not check/write trNumbers unique index:", errCheck);
      }

      await updateDoc(doc(db, "appointments", paymentModalAppt.id), {
        paymentStatus: "submitted",
        utrNumber: cleanUtr,
        paymentDate: paymentDate || new Date().toISOString(),
        paymentScreenshotUrl: paymentScreenshot || null,
        isDuplicateUtr: isDuplicate,
        paymentSubmittedAt: serverTimestamp(),
        rejectionReason: null,
      });

      setActionMsg(
        lang === "hi"
          ? "✅ आपका भुगतान सत्यापन के लिए भेज दिया गया है। काउंसलर द्वारा पुष्टि होने के बाद अपॉइंटमेंट कन्फर्म होगा।"
          : "✅ Payment submitted for verification. Session will be confirmed once verified by the counsellor."
      );
      setTimeout(() => setActionMsg(null), 5000);

      handleClosePaymentModal();
      await loadMyAppointments();
    } catch (err: any) {
      console.error("Payment submit error:", err);
      setPaymentError("Could not submit payment details. Please check your connection and try again.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Receipt Handlers
  const handleOpenReceiptModal = (appt: ClientAppointment) => {
    setReceiptModalAppt(appt);
  };

  const handleCloseReceiptModal = () => {
    setReceiptModalAppt(null);
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
    } catch {
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
    } catch {
      alert("Failed to update sharing preference.");
    }
  };

  // Delete Note
  const handleDeleteNote = async (id: string) => {
    if (!confirm("Delete this private note?")) return;
    try {
      await deleteDoc(doc(db, "clientNotes", id));
      setNotesList((prev) => prev.filter((n) => n.id !== id));
    } catch {
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
    } catch {
      alert("Failed to update document sharing setting.");
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDoc(doc(db, "clientDocuments", id));
      setDocsList((prev) => prev.filter((d) => d.id !== id));
    } catch {
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

      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: displayName.trim(),
          phone: clientPhone.trim() || null,
          photoURL: photoURL.trim() || null,
        },
        { merge: true }
      );

      await refreshUser();

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
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
        clientPhoto: displayNameChoice !== "anonymous" ? (photoURL || user?.photoURL || null) : null,
        rating,
        comment: reviewComment.trim(),
        approved: false, // Counsellor/admin moderates
        createdAt: serverTimestamp(),
      });
      setReviewSubmitted(true);
      setReviewComment("");
    } catch {
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
      router.push("/");
    } catch (err: any) {
      console.error("Account delete error:", err);
      alert("Could not complete full deletion. If you recently logged in, please re-authenticate and try again.");
    }
  };

  if (authLoading) {
    return (
      <div className="page-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgressLoader
          size={110}
          title={lang === "hi" ? "छात्र डैशबोर्ड लोड हो रहा है..." : "Loading Student Portal..."}
          subtitle={
            lang === "hi"
              ? "परामर्श सत्र और व्यक्तिगत डेटा लोड हो रहा है..."
              : "Syncing consultations & guidance materials..."
          }
        />
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
            className={`dash-nav-item${activeTab === "tasks" ? " active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            ✅ Action Steps ({tasksList.filter((t) => !t.completed).length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "journal" ? " active" : ""}`}
            onClick={() => setActiveTab("journal")}
          >
            🧘 Private Journal ({journalList.length})
          </button>
          <button
            className={`dash-nav-item${activeTab === "resources" ? " active" : ""}`}
            onClick={() => setActiveTab("resources")}
          >
            📚 Resources ({resourcesList.length})
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
          {profile.messagingEnabled && (
            <button
              className={`dash-nav-item${activeTab === "messages" ? " active" : ""}`}
              onClick={() => setActiveTab("messages")}
            >
              💬 {lang === "hi" ? "संदेश" : "Messages"}
            </button>
          )}
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
            👤 Profile &amp; Intake
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
                    <CircularProgressLoader
                      size={84}
                      title="सत्र लोड हो रहे हैं..."
                      subtitle="Fetching scheduled consultations..."
                    />
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
                          <th>Date &amp; Time</th>
                          <th>Session Mode &amp; Access</th>
                          <th>Payment &amp; Receipt</th>
                          <th>Calendar</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appt) => {
                          const withinCutoff = isWithinCutoff(appt);
                          const fee = appt.serviceFee ? Number(appt.serviceFee) : 0;
                          const hasFee = fee > 0;

                          return (
                            <tr key={appt.id}>
                              <td>
                                <strong>{appt.serviceTitle}</strong>
                                {appt.notes && (
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                                    "{appt.notes}"
                                  </div>
                                )}
                                {hasFee ? (
                                  <div style={{ fontSize: "0.75rem", color: "var(--brand-primary)", marginTop: "0.2rem", fontWeight: 600 }}>
                                    Fee: {formatInr(fee)}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                                    {lang === "hi" ? "निःशुल्क सत्र" : "Free Session"}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div><strong>{appt.date}</strong></div>
                                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{appt.timeSlot}</div>
                                {appt.rescheduleRequest?.status === "pending" && (
                                  <div className="badge badge-warning" style={{ marginTop: "0.35rem", fontSize: "0.72rem", display: "inline-block" }}>
                                    ⏳ Reschedule Requested ({appt.rescheduleRequest.requestedDate})
                                  </div>
                                )}
                                {appt.rescheduleRequest?.status === "rejected" && (
                                  <div className="badge badge-error" style={{ marginTop: "0.35rem", fontSize: "0.72rem", display: "inline-block" }}>
                                    ✕ Reschedule request declined
                                  </div>
                                )}
                              </td>
                              <td>
                                <span className="badge badge-primary">{appt.mode}</span>
                                {appt.status === "confirmed" && appt.mode === "Online" && (
                                  <div style={{ marginTop: "0.4rem" }}>
                                    {appt.meetingLink ? (
                                      <a
                                        href={appt.meetingLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-sm btn-primary"
                                        style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem" }}
                                      >
                                        🌐 Join Meeting Call
                                      </a>
                                    ) : (
                                      <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                                        Link will appear before session
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              {/* Payment & Receipt Column */}
                              <td>
                                {!hasFee || appt.paymentStatus === "not_required" ? (
                                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                    {lang === "hi" ? "आवश्यक नहीं" : "Not Required"}
                                  </span>
                                ) : appt.paymentStatus === "verified" ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                    <span className="badge badge-success">✓ Verified &amp; Paid</span>
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                                      onClick={() => handleOpenReceiptModal(appt)}
                                    >
                                      🧾 View Receipt
                                    </button>
                                  </div>
                                ) : appt.paymentStatus === "submitted" ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                    <span className="badge badge-warning">⏳ Verification Pending</span>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                      UTR: <code>{appt.utrNumber}</code>
                                    </div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                      {lang === "hi" ? "काउंसलर द्वारा जांच जारी..." : "Verification in progress..."}
                                    </div>
                                  </div>
                                ) : appt.paymentStatus === "rejected" ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                    <span className="badge badge-error">✕ Rejected</span>
                                    {appt.rejectionReason && (
                                      <div style={{ fontSize: "0.72rem", color: "var(--error)", lineHeight: 1.3 }}>
                                        "{appt.rejectionReason}"
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                                      onClick={() => handleOpenPaymentModal(appt)}
                                    >
                                      🔄 Re-submit Payment
                                    </button>
                                  </div>
                                ) : appt.paymentStatus === "refunded" ? (
                                  <div>
                                    <span className="badge badge-primary">Refunded</span>
                                    {appt.refundAmount && (
                                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                                        Amount: {formatInr(appt.refundAmount)}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                    <span className="badge badge-warning">Payment Pending</span>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                                      onClick={() => handleOpenPaymentModal(appt)}
                                    >
                                      💳 Pay {formatInr(fee)}
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td>
                                {appt.status === "confirmed" ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                    <a
                                      href={createGoogleCalendarUrl({
                                        title: `${appt.serviceTitle} with ${profile.counsellorName || "Counsellor"}`,
                                        description: `Personalized Guidance Consultation. Session Mode: ${appt.mode}. Confidentiality protected.`,
                                        location: appt.mode === "Online" ? (appt.meetingLink || "Online Video") : (profile.address || "Office"),
                                        date: appt.date,
                                        timeSlot: appt.timeSlot,
                                      })}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn btn-outline btn-sm"
                                      style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", whiteSpace: "nowrap" }}
                                    >
                                      📅 Google Cal
                                    </a>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", whiteSpace: "nowrap" }}
                                      onClick={() =>
                                        downloadIcsFile({
                                          title: `${appt.serviceTitle} - Inspiria Careers`,
                                          description: `Personalized guidance consultation. Session Mode: ${appt.mode}`,
                                          location: appt.mode === "Online" ? (appt.meetingLink || "Online Video") : (profile.address || "Office"),
                                          date: appt.date,
                                          timeSlot: appt.timeSlot,
                                        })
                                      }
                                    >
                                      📥 .ics File
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>On confirm</span>
                                )}
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
                                {appt.status !== "cancelled" && appt.status !== "completed" ? (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                    {!withinCutoff ? (
                                      <>
                                        <button
                                          type="button"
                                          className="btn btn-outline btn-sm"
                                          style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                                          onClick={() => handleOpenRescheduleModal(appt)}
                                        >
                                          Reschedule
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-sm"
                                          style={{ color: "var(--error)", fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                                          onClick={() => handleCancelAppointment(appt)}
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                        Within {profile.cancellationCutoffHours || 24}h cutoff
                                      </span>
                                    )}
                                  </div>
                                ) : appt.status === "completed" && profile.feedbackEnabled ? (
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", color: "var(--brand-primary)" }}
                                    onClick={() => setFeedbackModalAppt(appt)}
                                  >
                                    💬 {lang === "hi" ? "फ़ीडबैक दें" : "Feedback"}
                                  </button>
                                ) : (
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Reschedule Modal */}
              {rescheduleModalAppt && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                  }}
                  onClick={() => setRescheduleModalAppt(null)}
                >
                  <div
                    className="card"
                    style={{ maxWidth: "480px", width: "100%", padding: "1.5rem" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--brand-primary)", marginBottom: "0.5rem" }}>
                      📅 Request Reschedule
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                      Current session: {rescheduleModalAppt.date} ({rescheduleModalAppt.timeSlot})
                    </p>

                    {rescheduleError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{rescheduleError}</div>}

                    <form onSubmit={handleSubmitReschedule} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className="form-group">
                        <label className="form-label">New Preferred Date *</label>
                        <input
                          type="date"
                          className="form-input"
                          value={rescheduleDate}
                          min={minRescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">New Preferred Time Slot *</label>
                        <select
                          className="form-select"
                          value={rescheduleSlot}
                          onChange={(e) => setRescheduleSlot(e.target.value)}
                        >
                          <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                          <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
                          <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                          <option value="03:30 PM - 04:30 PM">03:30 PM - 04:30 PM</option>
                          <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Reason for Rescheduling (Optional)</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={rescheduleReason}
                          onChange={(e) => setRescheduleReason(e.target.value)}
                          placeholder="e.g. Schedule conflict with school exams..."
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setRescheduleModalAppt(null)}
                          disabled={rescheduleSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={rescheduleSubmitting}
                        >
                          {rescheduleSubmitting ? "Submitting..." : "Send Request"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Payment Submission Modal */}
              {paymentModalAppt && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                    overflowY: "auto",
                  }}
                  onClick={handleClosePaymentModal}
                >
                  <div
                    className="card"
                    style={{ maxWidth: "560px", width: "100%", padding: "1.75rem", maxHeight: "90vh", overflowY: "auto" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                          💳 {lang === "hi" ? "परामर्श शुल्क भुगतान" : "Consultation Fee Payment"}
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {paymentModalAppt.serviceTitle} ({paymentModalAppt.mode}) • {paymentModalAppt.date}
                        </p>
                      </div>
                      <span className="badge badge-primary" style={{ fontSize: "0.9rem", padding: "0.3rem 0.7rem" }}>
                        {formatInr(paymentModalAppt.serviceFee)}
                      </span>
                    </div>

                    {paymentError && (
                      <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
                        ⚠️ {paymentError}
                      </div>
                    )}

                    {/* QR Code & UPI Transfer Details */}
                    <div
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        padding: "1rem",
                        marginBottom: "1.25rem",
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: profile.paymentQr ? "140px 1fr" : "1fr", gap: "1rem", alignItems: "center" }}>
                        {profile.paymentQr && (
                          <div style={{ textAlign: "center" }}>
                            <img
                              src={profile.paymentQr}
                              alt="Payment QR Code"
                              style={{ width: "130px", height: "130px", objectFit: "contain", background: "#fff", padding: "6px", borderRadius: "8px", border: "1px solid var(--border)" }}
                            />
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                              {lang === "hi" ? "QR स्कैन करें" : "Scan to Pay"}
                            </span>
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                              {lang === "hi" ? "प्राप्तकर्ता का नाम:" : "Payee Name:"}
                            </span>
                            <strong style={{ fontSize: "0.92rem", color: "var(--text)" }}>
                              {profile.payeeName || profile.counsellorName || "Inspiria Careers"}
                            </strong>
                          </div>

                          {profile.upiId ? (
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                                {lang === "hi" ? "UPI ID:" : "UPI ID:"}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                                <code style={{ background: "var(--surface)", padding: "0.3rem 0.6rem", borderRadius: "4px", border: "1px solid var(--border)", fontWeight: 600 }}>
                                  {profile.upiId}
                                </code>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={handleCopyUpi}
                                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                                >
                                  {upiCopied ? "✓ Copied!" : "📋 Copy UPI"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              UPI details will be provided by your counsellor.
                            </div>
                          )}

                          {/* Mobile UPI Deep Link */}
                          {profile.upiId && (
                            <div style={{ marginTop: "0.5rem" }}>
                              <a
                                href={createUpiDeepLink({
                                  upiId: profile.upiId,
                                  payeeName: profile.payeeName || profile.counsellorName || "Counsellor",
                                  amount: Number(paymentModalAppt.serviceFee) || 0,
                                  appointmentId: paymentModalAppt.id,
                                })}
                                className="btn btn-primary btn-sm"
                                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}
                              >
                                📱 {lang === "hi" ? "UPI ऐप से भुगतान करें" : "Pay via UPI App (GPay / PhonePe / Paytm)"}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {profile.refundPolicyText && (
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          ℹ️ <strong>Policy:</strong> {profile.refundPolicyText}
                        </div>
                      )}
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.5 }}>
                      <p style={{ margin: "0 0 0.25rem" }}>
                        <strong>{lang === "hi" ? "भुगतान सत्यापन निर्देश:" : "Payment Verification Steps:"}</strong>
                      </p>
                      <ol style={{ paddingLeft: "1.2rem", margin: "0" }}>
                        <li>{lang === "hi" ? "QR कोड या UPI ऐप से शुल्क का भुगतान पूरा करें।" : "Complete payment using QR code or UPI app."}</li>
                        <li>{lang === "hi" ? "अपने बैंक/ऐप से 12-अंकों का UTR / Transaction No. यहाँ दर्ज करें।" : "Enter the 12-digit UTR / Transaction ID from your banking app."}</li>
                        <li>{lang === "hi" ? "काउंसलर सत्यापन के बाद आपकी अपॉइंटमेंट की पुष्टि की जाएगी।" : "Counsellor will verify and automatically confirm your appointment."}</li>
                      </ol>
                    </div>

                    {/* Payment Submission Form */}
                    <form onSubmit={handleSubmitPayment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {/* Honeypot */}
                      <input
                        type="text"
                        name="client_hp_field"
                        value={paymentHp}
                        onChange={(e) => setPaymentHp(e.target.value)}
                        style={{ display: "none" }}
                        tabIndex={-1}
                        autoComplete="off"
                      />

                      <div className="form-group">
                        <label className="form-label">
                          {lang === "hi" ? "ट्रांजेक्शन / UTR नंबर *" : "Transaction / UTR Number *"}
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={paymentUtr}
                          onChange={(e) => setPaymentUtr(e.target.value.toUpperCase())}
                          onBlur={() => setPaymentUtr((prev) => prev.trim().toUpperCase())}
                          placeholder="e.g. 428910293847 or UPI Ref ID"
                          required
                          style={{ letterSpacing: "1px", fontWeight: 600 }}
                        />
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                          {lang === "hi"
                            ? "आमतौर पर यह 12 अंकों का नंबर होता है जो आपके बैंक एसएमएस या ऐप में दिखता है।"
                            : "Typically a 12-digit reference number found in your UPI app receipt or SMS."}
                        </span>
                      </div>

                      <div className="grid-2" style={{ gap: "1rem" }}>
                        <div className="form-group">
                          <label className="form-label">{lang === "hi" ? "भुगतान की तारीख व समय" : "Payment Date & Time"}</label>
                          <input
                            type="datetime-local"
                            className="form-input"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{lang === "hi" ? "भुगतान राशि (₹)" : "Amount Paid (₹)"}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formatInr(paymentModalAppt.serviceFee)}
                            disabled
                            style={{ opacity: 0.8 }}
                          />
                        </div>
                      </div>

                      {/* Payment Screenshot Upload */}
                      <ImageUploader
                        label={lang === "hi" ? "भुगतान स्क्रीनशॉट (वैकल्पिक)" : "Payment Screenshot (Optional)"}
                        currentValue={paymentScreenshot}
                        onUpload={(url) => setPaymentScreenshot(url)}
                        onRemove={() => setPaymentScreenshot(null)}
                        maxSizeMB={3}
                        helpText="JPG, PNG up to 3 MB (will be compressed)"
                        compact
                      />

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={handleClosePaymentModal}
                          disabled={paymentSubmitting}
                        >
                          {t("cancel", lang)}
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={paymentSubmitting}
                        >
                          {paymentSubmitting
                            ? (lang === "hi" ? "जमा हो रहा है..." : "Submitting...")
                            : (lang === "hi" ? "सत्यापन हेतु भेजें" : "Submit Payment for Verification")}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Downloadable / Printable Receipt Modal */}
              {receiptModalAppt && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.6)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                    overflowY: "auto",
                  }}
                  onClick={handleCloseReceiptModal}
                >
                  <div
                    className="card"
                    style={{
                      maxWidth: "600px",
                      width: "100%",
                      padding: "2rem",
                      background: "#ffffff",
                      color: "#1a1a1a",
                      border: "2px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Receipt Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                      <div>
                        {profile.siteLogo ? (
                          <img
                            src={profile.siteLogo}
                            alt="Logo"
                            style={{ height: "48px", objectFit: "contain", marginBottom: "0.5rem" }}
                          />
                        ) : (
                          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#1a3a8f", margin: "0 0 0.25rem" }}>
                            {profile.siteName || "Inspiria Careers"}
                          </h2>
                        )}
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                          {profile.counsellorName || "Certified Career Counsellor"}
                        </div>
                        {profile.counsellorTitle && (
                          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            {profile.counsellorTitle}
                          </div>
                        )}
                        {profile.address && (
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                            📍 {profile.address}
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ display: "inline-block", background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>
                          PAID &amp; VERIFIED
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.5rem" }}>
                          Receipt No:
                        </div>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a", fontFamily: "monospace" }}>
                          {receiptModalAppt.receiptNumber || generateReceiptNumber(receiptModalAppt.id)}
                        </strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                          Date: {receiptModalAppt.date}
                        </div>
                      </div>
                    </div>

                    {/* Receipt Body Table */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Consultation Fee Details
                      </h4>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                        <tbody>
                          <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.5rem 0", color: "#64748b" }}>Client Name:</td>
                            <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                              {receiptModalAppt.clientName || user?.displayName || "Registered Client"}
                            </td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.5rem 0", color: "#64748b" }}>Client Email:</td>
                            <td style={{ padding: "0.5rem 0", textAlign: "right", color: "#0f172a" }}>
                              {receiptModalAppt.clientEmail || user?.email || "—"}
                            </td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.5rem 0", color: "#64748b" }}>Service Booked:</td>
                            <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                              {receiptModalAppt.serviceTitle}
                            </td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.5rem 0", color: "#64748b" }}>Session Mode:</td>
                            <td style={{ padding: "0.5rem 0", textAlign: "right", color: "#0f172a" }}>
                              {receiptModalAppt.mode}
                            </td>
                          </tr>
                          <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.5rem 0", color: "#64748b" }}>Transaction / UTR ID:</td>
                            <td style={{ padding: "0.5rem 0", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                              {receiptModalAppt.utrNumber || "VERIFIED-UPI"}
                            </td>
                          </tr>
                          <tr style={{ borderBottom: "2px solid #0f172a" }}>
                            <td style={{ padding: "0.75rem 0", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                              Total Amount Paid:
                            </td>
                            <td style={{ padding: "0.75rem 0", textAlign: "right", fontSize: "1.15rem", fontWeight: 800, color: "#1a3a8f" }}>
                              {formatInr(receiptModalAppt.serviceFee)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Receipt Watermark / Computer Generated Disclaimer */}
                    <div style={{ textAlign: "center", borderTop: "1px dashed #cbd5e1", paddingTop: "1rem", marginBottom: "1.5rem" }}>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                        🔒 This is a computer-generated receipt issued by Inspiria Careers. No physical signature is required.
                      </p>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "#94a3b8" }}>
                        For any queries regarding this consultation, please contact {profile.email || "counsellor"}.
                      </p>
                    </div>

                    {/* Modal Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }} className="no-print">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCloseReceiptModal}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => window.print()}
                      >
                        🖨️ Print / Save PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                    <CircularProgressLoader
                      size={84}
                      title="नोट्स लोड हो रहे हैं..."
                      subtitle="Fetching personal guidance notes..."
                    />
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
                    <CircularProgressLoader
                      size={84}
                      title="दस्तावेज़ लोड हो रहे हैं..."
                      subtitle="Fetching uploaded files..."
                    />
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
                    <label className="form-label">{lang === "hi" ? "पूरा नाम *" : "Full Name *"}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={lang === "hi" ? "आपका पूरा नाम" : "Your full name"}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{lang === "hi" ? "फोन नंबर (परामर्श व सूचना हेतु)" : "Phone Number (For guidance & notifications)"}</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {lang === "hi"
                        ? "अपॉइंटमेंट बुकिंग व सूचनाओं के लिए उपयोग किया जाता है।"
                        : "Used for appointment booking autofill and session updates."}
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{lang === "hi" ? "ईमेल पता (केवल पढ़ने योग्य)" : "Email Address (Read-only)"}</label>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ""}
                      disabled
                      style={{ opacity: 0.7 }}
                    />
                  </div>

                  <div className="form-group">
                    <ImageUploader
                      label={lang === "hi" ? "प्रोफ़ाइल फ़ोटो / अवतार" : "Profile Photo / Avatar"}
                      folder="avatars"
                      currentUrl={photoURL}
                      onUploadComplete={(url: string) => setPhotoURL(url)}
                      onRemove={() => setPhotoURL("")}
                      helperText={lang === "hi" ? "अपने फोन या कंप्यूटर से फोटो अपलोड करें (अधिकतम 2 MB)" : "Upload from your computer or phone. Max 2 MB, auto-compressed."}
                      maxSizeMB={2}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile
                      ? (lang === "hi" ? "सहेजा जा रहा है..." : "Saving...")
                      : (lang === "hi" ? "💾 प्रोफ़ाइल अपडेट करें" : "💾 Save Profile Changes")}
                  </button>
                </div>
              </form>

              {/* Confidential Intake Profile & Informed Consent Card */}
              <div className="card" style={{ maxWidth: "560px", marginTop: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--brand-primary)" }}>
                    🔒 {t("intakeProfile", lang)}
                  </h3>
                  <span className="badge badge-success">
                    {intakeProfile?.consentAccepted ? `Consent v${intakeProfile.consentVersion}.0 Active` : "Pending"}
                  </span>
                </div>
                {intakeProfile ? (
                  <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--text-muted)" }}>
                    <div><strong>{t("ageGroup", lang)}:</strong> {intakeProfile.ageGroup}</div>
                    <div><strong>{t("city", lang)}:</strong> {intakeProfile.city}</div>
                    <div><strong>{t("sessionPurpose", lang)}:</strong> {intakeProfile.purpose}</div>
                    <div><strong>{t("emergencyContactName", lang)}:</strong> {intakeProfile.emergencyContactName} ({intakeProfile.emergencyContactPhone})</div>
                    <div><strong>Consent Accepted:</strong> {new Date(intakeProfile.consentAcceptedAt).toLocaleDateString()}</div>
                  </div>
                ) : (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    You have not completed your confidential intake profile yet. It will be required during your first booking.
                  </p>
                )}
                <div style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setIntakeModalOpen(true)}
                  >
                    ✏️ {intakeProfile ? "Update Intake Questionnaire & Consent" : "Complete Intake Questionnaire"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ACTION STEPS & HOMEWORK */}
          {activeTab === "tasks" && (
            <div>
              <div className="dash-header">
                <h1>✅ {t("assignedTasks", lang)}</h1>
                <p>Follow-up exercises, reflection prompts, and action items assigned by your counsellor.</p>
              </div>

              {loadingTasks ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>{t("loading", lang)}</div>
              ) : tasksList.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🌱</div>
                  <h3 style={{ margin: "0 0 0.5rem" }}>No Action Items Currently Assigned</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>
                    Your counsellor will share tailored reflection exercises and homework tasks after your consultation session.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {tasksList.map((task) => (
                    <div
                      key={task.id}
                      className="card"
                      style={{
                        borderLeft: task.completed ? "4px solid #10b981" : "4px solid var(--brand-primary)",
                        opacity: task.completed ? 0.85 : 1,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task)}
                            style={{ marginTop: "0.3rem", width: 18, height: 18, cursor: "pointer" }}
                          />
                          <div>
                            <h3
                              style={{
                                fontSize: "1.05rem",
                                fontWeight: 700,
                                margin: "0 0 0.35rem",
                                textDecoration: task.completed ? "line-through" : "none",
                                color: task.completed ? "var(--text-muted)" : "var(--text-primary)",
                              }}
                            >
                              {task.title}
                            </h3>
                            <p style={{ margin: "0 0 0.5rem", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                              {task.description}
                            </p>
                            {task.dueDate && (
                              <span style={{ fontSize: "0.78rem", color: "var(--brand-primary)", fontWeight: 600 }}>
                                📅 Due: {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`badge ${task.completed ? "badge-success" : "badge-primary"}`}>
                          {task.completed ? "Completed" : "In Progress"}
                        </span>
                      </div>

                      {/* Reflection & Experience */}
                      <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--border)" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.35rem", color: "var(--text-muted)" }}>
                          💭 {t("taskReflection", lang)}:
                        </label>
                        {task.reflection ? (
                          <div style={{ background: "var(--surface-2)", padding: "0.6rem 0.8rem", borderRadius: "6px", fontSize: "0.85rem", fontStyle: "italic", marginBottom: "0.5rem" }}>
                            "{task.reflection}"
                          </div>
                        ) : null}
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input
                            type="text"
                            placeholder="Add your thoughts or reflection on this task..."
                            value={taskReflectionText[task.id] || ""}
                            onChange={(e) => setTaskReflectionText({ ...taskReflectionText, [task.id]: e.target.value })}
                            className="form-input"
                            style={{ fontSize: "0.825rem", padding: "0.45rem 0.65rem" }}
                          />
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleSaveReflection(task.id)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PRIVATE MINDFULNESS & GRATITUDE JOURNAL */}
          {activeTab === "journal" && (
            <div>
              <div className="dash-header">
                <h1>🧘 {t("gratitudeJournal", lang)}</h1>
                <p>A secure space to record thoughts, track daily mood, and reflect on moments of gratitude.</p>
              </div>

              {/* Confidentiality Notice */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "0.85rem 1.25rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "#166534" }}>
                🔒 <strong>100% Client-Private:</strong> {t("journalConfidentialNotice", lang)}
              </div>

              {/* New Entry Form */}
              <form onSubmit={handleAddJournalEntry} className="card" style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 1rem", color: "var(--brand-primary)" }}>
                  ✍️ Add New Journal Reflection
                </h3>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                    {t("howAreYouFeeling", lang)}
                  </label>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {[
                      { val: 1, label: "😔 Struggling" },
                      { val: 2, label: "😕 Low" },
                      { val: 3, label: "😐 Neutral" },
                      { val: 4, label: "🙂 Good" },
                      { val: 5, label: "🌟 Great" },
                    ].map((m) => (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => setJournalMood(m.val)}
                        style={{
                          padding: "0.45rem 0.85rem",
                          borderRadius: "999px",
                          border: journalMood === m.val ? "2px solid var(--brand-primary)" : "1px solid var(--border)",
                          background: journalMood === m.val ? "rgba(26, 58, 143, 0.1)" : "transparent",
                          fontWeight: journalMood === m.val ? 700 : 500,
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">{t("gratitudePrompt", lang)}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={journalGratitude}
                    onChange={(e) => setJournalGratitude(e.target.value)}
                    placeholder="e.g. A morning conversation with my friend, finishing my study targets..."
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label">{t("reflectionPrompt", lang)}</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={journalReflection}
                    onChange={(e) => setJournalReflection(e.target.value)}
                    placeholder="Write freely about your thoughts, emotions, challenges, or breakthroughs..."
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", color: "var(--text-muted)" }}>
                    <input
                      type="checkbox"
                      checked={journalShared}
                      onChange={(e) => setJournalShared(e.target.checked)}
                    />
                    🤝 {t("shareWithCounsellorPrompt", lang)}
                  </label>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={journalSaving || (!journalReflection.trim() && !journalGratitude.trim())}
                  >
                    {journalSaving ? t("loading", lang) : `💾 ${t("save", lang)}`}
                  </button>
                </div>
              </form>

              {/* Journal Entries List */}
              {loadingJournal ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>{t("loading", lang)}</div>
              ) : journalList.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                  No journal entries yet. Take a moment to capture your thoughts above.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {journalList.map((entry) => (
                    <div key={entry.id} className="card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "1.1rem" }}>
                            {entry.mood === 5 ? "🌟" : entry.mood === 4 ? "🙂" : entry.mood === 3 ? "😐" : entry.mood === 2 ? "😕" : "😔"}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{entry.moodLabel}</span>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>• {new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {entry.sharedWithCounsellor && (
                            <span className="badge badge-primary" style={{ fontSize: "0.7rem" }}>
                              🤝 Shared with Counsellor
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteJournalEntry(entry.id)}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--error)", fontSize: "0.85rem" }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {entry.gratitude && (
                        <div style={{ fontSize: "0.88rem", marginBottom: "0.5rem", color: "#15803d" }}>
                          🙏 <strong>Gratitude:</strong> {entry.gratitude}
                        </div>
                      )}

                      {entry.reflection && (
                        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {entry.reflection}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: EDUCATIONAL RESOURCES */}
          {activeTab === "resources" && (
            <div>
              <div className="dash-header">
                <h1>📚 {t("resources", lang)}</h1>
                <p>Curated worksheets, mindfulness guides, career handouts, and articles from your counsellor.</p>
              </div>

              {loadingResources ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>{t("loading", lang)}</div>
              ) : resourcesList.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📖</div>
                  <h3>No Resources Added Yet</h3>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>Recommended guides and worksheets will appear here soon.</p>
                </div>
              ) : (
                <div className="grid-2" style={{ gap: "1.25rem" }}>
                  {resourcesList.map((res) => (
                    <div key={res.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span className="badge badge-primary" style={{ textTransform: "capitalize" }}>
                            {res.category.replace("_", " ")}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                            {res.type}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
                          {res.title}
                        </h3>
                        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: "0 0 1rem", lineHeight: 1.5 }}>
                          {res.description}
                        </p>
                      </div>

                      <div>
                        {res.url ? (
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ display: "inline-block" }}
                          >
                            🔗 View / Download Resource
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

                {/* DPDPA 2023 Formal Deletion Request Card */}
                <div className="card" style={{ border: "1.5px solid #d97706" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d97706", marginBottom: "0.5rem" }}>
                    📜 {t("requestDataDeletion", lang)}
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                    Under the Digital Personal Data Protection Act (DPDPA 2023), you have the right to request erasure of your personal data held across appointments, intake responses, and uploaded records.
                  </p>
                  {deletionStatus === "requested" ? (
                    <div style={{ background: "#ecfdf5", border: "1px solid #34d399", padding: "0.75rem 1rem", borderRadius: "8px", color: "#065f46", fontSize: "0.85rem" }}>
                      ✓ {t("deletionRequestedNotice", lang)}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleRequestDeletion}
                      disabled={deletionStatus === "submitting"}
                    >
                      {deletionStatus === "submitting" ? t("loading", lang) : `📩 Submit Deletion Request`}
                    </button>
                  )}
                </div>

                {/* Communication & Reminder Preferences (Phase 6 Part C) */}
                {profile.smsRemindersEnabled && (
                  <div className="card" style={{ border: "1.5px solid var(--brand-secondary, #2563eb)" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-secondary, #2563eb)", marginBottom: "0.5rem" }}>
                      📱 {lang === "hi" ? "व्हाट्सएप / एसएमएस स्मरण (Reminders)" : "WhatsApp / SMS Reminders"}
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.6 }}>
                      {lang === "hi"
                        ? "अपॉइंटमेंट से 24 घंटे पहले स्वतः सूचना प्राप्त करें। कोई स्पैम या प्रचारक संदेश नहीं।"
                        : "Receive an automated reminder 24 hours prior to scheduled consultation. Strictly transactional."}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={reminderPref?.optedIn ?? false}
                          disabled={savingReminderPref}
                          onChange={(e) => handleToggleReminder(e.target.checked)}
                        />
                        {lang === "hi" ? "मुझे सत्र के स्मरण संदेश भेजें" : "Send me appointment reminders"}
                      </label>

                      {reminderPref?.optedIn && (
                        <div style={{ display: "flex", gap: "1.25rem", paddingLeft: "1.5rem" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontSize: "0.85rem" }}>
                            <input
                              type="radio"
                              name="channel"
                              value="whatsapp"
                              checked={reminderPref.preferredChannel === "whatsapp"}
                              onChange={() => handleToggleReminder(true, "whatsapp")}
                            />
                            💬 WhatsApp
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontSize: "0.85rem" }}>
                            <input
                              type="radio"
                              name="channel"
                              value="sms"
                              checked={reminderPref.preferredChannel === "sms"}
                              onChange={() => handleToggleReminder(true, "sms")}
                            />
                            ✉️ SMS
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Right to Erasure Immediate Account Deletion */}
                <div className="card" style={{ border: "1.5px solid var(--error)" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--error)", marginBottom: "0.5rem" }}>
                    ⚠️ Right to Erasure (Delete Account &amp; Data Immediately)
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

          {/* TAB 7: MESSAGES (Phase 6 Part A) */}
          {activeTab === "messages" && profile.messagingEnabled && user && (
            <div>
              <div className="dash-header">
                <h1>💬 {lang === "hi" ? "काउंसलर से संदेश" : "Messages with Counsellor"}</h1>
                <p>
                  {lang === "hi"
                    ? "निजी, सुरक्षित व गोपनीय संदेश। आपात स्थिति में हेल्पलाइन का उपयोग करें।"
                    : "Private and confidential asynchronous messages with your counsellor."}
                </p>
              </div>
              <div className="card" style={{ padding: "1.25rem", maxWidth: 800 }}>
                <MessagingPanel clientId={user.uid} viewerRole="client" />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Intake & Consent Modal */}
      <IntakeModal
        isOpen={intakeModalOpen}
        onClose={() => setIntakeModalOpen(false)}
        onSuccess={loadIntake}
      />

      {/* Session Feedback Modal (Phase 6 Part E) */}
      {feedbackModalAppt && (
        <SessionFeedbackModal
          appointmentId={feedbackModalAppt.id}
          serviceTitle={feedbackModalAppt.serviceTitle}
          onClose={() => setFeedbackModalAppt(null)}
        />
      )}
    </div>
  );
}

