# 🗺️ Product Roadmap — Inspiria Careers

This roadmap documents completed milestones, active Phase 2 features, and planned future enhancements.

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

## 🚀 Phase 2: Interactive Modules & Confidential Client Vault (Current)
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

## 🔮 Phase 3: Automation & Growth Features (Future)
- [ ] **Payment Gateway Integration**:
  - Razorpay / Stripe integration for seamless online session fees payment and automated invoicing.
- [ ] **Automated Reminders**:
  - WhatsApp Business API and SMS triggers for appointment confirmations and 1-hour prior session reminders.
- [ ] **Online Psychometric Assessment Engine**:
  - Integrated Holland Code (RIASEC) aptitude & personality questionnaire generating an automated career fit report for students.
- [ ] **WebRTC Video Session Room**:
  - Embedded end-to-end encrypted video meeting room directly in the student dashboard.
