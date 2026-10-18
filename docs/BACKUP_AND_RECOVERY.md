# 💾 Database Backup & Disaster Recovery Guide (BACKUP_AND_RECOVERY.md)

This document provides step-by-step procedures to back up, export, and restore Firestore database collections for **Inspiria Careers**.

---

## 1. Why Firestore Backups Matter

While Google Cloud guarantees 99.999% high availability, backups protect against:
- Accidental human deletion (e.g. deleting site settings or appointments by mistake).
- Malicious tampering or compromise.
- Migration to another cloud project or staging environment.

---

## 2. Prerequisites

1. Install Google Cloud SDK (`gcloud` CLI) on your local machine:
   ```bash
   gcloud init
   gcloud auth login
   gcloud config set project [YOUR_FIREBASE_PROJECT_ID]
   ```
2. Create a dedicated Cloud Storage Bucket for backups (e.g., `gs://[PROJECT_ID]-firestore-backups`):
   ```bash
   gcloud storage buckets create gs://[PROJECT_ID]-firestore-backups --location=asia-south1
   ```

---

## 3. Manual On-Demand Backup

To create an instant snapshot of the entire Firestore database before major updates:

```bash
gcloud firestore export gs://[PROJECT_ID]-firestore-backups/manual-backup-$(date +%Y%m%d)
```

To export only specific collections (e.g., settings, appointments, intake, workshops, reviews):
```bash
gcloud firestore export gs://[PROJECT_ID]-firestore-backups/critical-backup-$(date +%Y%m%d) \
  --collection-ids='siteContent','appointments','reviews','users','messages','workshops','workshopRegistrations','clientIntake','sessionNotes','resources','clientTasks','clientJournal'
```

---

## 4. Automated Daily Backup (Scheduled)

You can configure Google Cloud to run a daily export at midnight (IST):

1. **Enable Cloud Build & Cloud Functions / Cloud Scheduler API**:
   ```bash
   gcloud services enable cloudscheduler.googleapis.com
   ```
2. **Create a Cloud Scheduler Job**:
   ```bash
   gcloud scheduler jobs create http firestore-daily-backup \
     --schedule="0 2 * * *" \
     --time-zone="Asia/Kolkata" \
     --uri="https://firestore.googleapis.com/v1/projects/[PROJECT_ID]/databases/(default):exportDocuments" \
     --message-body='{"outputUriPrefix":"gs://[PROJECT_ID]-firestore-backups/daily"}' \
     --oauth-service-account-email="[PROJECT_ID]@appspot.gserviceaccount.com"
   ```

---

## 5. Restoration Procedure (Disaster Recovery)

If database records are accidentally deleted or corrupted, follow these steps to restore:

### Step 1: Identify the Backup Snapshot
List available snapshots in your Cloud Storage bucket:
```bash
gcloud storage ls gs://[PROJECT_ID]-firestore-backups/
```

### Step 2: Import Backup
Run the import command targeting the specific backup metadata directory:
```bash
gcloud firestore import gs://[PROJECT_ID]-firestore-backups/daily/[BACKUP_TIMESTAMP]/[BACKUP_TIMESTAMP].overall_export_metadata
```

To restore only a single collection (e.g. `siteContent`):
```bash
gcloud firestore import gs://[PROJECT_ID]-firestore-backups/daily/[BACKUP_TIMESTAMP]/[BACKUP_TIMESTAMP].overall_export_metadata \
  --collection-ids='siteContent'
```

> [!CAUTION]
> Importing documents will overwrite existing documents with matching IDs. New documents created after the backup timestamp remain untouched unless explicitly overwritten.

## 6. Firebase Authentication Export & Recovery

To back up all registered users and their credentials:
```bash
# Export user accounts to JSON
firebase auth:export users_backup.json --format=json --project [PROJECT_ID]

# Restore user accounts to a new or restored project
firebase auth:import users_backup.json --hash-algo=SCRYPT --project [PROJECT_ID]
```

---

## 7. Firebase Storage Assets Backup

To back up uploaded documents, client vault files, and site images from Cloud Storage:
```bash
# Sync entire storage bucket to local directory
gsutil -m rsync -r gs://[PROJECT_ID].firebasestorage.app ./storage_backup/

# Restore files from local directory to storage bucket
gsutil -m rsync -r ./storage_backup/ gs://[PROJECT_ID].firebasestorage.app/
```

---

## 8. Emergency Maintenance Mode Protocol

When performing major schema migrations, disaster recovery, or database restorations:

1. **Activate Maintenance Mode**:
   - In Counsellor Dashboard: Go to **Profile & Bio → System Maintenance Mode** toggle and turn ON.
   - Alternatively, via Firebase Console: in `siteContent/settings`, set `profile.maintenanceMode = true`.
2. **Client Experience**:
   - The top banner alerts visitors that scheduled maintenance is underway.
   - The booking page (`/book`) pauses submissions and links directly to `/emergency` helplines.
   - Counsellors and Administrators can still log in and view clinical records.
3. **Deactivate Maintenance Mode**:
   - Once database restoration or maintenance is complete and verified, toggle Maintenance Mode OFF.

---

## 9. Custom Domain Email Deliverability (SPF, DKIM, DMARC)

To prevent booking confirmations, reminders, and notifications from being marked as spam or spoofed by bad actors, configure these DNS records at your domain DNS registrar (e.g., Cloudflare, Namecheap, GoDaddy):

| Type | Name / Host | Value / Target | Purpose |
| :--- | :--- | :--- | :--- |
| **TXT** | `@` | `v=spf1 include:_spf.google.com ~all` *(or email provider SPF)* | Authorizes designated mail servers to send email on behalf of your domain. |
| **TXT** | `[selector]._domainkey` | `k=rsa; p=[PUBLIC_DKIM_KEY_FROM_PROVIDER]` | Cryptographically validates that outgoing email was not altered in transit. |
| **TXT** | `_dmarc` | `v=DMARC1; p=reject; rua=mailto:admin@yourdomain.com; aspf=r; adkim=r` | Instructs receiving inboxes to reject unauthenticated spoofed emails. |
| **MX** | `@` | `10 mail.yourdomain.com` (or Google Workspace / Zoho MX records) | Directs inbound email to verified mail servers. |

---

## 10. Client Data Portability (Self-Service)
Clients can download their own complete JSON data archive at any time directly from **Dashboard → Privacy & Data Rights → Export My Data**. This provides GDPR / DPDPA Article 20 compliance without needing administrative intervention.

