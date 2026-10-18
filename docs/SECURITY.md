# 🛡️ Security Policy & Rules Guide — Inspiria Careers

This document details the security model, Firestore and Storage rules, secrets management, breach response, and initial administrator bootstrap.

---

## 1. Secrets & Credentials Policy

### What Can Be Public (`NEXT_PUBLIC_`)
Only client-side Firebase connection keys may be exposed in `.env.local`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

*Note: In Firebase architecture, client API keys identify your project to Google APIs and are safe to be bundled into client JavaScript. Protection is achieved via Firestore & Storage Security Rules.*

### What Must NEVER Be Committed
- ❌ Firebase Service Account JSON files (`serviceAccountKey.json`).
- ❌ Admin / Counsellor passwords in plain text.
- ❌ Private keys or OAuth secret tokens.
- ❌ Personal client records or consultation session transcripts.

---

## 2. Setting Up the First Administrator (Bootstrap)

To grant yourself initial administrator privileges:
1. Navigate to `http://localhost:3000/signup` (or `/login`) and register with your email (or via Google Sign-In).
2. Open your [Firebase Console](https://console.firebase.google.com).
3. Go to **Firestore Database** -> Click on the `users` collection.
4. Locate the document matching your user's `uid`.
5. Edit the `role` field from `"client"` to `"admin"`.
6. Refresh your browser; you will now have full access to `/dashboard/admin`.

*From the Admin Dashboard (`/dashboard/admin`), you can subsequently assign the "Counsellor" role to Principal Ma'am or promote additional administrators with a single click.*

---

## 3. Incident Response & Data Breach Protocol

In the event of a suspected credential leak, security incident, or unauthorized access:

### Phase 1: Immediate Containment (Within 1 Hour)
1. **Activate Maintenance Mode**:
   - Turn on System Maintenance Mode in Counsellor Dashboard or set `profile.maintenanceMode = true` in Firestore `siteContent/settings` to halt new incoming transactions.
2. **Revoke Compromised Credentials**:
   - If an account is compromised, immediately disable it via Firebase Console -> **Authentication** -> **Users** -> **Disable account**.
   - If Firebase Web API keys or environment secrets were exposed, immediately regenerate keys in Google Cloud Console -> **APIs & Services** -> **Credentials**, update Vercel environment variables, and trigger a redeploy.
3. **Session Revocation**:
   - Use Firebase Admin SDK or Console to sign out all active sessions on compromised accounts.

### Phase 2: Root-Cause Investigation & Forensics (Within 6 Hours)
1. Query `auditLogs` collection in Firestore to trace timestamps, IP ranges (if captured), actor roles, and modified records.
2. Inspect Google Cloud Audit Logs for unusual bulk read/export operations.
3. Verify whether private clinical notes (`sessionNotes`), intake files (`clientIntake`), or messaging threads (`threads`) were accessed.

### Phase 3: Eradication & Remediation (Within 24 Hours)
1. Patch vulnerabilities in `firestore.rules`, `storage.rules`, or Next.js code.
2. Run test suites: `node --test tests/*.test.mjs` to ensure security regression guards catch the flaw.
3. If code or secrets were committed to Git history, purge them permanently using `git filter-repo` or BFG Repo-Cleaner before force-pushing.

### Phase 4: Statutory Notification & Client Communication (Within 72 Hours)
Under India's **Digital Personal Data Protection Act (DPDPA) 2023** and CERT-In guidelines:
1. If sensitive personal data was breached, report the incident to the Data Protection Board of India (DPBI) and CERT-In.
2. Notify affected clients directly via email with transparent details:
   - Nature of the incident and data fields involved.
   - Immediate actions taken by Inspiria Careers to secure data.
   - Recommended actions for clients (e.g., password reset).
   - Dedicated contact email for data inquiries.

### Phase 5: Post-Incident Review & Runbook Update
1. Conduct a post-mortem review with Counsellor and Admin.
2. Update `docs/SECURITY.md` and test coverage to eliminate repeat occurrences.

---

## 4. OWASP Top 10 Security Architecture Matrix

| OWASP Vulnerability | Risk Level | Implemented Mitigation & Safeguards |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | High | Enforced at database layer (`firestore.rules`). Admin denied access to clinical notes and private journal. Role spoofing prevented by server-side rule verification. |
| **A02: Cryptographic Failures** | Medium | HTTPS forced via Vercel HSTS. Password hashing handled by Google SCRYPT in Firebase Auth. Zero plaintext storage of passwords or tokens. |
| **A03: Injection (NoSQL/SQL)** | High | Firestore SDK uses parameterized queries natively. Honeypot anti-spam trap in forms. User inputs sanitized before display. |
| **A04: Insecure Design** | Medium | Concurrency slot locks prevent double-booking. 24-hour cutoff enforced for reschedules/cancellations. Immutable anti-fraud UTR registry. |
| **A05: Security Misconfiguration** | Medium | Dual-layer security (UI + Firestore Rules). Public write access strictly forbidden across all collections. Cloud Storage MIME type and file size caps. |
| **A06: Vulnerable Components** | Medium | Regular `npm audit` checks. Zero bloated third-party UI kits or animation suites. Native React 19 and Next.js App Router. |
| **A07: Identification & Auth Failures** | High | Firebase Auth rate limits brute-force attempts. Immediate account termination checks on disabled users. Role session guards on route navigation. |
| **A08: Software & Data Integrity Failures** | Medium | Client consent versioning (`consentVersion`). Double opt-in newsletter confirmation tokens. Signed Git commit hygiene. |
| **A09: Security Logging & Monitoring** | Low | Dedicated `auditLogs` collection tracks administrative actions (role changes, profile updates, manual UTR verifications). Admin-only view. |
| **A10: Server-Side Request Forgery (SSRF)** | Low | Zero arbitrary client-requested HTTP proxies or external URL fetches. All outbound webhook/calendar integrations use static vetted domains. |

---

## 4. Firestore & Storage Rules Overview

### Firestore Rules Summary
- `users`: Users can read and write only their own basic profile info; only admins can edit the `role` field.
- `siteContent`: Read by everyone; updated only by users with `role == "admin"` or `role == "counsellor"`.
- `appointments`: Clients can view, book, cancel, reschedule, and submit UTR/screenshot proofs (`paymentStatus: "submitted"`). Clients are **strictly prohibited** from setting `paymentStatus: "verified"` or `"refunded"`. Only counsellors and admins can verify payments and record refunds.
- `slotLocks`: Atomic transaction locks prevent simultaneous double-booking of identical date/time slots.
- `utrNumbers`: Immutable anti-fraud index preventing duplicate UTR reuse across appointments (`allow update, delete: if false;`).
- `clientIntake`: Confidential pre-session questionnaire. Accessible only by the client owner and attending counsellor. **Platform Admin is denied read/write access.**
- `sessionNotes`: Clinical case notes, therapeutic observations, and risk notes. Accessible **exclusively by the Counsellor**. **Clients and Platform Admin are strictly denied read/write access.**
- `clientJournal`: Private emotional reflection and mindfulness logs. 100% private to client owner; counsellor has read access only if explicitly shared. Zero external third-party AI processing.
- `clientNotes` & `clientDocuments`: Owner can read and write; counsellor can read **only if** `sharedWithCounsellor == true`. Admin has no direct read access to uphold client confidentiality.
- `resources`: Public resources read by all; client-only resources read by authenticated clients; write restricted to counsellor.
- `workshops` & `workshopRegistrations`: Public workshop schedule; attendee capacity limits and waitlist triggers enforced.
- `deletionRequests`: DPDPA 2023 statutory client erasure requests logged with 30-day resolution tracking.
- `threads` & `threads/{clientId}/messages` (Phase 6): Confidential asynchronous thread. Accessible **only by the client owner and attending counsellor**. **Platform Admin is strictly denied read/write access.**
- `sessionFeedback` (Phase 6): Private post-session qualitative feedback. Client can create for their appointment; readable **exclusively by the counsellor**. **Platform Admin is denied read access.**
- `reminderPreferences` (Phase 6): Client communication preference (opt-in state and preferred channel: WhatsApp or SMS).
- `subscribers` (Phase 6): Double opt-in newsletter list. Public can subscribe; confirmation and unsubscribe endpoints consume cryptographic tokens.

### Storage Rules Summary
- General vault files limited to `5MB`. Payment screenshots limited to `3MB`. Educational PDFs limited to `10MB`.
- Allowed MIME types: images (`image/*`), audio (`audio/*`), and PDFs (`application/pdf`).
- Path patterns:
  - `/clients/{uid}/{fileName}`: Private client vault (PDFs, marksheets). Accessible only to `{uid}`, and counsellors if shared.
  - `/payments/{uid}/{fileName}`: Payment transfer screenshot proofs. Accessible to the submitting client, counsellors, and administrators.
  - `/resources/{fileName}`: Educational materials uploaded by counsellor; readable by authenticated users.
  - `/messages/{clientId}/{fileName}`: Secure messaging attachments (PDF, JPEG, PNG, max 5MB). Accessible to client and counsellor.
  - `/counsellor/...`, `/branding/...`: Publicly viewable counsellor photo, site logo, and payment QR code; writable only by counsellors/admins.
