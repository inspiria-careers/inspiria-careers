# 💰 Costs and Operational Limits Guide

This document outlines the free-tier infrastructure limits for the Career & Mental Wellness Counselling platform across **Firebase Spark (Free)** and **Vercel Hobby (Free)**, accompanied by the design safeguards implemented to keep operations permanently zero-cost.

---

## 1. Firebase Spark (Free Plan) Quotas

| Resource | Free Tier Allowance | Our Design Safeguards |
| :--- | :--- | :--- |
| **Firestore Document Reads** | **50,000 / day** | All queries capped via `limit(50)` to `limit(300)`. Site settings are read once into `SiteContext` state. Client dashboard only reads user's own appointments and vault. |
| **Firestore Document Writes** | **20,000 / day** | Booking submissions, review posts, and notes are created strictly upon direct user intent. No background polling write loops. |
| **Firestore Document Deletes** | **20,000 / day** | Admin/Counsellor operations only. Cascade deletions run client-side sequentially on confirmation. |
| **Firestore Stored Data** | **1 GiB total** | JSON documents are lean (~1–5 KB each). 1 GB accommodates >200,000 appointments, notes, and profiles. |
| **Firestore Network Egress** | **10 GiB / month** | Only JSON payload returned; heavy media stored in Firebase Storage or external CDNs. |
| **Firebase Storage Capacity** | **5 GiB total** | Client-side image resizing and compression before upload. Documents capped at 5 MB each. |
| **Firebase Storage Downloads** | **1 GiB / day** | Static avatars and site logos cached locally in browser. |
| **Firebase Authentication** | **Unlimited (Email/Password)** | Zero cost for email/password and phone auth within monthly free limits. |

---

## 2. Vercel Hobby (Free Plan) Limits

| Resource | Hobby Tier Limit | Our Architecture |
| :--- | :--- | :--- |
| **Bandwidth (Network Egress)** | **100 GB / month** | Next.js App Router with static generation where possible, client-side routing, and SVGs/CSS instead of heavy video assets. |
| **Serverless Function Executions** | **100,000 / month** | API routes (`/api/newsletter/*`, `/api/cron/*`) are minimal. Most database interactions run client-to-Firestore directly via secure security rules. |
| **Serverless Execution Timeout** | **10 seconds** | Reminder cron and newsletter confirmation routes complete in < 2 seconds. |
| **Vercel Cron Jobs** | **1 scheduled cron / day** | Daily reminder sweep scheduled at `0 3 * * *` (3:00 AM UTC / 8:30 AM IST) in `vercel.json`. |
| **Edge Middleware Invocations** | **1,000,000 / month** | No heavy middleware; route protection is enforced at client context and Firestore security rules level. |

---

## 3. Implemented Cost Safeguards in Codebase

1. **Unbounded Query Capping**:
   - `posts`: Capped at `limit(50)` on public catalog and `limit(100)` on counsellor dashboard.
   - `workshops`: Capped at `limit(50)`.
   - `reviews`: Capped at `limit(50)` on public page and `limit(100)` on moderation dashboard.
   - `resources`: Capped at `limit(50)` for public view and `limit(100)` for counsellor repository.
   - `auditLogs`: Capped at `limit(50)` ordered by descending timestamp.
   - `appointments`: Scoped by user ID for clients; capped at `limit(300)` for counsellor dashboard and `limit(1000)` for CSV export.
   - `subscribers`: Capped at `limit(500)` in moderation view.

2. **Index Optimization**:
   - Composite indexes defined in `firestore.indexes.json` prevent full-table collection scans.

3. **Client Storage & Compression**:
   - `src/lib/imageUtils.ts` enforces dimensions and compression for photos and site logos to prevent multi-megabyte payloads.
   - Document upload modal enforces 5 MB hard limits for PDFs/images.

4. **Maintenance Mode**:
   - Allows counsellor to temporarily pause new appointment bookings (`maintenanceMode: true`) during high-traffic surges or planned maintenance, preventing spam reads/writes.

5. **Upgrade Trigger Points**:
   - When active client appointments consistently exceed 5,000/month or storage exceeds 4 GB, upgrade to **Firebase Blaze Plan** (Pay-as-you-go). At current usage rates, monthly charges on Blaze would still remain under ₹200–500 ($3–6 USD).
