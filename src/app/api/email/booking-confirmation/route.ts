// src/app/api/email/booking-confirmation/route.ts
// Appointment Email Notification Service — Transactional notifications for booking lifecycle
// Safe bilingual templates strictly omitting sensitive clinical session notes.
// Connects automatically to Resend when RESEND_API_KEY is provided in .env.local;
// falls back to safe dry-run console logging when running in development/without keys.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  getBookingReceivedEmail,
  getBookingConfirmedEmail,
  getBookingCancelledEmail,
  getBookingRescheduledEmail,
  EmailData,
} from "@/lib/emailTemplates";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      appointmentId,
      clientName,
      clientEmail,
      serviceTitle,
      date,
      timeSlot,
      mode = "Online",
      meetingLink,
      officeAddress,
      counsellorName,
      type = "booking_received",
    } = body;

    // Validate email
    const trimmedEmail = (clientEmail || "").trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Valid client email is required" },
        { status: 400 }
      );
    }

    const emailData: EmailData = {
      clientName: clientName?.trim() || "Valued Client",
      serviceTitle: serviceTitle || "Career Guidance Consultation",
      counsellorName,
      date: date || "",
      timeSlot: timeSlot || "",
      mode,
      meetingLink,
      officeAddress,
    };

    // Determine appropriate bilingual template
    let emailContent: { subject: string; text: string };
    if (type === "booking_confirmed") {
      emailContent = getBookingConfirmedEmail(emailData);
    } else if (type === "booking_cancelled") {
      emailContent = getBookingCancelledEmail(emailData);
    } else if (type === "booking_rescheduled") {
      emailContent = getBookingRescheduledEmail(emailData);
    } else {
      emailContent = getBookingReceivedEmail(emailData);
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom =
      process.env.EMAIL_FROM || "Inspiria Careers <onboarding@resend.dev>";

    let dispatchMode: "live" | "dry-run" = "dry-run";

    if (resendApiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [trimmedEmail],
            subject: emailContent.subject,
            text: emailContent.text,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="margin-bottom: 20px; border-bottom: 2px solid #1a3a8f; padding-bottom: 12px;">
                  <h2 style="color: #1a3a8f; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">Inspiria Careers</h2>
                  <p style="color: #64748b; margin: 4px 0 0; font-size: 13px;">Career Guidance &amp; Psychological Counselling</p>
                </div>
                <div style="color: #1e293b; font-size: 15px; line-height: 1.6; white-space: pre-line;">
                  ${emailContent.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                </div>
                <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
                  This is an automated notification from Inspiria Careers. Please do not reply directly to this email.
                </div>
              </div>
            `,
          }),
        });

        if (res.ok) {
          dispatchMode = "live";
        } else {
          const errText = await res.text();
          console.warn("[Resend API Error]:", errText);
          dispatchMode = "dry-run";
        }
      } catch (sendErr) {
        console.warn("[Email Send Error - Falling back to dry-run]:", sendErr);
        dispatchMode = "dry-run";
      }
    } else {
      // Dry-run logging for development / zero-cost setup
      console.log(
        `[EMAIL NOTIFICATION DRY-RUN] Mode: ${dispatchMode} | To: ${trimmedEmail} | Subject: "${emailContent.subject}"`
      );
    }

    // Record timestamp on appointment doc if ID provided
    if (appointmentId) {
      updateDoc(doc(db, "appointments", appointmentId), {
        confirmationEmailSent: true,
        confirmationEmailSentAt: serverTimestamp(),
        confirmationEmailType: type,
        confirmationEmailMode: dispatchMode,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      mode: dispatchMode,
      recipient: trimmedEmail,
      subject: emailContent.subject,
      appointmentId: appointmentId || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Booking email dispatch error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch email", details: error?.message },
      { status: 500 }
    );
  }
}
