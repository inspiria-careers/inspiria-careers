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

## 3. Incident Response: Token or Password Leak

If a password or API credential is leaked accidentally:
1. **Rotate Firebase API Key**:
   - Go to Google Cloud Console -> **APIs & Services** -> **Credentials**.
   - Generate a new browser key and update `.env.local` / Vercel Environment Variables.
2. **Revoke User Sessions**:
   - In Firebase Console -> **Authentication** -> **Users**, locate the affected account.
   - Click the three dots `...` -> **Reset Password** or **Disable Account**.
3. **Audit Firestore Access**:
   - Check Firebase Audit Logs to inspect any abnormal reads/writes.
4. **Git History Scrub**:
   - If secrets were committed to Git, use `git filter-repo` or BFG Repo-Cleaner to permanently scrub the commit history, then force-push clean commits.

---

## 4. Firestore & Storage Rules Overview

### Firestore Rules Summary
- `users`: Users can read and write only their own basic profile info; only admins can edit the `role` field.
- `siteContent`: Read by everyone; updated only by users with `role == "admin"` or `role == "counsellor"`.
- `appointments`: Clients can view and cancel their own appointments; counsellors/admins can view and update all.
- `clientNotes` & `clientDocuments`: Owner can read and write; counsellor can read **only if** `sharedWithCounsellor == true`. Admin has no direct read access to uphold client confidentiality.
- `posts`: Public can read published posts; only counsellors/admins can create, edit, or delete posts.
- `reviews`: Public can read approved reviews; clients can create pending reviews; counsellors/admins moderate.

### Storage Rules Summary
- Files are limited to `5MB`.
- Allowed MIME types: images (`image/*`) and PDFs (`application/pdf`).
- Path pattern: `/clients/{uid}/{fileName}` allows read/write only to `{uid}`, with read allowed to counsellors if flagged shared in Firestore.
