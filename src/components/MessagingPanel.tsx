"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSite } from "@/contexts/SiteContext";
import { t } from "@/translations";
import type { ThreadMessage } from "@/types";

const EDIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface MessagingPanelProps {
  /** For client view: pass client's own userId.
   *  For counsellor view: pass the clientId of the thread to open. */
  clientId: string;
  clientName?: string;
  /** "client" | "counsellor" — who is viewing */
  viewerRole: "client" | "counsellor";
}

export default function MessagingPanel({
  clientId,
  clientName,
  viewerRole,
}: MessagingPanelProps) {
  const { user } = useAuth();
  const { profile, lang } = useSite();

  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rateLimitHit, setRateLimitHit] = useState(false);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);

  // Real-time listener on the subcollection: threads/{clientId}/messages
  useEffect(() => {
    if (!clientId) return;
    const q = query(
      collection(db, "threads", clientId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ThreadMessage));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [clientId]);

  // Simple client-side rate limit: max 5 messages per 60 seconds
  const sentTimestamps = useRef<number[]>([]);
  function checkRateLimit(): boolean {
    const now = Date.now();
    sentTimestamps.current = sentTimestamps.current.filter(
      (ts) => now - ts < 60_000
    );
    if (sentTimestamps.current.length >= 5) {
      setRateLimitHit(true);
      setTimeout(() => setRateLimitHit(false), 15_000);
      return false;
    }
    sentTimestamps.current.push(now);
    return true;
  }

  async function handleSend() {
    if (!text.trim() && !attachment) return;
    if (!user || !clientId) return;
    if (!checkRateLimit()) return;

    setSending(true);
    try {
      let attachmentUrl: string | undefined;
      let attachmentName: string | undefined;
      let attachmentType: string | undefined;

      if (attachment) {
        setUploading(true);
        const storageRef = ref(
          storage,
          `messages/${clientId}/${Date.now()}_${attachment.name}`
        );
        await uploadBytes(storageRef, attachment);
        attachmentUrl = await getDownloadURL(storageRef);
        attachmentName = attachment.name;
        attachmentType = attachment.type;
        setUploading(false);
        setAttachment(null);
      }

      const msg: Omit<ThreadMessage, "id"> = {
        threadId: clientId,
        senderId: user.uid,
        senderRole: viewerRole,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        deleted: false,
        ...(attachmentUrl ? { attachmentUrl, attachmentName, attachmentType } : {}),
      };

      await addDoc(collection(db, "threads", clientId, "messages"), {
        ...msg,
        createdAt: serverTimestamp(),
      });

      // Update thread metadata (unread count for the other party)
      const unreadField =
        viewerRole === "client" ? "unreadByCounsellor" : "unreadByClient";
      await updateDoc(doc(db, "threads", clientId), {
        lastMessageAt: serverTimestamp(),
        lastSenderRole: viewerRole,
        [unreadField]: true,
        archived: false,
      }).catch(() => {
        // Thread doc may not exist yet; create it
        return addDoc(collection(db, "threads"), {
          clientId,
          clientName: clientName || user.displayName || "Client",
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
          lastSenderRole: viewerRole,
          [unreadField]: true,
          archived: false,
        });
      });

      setText("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert(lang === "hi" ? "संदेश नहीं भेजा जा सका।" : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  async function handleSoftDelete(msgId: string) {
    if (!confirm(lang === "hi" ? "यह संदेश हटाना चाहते हैं?" : "Delete this message?")) return;
    await updateDoc(doc(db, "threads", clientId, "messages", msgId), {
      deleted: true,
      deletedAt: new Date().toISOString(),
      text: "",
      attachmentUrl: null,
    });
  }

  async function handleSaveEdit(msgId: string) {
    if (!editText.trim()) return;
    await updateDoc(doc(db, "threads", clientId, "messages", msgId), {
      text: editText.trim(),
      editedAt: new Date().toISOString(),
    });
    setEditingId(null);
  }

  async function markAsRead() {
    if (!clientId) return;
    const field =
      viewerRole === "client" ? "unreadByClient" : "unreadByCounsellor";
    await updateDoc(doc(db, "threads", clientId), { [field]: false }).catch(() => {});
  }

  // Mark as read when panel mounts / messages update
  useEffect(() => {
    if (messages.length > 0) markAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  function canEditOrDelete(msg: ThreadMessage): boolean {
    if (!user || msg.senderId !== user.uid || !currentTime) return false;
    const age = currentTime - new Date(msg.createdAt).getTime();
    return age <= EDIT_WINDOW_MS;
  }

  const responseTimeText =
    profile.messagingResponseTimeText || "1-2 working days";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 400 }}>
      {/* ── Emergency / Async Disclaimer Banner ── */}
      <div
        style={{
          background: "#fef3cd",
          border: "1px solid #fcd34d",
          borderRadius: 8,
          padding: "0.65rem 1rem",
          marginBottom: "0.75rem",
          fontSize: "0.82rem",
          color: "#92400e",
          lineHeight: 1.5,
        }}
      >
        ⚠️{" "}
        {lang === "hi"
          ? `यह सेवा आपातकालीन स्थिति के लिए नहीं है। काउंसलर का जवाब ${responseTimeText} के भीतर आ सकता है।`
          : `This is not for emergencies. Counsellor typically responds within ${responseTimeText}.`}{" "}
        <a href="/emergency" style={{ fontWeight: 700, color: "#b45309" }}>
          {lang === "hi" ? "तुरंत सहायता →" : "Get Immediate Help →"}
        </a>
      </div>

      {/* ── Messages List ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid var(--border-color)",
          borderRadius: 10,
          padding: "1rem",
          background: "var(--card-bg, #f9fafb)",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          marginBottom: "0.75rem",
          minHeight: 220,
          maxHeight: 420,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "3rem", fontSize: "0.9rem" }}>
            {lang === "hi" ? "अभी कोई संदेश नहीं। पहले संदेश भेजें।" : "No messages yet. Send the first message."}
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === user?.uid;
          const isDeleted = msg.deleted;
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMine ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "78%",
                  padding: "0.55rem 0.85rem",
                  borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: isMine ? "var(--brand-primary, #1a3a8f)" : "#e5e7eb",
                  color: isMine ? "#fff" : "#1f2937",
                  fontSize: "0.88rem",
                  lineHeight: 1.5,
                  fontStyle: isDeleted ? "italic" : "normal",
                  opacity: isDeleted ? 0.6 : 1,
                }}
              >
                {isDeleted ? (
                  <span>
                    🚫 {lang === "hi" ? "संदेश हटा दिया गया" : "Message deleted"}
                  </span>
                ) : editingId === msg.id ? (
                  <div style={{ display: "flex", gap: "0.4rem", flexDirection: "column" }}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      style={{ fontSize: "0.85rem", borderRadius: 6, padding: "0.3rem", width: "100%" }}
                    />
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => handleSaveEdit(msg.id)} className="btn btn-primary btn-sm" style={{ fontSize: "0.75rem" }}>
                        {lang === "hi" ? "सहेजें" : "Save"}
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn btn-outline btn-sm" style={{ fontSize: "0.75rem" }}>
                        {t("cancel", lang)}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span>{msg.text}</span>
                    {msg.attachmentUrl && (
                      <div style={{ marginTop: "0.35rem" }}>
                        {msg.attachmentType?.startsWith("image/") ? (
                          <img
                            src={msg.attachmentUrl}
                            alt={msg.attachmentName || "attachment"}
                            style={{ maxWidth: 180, borderRadius: 6, display: "block" }}
                          />
                        ) : (
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: isMine ? "#bfdbfe" : "#1d4ed8", fontSize: "0.8rem" }}
                          >
                            📎 {msg.attachmentName || "Attachment"}
                          </a>
                        )}
                      </div>
                    )}
                    {msg.editedAt && (
                      <span style={{ fontSize: "0.7rem", opacity: 0.6, display: "block", marginTop: 2 }}>
                        {lang === "hi" ? "संपादित" : "edited"}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2, display: "flex", gap: "0.5rem" }}>
                <span>
                  {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {canEditOrDelete(msg) && !isDeleted && editingId !== msg.id && (
                  <>
                    <button
                      onClick={() => { setEditingId(msg.id); setEditText(msg.text); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.7rem", padding: 0 }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleSoftDelete(msg.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.7rem", padding: 0 }}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Compose Area ── */}
      {rateLimitHit && (
        <div style={{ fontSize: "0.8rem", color: "#ef4444", marginBottom: "0.4rem" }}>
          ⚠️ {lang === "hi" ? "बहुत जल्दी संदेश भेज रहे हैं। थोड़ा रुकें।" : "Too many messages. Please wait a moment."}
        </div>
      )}
      {attachment && (
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.35rem", display: "flex", gap: "0.4rem", alignItems: "center" }}>
          📎 {attachment.name}
          <button onClick={() => setAttachment(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>✕</button>
        </div>
      )}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={2}
          placeholder={lang === "hi" ? "संदेश लिखें... (Shift+Enter = नई लाइन)" : "Write a message... (Shift+Enter = new line)"}
          style={{
            flex: 1,
            padding: "0.6rem 0.8rem",
            borderRadius: 10,
            border: "1px solid var(--border-color)",
            fontSize: "0.88rem",
            resize: "none",
            background: "var(--card-bg, #ffffff)",
          }}
          maxLength={2000}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title={lang === "hi" ? "फ़ाइल जोड़ें (PDF/JPG/PNG, 5MB तक)" : "Attach file (PDF/JPG/PNG, up to 5MB)"}
            style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "0.45rem 0.65rem", cursor: "pointer", fontSize: "1rem" }}
          >
            📎
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || uploading || (!text.trim() && !attachment)}
            className="btn btn-primary btn-sm"
            style={{ padding: "0.45rem 0.85rem" }}
          >
            {sending || uploading ? "..." : lang === "hi" ? "भेजें" : "Send"}
          </button>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 5 * 1024 * 1024) {
            alert(lang === "hi" ? "फ़ाइल 5MB से बड़ी नहीं होनी चाहिए।" : "File must be under 5MB.");
            return;
          }
          setAttachment(f);
          e.target.value = "";
        }}
      />
      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
        🔒 {lang === "hi"
          ? "संदेश Firestore में सुरक्षित संग्रहीत हैं। यह एंड-टू-एंड एन्क्रिप्टेड नहीं है। विवरण के लिए गोपनीयता नीति देखें।"
          : "Messages are stored securely in Firestore. This is not end-to-end encrypted. See Privacy Policy for details."}
      </div>
    </div>
  );
}
