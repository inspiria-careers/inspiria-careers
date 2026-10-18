# 🛠️ System Maintenance Guide (MAINTENANCE.md)

This maintenance guide outlines the recurring operational schedule, health checks, dependency auditing, and backup verification for **Inspiria Careers**.

---

## 1. Recurring Maintenance Schedule

### Daily Operational Checks (5 Minutes)
- **Review Pending Bookings**: Check Counsellor Dashboard -> **Appointments** for new appointment requests awaiting confirmation or payment verification.
- **Review UTR Submissions**: Cross-check any submitted UPI payments in **Payments** tab against the counsellor bank account statement.
- **Address Crisis Inquiries**: Review **Inbox** for any urgent client messages. If any urgent distress signals appear, refer immediately to the emergency protocol (`docs/RUNBOOK.md`).

### Weekly Maintenance (15 Minutes)
- **Review Moderation Queue**: Approve or reject public reviews (`/dashboard/counsellor -> Reviews`).
- **Review Feedback Ratings**: Check post-session qualitative ratings (`/dashboard/counsellor -> Session Feedback`) for clinical reflection.
- **Audit Logs Check**: Open `/dashboard/admin -> Audit Logs` to check for unexpected role changes or administrative activity.
- **Automated Backup Verification**: Verify that the daily Firestore export ran successfully in Google Cloud Storage (`gs://[PROJECT_ID]-firestore-backups/daily`).

### Monthly Maintenance (30 Minutes)
- **Quota & Cost Inspection**: Inspect Firebase Console -> Usage & Billing and Vercel Analytics to verify operations remain within free tier limits (see `docs/COSTS_AND_LIMITS.md`).
- **Dependency Security Audit**: Run `npm audit` and `npm outdated` locally. Review security advisories and update minor patch versions.
- **Verify DNS & SSL Health**: Check domain SSL expiry, SPF, DKIM, and DMARC status using MXToolbox or similar DNS analyzers.
- **Export Monthly Data Archive**: Download monthly appointments CSV and review CSV from `/dashboard/admin` and archive in secure counsellor offline storage.

### Quarterly Maintenance (1 Hour)
- **DPDPA Erasure Requests Review**: Ensure any submitted erasure requests (`deletionRequests` collection) have been processed within the 30-day statutory window.
- **Content & Service Review**: Update services list, fees, workshop offerings, and educational resources.
- **Disaster Recovery Simulation**: Perform a test import of a snapshot into a staging/emulator project to verify backup data integrity.

---

## 2. Dependency Management & Upgrade Cadence

1. **Safety Rule**: Never run `npm audit fix --force` blindly. This can downgrade major frameworks (e.g. Next.js / Firebase SDK).
2. **Standard Upgrade Command**:
   ```bash
   npm outdated
   npm update
   npm run lint
   npm run build
   node --test tests/*.test.mjs
   ```
3. **Major Version Migrations**:
   - Only test major Next.js or React updates on a separate Git branch.
   - Always run the full regression test suite (`node --test tests/*.test.mjs`) before merging to `main`.

---

## 3. Log Retention & Storage Hygiene

- **Firestore Audit Logs (`auditLogs`)**: Retain 180 days of administrative action records.
- **Cloud Storage**: Periodically remove temporary or rejected payment screenshots after verification is completed and receipts are generated.
- **Client Vault Documents**: Stored under client ownership; permanently deleted upon verified client account deletion.
