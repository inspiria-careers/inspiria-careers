# 🗄️ Firestore Database Schema — Inspiria Careers

This document defines the schema, field types, example documents, and access controls for all collections in Cloud Firestore.

---

## 1. Collection: `users`
- **Path**: `users/{uid}`
- **Description**: Stores user account profiles and role assignments.
- **Access**:
  - Read: Authenticated user (own doc) or Admin.
  - Create: Authenticated user (on signup).
  - Update: User (name/photo only); Admin (role assignment).

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` | `string` | Firebase Auth UID |
| `email` | `string` or `null` | User email address |
| `displayName` | `string` or `null` | Full name |
| `photoURL` | `string` or `null` | Profile photo URL |
| `role` | `"admin" \| "counsellor" \| "client"` | System role |
| `createdAt` | `timestamp` | Document creation timestamp |

```json
{
  "uid": "U1234567890",
  "email": "student@example.com",
  "displayName": "Rohan Gupta",
  "photoURL": "https://example.com/avatar.jpg",
  "role": "client",
  "createdAt": "2026-10-17T12:00:00Z"
}
```

---

## 2. Collection: `siteContent`
- **Path**: `siteContent/settings`
- **Description**: Global site configuration, counsellor credentials, services, gallery, theme settings, and availability.
- **Access**:
  - Read: Public (`allow read: if true;`)
  - Write: Admin and Counsellor.

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `profile` | `map` | Counsellor identity, bio, contact details, social links |
| `services` | `array<map>` | Array of `{ id, icon, title, description }` |
| `gallery` | `array<map>` | Array of `{ id, type, url, caption, category }` |
| `theme` | `map` | `{ preset, brandPrimary, brandSecondary, font }` |
| `availability` | `map` | `{ workingDays: string[], slots: string[], disabledDates: string[] }` |

---

## 3. Collection: `appointments`
- **Path**: `appointments/{appointmentId}`
- **Description**: Consultation booking requests and session management.
- **Access**:
  - Read: Client (own appointments: `userId == auth.uid`), Counsellor, Admin.
  - Create: Public or Authenticated client.
  - Update: Counsellor / Admin (status, notes); Client (cancel own pending appointment).

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` or `null` | Client UID (if logged in) |
| `clientName` | `string` | Name of candidate/parent |
| `clientEmail` | `string` or `null` | Notification email |
| `clientPhone` | `string` | WhatsApp/Contact number |
| `serviceId` | `string` or `null` | Selected service ID |
| `serviceTitle` | `string` | Title of counselling service |
| `date` | `string` (YYYY-MM-DD) | Appointment date |
| `timeSlot` | `string` | e.g. "10:00 AM - 11:00 AM" |
| `mode` | `"Online" \| "In-Person"` | Video call or office visit |
| `notes` | `string` | Candidate questions or background |
| `counsellorNote`| `string` | Internal counsellor remarks |
| `status` | `"pending" \| "confirmed" \| "completed" \| "cancelled"` | Status |
| `createdAt` | `timestamp` | Created timestamp |

---

## 4. Collection: `posts`
- **Path**: `posts/{postId}`
- **Description**: Career guidance articles, exam preparation tips, and updates.
- **Access**:
  - Read: Public (`published == true`); Counsellor / Admin (all).
  - Write: Counsellor and Admin.

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | Article headline |
| `slug` | `string` | URL-friendly slug (e.g. `career-after-12th`) |
| `category` | `string` | e.g. "Stream Selection", "Admissions" |
| `excerpt` | `string` | Short 1-2 sentence preview |
| `content` | `string` | Article body text |
| `coverImage` | `string` or `null` | Direct URL of cover photo |
| `coverImageAlt`| `string` | Accessibility alt text |
| `authorName` | `string` | Counsellor / author credit |
| `published` | `boolean` | Public visibility flag |
| `createdAt` | `timestamp` | Publication timestamp |

---

## 5. Collection: `reviews`
- **Path**: `reviews/{reviewId}`
- **Description**: Student and parent feedback, ratings, and testimonials.
- **Access**:
  - Read: Public (`approved == true`); Counsellor / Admin (all).
  - Create: Authenticated client.
  - Update / Delete: Counsellor and Admin.

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` or `null` | Reviewer UID |
| `clientName` | `string` | Display name formatted by privacy choice |
| `displayNameChoice` | `"full" \| "first_only" \| "anonymous"` | Display preference |
| `rating` | `number` (1 to 5) | Star rating |
| `comment` | `string` | Review text |
| `approved` | `boolean` | Approval status (default: `false`) |
| `createdAt` | `timestamp` | Submitted timestamp |

---

## 6. Collection: `clientNotes` (Confidential)
- **Path**: `clientNotes/{noteId}`
- **Description**: Private notes created by the client regarding their thoughts, questions, or action items.
- **Access**:
  - Read: Owner (`userId == auth.uid`), or Counsellor IF `sharedWithCounsellor == true`.
  - Write: Owner only (`userId == auth.uid`).
  - Admin access: **Forbidden** (Strict client confidentiality).

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Client UID |
| `title` | `string` | Note title |
| `content` | `string` | Private note text |
| `sharedWithCounsellor` | `boolean` | Toggle to share with counsellor |
| `updatedAt` | `timestamp` | Last updated timestamp |

---

## 7. Collection: `clientDocuments` (Confidential)
- **Path**: `clientDocuments/{docId}`
- **Description**: Uploaded scorecards, resumes, or report cards (max 5 MB).
- **Access**:
  - Read: Owner (`userId == auth.uid`), or Counsellor IF `sharedWithCounsellor == true`.
  - Write: Owner only (`userId == auth.uid`).
  - Admin access: **Forbidden**.

### Fields
| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | Client UID |
| `fileName` | `string` | Original file name |
| `fileUrl` | `string` | Cloud Storage or safe base64 URL |
| `fileType` | `string` | e.g. "application/pdf", "image/png" |
| `fileSize` | `number` | Size in bytes (max 5,242,880) |
| `sharedWithCounsellor` | `boolean` | Toggle to share with counsellor |
| `createdAt` | `timestamp` | Upload timestamp |

---

## 8. Collection: `messages`
- **Path**: `messages/{messageId}`
- **Description**: General inquiries received from the public `/contact` form.
- **Access**:
  - Create: Public (`allow create: if true;`)
  - Read / Manage: Counsellor and Admin.
