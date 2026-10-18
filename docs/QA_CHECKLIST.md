# ✅ Pre-Release Quality Assurance Checklist (QA_CHECKLIST.md)

Use this checklist before deploying updates to production or during periodic release audits.

---

## 1. Authentication & Security
- [ ] **Sign Up Validation:** Password must be at least 8 characters. Weak password inputs trigger friendly alert.
- [ ] **Role Assignment on Creation:** New users automatically default to role `client`. Role cannot be escalated by client request.
- [ ] **Role Protection:** Non-admins cannot access `/dashboard/admin`. Clients cannot access `/dashboard/counsellor`.
- [ ] **Account Disabling:** In Admin panel, toggling a user account to "Disabled" instantly logs out the user and denies login attempts.
- [ ] **Password Reset:** `/forgot-password` dispatches valid password reset email link via Firebase Auth.
- [ ] **Zero Secrets in Source:** No passwords, secret keys, or service account files committed in repo or git history.

---

## 2. Appointment Booking & Management
- [ ] **Time Slot Conflict:** Double-booking the same date and slot is blocked in real-time.
- [ ] **Blocked Dates & Holidays:** Dates added by counsellor to "Blocked Dates" cannot be booked in `/book`.
- [ ] **Online Consultation Mode:** When booked as "Online", confirmed appointment displays dynamic Meeting Link (Google Meet / Zoom) exclusively to that client.
- [ ] **Calendar Export:** Clicking "Add to Google Calendar" opens valid Google event URL. Clicking ".ICS" downloads valid RFC 5545 file that imports into Apple Calendar / Outlook.
- [ ] **Reschedule Request:**
  - Client can submit a preferred new date/slot and reason.
  - Counsellor sees pending reschedule banner and can Approve or Reject.
  - Approving instantly updates appointment date/slot and resets banner.
- [ ] **Cancellation Cutoff (24 Hours):** Self-cancellation and reschedule buttons are disabled if the session is within the configured cutoff window.

---

## 3. Client Confidentiality Vault (DPDPA / GDPR)
- [ ] **Private Notes:** Client notes remain 100% confidential. Admin cannot read private client notes.
- [ ] **Counsellor Sharing:** Only notes and documents marked `sharedWithCounsellor: true` are visible in Counsellor dashboard.
- [ ] **Document Upload:** Validates file size (<5MB) and type (PDF / Images only).
- [ ] **Data Portability:** Clicking "Export My Data" downloads complete JSON archive of user profile, notes, documents, and appointments.
- [ ] **Right to Erasure (Delete Account):** Confirming deletion removes user record, private notes, documents, and Firebase Auth account completely.

---

## 4. Counsellor & Admin Tools
- [ ] **Dashboard Overview:** Displays live counters for Today's Sessions, Pending Requests, Pending Reviews, and Inquiries.
- [ ] **Review Moderation:** Client reviews are unpublished (`approved: false`) until Counsellor explicitly clicks "Approve".
- [ ] **Articles / Posts:** Counsellor can write, edit, and publish posts. Published posts appear instantly on `/posts`.
- [ ] **Contact Form Inbox:** Messages submitted on `/contact` arrive in Counsellor Inbox with status `unread`. Counsellor can mark `read` or `replied`.
- [ ] **Audit Trail:** Admin dashboard displays immutable records of role changes, deletions, and setting updates from `auditLogs`.
- [ ] **CSV Exports:** Appointments and Reviews can be downloaded as clean `.csv` spreadsheets.

---

## 5. UI, Responsiveness & Accessibility
- [ ] **Mobile Layout (360px):** Test on iPhone SE / Android 360px width. Navbar hamburger menu toggles cleanly; no horizontal overflow.
- [ ] **Tablet Layout (768px):** Grid layouts collapse appropriately into responsive columns.
- [ ] **Bilingual Toggle (EN / HI):** Switching language translates all headings, labels, buttons, and system notices without breaking layout.
- [ ] **Floating WhatsApp:** Click-to-chat button floats non-intrusively at bottom-right corner when WhatsApp number is set.
- [ ] **Emergency Disclaimer:** Mental health helpline phone numbers (iCall & Vandrevala Foundation) are clearly visible in the footer.
- [ ] **Custom 404 & Error Boundary:** Non-existent routes display calm bilingual 404 page with return home button.

---

## 6. Performance & SEO
- [ ] **Sitemap:** Navigating to `/sitemap.xml` returns valid XML index with all public URLs.
- [ ] **Robots.txt:** Navigating to `/robots.txt` disallows `/dashboard/` and `/api/`.
- [ ] **JSON-LD Schema:** Page source includes `<script type="application/ld+json">` with dynamic LocalBusiness / Person data.
- [ ] **Next.js Font:** Typography loads with zero layout shift via `next/font`.
