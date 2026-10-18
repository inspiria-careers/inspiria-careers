// src/app/api/newsletter/subscribe/route.ts
// Newsletter subscribe API — Phase 6 Part F
// Creates a subscriber record with a random confirmation token.
// No paid third-party connected yet. Currently logs in dry-run mode.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, limit } from "firebase/firestore";
import crypto from "crypto";

function generateToken(len = 32): string {
  return crypto.randomBytes(len).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = (body.email || "").toLowerCase().trim();
    const name: string = (body.name || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Check if already subscribed
    const q = query(
      collection(db, "subscribers"),
      where("email", "==", email),
      where("active", "==", true),
      limit(1)
    );
    const existing = await getDocs(q);

    if (!existing.empty) {
      // Already subscribed — silently succeed (no info leak)
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }

    const confirmationToken = generateToken();
    const unsubscribeToken = generateToken();

    await addDoc(collection(db, "subscribers"), {
      email,
      name: name || null,
      confirmed: false,
      confirmationToken,
      unsubscribeToken,
      subscribedAt: new Date().toISOString(),
      confirmedAt: null,
      unsubscribedAt: null,
      active: false, // becomes true after email confirmation
    });

    // DRY-RUN: Log confirmation link — no email sent yet
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const confirmUrl = `${baseUrl}/api/newsletter/confirm?token=${confirmationToken}`;
    console.log(`[Newsletter DRY-RUN] Confirmation URL for ${email}: ${confirmUrl}`);
    // FUTURE: send confirmation email via Resend/EmailJS with confirmUrl
    // Message content must include unsubscribe link.

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Newsletter] subscribe error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
