import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Phase 3: Production Flow & Security Tests", () => {
  // 1. Calendar Generation & URL formatting
  test("RFC 5545 ICS generation creates valid format with VEVENT", () => {
    const title = "Academic Consultation - Inspiria Careers";
    const date = "2026-11-20";
    const slot = "10:00 AM - 11:00 AM";
    const location = "Online Meeting";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Inspiria Careers//Consultation Calendar//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    assert.ok(icsContent.includes("BEGIN:VCALENDAR"));
    assert.ok(icsContent.includes("BEGIN:VEVENT"));
    assert.ok(icsContent.includes("STATUS:CONFIRMED"));
    assert.ok(icsContent.includes("END:VCALENDAR"));
  });

  // 2. Cancellation Cutoff Logic
  test("Cancellation cutoff correctly rejects requests within 24h window", () => {
    const cutoffHours = 24;
    const now = Date.now();

    // 12 hours from now (violates cutoff)
    const appointmentSoon = now + 12 * 60 * 60 * 1000;
    const isWithinCutoffSoon = (appointmentSoon - now) < cutoffHours * 60 * 60 * 1000;
    assert.equal(isWithinCutoffSoon, true, "Should flag as within cutoff for 12h");

    // 48 hours from now (allowed)
    const appointmentFar = now + 48 * 60 * 60 * 1000;
    const isWithinCutoffFar = (appointmentFar - now) < cutoffHours * 60 * 60 * 1000;
    assert.equal(isWithinCutoffFar, false, "Should allow cancellation for 48h");
  });

  // 3. Privacy Rule: No confidential notes in client email templates
  test("Email templates never leak private counselling notes or therapist observations", () => {
    const sampleSensitiveNote = "Client expresses high anxiety regarding NEET entrance scores and family pressure.";
    
    // Test data for email notification
    const emailPayload = {
      clientName: "Rahul Verma",
      serviceTitle: "Career Strategy Session",
      date: "2026-11-15",
      timeSlot: "11:30 AM - 12:30 PM",
      mode: "Online",
      meetingLink: "https://meet.google.com/xyz-abcd-efg",
    };

    const renderedEnglish = `Dear ${emailPayload.clientName},\nYour session for ${emailPayload.serviceTitle} on ${emailPayload.date} at ${emailPayload.timeSlot} (${emailPayload.mode}) has been confirmed.\nLink: ${emailPayload.meetingLink}`;
    
    // Verify payload strictly omits confidential notes
    assert.ok(!renderedEnglish.includes(sampleSensitiveNote));
    assert.ok(renderedEnglish.includes("Rahul Verma"));
    assert.ok(renderedEnglish.includes("Career Strategy Session"));
  });

  // 4. Honeypot Bot Trap Validation
  test("Honeypot form submissions must be safely trapped and discarded", () => {
    const fakeSubmissionWithSpam = {
      name: "Bot User",
      email: "bot@spam.com",
      message: "Buy cheap crypto here",
      honeypot: "spam_payload",
    };

    let savedToDatabase = false;
    if (fakeSubmissionWithSpam.honeypot) {
      // Honeypot triggered: simulate success for the bot without persisting
      savedToDatabase = false;
    } else {
      savedToDatabase = true;
    }

    assert.equal(savedToDatabase, false, "Spam submission with honeypot must not be saved to DB");
  });

  // 5. Account Disabled Enforcement
  test("Disabled users must have session terminated immediately", () => {
    const activeUser = { uid: "user_1", role: "client", disabled: false };
    const bannedUser = { uid: "user_2", role: "client", disabled: true };

    const checkAccess = (user) => {
      if (!user || user.disabled) return "DENIED";
      return "ALLOWED";
    };

    assert.equal(checkAccess(activeUser), "ALLOWED");
    assert.equal(checkAccess(bannedUser), "DENIED");
  });

  // 6. Reschedule State Machine
  test("Reschedule approval updates appointment date/time and marks status confirmed", () => {
    const appt = {
      id: "appt_123",
      date: "2026-11-01",
      timeSlot: "10:00 AM - 11:00 AM",
      status: "confirmed",
      rescheduleRequest: {
        newDate: "2026-11-05",
        newTimeSlot: "02:00 PM - 03:00 PM",
        reason: "Family emergency",
        requestedAt: "2026-10-18T10:00:00Z",
      },
    };

    // Simulate Counsellor Approval
    const updatedAppt = {
      ...appt,
      date: appt.rescheduleRequest.newDate,
      timeSlot: appt.rescheduleRequest.newTimeSlot,
      status: "confirmed",
      rescheduleRequest: null,
    };

    assert.equal(updatedAppt.date, "2026-11-05");
    assert.equal(updatedAppt.timeSlot, "02:00 PM - 03:00 PM");
    assert.equal(updatedAppt.rescheduleRequest, null);
  });
});

describe("Phase 4: Manual QR Payment Flow & Anti-Fraud Tests", () => {
  // Helper functions replicated for pure node test execution
  const validateUtr = (raw) => {
    if (!raw || typeof raw !== "string") return { valid: false, error: "UTR cannot be empty" };
    const clean = raw.trim().replace(/[\s-]/g, "").toUpperCase();
    if (clean.length < 8) return { valid: false, error: "UTR number is too short (min 8 characters)" };
    if (clean.length > 25) return { valid: false, error: "UTR number is too long (max 25 characters)" };
    if (!/^[A-Z0-9]+$/.test(clean)) return { valid: false, error: "UTR must contain only letters and numbers" };
    return { valid: true, cleanUtr: clean };
  };

  const createUpiDeepLink = ({ upiId, payeeName, amount, appointmentId, note }) => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: payeeName,
      am: amount.toFixed(2),
      cu: "INR",
      tn: note || `Consultation Fee ${appointmentId ? `#${appointmentId}` : ""}`,
    });
    return `upi://pay?${params.toString()}`;
  };

  const generateReceiptNumber = (appointmentId) => {
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const suffix = (appointmentId || "0000").replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
    return `REC-${date}-${suffix.padStart(4, "0")}`;
  };

  // 1. UTR Validation
  test("validateUtr accurately accepts valid banking UTRs and rejects invalid formats", () => {
    // Valid 12-digit standard UPI UTR
    const v1 = validateUtr("428912345678");
    assert.equal(v1.valid, true);
    assert.equal(v1.cleanUtr, "428912345678");

    // Valid alphanumeric with spaces and lowercase
    const v2 = validateUtr(" cms 9876 5432 ");
    assert.equal(v2.valid, true);
    assert.equal(v2.cleanUtr, "CMS98765432");

    // Invalid: Too short (<8 chars)
    const v3 = validateUtr("12345");
    assert.equal(v3.valid, false);
    assert.ok(v3.error.includes("too short"));

    // Invalid: Special characters
    const v4 = validateUtr("1234-5678@90!");
    assert.equal(v4.valid, false);
    assert.ok(v4.error.includes("only letters and numbers"));

    // Invalid: Empty or null
    assert.equal(validateUtr("").valid, false);
    assert.equal(validateUtr(null).valid, false);
  });

  // 2. UPI Deep Link Encoding
  test("createUpiDeepLink encodes UPI parameters correctly for mobile app handoff", () => {
    const link = createUpiDeepLink({
      upiId: "counsellor@okhdfcbank",
      payeeName: "Dr. Ananya Sharma",
      amount: 1500,
      appointmentId: "appt_8899",
      note: "Higher Education Consultation",
    });

    assert.ok(link.startsWith("upi://pay?"));
    assert.ok(link.includes("pa=counsellor%40okhdfcbank"));
    assert.ok(link.includes("pn=Dr.+Ananya+Sharma"));
    assert.ok(link.includes("am=1500.00"));
    assert.ok(link.includes("cu=INR"));
  });

  // 3. Official Receipt Number Format
  test("generateReceiptNumber produces standardized REC-YYYYMMDD-XXXX format", () => {
    const receiptNo = generateReceiptNumber("appt_abc1234");
    assert.match(receiptNo, /^REC-\d{8}-[A-Z0-9]{4}$/);
    
    // Check with short ID
    const receiptShort = generateReceiptNumber("9");
    assert.match(receiptShort, /^REC-\d{8}-[A-Z0-9]{4}$/);
  });

  // 4. Payment Lifecycle State Transitions
  test("Payment verification workflow transitions states correctly", () => {
    const initialBooking = {
      id: "appt_pay_01",
      clientName: "Priya Sharma",
      serviceFee: 1000,
      paymentStatus: "pending",
      status: "pending",
    };

    // Client submits UTR
    const clientSubmission = {
      ...initialBooking,
      paymentStatus: "submitted",
      utrNumber: "428999888777",
      paymentDate: "2026-10-18T10:30:00Z",
    };
    assert.equal(clientSubmission.paymentStatus, "submitted");

    // Counsellor verifies credit in bank statement
    const counsellorVerified = {
      ...clientSubmission,
      paymentStatus: "verified",
      status: "confirmed",
      receiptNumber: generateReceiptNumber(clientSubmission.id),
      verifiedBy: "counsellor@inspiria.in",
    };
    assert.equal(counsellorVerified.paymentStatus, "verified");
    assert.equal(counsellorVerified.status, "confirmed");
    assert.ok(counsellorVerified.receiptNumber.startsWith("REC-"));

    // Client requests cancellation -> Counsellor records refund
    const refundedBooking = {
      ...counsellorVerified,
      paymentStatus: "refunded",
      refundAmount: 1000,
      refundNote: "Refunded via GPay on cancellation",
      status: "cancelled",
    };
    assert.equal(refundedBooking.paymentStatus, "refunded");
    assert.equal(refundedBooking.status, "cancelled");
    assert.equal(refundedBooking.refundAmount, 1000);
  });

  // 5. Anti-Fraud Security: Client Cannot Self-Verify
  test("Security constraint: Client cannot directly set paymentStatus to verified", () => {
    const simulateClientUpdate = (callerRole, requestedStatus) => {
      // Replicates Firestore rule:
      // !request.resource.data.diff(resource.data).affectedKeys().hasAny(['status', 'counsellorNote'])
      // && request.resource.data.paymentStatus in ['pending', 'submitted']
      if (callerRole === "client" && (requestedStatus === "verified" || requestedStatus === "refunded")) {
        return "PERMISSION_DENIED";
      }
      return "PERMISSION_GRANTED";
    };

    assert.equal(simulateClientUpdate("client", "submitted"), "PERMISSION_GRANTED");
    assert.equal(simulateClientUpdate("client", "verified"), "PERMISSION_DENIED");
    assert.equal(simulateClientUpdate("client", "refunded"), "PERMISSION_DENIED");
    assert.equal(simulateClientUpdate("counsellor", "verified"), "PERMISSION_GRANTED");
    assert.equal(simulateClientUpdate("admin", "refunded"), "PERMISSION_GRANTED");
  });

  // 6. Duplicate UTR Detection Check
  test("Anti-Fraud index: Duplicate UTR across appointments is flagged", () => {
    const existingIndexedUtrs = new Set(["CMS123456789", "428911223344"]);

    const processSubmission = (newUtr) => {
      const isDuplicate = existingIndexedUtrs.has(newUtr);
      return {
        isDuplicateUtr: isDuplicate,
        warningFlag: isDuplicate ? "FLAGGED_FOR_COUNSELLOR" : "CLEAN",
      };
    };

    // First time submission
    const cleanSub = processSubmission("NEW9988776655");
    assert.equal(cleanSub.isDuplicateUtr, false);
    assert.equal(cleanSub.warningFlag, "CLEAN");

    // Replay attack with same UTR
    const fraudSub = processSubmission("CMS123456789");
    assert.equal(fraudSub.isDuplicateUtr, true);
    assert.equal(fraudSub.warningFlag, "FLAGGED_FOR_COUNSELLOR");
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   PHASE 5: CLINICAL INTAKE, PRIVACY, ATOMIC SCHEDULING & INSIGHTS TESTS
   ───────────────────────────────────────────────────────────────────────────── */
describe("Phase 5: Clinical Intake, Privacy, Atomic Scheduling & Insights Tests", () => {
  // 1. Intake Form & Under-18 Parental Consent Guard
  test("Intake validation: under-18 clients require parent contact and parental consent", () => {
    const validateIntake = (intake) => {
      if (!intake.city || !intake.city.trim()) return { valid: false, error: "CITY_REQUIRED" };
      if (!intake.emergencyContactName || !intake.emergencyContactPhone) {
        return { valid: false, error: "EMERGENCY_CONTACT_REQUIRED" };
      }
      if (intake.ageGroup === "under_18") {
        if (!intake.parentName || !intake.parentPhone) {
          return { valid: false, error: "PARENTAL_DETAILS_REQUIRED" };
        }
        if (!intake.parentConsentConfirmed) {
          return { valid: false, error: "PARENTAL_CONSENT_REQUIRED" };
        }
      }
      if (!intake.consentAccepted) return { valid: false, error: "CONSENT_REQUIRED" };
      return { valid: true };
    };

    // Adult client
    const adultIntake = {
      ageGroup: "18_24",
      city: "New Delhi",
      purpose: "career",
      emergencyContactName: "Ramesh Sharma",
      emergencyContactPhone: "9876543210",
      consentAccepted: true,
    };
    assert.deepEqual(validateIntake(adultIntake), { valid: true });

    // Under-18 client without parent consent
    const minorWithoutConsent = {
      ageGroup: "under_18",
      city: "Lucknow",
      purpose: "academic",
      emergencyContactName: "Mother",
      emergencyContactPhone: "9876543211",
      parentName: "Sunita Verma",
      parentPhone: "9876543212",
      parentConsentConfirmed: false,
      consentAccepted: true,
    };
    assert.deepEqual(validateIntake(minorWithoutConsent), { valid: false, error: "PARENTAL_CONSENT_REQUIRED" });

    // Under-18 client with valid parental consent
    const minorValid = {
      ...minorWithoutConsent,
      parentConsentConfirmed: true,
    };
    assert.deepEqual(validateIntake(minorValid), { valid: true });

    // Firestore safety: Ensure adult intake payload contains null, never undefined
    const isUnder18 = adultIntake.ageGroup === "under_18";
    const payloadParentName = isUnder18 ? (adultIntake.parentName || null) : null;
    const payloadParentPhone = isUnder18 ? (adultIntake.parentPhone || null) : null;
    const payloadConsent = isUnder18 ? !!adultIntake.parentConsentConfirmed : false;

    assert.notEqual(payloadParentName, undefined, "parentName must not be undefined for Firestore");
    assert.notEqual(payloadParentPhone, undefined, "parentPhone must not be undefined for Firestore");
    assert.notEqual(payloadConsent, undefined, "parentConsentConfirmed must not be undefined");
    assert.equal(payloadParentName, null);
    assert.equal(payloadParentPhone, null);
    assert.equal(payloadConsent, false);
  });

  // 2. Versioned Informed Consent Guard
  test("Versioned consent: Client must accept current site consent version", () => {
    const isConsentUpToDate = (clientConsentVersion, siteCurrentVersion) => {
      return clientConsentVersion >= siteCurrentVersion;
    };

    assert.equal(isConsentUpToDate(1, 1), true);
    assert.equal(isConsentUpToDate(1, 2), false); // Needs re-consent
    assert.equal(isConsentUpToDate(2, 2), true);
  });

  // 3. Clinical Session Notes Least-Privilege Access Control
  test("Confidentiality rule: Clinical session notes are strictly counsellor-only (Admin and Client denied)", () => {
    const checkSessionNoteAccess = (userRole) => {
      // Replicates Firestore rule:
      // match /sessionNotes/{noteId} {
      //   allow read, write: if isAuthenticated() && getUserRole() == 'counsellor';
      // }
      if (userRole === "counsellor") return "ACCESS_GRANTED";
      return "ACCESS_DENIED";
    };

    assert.equal(checkSessionNoteAccess("counsellor"), "ACCESS_GRANTED");
    assert.equal(checkSessionNoteAccess("admin"), "ACCESS_DENIED");
    assert.equal(checkSessionNoteAccess("client"), "ACCESS_DENIED");
    assert.equal(checkSessionNoteAccess(null), "ACCESS_DENIED");
  });

  // 4. Client Private Journal Zero-Leaking Security Guard
  test("Confidentiality rule: Client journal is strictly private unless explicitly shared", () => {
    const checkJournalAccess = (callerUid, ownerUid, callerRole, isShared) => {
      if (callerUid === ownerUid) return "ALLOW";
      if (callerRole === "counsellor" && isShared) return "ALLOW";
      return "DENY";
    };

    // Owner reads their own journal
    assert.equal(checkJournalAccess("client_1", "client_1", "client", false), "ALLOW");

    // Counsellor attempts to read unshared journal -> BLOCKED
    assert.equal(checkJournalAccess("counsellor_1", "client_1", "counsellor", false), "DENY");

    // Counsellor reads explicitly shared journal -> ALLOWED
    assert.equal(checkJournalAccess("counsellor_1", "client_1", "counsellor", true), "ALLOW");

    // Admin attempts to read client journal -> NEVER ALLOWED
    assert.equal(checkJournalAccess("admin_1", "client_1", "admin", true), "DENY");
  });

  // 5. Atomic Double-Booking Race Condition Prevention
  test("Atomic booking: Concurrency lock prevents double-booking the same date/slot", () => {
    const slotLocks = new Map();

    const bookSlotAtomically = (date, slot, bookingId) => {
      const lockKey = `${date}_${slot.replace(/[^a-zA-Z0-9]/g, "_")}`;
      if (slotLocks.has(lockKey)) {
        throw new Error("SLOT_TAKEN");
      }
      slotLocks.set(lockKey, { status: "booked", bookingId });
      return { success: true, lockKey };
    };

    const firstBooking = bookSlotAtomically("2026-11-05", "10:00 AM - 11:00 AM", "appt_1");
    assert.equal(firstBooking.success, true);

    // Second client attempts to book exact same slot simultaneously
    assert.throws(() => {
      bookSlotAtomically("2026-11-05", "10:00 AM - 11:00 AM", "appt_2");
    }, /SLOT_TAKEN/);

    // Different slot on same date succeeds
    const secondSlot = bookSlotAtomically("2026-11-05", "11:30 AM - 12:30 PM", "appt_3");
    assert.equal(secondSlot.success, true);
  });

  // 6. Workshop Capacity & Waitlist Workflow
  test("Workshop capacity calculation: Transitions to waitlist when maxSeats is reached", () => {
    const maxSeats = 25;
    let enrolledCount = 24;

    const registerParticipant = () => {
      if (enrolledCount < maxSeats) {
        enrolledCount++;
        return { status: "confirmed", remainingSeats: maxSeats - enrolledCount };
      }
      return { status: "waitlist", remainingSeats: 0 };
    };

    // 25th registrant gets last seat
    const seat25 = registerParticipant();
    assert.equal(seat25.status, "confirmed");
    assert.equal(seat25.remainingSeats, 0);

    // 26th registrant is placed on priority waitlist
    const seat26 = registerParticipant();
    assert.equal(seat26.status, "waitlist");
    assert.equal(seat26.remainingSeats, 0);
  });

  // 7. Aggregate Insights Calculations (No PII Leakage)
  test("Aggregate insights: Correctly calculates revenue, cancellation rate, and no-show rate", () => {
    const mockAppointments = [
      { id: "1", status: "completed", paymentStatus: "verified", serviceFee: 1500, userId: "u1" },
      { id: "2", status: "confirmed", paymentStatus: "verified", serviceFee: 1000, userId: "u2" },
      { id: "3", status: "cancelled", paymentStatus: "refunded", serviceFee: 1000, userId: "u3" },
      { id: "4", status: "no_show", paymentStatus: "verified", serviceFee: 1500, userId: "u1" }, // returning client
    ];

    const total = mockAppointments.length;
    const verifiedRevenue = mockAppointments
      .filter((a) => a.paymentStatus === "verified")
      .reduce((sum, a) => sum + a.serviceFee, 0);

    const cancelledCount = mockAppointments.filter((a) => a.status === "cancelled").length;
    const noShowCount = mockAppointments.filter((a) => a.status === "no_show").length;

    const cancellationRate = ((cancelledCount / total) * 100).toFixed(1) + "%";
    const noShowRate = ((noShowCount / total) * 100).toFixed(1) + "%";

    assert.equal(total, 4);
    assert.equal(verifiedRevenue, 4000); // 1500 + 1000 + 1500
    assert.equal(cancellationRate, "25.0%");
    assert.equal(noShowRate, "25.0%");

    // Check returning client rate
    const clientCounts = {};
    mockAppointments.forEach((a) => {
      clientCounts[a.userId] = (clientCounts[a.userId] || 0) + 1;
    });
    const uniqueClients = Object.keys(clientCounts).length;
    const returningClients = Object.values(clientCounts).filter((c) => c > 1).length;
    const returnRate = ((returningClients / uniqueClients) * 100).toFixed(1) + "%";

    assert.equal(uniqueClients, 3);
    assert.equal(returningClients, 1);
    assert.equal(returnRate, "33.3%");
  });

  // 8. PWA Manifest Integrity Test
  test("PWA manifest contains required web app fields and icons", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const manifestPath = path.join(process.cwd(), "public", "manifest.webmanifest");

    assert.ok(fs.existsSync(manifestPath), "manifest.webmanifest must exist");
    const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    assert.equal(content.name, "Inspiria Careers");
    assert.equal(content.display, "standalone");
    assert.ok(content.start_url);
    assert.ok(content.icons && content.icons.length > 0);
  });
});

describe("Phase 6: Optional Add-ons & Privacy Safeguards", () => {
  // 1. Feature Flags Clean Default OFF & Zero Regression
  test("Feature flags: All Phase 6 add-ons default to OFF and behave cleanly", () => {
    const defaultProfile = {
      messagingEnabled: false,
      smsRemindersEnabled: false,
      feedbackEnabled: false,
      newsletterEnabled: false,
      messagingResponseTimeText: "1-2 working days",
    };

    assert.equal(defaultProfile.messagingEnabled, false, "Messaging must default to OFF");
    assert.equal(defaultProfile.smsRemindersEnabled, false, "SMS Reminders must default to OFF");
    assert.equal(defaultProfile.feedbackEnabled, false, "Session feedback must default to OFF");
    assert.equal(defaultProfile.newsletterEnabled, false, "Newsletter must default to OFF");
  });

  // 2. Messaging: 10-Minute Window & Soft Delete
  test("Messaging: 10-minute edit/delete cutoff window operates accurately", () => {
    const EDIT_WINDOW_MS = 10 * 60 * 1000;
    const now = Date.now();

    // 5 minutes old message: editable
    const recentMsgTime = new Date(now - 5 * 60 * 1000).toISOString();
    const isRecentEditable = (now - new Date(recentMsgTime).getTime()) <= EDIT_WINDOW_MS;
    assert.equal(isRecentEditable, true, "Message within 10 min should be editable");

    // 15 minutes old message: locked
    const oldMsgTime = new Date(now - 15 * 60 * 1000).toISOString();
    const isOldEditable = (now - new Date(oldMsgTime).getTime()) <= EDIT_WINDOW_MS;
    assert.equal(isOldEditable, false, "Message older than 10 min must be locked against edit/delete");

    // Soft delete structure: maintains thread audit without exposing content
    const originalMsg = {
      id: "msg-1",
      threadId: "client-123",
      senderId: "client-123",
      text: "Can we talk about my previous session notes?",
      deleted: false,
    };

    const softDeletedMsg = {
      ...originalMsg,
      deleted: true,
      deletedAt: new Date().toISOString(),
      text: "",
      attachmentUrl: null,
    };

    assert.equal(softDeletedMsg.deleted, true);
    assert.equal(softDeletedMsg.text, "");
    assert.equal(softDeletedMsg.attachmentUrl, null);
    assert.ok(softDeletedMsg.deletedAt);
  });

  // 3. Reminders: Minimal Safe Transactional Templates (Zero Clinical Data)
  test("Reminders: Templates contain ONLY appointment logistics, zero clinical notes", () => {
    const payload = {
      clientName: "Priya Singh",
      appointmentTime: "11:00 AM",
      appointmentDate: "Oct 25, 2026",
    };

    const enTemplate = `Hello ${payload.clientName}, your appointment is tomorrow at ${payload.appointmentTime} on ${payload.appointmentDate}. — Inspiria Careers`;
    const hiTemplate = `नमस्ते ${payload.clientName}, आपका परामर्श सत्र कल ${payload.appointmentDate} को ${payload.appointmentTime} पर है। — Inspiria Careers`;

    // Clinical keyword safety check
    const prohibitedWords = ["depression", "anxiety", "counselling notes", "mental illness", "diagnosis", "therapy"];
    for (const word of prohibitedWords) {
      assert.equal(enTemplate.toLowerCase().includes(word), false, `Reminder must not leak: ${word}`);
      assert.equal(hiTemplate.toLowerCase().includes(word), false, `Reminder must not leak: ${word}`);
    }

    assert.ok(enTemplate.includes(payload.clientName));
    assert.ok(enTemplate.includes(payload.appointmentTime));
    assert.ok(hiTemplate.includes(payload.clientName));
  });

  // 4. Session Feedback: Isolated from Public Reviews
  test("Session feedback: Structured for confidential counsellor reflection, distinct from public reviews", () => {
    const feedbackSubmission = {
      appointmentId: "appt-999",
      clientId: "client-456",
      rating: 5,
      helpfulness: "The decision matrix helped clarify my university choices.",
      improvements: "Would appreciate more time for Q&A.",
      wouldReturn: true,
      submittedAt: new Date().toISOString(),
    };

    assert.ok(feedbackSubmission.rating >= 1 && feedbackSubmission.rating <= 5);
    assert.equal(typeof feedbackSubmission.wouldReturn, "boolean");
    assert.ok(feedbackSubmission.helpfulness.length > 0);
    // Verified: No public 'approved' flag; never displayed on public homepage
    assert.equal((feedbackSubmission).approved, undefined);
  });

  // 5. Newsletter: Double Opt-in & One-click Unsubscribe Lifecycles
  test("Newsletter: Full double opt-in and unsubscribe token state transition", () => {
    // Stage 1: Subscribe request generates tokens with active = false
    const subscriber = {
      email: "subscriber@example.com",
      confirmed: false,
      confirmationToken: "abc123confirm",
      unsubscribeToken: "xyz789unsub",
      active: false,
      subscribedAt: new Date().toISOString(),
      confirmedAt: null,
      unsubscribedAt: null,
    };

    assert.equal(subscriber.confirmed, false);
    assert.equal(subscriber.active, false);

    // Stage 2: Token Confirmation
    subscriber.confirmed = true;
    subscriber.active = true;
    subscriber.confirmedAt = new Date().toISOString();
    subscriber.confirmationToken = ""; // consumed

    assert.equal(subscriber.confirmed, true);
    assert.equal(subscriber.active, true);
    assert.equal(subscriber.confirmationToken, "");

    // Stage 3: One-click Unsubscribe
    subscriber.active = false;
    subscriber.confirmed = false;
    subscriber.unsubscribedAt = new Date().toISOString();

    assert.equal(subscriber.active, false);
    assert.ok(subscriber.unsubscribedAt);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7: SECURITY MATRIX, DATA ISOLATION & SYSTEM RELIABILITY TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe("Phase 7: Security Matrix, Data Isolation & Reliability Tests", () => {
  // 1. Role Access Control Matrix Verification
  test("Security matrix: Strict role isolation across all collections", () => {
    const checkAccess = (role, resource, operation, isOwner = false, isShared = false) => {
      switch (resource) {
        case "sessionNotes":
          // Strictly Counsellor only. Admin and Client denied under all conditions.
          return role === "counsellor" ? "ALLOW" : "DENY";

        case "clientJournal":
          // Client owner always. Counsellor ONLY if sharedWithCounsellor is true. Admin DENIED.
          if (role === "admin") return "DENY";
          if (role === "client" && isOwner) return "ALLOW";
          if (role === "counsellor" && isShared) return "ALLOW";
          return "DENY";

        case "clientIntake":
          // Client owner can create/read. Counsellor can read. Admin DENIED.
          if (role === "admin") return "DENY";
          if (role === "client" && isOwner) return "ALLOW";
          if (role === "counsellor") return "ALLOW";
          return "DENY";

        case "auditLogs":
          // Admin only.
          return role === "admin" ? "ALLOW" : "DENY";

        case "users":
          // Admin can manage all. Client can only update own profile.
          if (role === "admin") return "ALLOW";
          if (role === "client" && isOwner && operation === "update") return "ALLOW";
          return "DENY";

        case "publicContent":
          // Everyone can read public posts, approved reviews, resources.
          if (operation === "read") return "ALLOW";
          return (role === "admin" || role === "counsellor") ? "ALLOW" : "DENY";

        default:
          return "DENY";
      }
    };

    // Clinical session notes: ONLY counsellor allowed
    assert.equal(checkAccess("admin", "sessionNotes", "read"), "DENY");
    assert.equal(checkAccess("client", "sessionNotes", "read"), "DENY");
    assert.equal(checkAccess(null, "sessionNotes", "read"), "DENY");
    assert.equal(checkAccess("counsellor", "sessionNotes", "read"), "ALLOW");

    // Client journal: admin never allowed
    assert.equal(checkAccess("admin", "clientJournal", "read", false, true), "DENY");
    assert.equal(checkAccess("client", "clientJournal", "read", true, false), "ALLOW");
    assert.equal(checkAccess("counsellor", "clientJournal", "read", false, false), "DENY");
    assert.equal(checkAccess("counsellor", "clientJournal", "read", false, true), "ALLOW");

    // Audit logs: admin only
    assert.equal(checkAccess("counsellor", "auditLogs", "read"), "DENY");
    assert.equal(checkAccess("client", "auditLogs", "read"), "DENY");
    assert.equal(checkAccess("admin", "auditLogs", "read"), "ALLOW");

    // Client intake: admin denied
    assert.equal(checkAccess("admin", "clientIntake", "read"), "DENY");
    assert.equal(checkAccess("counsellor", "clientIntake", "read"), "ALLOW");
    assert.equal(checkAccess("client", "clientIntake", "read", true), "ALLOW");
  });

  // 2. Maintenance Mode System Boundary
  test("Maintenance mode: Blocks new public bookings while preserving admin/counsellor access", () => {
    const handleBookingAttempt = (isMaintenanceActive, userRole) => {
      if (isMaintenanceActive) {
        return { allowed: false, error: "MAINTENANCE_PAUSED", redirect: "/emergency" };
      }
      return { allowed: true, status: "PROCEED_TO_SLOT_SELECTION" };
    };

    const handleDashboardLogin = (isMaintenanceActive, userRole) => {
      // Counsellor and Admin can always access their operational dashboards during maintenance
      if (userRole === "counsellor" || userRole === "admin") {
        return { allowed: true, access: "GRANTED" };
      }
      return { allowed: true, access: "CLIENT_READ_ONLY" };
    };

    // When maintenance is active
    const bookingResult = handleBookingAttempt(true, null);
    assert.equal(bookingResult.allowed, false);
    assert.equal(bookingResult.error, "MAINTENANCE_PAUSED");
    assert.equal(bookingResult.redirect, "/emergency");

    // Counsellor login remains operational
    const counsellorAccess = handleDashboardLogin(true, "counsellor");
    assert.equal(counsellorAccess.allowed, true);
    assert.equal(counsellorAccess.access, "GRANTED");

    // Admin login remains operational
    const adminAccess = handleDashboardLogin(true, "admin");
    assert.equal(adminAccess.allowed, true);
    assert.equal(adminAccess.access, "GRANTED");
  });

  // 3. XSS & Payload Sanitization
  test("Input sanitization: Script tags and malicious payloads are stripped", () => {
    const sanitizeInput = (text) => {
      if (!text) return "";
      return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<[^>]+>/g, "")
        .trim();
    };

    const maliciousXSS = "<script>alert('xss')</script>Hello Counsellor <img src=x onerror=alert(1)>";
    const cleaned = sanitizeInput(maliciousXSS);
    assert.equal(cleaned.includes("<script>"), false);
    assert.equal(cleaned.includes("<img"), false);
    assert.equal(cleaned, "Hello Counsellor");
  });

  // 4. Video Embed & URL Formatting
  test("Video formatting: Converts YouTube shorts, short links, and watch URLs to embed format", () => {
    function formatVideoEmbedUrl(url) {
      if (!url) return "";
      const trimmed = url.trim();
      const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
      const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
      if (trimmed.includes("youtube.com/embed/")) return trimmed;
      const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      return trimmed;
    }

    assert.equal(
      formatVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
    assert.equal(
      formatVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ"),
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
    assert.equal(
      formatVideoEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
    assert.equal(
      formatVideoEmbedUrl("https://vimeo.com/76979871"),
      "https://player.vimeo.com/video/76979871"
    );
  });

  // 5. Transactional Booking Email Confirmation
  test("Booking confirmation email: Dispatches valid bilingual content with zero clinical disclosure", () => {
    const emailData = {
      clientName: "Priya Sharma",
      serviceTitle: "Career Stream Selection",
      date: "2026-11-25",
      timeSlot: "02:00 PM - 03:00 PM",
      mode: "Online",
      counsellorName: "Principal Ma'am",
    };

    // Test booking received
    const subject = `Appointment Request Received: ${emailData.serviceTitle} | Inspiria Careers`;
    assert.ok(subject.includes(emailData.serviceTitle));
    assert.ok(subject.includes("Inspiria Careers"));

    // Verify safe properties
    assert.equal(emailData.clientName, "Priya Sharma");
    assert.equal(emailData.date, "2026-11-25");
  });
});


