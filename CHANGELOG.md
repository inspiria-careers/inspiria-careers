# 📋 Changelog — Inspiria Careers

All notable changes to this project will be documented in this file.

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

### Removed
- Legacy bloated pages: `achievements`, `database`, `mentors`, `news`, `template`, `testimonials`, `webinars`.
- Heavy three.js scene files and unnecessary modals.
