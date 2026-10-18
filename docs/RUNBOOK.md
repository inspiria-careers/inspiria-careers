# 📘 Standard Operating Procedures Runbook (RUNBOOK.md)

This operational runbook provides clear, step-by-step Standard Operating Procedures (SOPs) for counsellors and platform administrators of **Inspiria Careers**.

---

## SOP-1: Handling a Missed Session or Client No-Show

### Context
A client fails to join their scheduled Google Meet / Zoom link or visit the office within 15 minutes of the agreed start time.

### Procedure
1. **Grace Period**: Wait 10–15 minutes. Send a polite WhatsApp message or email with the meeting link:
   > *"Hello [Client Name], Dr. Ananya Sharma is waiting in the counselling meeting room. Here is your direct link: [Link]. Please let us know if you are encountering technical difficulties."*
2. **Mark Status**: If the client does not join after 20 minutes, go to **Counsellor Dashboard -> Appointments**, find the card, and set status to **"No Show"**.
3. **Reschedule Courtesy**: If the client reached out with an emergency, the counsellor can manually click **"Reschedule"** to offer an alternative slot without charging a second fee.
4. **Audit**: The status change is automatically logged in client history.

---

## SOP-2: Responding to an Acute Mental Health Crisis Disclosure

### Context
A visitor, student, or client sends an intake response, contact message, or chat message indicating immediate risk of self-harm, severe distress, or emergency danger.

### Mandatory Protocol
1. **Do Not Rely Solely on Async Messaging**: Async messaging is not designed for active crisis management.
2. **Provide Immediate Toll-Free Helplines**: Immediately respond with emergency helpline numbers:
   - **Tele-MANAS (Govt of India)**: `14416` (24×7, multi-lingual, toll-free)
   - **KIRAN Mental Health Helpline**: `1800-599-0019` (24×7)
   - **iCall (TISS)**: `9152987821`
   - **National Emergency Response**: `112`
   - Direct web link: `/emergency`
3. **Minor Safeguarding**: If the client is under 18 years old and provided an emergency contact during intake, contact the nominated guardian immediately in accordance with professional ethical duty-of-care guidelines.
4. **Document Case Privately**: Record observations strictly in the counsellor's confidential **Session Notes** (`sessionNotes` collection). Never post crisis details in public chat or email threads.

---

## SOP-3: Resolving a Payment UTR Dispute / Fraudulent Ref Number

### Context
A client submits an appointment with a 12-digit UTR, but the funds are not reflected in the counsellor's bank account.

### Procedure
1. **Check Bank Statement**: Confirm whether the transaction was received under UPI IMPS / NEFT ref within 2 hours.
2. **UTR Format Check**: Verify that the UTR is exactly 12 alphanumeric characters without spaces.
3. **Communication**: If funds are genuinely not credited, in **Payments** tab, leave payment status as **"Pending Verification"** and message the client:
   > *"Hello [Name], we could not match UTR [XXXX] on our bank statement. Please reply with your UPI app payment receipt screenshot or double-check the reference number."*
4. **Flag Duplicate**: The database prevents identical UTR reuse via the `utrNumbers` collection. If duplicate submission occurs, verify whether the client submitted twice accidentally.
5. **Resolution**: Once verified, click **"Verify Payment"** to confirm the slot and generate an automated standard receipt (`REC-YYYYMMDD-XXXX`).

---

## SOP-4: Recovering an Accidental Document or Profile Deletion

### Context
A counsellor or admin accidentally overwrites or deletes site settings, a service, or an appointment.

### Procedure
1. **Activate Maintenance Mode**: Turn on Maintenance Mode to pause incoming public changes.
2. **Locate Last Backup Snapshot**:
   ```bash
   gcloud storage ls gs://[PROJECT_ID]-firestore-backups/daily/
   ```
3. **Targeted Import**:
   ```bash
   gcloud firestore import gs://[PROJECT_ID]-firestore-backups/daily/[LATEST_TIMESTAMP]/[LATEST_TIMESTAMP].overall_export_metadata \
     --collection-ids='siteContent'
   ```
4. **Verify**: Refresh `/dashboard/counsellor` to confirm restored profile data.
5. **Deactivate Maintenance Mode**: Turn off Maintenance Mode.

---

## SOP-5: Transferring Counsellor Role or Onboarding a New Admin

### Context
An existing counsellor or platform administrator needs to delegate access to another verified user.

### Procedure
1. Have the incoming user register at `/signup` (or login via Google).
2. The Primary Administrator navigates to `/dashboard/admin -> User Management`.
3. Locate the user by email or UID.
4. Change their role dropdown to **"Counsellor"** or **"Admin"**.
5. The action is recorded permanently in `auditLogs`.
6. The user immediately gains access upon refreshing their page.

---

## SOP-6: Zero-Downtime Deployment & Instant Rollback

### Production Deployment
```bash
# 1. Run local verification
npm run lint
npm run build
node --test tests/*.test.mjs

# 2. Push to main (Vercel automatically triggers production build)
git push origin main
```

### Instant Rollback (if unexpected error occurs in production)
1. Open [Vercel Dashboard](https://vercel.com) -> Deployments.
2. Locate the previous successful deployment.
3. Click the three dots `...` -> **"Instant Rollback"**.
4. Production traffic reverts to the known good build in under 5 seconds.
