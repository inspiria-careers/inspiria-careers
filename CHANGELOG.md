# 📋 Changelog — Inspiria Careers

All notable changes to this project will be documented in this file.

## [Phase 7.1.0] - 2026-10-18

### Added & Enhanced
- **Admin Full Website Content Control**:
  - Expanded `/dashboard/admin` with full control over all website content: Counsellor Identity & Bio (name, title, photo, qualifications, bio, badges, metrics), Services & Pricing, Gallery images/videos, Site Branding & Footer customization, Booking rules & UPI/QR payment details, Dynamic bilingual FAQs & 24x7 Emergency Helplines, Feature Flags & Maintenance mode, Theme Presets, Audit logs, and CSV exports.
- **Dynamic Consultation Booking Fee Control**:
  - Added `defaultConsultationFee` to `siteContent/settings` (SiteProfile) editable directly by Counsellor / Principal Ma'am in `/dashboard/counsellor` and by Admin in `/dashboard/admin`.
  - Added inline edit controls for individual service fees and descriptions in both Counsellor and Admin dashboards.
  - Enhanced `/book` booking flow: services without an explicit fee automatically fall back to the counsellor's default consultation fee, with live fee display badge ("₹X" or "Free / निःशुल्क").
- **Client Profile & Details Self-Service Editing**:
  - Expanded `/dashboard/client` Profile tab allowing registered clients/users to edit their Full Name (`displayName`), Phone Number (`phone`), and Profile Photo / Avatar with direct device upload via `ImageUploader`.
- **Transactional Booking & Appointment Email Service**:
  - Implemented `/api/email/booking-confirmation` providing automated bilingual emails for booking received, session confirmation, and cancellations.
  - Automatically sends live emails via Resend HTTP API when `RESEND_API_KEY` is configured in `.env.local`, with zero-crash safe dry-run console fallback during development.
  - Booking page (`/book`) and Counsellor dashboard automatically trigger confirmation emails with verified session date, time, and location/meeting link.
- **Universal Video & Media Embed Engine**:
  - Added `src/lib/videoUtils.ts` with automated parsing of YouTube standard links (`watch?v=`), short links (`youtu.be/`), Shorts (`shorts/`), Vimeo embeds, and direct HTML5 MP4/WebM video players in Gallery and Resources.
- **Direct Document & PDF Upload in Educational Resources**:
  - Added direct device file uploader in Counsellor Dashboard (`/dashboard/counsellor → Resource Hub`) allowing counselors to upload PDFs, worksheets, audio, or video files up to 10MB to Cloud Storage alongside external links.
- **Client & Counsellor Messaging Attachments**:
  - Documented and refined peer-to-peer asynchronous messaging attachment exchange (PDF, JPG, PNG up to 5MB) via Cloud Storage with private per-client isolation.
- **Fixed Firestore setDoc Undefined Field in Intake Form**:
  - Resolved `Unsupported field value: undefined (parentName)` error in `IntakeModal.tsx` by replacing `undefined` with `null` for adult clients (18+), ensuring seamless intake submission.
  - Added dedicated QR code card with scan-to-pay preview on `/book` success screen.

## [Phase 7.0.0] - 2026-10-18

### Fixed & Stabilized (Part A: Feedback Fixes)
- **UTR Input Casing & Spacing (FB-101)**: Added automatic uppercase conversion and whitespace trimming to prevent bank reference mismatch.
- **Print Receipt Clipping (FB-102)**: Added dedicated `@media print` rules ensuring clean, full-width receipts on A4 without navbar/footer clutter.
- **Dynamic Reschedule Cutoff (FB-103)**: Dynamic calculation of 24-hour cutoff on modal open, preventing stale cutoff windows.
- **Offline Connection Notice (FB-104)**: Added non-intrusive floating `OfflineNotice` toast alerting users of network drops with reconnect notifications.
- **Fully-Booked Date Notice (FB-105)**: Date selector now displays explicit "all slots fully booked" notice with alternative dates advice.

### Added & Hardened (Parts B–G)
- **Firebase Environment Validation**: Startup validation in `src/lib/env.ts` checking required public Firebase configuration keys.
- **Query Capping & Cost Protection**: Added `limit(50)` to `limit(500)` to all Firestore collection queries across public catalog and counsellor dashboards, preventing Spark free-tier quota exhaustion.
- **System Maintenance Mode**: Added `maintenanceMode` toggle in Counsellor Settings with top banner and booking pause, while maintaining administrative login.
- **Security Matrix & OWASP Hardening**: Added 3 new unit tests in `tests/production_flows.test.mjs` verifying role access isolation and anti-XSS sanitization (28/28 passing).
- **Incident Response Protocol**: Documented formal 5-step incident response and breach notification protocol in `docs/SECURITY.md`.
- **Operations & Runbooks**: Added `docs/COSTS_AND_LIMITS.md`, `docs/MAINTENANCE.md`, `docs/RUNBOOK.md`, and updated `docs/BACKUP_AND_RECOVERY.md` with Auth/Storage recovery commands and email DNS records.
- **Hindi Content Guide**: Expanded `docs/CONTENT_GUIDE.md` with simple Hindi instructions for QR verification, clinical notes, and feature flags.

---

## [Phase 6.0.0] - 2026-10-18

### Added
- **Modular Feature Flag Architecture**:
  - Independent feature flags in `siteContent/settings`: `messagingEnabled`, `smsRemindersEnabled`, `feedbackEnabled`, `newsletterEnabled`.
  - All add-ons default to **OFF** (`false`), allowing zero regression and immediate clean rollback.
  - Interactive feature flag toggles in Counsellor Settings (`/dashboard/counsellor → Profile & Bio`).
- **Secure Asynchronous Messaging (Part A - flag: `messagingEnabled`)**:
  - Private client-counsellor communication threads (`threads/{clientId}` & `threads/{clientId}/messages/{messageId}`).
  - File attachments support (PDF, JPEG, PNG, max 5MB) via Cloud Storage (`/messages/{clientId}/{fileName}`).
  - 10-minute edit and soft-delete grace window (`deleted: true`) preserving audit trail while clearing message content.
  - Client-side rate limiting (max 5 messages per minute).
  - Prominent emergency notice banner with customizable counsellor expected response time display.
  - Transparent legal disclaimer: messages are stored securely in Firestore with least-privilege rules without false E2EE claims.
  - Strict confidentiality: Only client owner and counsellor have access. **Platform Admin has ZERO read or write access.**
- **WhatsApp & SMS Reminders Abstraction (Part C - flag: `smsRemindersEnabled`)**:
  - Provider-agnostic reminder service (`src/lib/reminderService.ts`) operating in out-of-the-box dry-run console mode.
  - Explicit client opt-in checkbox and channel selector (WhatsApp or SMS) in Client Dashboard (`/dashboard/client → Privacy & Data Rights`).
  - Minimal, safe transactional templates containing strictly appointment logistics (client name, date, slot), with ZERO clinical disclosures or diagnostic keywords.
  - Complete integration guide (`docs/INTEGRATIONS.md`) detailing Meta Cloud API, Indian Telecom DLT registration, and Vercel Cron limits.
- **Private Session Feedback & Follow-up Queue (Part E - flag: `feedbackEnabled`)**:
  - Confidential post-session feedback modal on completed appointments (`sessionFeedback` collection) with 1-5 star ratings, helpful aspects, improvement areas, and return intent.
  - Strict separation from public testimonials: **Platform Admin and Public have ZERO access** to session feedback.
  - Counsellor Follow-up Queue: Automatically identifies clients who completed a consultation > 7 days ago with no follow-up booking.
  - One-click "Send Follow-up Nudge" action trigger with dry-run logging and `followupSentAt` tracking.
- **Newsletter & Career Tips Subscription (Part F - flag: `newsletterEnabled`)**:
  - Dynamic double opt-in subscription box in website footer (`src/components/NewsletterSubscribe.tsx`).
  - Next.js API endpoints for subscription (`/api/newsletter/subscribe`), cryptographic token confirmation (`/api/newsletter/confirm`), and one-click unsubscription (`/api/newsletter/unsubscribe`).
  - Isolated subscriber collection (`subscribers`) with Counsellor Dashboard subscriber list and CSV export.
- **Quality, Security, Handover & Testing (Part G)**:
  - Firestore security rules updated for `threads`, `reminderPreferences`, `sessionFeedback`, and `subscribers`.
  - Storage security rules updated for `/messages/{clientId}/{fileName}`.
  - Automated test suite expanded to 25/25 passing unit tests in `tests/production_flows.test.mjs`.
  - 0 ESLint warnings (`npm run lint`) and clean Next.js 16 production build (`npm run build`).
  - Documentation updated across `ARCHITECTURE.md`, `FIRESTORE_SCHEMA.md`, `ROLES_AND_PERMISSIONS.md`, `SECURITY.md`, `PRIVACY_AND_CONSENT.md`, `INTEGRATIONS.md`, `HANDOVER.md`, `ROADMAP.md`, and `CHANGELOG.md`.

---

## [Phase 5.0.0] - 2026-10-18

### Added
- **Confidential Intake Form & Versioned Informed Consent (Part A)**:
  - First-time client confidential intake modal prompting for age bracket, city, counselling purpose, previous counselling history, emergency contact, and language preference.
  - Minor Under-18 Safeguards: Mandatory Parent / Legal Guardian name, phone, and explicit parental consent checkbox before appointment booking.
  - Versioned informed consent stored in `siteContent/settings.consentVersion`; records agreement timestamps and version strings in `clientIntake` records.
  - Strict privacy enforcement: Only the attending Counsellor and Client owner have database read/write access. **Platform Admin is denied all access via `firestore.rules`.**
- **Counsellor Private Session Notes & DPDPA Queue (Part B)**:
  - Clinical session notes modal accessible only to Counsellor (`sessionNotes/{appointmentId}`).
  - Structured documentation: session summary, clinical observations, homework tasks, next session timeframe, and risk/safety flags.
  - Real-time `localStorage` autosave draft preservation plus Firestore cloud sync.
  - Revision history tracking with snapshot timestamps.
  - Clean printable / PDF layout (`window.print()`) and JSON export.
  - DPDPA 2023 formal deletion requests queue in Counsellor Dashboard fulfilling India's data protection obligations within 30 days.
  - Strictly Counsellor-only access in `firestore.rules` (Client and Admin denied).
- **Counsellor Resource Hub, Tasks & Client Mindfulness Journal (Part C)**:
  - Counsellor Educational Resource Hub (`resources`): upload PDFs, links, audio guides, and articles with public vs client-only visibility.
  - Public resource directory at `/resources` with category filters.
  - Task assignment system (`clientTasks`): Counsellor assigns action items; Client completes with reflection notes.
  - Client Mindfulness & Gratitude Journal (`clientJournal`): Daily mood rating (1-5), reflection log, and gratitude entry. 100% private to client by default; optional share with counsellor; zero external AI processing.
- **Workshops & Group Events Management (Part D)**:
  - Counsellor Workshop Manager: create/edit workshops, set seat capacity, mode (online/in-person), meeting links/venue, and fees.
  - Public workshops index `/workshops` and registration route `/workshops/[id]`.
  - Real-time seat limit enforcement with automatic waitlist queue transition.
  - Full integration with Phase 4 manual UPI QR and UTR payment verification flow for paid events.
  - One-click CSV attendee roster export and attendance tracking (`present` / `absent`).
- **Smarter Scheduling & Atomic Booking Concurrency (Part E)**:
  - Configurable session durations (30m, 45m, 60m) and buffer times (0m, 10m, 15m).
  - Weekly recurring IST schedule builder in Counsellor Settings with individual day-of-week toggles.
  - Atomic booking concurrency via Firestore transactions on `slotLocks/{date_slot}` eliminating double bookings.
  - "No-show" appointment status option.
- **Aggregate Insights Dashboard (Part F)**:
  - High-performance, lightweight pure CSS/SVG visual analytics dashboard (zero external charting dependencies).
  - Aggregate metrics: Monthly booking volume, verified revenue (₹), popular services breakdown, cancellation rate, no-show rate, client return rate.
  - Strict privacy: Zero client PII displayed.
- **Trust, Safety & Emergency Helplines (Part G)**:
  - Dynamic bilingual FAQ page (`/faq`) with instant search filter.
  - Emergency Helplines directory (`/emergency`) with verified Indian mental health crisis contacts (Tele-MANAS `14416`, KIRAN `1800-599-0019`, iCall `9152987821`, Vandrevala `9999 666 555`, National Emergency `112`) with click-to-dial links.
  - Emergency crisis disclaimer banner across `/book`, `/contact`, `/offline`, and site footer.
  - Counsellor professional registration number (RCI / APC) displayed on `/about` and site footer.
- **PWA & Offline Fallback (Part H)**:
  - Web App Manifest (`/manifest.webmanifest`) for installable mobile home-screen experience.
  - Custom offline fallback route (`/offline`) featuring retry controls and direct-dial emergency helplines.
  - Complete bilingual dictionary in `src/translations/index.ts`.
- **Launch Readiness & Automated Verification (Part I)**:
  - `docs/LAUNCH_CHECKLIST.md` complete pre-launch smoke testing guide.
  - Automated test suite expanded to 20/20 passing tests in `tests/production_flows.test.mjs`.
  - 0 ESLint warnings (`npm run lint`) and clean Next.js 16 production build (`npm run build`).

---

## [Phase 4.0.0] - 2026-10-18

### Added
- **Manual QR & UPI Payment System (Part A)**:
  - Zero third-party payment gateway SDKs or commissions: direct UPI transfers via Google Pay, PhonePe, Paytm, and BHIM.
  - Counsellor Settings: Upload official Payment QR code image, set UPI ID (VPA), payee name, and custom cancellation/refund policy text in `siteContent/settings`.
  - Service Fees: Admin and counsellor can configure INR consultation fees per service (0 or empty skips payment).
  - Client Booking & Payment Flow:
    - Creates appointment with `paymentStatus: "pending"` (or `"not_required"` if fee = 0).
    - Client dashboard interactive payment modal with dynamic QR display, one-click UPI ID copy, mobile `upi://pay` deep link, and submission form.
    - Mandatory 12-digit UTR transaction reference number, payment date/time, and optional screenshot proof.
    - Transitions appointment to `paymentStatus: "submitted"`.
  - Anti-Fraud & Database Security:
    - `firestore.rules`: Clients are strictly forbidden from setting `paymentStatus: "verified"` or `"refunded"`.
    - Dedicated `trNumbers/{cleanUtr}` index detects duplicate transaction reference numbers across appointments, alerting the counsellor with a prominent red badge.
    - `storage.rules`: Payment proof screenshots stored in private `/payments/{userId}/{fileName}` bucket accessible only to client owner, counsellor, and admin.
  - Counsellor Payment Verification Dashboard (`activeTab === "payments"`):
    - Mandatory verification safety banner in Hindi and English reminding counsellor to match UTR in real bank statement before approving.
    - Live financial counter cards: Pending Submissions, Total Verified (₹), Rejected (Count), Refunded (₹).
    - Status filtering, search query (client name, phone, UTR, receipt no), and date range filters.
    - Actions: Verify & Confirm (auto-confirms appointment, issues computer receipt), Reject (mandatory reason for client resubmission), and Refund (records refund amount and notes).
    - Export Payments (CSV): Full financial report export.
  - Official Computer-Generated Digital Receipts:
    - Standardized receipt format (`REC-YYYYMMDD-XXXX`) minted upon payment verification.
    - Printable PDF-style layout with counsellor/site branding, client details, slot details, UTR reference, refund policy note, and legal disclaimer.
    - Client and Counsellor can view and print receipts with one click (`window.print()`).
- **Logo & Branding Upload (Part B)**:
  - Universal reusable `ImageUploader` component (`src/components/ImageUploader.tsx`) supporting PNG, SVG, JPG, WebP (max 2MB/3MB, drag & drop, client-side canvas compression, live preview thumbnail, alt text).
  - Admin Dashboard: Replaced plain URL input with `ImageUploader` for Primary Site Logo, Dark Mode Logo, and Favicon, plus Logo Alt Text.
  - Counsellor Dashboard: Replaced plain URL input with `ImageUploader` for Counsellor Profile Photo and Payment QR code.
  - Public Navbar: Accessible alt text dynamically sourced from `profile.siteLogoAlt`.
- **Documentation & Testing (Part C)**:
  - Replaced `docs/PAYMENTS_PLAN.md` with comprehensive `docs/PAYMENTS.md` containing Mermaid state machine diagram, roles matrix, security protections, and step-by-step Hindi counsellor verification guide.
  - Updated `docs/FIRESTORE_SCHEMA.md`, `docs/ROLES_AND_PERMISSIONS.md`, `docs/SECURITY.md`, and `README.md`.
  - Expanded automated test suite in `tests/production_flows.test.mjs` covering UTR format validation, UPI deep links, receipt number generation, and state machine transitions.

---

## [Phase 3.0.0] - 2026-10-17

### Added
- **Appointment Upgrades (Part A)**:
  - Session mode selection: Online (video consultation) vs In-Person (office visit).
  - Secure Meeting Link field for Counsellor (Google Meet / Zoom / WhatsApp), rendered exclusively to the client once confirmed.
  - Add to Calendar: RFC 5545 `.ics` file generator/downloader and one-click Google Calendar web link.
  - Appointment Rescheduling: Client reschedule request workflow with preferred date, slot, and reason; counsellor approval & rejection controls.
  - Cancellation & Reschedule cutoff window (default: 24h prior) configured in settings.
  - Counsellor Blocked Dates / Holidays manager preventing bookings on unavailable dates.
  - Automated 24h prior reminder endpoint (`/api/cron/reminders`) secured by `CRON_SECRET` with `vercel.json` daily cron schedule.
  - 5 safe bilingual email notification templates (`src/lib/emailTemplates.ts`) strictly omitting confidential counselling notes.
- **Admin & Counsellor Operations (Part B)**:
  - Admin User Management: Account deactivation toggle (`disabled: boolean`) with automatic session termination.
  - System Audit Log collection (`auditLogs`) and Admin log viewer for role updates, deletions, and settings changes.
  - Counsellor Dashboard Overview: Live counters for Today's Sessions, Pending Bookings, Pending Reviews, and Inquiries.
  - Data Export Hub: One-click CSV downloads for appointments and client reviews.
  - Contact Form Messages Inbox with status workflow (`unread`, `read`, `replied`).
- **SEO, Performance & Accessibility (Part C)**:
  - Dynamic XML sitemap (`/sitemap.xml`) via `sitemap.ts` and search engine directives (`/robots.txt`) via `robots.ts`.
  - JSON-LD Structured Data (`LocalBusiness` & `Person`) rendered from Firestore profile.
  - Subroute layouts providing unique page titles, descriptions, canonical URLs, and OpenGraph tags.
  - Optimized typography loading via `next/font/google` (Inter).
  - Custom calm bilingual 404 page (`not-found.tsx`) and error boundary (`error.tsx`).
  - Privacy-friendly, cookie-free default stance.
- **Security Hardening (Part D)**:
  - Comprehensive HTTP security headers in `next.config.ts` (HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`).
  - Firebase App Check integration with reCAPTCHA v3 in `src/lib/firebase.ts`.
  - Re-audited `firestore.rules` and `storage.rules` with immutable audit log protection and reschedule permissions.
  - Git history security scan confirming zero leaked passwords or secrets.
  - Strong password policy enforcement (8+ characters) on signup and email password reset flow.
  - Complete GDPR/DPDPA data erasure verification.
- **Language & Content Polish (Part E)**:
  - 100% complete bilingual English and Hindi translation dictionary in `src/translations/index.ts`.
  - Floating non-intrusive WhatsApp click-to-chat button.
  - Emergency mental health helpline banner (iCall & Vandrevala Foundation) in footer.
- **Payments Preparation (Part F - Off by Default)**:
  - Feature flag `paymentsEnabled: false` in `siteContent/settings` and Admin dashboard.
  - Optional `fee` field on services and `paymentStatus` on appointments.
  - Complete Razorpay architecture blueprint in `docs/PAYMENTS_PLAN.md`.
- **Testing & Quality (Part G)**:
  - Automated test suite (`tests/production_flows.test.mjs`) verifying calendar generation, cutoff logic, privacy protection, honeypots, and account disabling.
  - Added `npm test` script.
  - Pre-release manual QA checklist in `docs/QA_CHECKLIST.md`.
- **Handover & Recovery (Part H)**:
  - `docs/BACKUP_AND_RECOVERY.md`: Firestore export, automated cloud schedules, and disaster recovery.
  - `docs/HANDOVER.md`: Account ownership registry, role matrix, and Hindi troubleshooting guide.
  - Updated `docs/DEPLOYMENT.md`, `docs/CONTENT_GUIDE.md`, `docs/FIRESTORE_SCHEMA.md`, `docs/ROADMAP.md`, `README.md`.

---

## [Phase 2.0.0] - 2026-10-17

### Added
- **Documentation Suite**:
  - `AGENTS.md`: Core developer rules and strict guidelines.
  - `README.md`: Complete project overview, architecture, and commands.
  - `docs/ARCHITECTURE.md`: Routing map, component hierarchy, data lifecycle, and Mermaid auth diagram.
  - `docs/ROLES_AND_PERMISSIONS.md`: Role matrix for Admin, Counsellor, and Client.
  - `docs/FIRESTORE_SCHEMA.md`: Schema, types, and access controls for all collections.
  - `docs/SECURITY.md`: Secrets management, bootstrap guide, and leak mitigation.
  - `docs/PRIVACY_AND_CONSENT.md`: Data retention, client export/delete, and bilingual policy draft.
  - `docs/CONTENT_GUIDE.md`: Simple Hindi operational guide for counsellors.
  - `docs/DEPLOYMENT.md`: Step-by-step Vercel and Firebase production setup.
  - `docs/ROADMAP.md`: Milestones and upcoming roadmap.
- **Guidance Blog & Knowledge Hub**:
  - Auto-generated slugs, category filters, and single post reader route `/posts/[slug]` with OpenGraph tags.
  - Post editor with draft/published status toggle and alt text support.
- **Client Reviews & Testimonials**:
  - Client review submission with privacy display selector (`full`, `first_only`, `anonymous`).
  - Counsellor/Admin moderation panel (approve/reject/hide).
  - Dedicated `/reviews` page and dynamic Home page review showcase.
- **Confidential Client Notes & Document Vault**:
  - Private notes and document uploads (PDF/JPG/PNG up to 5 MB) stored securely.
  - `"Share with counsellor"` per-item toggle.
  - GDPR/DPDPA compliant "Export My Data (JSON)" and "Delete My Account & Data".
- **Advanced Theme Customiser (Admin)**:
  - 5 pre-configured calm color themes, custom color pickers, font selector, live preview, and low-contrast accessibility warnings.
- **Appointment Enhancements**:
  - Double-booking prevention with slot availability settings.
  - Counsellor internal notes and appointment workflow tracking.
- **Security & Quality**:
  - Hardened `firestore.rules` and `storage.rules`.
  - Client-side image compression and anti-spam honeypot protection on forms.

---

## [Phase 1.0.0] - 2026-10-17

### Added
- Complete refactoring into clean Next.js 16 App Router architecture.
- Real Firebase Authentication with Google Sign-In and Email/Password.
- Dynamic Firestore-driven content (`siteContent/settings`) with zero hardcoding.
- 3 distinct system roles: **Admin**, **Counsellor**, and **Client**.
- Edge middleware route guards for dashboard protection.
- Bilingual English / हिन्दी switcher across all navigation and content.
- Clean vanilla CSS design system with CSS custom properties.
- Dedicated public pages: Home, About Us, Services, Gallery, Contact, Book Appointment, Privacy Policy.
