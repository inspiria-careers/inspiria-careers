// src/app/api/newsletter/confirm/route.ts
// Newsletter email confirmation — double opt-in

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, limit } from "firebase/firestore";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Invalid confirmation link.", { status: 400 });
  }

  try {
    const q = query(
      collection(db, "subscribers"),
      where("confirmationToken", "==", token),
      limit(1)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return new NextResponse("This link is invalid or already used.", { status: 404 });
    }

    const docSnap = snap.docs[0];
    await updateDoc(doc(db, "subscribers", docSnap.id), {
      confirmed: true,
      active: true,
      confirmedAt: new Date().toISOString(),
      confirmationToken: "", // consume token
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/?subscribed=1`);
  } catch (err) {
    console.error("[Newsletter] confirm error:", err);
    return new NextResponse("Server error.", { status: 500 });
  }
}
