# 📘 AGENTS.md — Developer & AI Pair Programming Rules

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## 🎯 Project Core Principles (Non-Negotiable)

1. **Zero Hardcoded Counsellor Details**:
   - Counsellor name, qualifications, photo, specializations, biography, phone, WhatsApp, email, office address, timings, services, gallery, announcements, site title, and logo must **always** come dynamically from Firestore (`siteContent/settings`).
   - If fields are empty in Firestore, render clean, professional, respectful empty-state placeholders (e.g., *"Details will be updated soon"* / *"जानकारी जल्द अपडेट की जाएगी"*).
   - **Never insert fake statistics, placeholder metrics, or dummy testimonials.**

2. **Clean, Simple & Lean Architecture**:
   - Do not install heavy or unnecessary third-party libraries (e.g., no Three.js, no giant animation suites, no bloated UI kits).
   - Use standard **React 19**, **Next.js App Router**, **TypeScript**, and **Vanilla CSS** (`globals.css`) with CSS custom properties.
   - Keep components modular, accessible, and easily maintainable.

3. **Strict Secrets & Security Hygiene**:
   - **Never hardcode passwords, API secret keys, service accounts, or private credentials** in code or commits.
   - Only standard client-safe Firebase public keys (`NEXT_PUBLIC_FIREBASE_*`) belong in `.env.local` / `.env.example`.
   - Passwords must never be displayed in plain text in UI notes or admin screens.

4. **Enforce Dual-Layer Security (UI + Backend Rules)**:
   - UI route guards and disabled buttons are strictly for user convenience.
   - Actual security is enforced at the database level via `firestore.rules` and `storage.rules`.
   - Client private notes and documents must only be accessible to that client (`auth.uid == userId`), unless explicitly shared with counsellor (`sharedWithCounsellor == true`). Admin must **not** have blanket read access to private client counselling notes or documents.

5. **Calm, Professional & Accessible Aesthetics**:
   - Calming, trustworthy visual tone designed for mental wellness and academic guidance.
   - Maximum 2 primary brand colors controllable via CSS custom properties (`--brand-primary`, `--brand-secondary`).
   - Mobile-first responsive layout with fast load times and clean contrast ratios (WCAG AA compliant).
   - Full bilingual support (English & Hindi) driven by translation dictionaries (`src/translations/index.ts`).

6. **Quality & Zero Junk**:
   - After any modifications, `npm run build` and `npm run lint` must pass cleanly without warnings or type errors.
   - Delete obsolete, unused pages, templates, or legacy code instead of leaving dead files.
   - Every new Firestore collection or feature must be documented in `docs/` and reflected in `CHANGELOG.md`.
