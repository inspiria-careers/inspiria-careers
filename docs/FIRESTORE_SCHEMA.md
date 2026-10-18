# 🗄️ Firestore Database Schema — Inspiria Careers

This document defines the schema, field types, example documents, and access controls for all collections in Cloud Firestore.

---

## 1. Collection: `users`
- **Path**: `users/{uid}`
- **Description**: Stores user account profiles and role assignments.
- **Access**:
  - Read: Authenticated user (own doc) or Admin.
  - Create: Authenticated user (on signup, default role `client`).
  - Update: User (name/photo only); Admin (role assignment, disabled toggle).
  - Delete: User (self-service account erasure) or Admin.

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | `string` | Firebase Auth UID |
| `email` | `string` or `null` | User email address |
| `displayName` | `string` or `null` | Full name |
| `photoURL` | `string` or `null` | Profile photo URL |
| `role` | `"admin" \| "counsellor" \| "client"` | System role |
| `disabled` | `boolean` (optional) | If true, user session is denied and auto-terminated |
| `createdAt` | `timestamp` | Document creation timestamp |

---

## 2. Collection: `siteContent`
- **Path**: `siteContent/settings`
- **Description**: Global site configuration, counsellor credentials, services, gallery, theme settings, availability, and feature flags.
- **Access**:
  - Read: Public (`allow read: if true;`)
  - Write: Admin and Counsellor.

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `profile` | `map` | Counsellor identity, bio, contact details, social links, `paymentQr: string`, `upiId: string`, `payeeName: string`, `refundPolicyText: string`, `siteLogoDark: string`, `siteLogoAlt: string`, `siteFavicon: string`, `cancellationCutoffHours: number`, `blockedDates: string[]`, `paymentsEnabled: boolean` |
| `services` | `array<map>` | Array of `{ id, icon, title, description, fee?: number }` |
| `gallery` | `array<map>` | Array of `{ id, type, url, caption, category }` |
| `theme` | `map` | `{ preset, brandPrimary, brandSecondary, font }` |
| `availability` | `map` | Working days, slots, and holiday schedules |

---

## 3. Collection: `appointments`
- **Path**: `appointments/{appointmentId}`
- **Description**: Consultation booking requests, session management, and manual payment verification.
- **Access**:
  - Read: Client (own appointments: `userId == auth.uid`), Counsellor, Admin.
  - Create: Public or Authenticated client.
  - Update: Counsellor / Admin (status, remarks, meeting link, verify/reject/refund payments); Client (cancel, reschedule, or submit UTR & screenshot with `paymentStatus: "submitted"`).

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` or `null` | Client UID (if logged in) |
| `clientName` | `string` | Name of candidate/parent |
| `clientEmail` | `string` or `null` | Notification email |
| `clientPhone` | `string` | WhatsApp/Contact number |
| `serviceId` | `string` or `null` | Selected service ID |
| `serviceTitle` | `string` | Title of counselling service |
| `serviceFee` | `number` or `null` | Consultation fee amount (INR) |
| `paymentStatus`| `"not_required" \| "pending" \| "submitted" \| "verified" \| "rejected" \| "refunded"` | Financial status |
| `utrNumber` | `string` or `null` | 12-digit UPI Transaction Reference / UTR |
| `paymentDate` | `string` or `null` | Date/time client completed the UPI transfer |
| `paymentScreenshotUrl` | `string` or `null` | Uploaded transfer proof screenshot in `/payments/{uid}/...` |
| `rejectionReason` | `string` or `null` | Counsellor note if payment is rejected (e.g. UTR mismatch) |
| `refundAmount` | `number` or `null` | Refund amount in INR (if session is refunded) |
| `refundNote` | `string` or `null` | Internal record of refund method and transaction |
| `receiptNumber` | `string` or `null` | Official receipt ID (`REC-YYYYMMDD-XXXX`) minted upon verification |
| `isDuplicateUtr` | `boolean` or `null` | Anti-fraud flag if UTR was already recorded in system |
| `verifiedAt` | `timestamp` or `null` | When counsellor approved payment |
| `verifiedBy` | `string` or `null` | Email/UID of verifying counsellor |
| `date` | `string` (YYYY-MM-DD) | Appointment date |
| `timeSlot` | `string` | e.g. "10:00 AM - 11:00 AM" |
| `mode` | `"Online" \| "In-Person"` | Video call or office visit |
| `meetingLink` | `string` or `null` | Secure Google Meet/Zoom link (visible to client only once confirmed) |
| `notes` | `string` | Candidate questions or background |
| `counsellorNote`| `string` | Internal counsellor remarks |
| `status` | `"pending" \| "confirmed" \| "completed" \| "cancelled"` | Session status |
| `rescheduleRequest`| `map` or `null` | `{ newDate, newTimeSlot, reason, requestedAt }` |
| `reminderSent` | `boolean` | Set to true after 24h prior cron reminder is processed |
| `createdAt` | `timestamp` | Created timestamp |

---

## 3b. Collection: `trNumbers` (Anti-Fraud UTR Index)
- **Path**: `trNumbers/{cleanUtr}`
- **Description**: Immutable index of submitted transaction reference numbers preventing duplicate UTR reuse across appointments.
- **Access**:
  - Read: Counsellor and Admin.
  - Create: Authenticated client (`userId == auth.uid`).
  - Update, Delete: Blocked (`allow update, delete: if false;`).

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `appointmentId` | `string` | Associated appointment ID |
| `userId` | `string` | Submitting client UID |
| `amount` | `number` | Consultation fee paid |
| `createdAt` | `timestamp` | Submission timestamp |

---

## 4. Collection: `posts`
- **Path**: `posts/{postId}`
- **Description**: Career guidance articles, entrance exam tips, and updates.
- **Access**:
  - Read: Public (`published == true`); Counsellor / Admin (all).
  - Write: Counsellor and Admin.

---

## 5. Collection: `reviews`
- **Path**: `reviews/{reviewId}`
- **Description**: Client feedback with mandatory counsellor moderation before public display.
- **Access**:
  - Read: Public (`approved == true`); Counsellor / Admin (all).
  - Create: Authenticated client (must default to `approved: false`).
  - Update/Delete: Counsellor and Admin.

---

## 6. Collection: `clientNotes` (Confidential Vault)
- **Path**: `clientNotes/{noteId}`
- **Description**: Private notes created by clients during their counselling journey.
- **Access**:
  - Strictly restricted: Client owner (`userId == auth.uid`); Counsellor only if `sharedWithCounsellor == true`. Admin has **NO** access.

---

## 7. Collection: `clientDocuments` (Confidential Vault)
- **Path**: `clientDocuments/{docId}`
- **Description**: Marksheets, certificates, aptitude reports uploaded by clients.
- **Access**:
  - Strictly restricted: Client owner (`userId == auth.uid`); Counsellor only if `sharedWithCounsellor == true`. Admin has **NO** access.

---

## 8. Collection: `messages`
- **Path**: `messages/{messageId}`
- **Description**: Inquiries submitted through the `/contact` form.
- **Access**:
  - Create: Public (`allow create: if true;`).
  - Read, Update, Delete: Counsellor and Admin.

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Sender full name |
| `email` | `string` or `null` | Sender email |
| `phone` | `string` or `null` | Sender telephone number |
| `message` | `string` | Inquired questions or consultation context |
| `status` | `"unread" \| "read" \| "replied"` | Inquiry workflow status |
| `createdAt` | `timestamp` | Submission timestamp |

---

## 9. Collection: `auditLogs` (Immutable System Trail)
- **Path**: `auditLogs/{logId}`
- **Description**: System audit events capturing administrative actions, role modifications, record deletions, and settings changes.
- **Access**:
  - Read: Admin only.
  - Create: Counsellor or Admin.
  - Update, Delete: **Blocked (`allow update, delete: if false;`)** to ensure an immutable audit log.

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `actorUid` | `string` | UID of admin or counsellor performing action |
| `actorEmail` | `string` or `null` | Email of actor |
| `actorRole` | `string` | Role (`admin` or `counsellor`) |
| `action` | `string` | Action code (e.g. `USER_ROLE_CHANGED`, `REVIEW_DELETED`, `SETTINGS_UPDATED`) |
| `details` | `string` | Human-readable description |
| `targetId` | `string` (optional) | Target entity ID |
| `timestamp` | `timestamp` | Event timestamp |

---

## 10. Collection: `clientIntake` (Confidential Intake Profiles)
- **Path**: `clientIntake/{userId}`
- **Description**: Clinical intake questionnaires completed by clients before consultation.
- **Access**:
  - Read, Write: Client owner (`auth.uid == userId`) and Counsellor (`getUserRole() == 'counsellor'`).
  - **Admin has ZERO read or write access.**

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | UID of client |
| `ageGroup` | `string` | Age bracket (`under_18`, `18_24`, `25_34`, `35_plus`) |
| `city` | `string` | Client residential city / state |
| `purpose` | `string` | Consultation purpose (e.g., `Career Guidance`, `Stress Management`) |
| `purposeDetail` | `string` | Short personal elaboration of session goals |
| `previousCounselling` | `boolean` | Prior therapy or guidance consultation history |
| `emergencyContactName` | `string` | Name of emergency contact person |
| `emergencyContactPhone` | `string` | Direct contact number |
| `preferredLanguage` | `string` | Preferred consultation language (`en`, `hi`, `other`) |
| `parentConsent` | `boolean` | Mandatory parental consent flag if `ageGroup === 'under_18'` |
| `parentName` | `string` | Parent / legal guardian full name (under-18) |
| `parentPhone` | `string` | Parent / legal guardian phone (under-18) |
| `acceptedConsentVersion` | `string` | Informed consent policy version code agreed to |
| `consentAcceptedAt` | `string` | ISO timestamp of consent agreement |

---

## 11. Collection: `sessionNotes` (Counsellor Clinical Records)
- **Path**: `sessionNotes/{appointmentId}`
- **Description**: Confidential clinical case notes and observations logged by the counsellor.
- **Access**:
  - Strictly Counsellor only (`getUserRole() == 'counsellor'`).
  - **Client and Platform Admin have ZERO access.**

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `appointmentId` | `string` | Associated consultation appointment ID |
| `clientId` | `string` | Client UID |
| `clientName` | `string` | Client display name |
| `sessionDate` | `string` | YYYY-MM-DD date of consultation |
| `summary` | `string` | Session summary |
| `observations` | `string` | Clinical behavioral and psychological observations |
| `homework` | `string` | Assigned homework or client action items |
| `nextSessionPlan` | `string` | Recommended follow-up timeline |
| `riskNotes` | `string` | Confidential safety or risk flags |
| `versions` | `array` | Revision history snapshots |
| `updatedAt` | `string` | ISO timestamp of last update |

---

## 12. Collection: `resources` (Counsellor Resource Hub)
- **Path**: `resources/{resourceId}`
- **Description**: Educational articles, worksheets, audio guides, and aptitude materials.
- **Access**:
  - Public resources: Readable by everyone (`resource.data.visibility == 'public'`).
  - Client-only resources: Readable by authenticated users (`request.auth != null`).
  - Create, Update, Delete: Counsellor only.

---

## 13. Collection: `clientTasks` (Assigned Homework & Actions)
- **Path**: `clientTasks/{taskId}`
- **Description**: Action steps and assignments given to clients by counsellor.
- **Access**:
  - Read: Task owner client (`auth.uid == resource.data.userId`) and Counsellor.
  - Create, Delete: Counsellor only.
  - Update: Client (marking completion, reflection text) and Counsellor.
  - **Admin has ZERO access.**

---

## 14. Collection: `clientJournal` (Private Mindfulness & Gratitude)
- **Path**: `clientJournal/{entryId}`
- **Description**: Daily emotional check-in, reflection, and gratitude logs.
- **Access**:
  - 100% private to client owner (`auth.uid == resource.data.userId`).
  - Counsellor has read access ONLY if `resource.data.sharedWithCounsellor == true`.
  - **Admin has ZERO access.**

---

## 15. Collection: `workshops` & `workshopRegistrations`
- **Path**: `workshops/{workshopId}`
  - Group webinars, masterclasses, and career workshops.
  - Public read; Counsellor write.
- **Path**: `workshopRegistrations/{regId}`
  - Client event tickets, payment status, and attendance logs.
  - Registered user or Counsellor read/write.

---

## 16. Collection: `slotLocks` (Atomic Concurrency Protection)
- **Path**: `slotLocks/{date_slot}`
- **Description**: Prevents double-booking race conditions during simultaneous booking checkouts.
- **Access**: Authenticated clients create/update via Firestore transaction.

---

## 17. Collection: `deletionRequests` (DPDPA 2023 Statutory Queue)
- **Path**: `deletionRequests/{requestId}`
- **Description**: Formal client erasure requests under Digital Personal Data Protection Act 2023.
- **Access**: Client create (`auth.uid == userId`); Counsellor & Admin manage resolution.

---

## 18. Collection: `threads` & `threads/{clientId}/messages` (Phase 6 Part A: Secure Messaging)
- **Path**: `threads/{clientId}`
- **Description**: Thread header document storing unread flags, last active timestamp, and client identity.
- **Subcollection Path**: `threads/{clientId}/messages/{messageId}`
- **Description**: Individual asynchronous messages and file attachments exchanged between client and counsellor.
- **Access**:
  - Read & Write: Authenticated Client owner (`auth.uid == clientId`) or Counsellor.
  - **Admin has ZERO access** (Strict least-privilege medical privacy isolation).
  - Messages have a 10-minute edit/soft-delete grace window. Soft-deleted messages clear content and retain metadata.

---

## 19. Collection: `reminderPreferences` (Phase 6 Part C: Reminders)
- **Path**: `reminderPreferences/{userId}`
- **Description**: Stores user's explicit opt-in preferences for WhatsApp / SMS appointment reminders.
- **Access**:
  - Read & Write: User owner (`auth.uid == userId`) and Counsellor.

---

## 20. Collection: `sessionFeedback` (Phase 6 Part E: Private Feedback)
- **Path**: `sessionFeedback/{feedbackId}`
- **Description**: Private post-session qualitative feedback, 1-5 rating, and return intent.
- **Access**:
  - Create: Authenticated Client (`auth.uid == resource.data.clientId`).
  - Read: Counsellor only.
  - **Admin has ZERO access**.
  - Never displayed publicly (strictly isolated from public `reviews`).

---

## 21. Collection: `subscribers` (Phase 6 Part F: Newsletter & Tips)
- **Path**: `subscribers/{subscriberId}`
- **Description**: Double opt-in newsletter subscribers with cryptographic tokens for confirmation and one-click unsubscription.
- **Access**:
  - Create: Public (initial state `confirmed: false`, `active: false`).
  - Read & Delete: Counsellor & Admin.
  - Update: Token verification/consumption via API endpoint.

