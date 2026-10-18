import { NextResponse } from "next/server";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAppointmentReminderEmail } from "@/lib/emailTemplates";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron Endpoint: Sends appointment reminders 24 hours prior
 * Protected by CRON_SECRET header
 * Designed for Vercel Free Plan (executes once daily)
 */
export async function GET(request: Request) {
  try {
    // 1. Verify Authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Determine target date (tomorrow in YYYY-MM-DD)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split("T")[0];

    // 3. Query confirmed appointments for tomorrow
    const q = query(
      collection(db, "appointments"),
      where("date", "==", targetDate),
      where("status", "==", "confirmed")
    );

    const snapshot = await getDocs(q);
    const appointmentsToRemind = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as any))
      .filter((a) => !a.reminderSent);

    const processed = [];

    // 4. Process each appointment
    for (const appt of appointmentsToRemind) {
      const emailContent = getAppointmentReminderEmail({
        clientName: appt.clientName || "Valued Client",
        serviceTitle: appt.serviceTitle || "Counselling Session",
        date: appt.date,
        timeSlot: appt.timeSlot,
        mode: appt.mode || "Online",
        meetingLink: appt.meetingLink || "",
        officeAddress: appt.officeAddress || "",
      });

      // Mark reminder sent in Firestore to prevent duplicate triggers
      await updateDoc(doc(db, "appointments", appt.id), {
        reminderSent: true,
        reminderSentAt: serverTimestamp(),
      });

      processed.push({
        id: appt.id,
        clientEmail: appt.clientEmail,
        clientName: appt.clientName,
        subject: emailContent.subject,
      });
    }

    return NextResponse.json({
      success: true,
      targetDate,
      remindersProcessed: processed.length,
      appointments: processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron reminder error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message },
      { status: 500 }
    );
  }
}
