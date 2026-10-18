# 👥 Roles & Permissions Matrix — Inspiria Careers

This document details the exact permissions across the three system roles: **Admin**, **Counsellor**, and **Client**.

---

## 1. Permissions Matrix

| Resource / Action | Admin | Counsellor | Client | Public / Visitor |
| :--- | :---: | :---: | :---: | :---: |
| **Site Content & Branding** | | | | |
| View Public Pages (`/`, `/about`, `/services`, `/gallery`) | ✅ | ✅ | ✅ | ✅ |
| Change Site Name, Logo, Announcement Banner | ✅ | ❌ | ❌ | ❌ |
| Change Theme Colors, Fonts & Presets | ✅ | ❌ | ❌ | ❌ |
| Edit Counsellor Profile, Bio, Qualifications | ✅ | ✅ | ❌ | ❌ |
| Add / Edit / Remove Services | ✅ | ✅ | ❌ | ❌ |
| Add / Remove Gallery Photos & Videos | ✅ | ✅ | ❌ | ❌ |
| **User & Role Management** | | | | |
| View All Registered Users | ✅ | ❌ | ❌ | ❌ |
| Change User Roles (Admin / Counsellor / Client) | ✅ | ❌ | ❌ | ❌ |
| Trigger Password Reset for Users | ✅ | ❌ | ❌ | ❌ |
| Update Own Profile (Name, Avatar) | ✅ | ✅ | ✅ | ❌ |
| Delete Own Account & Export Personal Data | ✅ | ✅ | ✅ | ❌ |
| **Blog / Guidance Posts** | | | | |
| View Published Posts (`/posts`, `/posts/[slug]`) | ✅ | ✅ | ✅ | ✅ |
| View Draft / Unpublished Posts | ✅ | ✅ | ❌ | ❌ |
| Create / Edit / Delete Posts | ✅ | ✅ | ❌ | ❌ |
| **Appointments** | | | | |
| Book an Appointment (`/book`) | ✅ | ✅ | ✅ | ✅ |
| View Own Booked Appointments | ✅ | ✅ | ✅ (Own Only) | ❌ |
| View All Clients' Appointments | ✅ | ✅ | ❌ | ❌ |
| Confirm / Complete / Cancel Any Appointment | ✅ | ✅ | ❌ | ❌ |
| Cancel Own Pending Appointment | ✅ | ✅ | ✅ | ❌ |
| Configure Availability Schedule & Slots | ✅ | ✅ | ❌ | ❌ |
| Add Internal Counsellor Notes on Appointment | ✅ | ✅ | ❌ | ❌ |
| **Client Private Notes & Documents (Sensitive)** | | | | |
| Create / Edit / Delete Private Notes | ❌ | ❌ | ✅ (Own Only) | ❌ |
| Upload / Delete Private Documents (PDF/Images) | ❌ | ❌ | ✅ (Own Only) | ❌ |
| View Unshared Client Notes / Documents | ❌ | ❌ | ✅ (Own Only) | ❌ |
| View Client Notes / Docs marked `sharedWithCounsellor` | ❌ | ✅ | ✅ (Own Only) | ❌ |
| **Reviews & Feedback** | | | | |
| Submit Review / Testimonial | ✅ | ✅ | ✅ | ❌ |
| View Approved Reviews (`/reviews`, Home) | ✅ | ✅ | ✅ | ✅ |
| Approve / Reject / Hide Reviews | ✅ | ✅ | ❌ | ❌ |
| **Contact Inquiries (`messages`)** | | | | |
| Send Contact Message (`/contact`) | ✅ | ✅ | ✅ | ✅ |
| View / Manage Received Messages | ✅ | ✅ | ❌ | ❌ |
| **Payments & Financial Verification** | | | | |
| Upload / Update Counsellor Payment QR & UPI ID | ✅ | ✅ | ❌ | ❌ |
| Set Consultation Fees per Service (INR) | ✅ | ✅ | ❌ | ❌ |
| Submit Payment UTR Reference & Proof Screenshot | ❌ | ❌ | ✅ (Own Only) | ❌ |
| Verify Payment Credit & Confirm Session | ✅ | ✅ | ❌ | ❌ |
| Reject Payment with Mandatory Reason | ✅ | ✅ | ❌ | ❌ |
| Record Client Refund & Cancel Session | ✅ | ✅ | ❌ | ❌ |
| View / Print Computer-Generated Digital Receipt | ✅ | ✅ | ✅ (Own Only) | ❌ |
| Export Financial Payments Report (CSV) | ✅ | ✅ | ❌ | ❌ |
| **Phase 5: Counselling Features & Clinical Privacy** | | | | |
| Complete / Update Confidential Intake Questionnaire | ❌ | ❌ | ✅ (Own Only) | ❌ |
| View Client Intake Details | ❌ (Strictly Denied) | ✅ | ✅ (Own Only) | ❌ |
| Create / Edit Clinical Session Notes (`sessionNotes`) | ❌ (Strictly Denied) | ✅ | ❌ (Strictly Denied) | ❌ |
| Export / Print Clinical Session Notes | ❌ (Strictly Denied) | ✅ | ❌ (Strictly Denied) | ❌ |
| Create & Assign Client Tasks / Homework | ❌ | ✅ | ❌ | ❌ |
| Mark Task Completed & Add Reflection | ❌ | ✅ | ✅ (Own Only) | ❌ |
| Maintain Private Mindfulness & Gratitude Journal | ❌ | ❌ | ✅ (Own Only) | ❌ |
| View Journal marked `sharedWithCounsellor` | ❌ (Strictly Denied) | ✅ | ✅ (Own Only) | ❌ |
| Manage Educational Resources Hub (Create/Delete) | ❌ | ✅ | ❌ | ❌ |
| Manage Workshops, Capacity & Attendees | ❌ | ✅ | ❌ | ❌ |
| Register for Workshop / Join Waitlist | ✅ | ✅ | ✅ | ✅ |
| Submit DPDPA 2023 Formal Deletion Request | ❌ | ❌ | ✅ (Own Only) | ❌ |
| Process & Resolve DPDPA Deletion Queue | ✅ | ✅ | ❌ | ❌ |
| View Aggregate Insights (Pure CSS/SVG Analytics) | ❌ | ✅ | ❌ | ❌ |
| **Phase 6: Optional Add-ons & Messaging Privacy** | | | | |
| Exchange Asynchronous Messages & Attachments (`threads`) | ❌ (Strictly Denied) | ✅ | ✅ (Own Thread) | ❌ |
| Manage WhatsApp / SMS Reminder Opt-In (`reminderPreferences`) | ❌ | ✅ | ✅ (Own Only) | ❌ |
| Submit Private Session Feedback (`sessionFeedback`) | ❌ | ❌ | ✅ (Own Session) | ❌ |
| View Private Session Feedback & Manage Follow-up Queue | ❌ (Strictly Denied) | ✅ | ❌ | ❌ |
| Subscribe / Unsubscribe to Career Tips Newsletter | ✅ | ✅ | ✅ | ✅ |
| Manage Newsletter Subscribers & Export CSV | ✅ | ✅ | ❌ | ❌ |

---

## 2. Key Privacy Protections

1. **Client Confidentiality Rule**:
   - Private client notes and uploaded counselling documents are strictly private.
   - Even the **Admin** role does not have default read access to client documents or notes unless specifically shared with the counsellor.
2. **Review Integrity**:
   - Clients cannot publish unmoderated reviews directly to the public home page. Every review undergoes counsellor/admin approval to protect against spam or inappropriate content.
3. **Role Elevation Guard**:
   - Only existing authenticated Administrators can modify another user's role in the `users` Firestore collection.
   - The client application enforces this both in the UI and via Firestore security rules.
