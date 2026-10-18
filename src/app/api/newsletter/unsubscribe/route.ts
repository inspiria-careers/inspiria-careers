// src/app/api/newsletter/unsubscribe/route.ts
// Newsletter unsubscribe — one-click link in every email

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, limit } from "firebase/firestore";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  try {
    const q = query(
      collection(db, "subscribers"),
      where("unsubscribeToken", "==", token),
      limit(1)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return new NextResponse("Subscriber not found.", { status: 404 });
    }

    const docSnap = snap.docs[0];
    await updateDoc(doc(db, "subscribers", docSnap.id), {
      active: false,
      confirmed: false,
      unsubscribedAt: new Date().toISOString(),
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/?unsubscribed=1`);
  } catch (err) {
    console.error("[Newsletter] unsubscribe error:", err);
    return new NextResponse("Server error.", { status: 500 });
  }
}
