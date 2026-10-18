# 🚀 Production Launch Checklist & Handover Guide — Inspiria Careers

This document is the definitive pre-launch verification and operational handover guide for deploying the Inspiria Careers counselling platform into production.

---

## 📋 Pre-Flight Verification Matrix

| Area | Verification Task | Required Status | Verified? |
| :--- | :--- | :--- | :---: |
| **Secrets & Env** | Firebase public keys set in `.env.local` / Vercel secrets (No private secrets committed) | Mandatory | [x] |
| **Firestore Rules** | `firestore.rules` deployed — Admin denied from clinical notes, intake, private journals | Mandatory | [x] |
| **Storage Rules** | `storage.rules` deployed — User-isolated storage and counsellor resource bucket | Mandatory | [x] |
| **Counsellor Profile** | Dynamic name, qualifications, bio, registration number, contact info populated | Mandatory | [x] |
| **Payment Setup** | Counsellor UPI ID, Payee Name, and QR image uploaded in `siteContent/paymentSettings` | Mandatory | [x] |
| **Services & Fees** | Services created with accurate fees (0 for free sessions to bypass payment) | Mandatory | [x] |
| **Scheduling Engine** | Weekly IST slots configured, slot durations (30/45/60m) & buffers (10/15m) defined | Mandatory | [x] |
| **Consent & Intake** | Informed consent version & text active; minor under-18 parental safeguards enforced | Mandatory | [x] |
| **Emergency Helplines** | Verified Indian helplines (Tele-MANAS, KIRAN, iCall, Vandrevala, 112) live at `/emergency` | Mandatory | [x] |
| **PWA & Offline** | Web manifest valid, service worker/PWA icon set, `/offline` fallback page verified | Mandatory | [x] |
| **Build & Linting** | `npm test` passes (20/20 tests), `npm run lint` (0 warnings), `npm run build` (26 routes clean) | Mandatory | [x] |

---

## 🛠️ Step-by-Step Go-Live Deployment

### Step 1: Firebase Project Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication**:
   - Enable **Email/Password** provider.
   - Enable **Google Sign-In** provider.
   - Add authorized domains: `localhost`, `inspiria-careers.vercel.app`, custom domain.
3. Enable **Cloud Firestore** in production mode.
4. Enable **Cloud Storage**.

### Step 2: Deploy Dual-Layer Security Rules
Deploy Firestore and Storage rules using the Firebase CLI:
```bash
firebase deploy --only firestore:rules,storage
```
*Verify that `firestore.rules` enforces that only counsellors can access `sessionNotes` and `clientIntake`, and clients can only access their own `clientJournal`.*

### Step 3: Configure Production Environment Variables
In your hosting provider (e.g. Vercel / Netlify / Cloudflare Pages), set:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=inspiria-careers.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=inspiria-careers
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=inspiria-careers.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### Step 4: First Admin & Counsellor Initialization
1. Navigate to `/signup` and create the primary account for the counsellor.
2. In Firestore console under the `users` collection, locate this user document and set:
   ```json
   {
     "role": "counsellor"
   }
   ```
3. (Optional) For a platform manager, create an account and set `"role": "admin"`.
   *Note: Platform admin can manage users, reviews, and general settings, but by design CANNOT inspect confidential clinical notes or client journals.*

### Step 5: Counsellor Dashboard Initial Configuration
Log in as the counsellor and visit `/dashboard/counsellor`:
1. **Profile Tab**:
   - Counsellor Full Name & Qualifications (e.g., M.A. Psychology, RCI Registered).
   - Professional Registration Number (RCI / APC).
   - Bio, Specializations, Office Address, Timings, Phone, WhatsApp, and Email.
   - Upload Profile Photo.
2. **Branding Tab**:
   - Set Site Title and upload Logo & Favicon.
3. **Payment Settings Tab**:
   - Upload UPI QR Code image.
   - Enter UPI ID (e.g., `counsellor@upi`) and Payee Name.
4. **Schedule & Buffer Tab**:
   - Select Session Duration (30m, 45m, or 60m).
   - Select Buffer Time (0m, 10m, or 15m) to prevent back-to-back fatigue.
   - Define weekly IST working slots (e.g., Mon-Fri 10:00 AM - 05:00 PM).
   - Review and update Informed Consent Version (e.g., `v2.0-2026`).
5. **Services Tab**:
   - Add counselling services with clear descriptions and fee in INR.
6. **Workshops Tab**:
   - Publish any upcoming group webinars or student workshops.

---

## 🧪 End-to-End Operational Smoke Tests

Before announcing the platform to students and parents, perform this 10-minute smoke test:

1. **New Client Booking Smoke Test**:
   - Register as a test student at `/signup`.
   - Go to `/book`, select a service and slot.
   - Verify the **Confidential Intake Questionnaire** pops up.
   - Test under-18 toggle: verifies parent name, parent phone, and parental consent checkbox.
   - Submit booking.
2. **Manual QR Payment Smoke Test**:
   - In Client Dashboard (`/dashboard/client`), verify payment card appears.
   - Click "Pay with UPI app" link or view QR code.
   - Enter a 12-digit mock UTR number (e.g., `202610189999`) and submit.
   - Switch to Counsellor Dashboard: verify pending payment shows in Appointments.
   - Counsellor clicks "Verify Payment": auto-generates receipt `REC-YYYYMMDD-XXXX`.
   - Client dashboard reflects "Payment Verified" with downloadable receipt.
3. **Clinical Session Notes Smoke Test**:
   - In Counsellor Dashboard, click `📝 Notes` on the confirmed booking.
   - Add session summary, key observations, and homework tasks.
   - Test "Print / Save PDF" and "Export JSON".
   - Verify the notes are autosaved in `localStorage` and synced to Firestore.
   - Log in as test student and admin: verify neither can see counsellor clinical notes.
4. **Client Mindfulness Journal Test**:
   - In Client Dashboard, go to "Mindfulness Journal" tab.
   - Log a mood rating, reflection, and gratitude entry.
   - Leave "Share with Counsellor" unchecked: entry is 100% private.
5. **Workshops Registration & Waitlist Test**:
   - Visit `/workshops` and open a workshop.
   - Register a client. Verify capacity decreases. If full, verify waitlist banner activates.
6. **Emergency Crisis Helplines Test**:
   - Visit `/emergency` on mobile and desktop.
   - Ensure Tele-MANAS (`14416`), KIRAN (`1800-599-0019`), and `112` click-to-call links work directly.
7. **PWA Offline Fallback Test**:
   - In Chrome DevTools > Network, check "Offline".
   - Reload page: verifies `/offline` route renders gracefully with emergency helpline numbers.

---

## 🛡️ DPDPA 2023 & Security Maintenance

- **Formal Deletion Requests**: Fulfill client requests queued in the Counsellor Dashboard "DPDPA 2023 Deletion Requests" tab within 30 days.
- **Audit Logs**: All sensitive operations (payment verification, user status toggles, schedule modifications) are logged immutably in `auditLogs`.
- **Atomic Slot Locking**: The booking engine locks slots using Firestore transactions on `slotLocks/${date}_${slot}` to guarantee zero double bookings.
