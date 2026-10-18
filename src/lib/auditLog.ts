import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface AuditLogEntry {
  actorUid: string;
  actorEmail: string | null;
  actorRole: string;
  action: string;
  details: string;
  targetId?: string;
  timestamp?: any;
}

/**
 * Record a security or administrative action to the auditLogs collection
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "timestamp">) {
  try {
    await addDoc(collection(db, "auditLogs"), {
      ...entry,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    // Audit logging should not crash user operations, but log warning
    console.warn("Audit log write error:", err);
  }
}
