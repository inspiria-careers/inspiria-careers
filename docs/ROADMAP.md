# 🗺️ Product Roadmap — Inspiria Careers

This roadmap documents completed milestones, active capabilities, and planned future enhancements.

---

## ✅ Phase 1: Clean Foundation & Role Architecture (Completed)
- [x] Complete refactoring: removed bloated unused pages, heavy three.js scenes, and unneeded modals.
- [x] Implemented dynamic, zero-hardcoded Firestore-driven content (`siteContent/settings`).
- [x] Clean role-based authorization: **Admin**, **Counsellor**, and **Client**.
- [x] Firebase Authentication with Google One-Click and Email/Password.
- [x] Responsive, mobile-first design with calm, professional aesthetics.
- [x] Full bilingual support (English and हिन्दी).
- [x] Dynamic public pages: Home, About Us, Services, Gallery, Contact, and Privacy Policy.

---

## ✅ Phase 2: Interactive Modules & Confidential Client Vault (Completed)
- [x] **Guidance Blog & Knowledge Hub**:
  - Auto-generated slugs, category tagging, cover photo with alt text.
  - Public article listing with dynamic single-post reader (`/posts/[slug]`).
- [x] **Verified Reviews & Testimonial Moderation**:
  - Client review submission with privacy display options (Full Name / First Name Only / Anonymous).
  - Counsellor/Admin moderation dashboard to approve, reject, or hide reviews.
  - Dedicated `/reviews` page and dynamic Home section featuring approved reviews.
- [x] **Enhanced Appointment Management**:
  - Slot availability management in settings to prevent double-booking.
  - Counsellor internal remarks and status workflow (Pending, Confirmed, Completed, Cancelled).
- [x] **Confidential Client Notes & Document Vault**:
  - Private notes and documents (PDF/JPG/PNG, max 5 MB).
  - Granular `"Share with counsellor"` toggle per item.
  - Full client data export (JSON) and self-service account deletion.
- [x] **Live Theme Customiser & Accessibility**:
  - 5 pre-configured calm color presets, custom primary/accent pickers, font options, and low-contrast accessibility warnings.
- [x] **Security Hardening**:
  - Explicit `firestore.rules` and `storage.rules` preventing unauthorized cross-user data access.
  - Anti-spam honeypot protection on booking, contact, and review forms.

---

## ✅ Phase 3: Production-Ready Hardening & Operations (Completed)
- [x] **Appointment Upgrades**:
  - Online vs In-Person modes with dynamic meeting links (Google Meet/Zoom) for confirmed sessions.
  - Add to Google Calendar & RFC 5545 `.ics` file download.
  - Client reschedule request workflow with counsellor approval/rejection.
  - 24-hour cancellation cutoff setting and Counsellor blocked dates/holidays manager.
  - Daily Vercel Cron (`/api/cron/reminders`) with `CRON_SECRET` protection for 24h prior reminders.
  - 5 safe bilingual email notification templates omitting private counselling notes.
- [x] **Admin & Counsellor Operations**:
  - Admin user management with account deactivation toggle and automatic session termination.
  - Immutable audit trail (`auditLogs`) and Admin viewer.
  - Counsellor dashboard overview cards (Today's sessions, pending requests, pending reviews, inquiries).
  - One-click CSV exports for appointments and reviews.
  - Contact messages inbox with `unread`, `read`, and `replied` status tracking.
- [x] **SEO, Performance & Accessibility**:
  - Dynamic XML sitemap (`/sitemap.xml`) and `/robots.txt`.
  - Dynamic JSON-LD structured data (`LocalBusiness` & `Person`).
  - Subroute metadata layouts with canonical URLs and OpenGraph tags.
  - Zero-CLS font optimization via `next/font/google` (Inter).
  - Custom calm 404 page and error boundary.
- [x] **Security Hardening**:
  - HTTP security headers in `next.config.ts` (HSTS, CSP, Frame Options).
  - Firebase App Check initialization with reCAPTCHA v3.
  - Complete git commit secrets scan (zero leaks found).
  - Strong password policy (8+ chars) and email-based password reset.
  - Self-service GDPR/DPDPA complete data erasure.
- [x] **Language & Payments Prep**:
  - 100% complete bilingual dictionary in `src/translations/index.ts`.
  - Floating WhatsApp click-to-chat button and emergency helpline in footer.
  - Feature flag `paymentsEnabled: false` and comprehensive Razorpay blueprint in `docs/PAYMENTS_PLAN.md`.
- [x] **Testing & Handover Suite**:
  - Automated test suite (`npm test`) passing all production flow tests.
  - `docs/QA_CHECKLIST.md`, `docs/BACKUP_AND_RECOVERY.md`, `docs/HANDOVER.md`.

---

## ✅ Phase 4: Manual QR Payment Flow & Branding Hub (Completed)
- [x] **Manual QR Payment Engine**:
  - Counsellor UPI QR image upload, UPI ID, and payee name stored in `siteContent/paymentSettings`.
  - Service-specific fees (INR); fee=0 automatically bypasses payment.
  - Client post-booking payment step with mobile UPI deep-linking (`upi://pay`) and copy buttons.
  - Bank UTR reference submission (12 alphanumeric validation) and proof screenshot upload.
  - Counsellor verification workflow: auto-generates digital receipt (`REC-YYYYMMDD-XXXX`), updates status to `verified`, and confirms booking.
  - Payment rejection with mandatory client-visible reason and refund recording.
  - Printable / downloadable digital payment receipt modal with auto-print.
  - CSV export of financial payments report.
- [x] **Anti-Fraud Protections**:
  - Immutable `utrNumbers` collection prevents duplicate UTR reuse across appointments.
  - Client database write guards: clients cannot directly set `paymentStatus: "verified"`.
- [x] **Logo & Branding Upload**:
  - Image uploader for site logo and favicon in Counsellor Settings with live preview.

---

## ✅ Phase 5: Counselling Features, Insights & Launch Readiness (Completed)
- [x] **Part A: Confidential Intake Form & Informed Consent**:
  - Intake questionnaire (age group, city, purpose, prior therapy, emergency contact, language).
  - Minor under-18 parental safeguard: mandatory parent/guardian name, phone, and explicit parental consent.
  - Versioned informed consent agreement (`siteContent/settings.consentVersion`).
  - Strict confidentiality: Client & Counsellor access only; **Platform Admin is denied read/write access**.
- [x] **Part B: Counsellor Private Clinical Session Notes**:
  - Clinical notes editor: summary, key observations, homework assignments, next session timeline, risk flags.
  - Real-time `localStorage` draft autosave + Firestore sync.
  - Revision history snapshot timeline.
  - Printable / PDF-ready clinical view and JSON data export.
  - DPDPA 2023 formal deletion request submission and counsellor resolution queue.
  - Access restricted exclusively to the Counsellor role.
- [x] **Part C: Resources Hub, Tasks & Client Journal**:
  - Educational resource library (`/resources`) with category filters and download links (public vs client-only).
  - Task assignment system with client reflection responses.
  - Private client mindfulness & gratitude journal with mood check-in (100% private unless explicitly shared, zero external AI processing).
- [x] **Part D: Workshops & Group Events**:
  - Counsellor workshop manager: create, edit, attendee roster, and attendance tracking.
  - Public listing (`/workshops`) and registration flow (`/workshops/[id]`).
  - Real-time seat limit capacity checks and automatic waitlist transition.
  - Phase 4 manual QR payment integration for paid workshops.
  - One-click CSV attendee roster export.
- [x] **Part E: Smarter Scheduling & Atomic Concurrency**:
  - Dynamic session durations (30m, 45m, 60m) and buffer times (10m, 15m).
  - Weekly recurring IST schedule editor with day-by-day availability toggles.
  - Atomic booking concurrency via Firestore transactions on `slotLocks/{date_slot}` eliminating double bookings.
  - "No-show" appointment status tracking.
- [x] **Part F: Aggregate Insights Dashboard**:
  - Pure CSS/SVG analytics dashboard (zero external charting libraries, maintaining lean bundle).
  - Monthly booking trends, verified revenue, popular services breakdown, cancellation rate, no-show rate, client return rate.
  - Zero PII exposure.
- [x] **Part G: Trust, Safety & Ethics**:
  - Dynamic bilingual FAQ accordion (`/faq`) with instant search filter.
  - Emergency Helplines directory (`/emergency`) with direct-dial links (Tele-MANAS, KIRAN, iCall, Vandrevala, 112).
  - Prominent emergency crisis banners across `/book`, `/contact`, `/offline`, and footer.
  - Counsellor professional registration number display on `/about` and footer.
- [x] **Part H: PWA & Offline Experience**:
  - Valid web manifest (`/manifest.webmanifest`) with standalone display mode.
  - Dedicated offline fallback page (`/offline`) with direct-dial emergency helplines.
  - 100% complete bilingual dictionary in `src/translations/index.ts`.
- [x] **Part I: Launch Handover & QA Verification**:
  - Comprehensive `docs/LAUNCH_CHECKLIST.md` pre-flight verification guide.
  - Automated test suite (`npm test`) expanded to 20/20 passing tests.
  - 0 ESLint warnings (`npm run lint`), and 100% clean Next.js 16 production build (`npm run build`).

---

## ✅ Phase 6: Optional Add-ons & Modular Architecture (Completed)
- [x] **Part A: Secure Asynchronous Messaging (`messagingEnabled`)**:
  - Modular feature flag defaulting to OFF (`siteContent/settings.messagingEnabled`).
  - Isolated thread architecture (`threads/{clientId}/messages/{messageId}`).
  - 10-minute edit and soft-delete grace window preserving thread continuity.
  - File attachments (PDF, JPEG, PNG, max 5MB) via Cloud Storage.
  - Prominent emergency / non-crisis disclaimer with customizable counsellor expected response time notice.
  - Strict confidentiality: Only client owner and counsellor have access. **Platform Admin has ZERO read/write access.**
  - Transparent data protection disclosures: explicitly states no false E2EE claims.
- [x] **Part C: WhatsApp & SMS Reminders (`smsRemindersEnabled`)**:
  - Provider-agnostic abstraction service (`src/lib/reminderService.ts`).
  - Client-side explicit opt-in preference controls and channel selection (WhatsApp / SMS) in Client Dashboard.
  - Minimal transactional templates containing strictly appointment logistics (ZERO clinical disclosures).
  - Out-of-the-box safe dry-run mode (logs to console without third-party network egress).
  - Complete integration guide (`docs/INTEGRATIONS.md`) detailing Meta Cloud API, Indian DLT compliance, and Vercel Cron limits.
- [x] **Part E: Private Session Feedback & Follow-up Queue (`feedbackEnabled`)**:
  - Post-session confidential feedback modal for completed appointments (1-5 star rating, helpful aspects, improvement reflections, return intent).
  - Strictly isolated from public testimonials (`sessionFeedback` vs `reviews`); **Platform Admin has ZERO read access**.
  - Counsellor Follow-up Queue: Automatically identifies clients whose consultations completed > 7 days ago with no follow-up booking.
  - One-click follow-up reminder action trigger with dry-run logging.
- [x] **Part F: Newsletter & Career Tips Subscription (`newsletterEnabled`)**:
  - Responsive double opt-in subscription box in website footer (`src/components/NewsletterSubscribe.tsx`).
  - Cryptographic token generation for secure confirmation (`/api/newsletter/confirm`) and one-click unsubscription (`/api/newsletter/unsubscribe`).
  - Isolated subscriber collection (`subscribers`) with Counsellor Dashboard subscriber roster and CSV export.
- [x] **Part G: Quality, Security, Handover & Testing**:
  - All Phase 6 add-ons default to OFF and disable cleanly without leaving orphaned UI or broken states.
  - Automated test suite expanded to 25/25 passing tests (`tests/production_flows.test.mjs`).
  - 0 ESLint warnings (`npm run lint`), and 100% clean Next.js 16 production build (`npm run build`).
  - Full documentation synchronization across `ARCHITECTURE.md`, `FIRESTORE_SCHEMA.md`, `ROLES_AND_PERMISSIONS.md`, `SECURITY.md`, `PRIVACY_AND_CONSENT.md`, `INTEGRATIONS.md`, `HANDOVER.md`, `ROADMAP.md`, and `CHANGELOG.md`.

---

## ✅ Phase 7: Stabilization, Cleanup & Production Hardening (Completed)
- [x] **Part A: Real-World Feedback Fixes**:
  - Seeded and tracked issues in `docs/FEEDBACK_LOG.md` (FB-101 to FB-105).
  - Fixed UTR input auto-capitalization and whitespace trimming.
  - Resolved print receipt layout clipping with dedicated `@media print` CSS.
  - Dynamic reschedule cutoff recalculation avoiding stale 24-hr windows on open modals.
  - Added non-intrusive `OfflineNotice` toast for dropped internet connections.
  - Replaced generic unavailable messages with explicit fully-booked notice on date picker.
- [x] **Part B: Code Health & Environment Validation**:
  - Validated client-side Firebase environment configuration on boot (`src/lib/env.ts`).
  - Verified React 19 purity compliance and clean error handling.
- [x] **Part C: Performance & Free-Tier Cost Safeguards**:
  - Capped unbounded Firestore collection queries with `limit(50)` to `limit(500)`.
  - Created `docs/COSTS_AND_LIMITS.md` detailing Firebase Spark and Vercel Hobby free-tier quotas.
- [x] **Part D: Security Re-Audit & Access Matrix**:
  - Implemented comprehensive Role Access Control Matrix unit tests in `tests/production_flows.test.mjs`.
  - Updated `docs/SECURITY.md` with 5-phase Incident Response protocol and OWASP Top 10 mitigation matrix.
- [x] **Part E: System Reliability & Recovery**:
  - Implemented System Maintenance Mode flag (`maintenanceMode`) with public banner and pause on new bookings.
  - Expanded `docs/BACKUP_AND_RECOVERY.md` with Firebase Auth export, Storage sync, and SPF/DKIM/DMARC DNS configuration.
- [x] **Part F: Accessibility & Content Audit**:
  - Verified 100% dynamic content from Firestore with zero hardcoded fake metrics.
  - Expanded `docs/CONTENT_GUIDE.md` in clear, conversational Hindi for Principal Ma'am.
- [x] **Part G: Operational Documentation**:
  - Created recurring maintenance guide (`docs/MAINTENANCE.md`).
  - Created operational standard operating procedures (`docs/RUNBOOK.md`).
  - Full test suite passing (28/28 tests), 0 lint errors, clean production build.

---

## 🔮 Future Enhancements (Post-Launch)
- [ ] **Psychometric Assessment Engine**: Embedded Holland Code (RIASEC) aptitude questionnaires.
- [ ] **Direct Payment Gateway Integration**: Razorpay / Cashfree SDK integration if high-volume automated processing is requested.

