# 📝 Real-World Feedback & Resolution Log — Inspiria Careers

This document tracks feedback from test users, candidates, and counsellor sessions. Each item contains reproduction steps, root cause analysis, technical resolution, and regression test verification.

---

## Feedback Items Table

| ID | Category | Reported Issue | Status | Resolution Summary | Test Coverage |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **FB-101** | Payments | Bank UTR copied from UPI apps with spaces or lowercase failed validation | `FIXED` | Auto-trim whitespace and uppercase strings in `validateUtr` & payment form inputs | `production_flows.test.mjs` |
| **FB-102** | Print / UI | Digital payment receipt cuts off margins when printing to PDF on mobile browsers | `FIXED` | Enhanced `@media print` CSS isolating `.receipt-card` with clean A4 margins | Visual + CSS media print check |
| **FB-103** | Scheduling | Stale minimum date when reschedule modal is opened after prolonged tab idle time | `FIXED` | Dynamically recompute `minRescheduleDate` upon modal opening | `production_flows.test.mjs` |
| **FB-104** | Connectivity | Form hangs silently without feedback when user network drops mid-submission | `FIXED` | Global `OfflineNotice` listener alerting users immediately if connection drops | Component + Browser events |
| **FB-105** | Booking | Ambiguous empty dropdown when all slots for a selected date are booked or blocked | `FIXED` | Render clear bilingual notice *"No slots available on this date / इस तिथि पर कोई स्लॉट उपलब्ध नहीं है"* | UI unit test in booking flow |

---

## Detailed Issue Analysis & Fixes

### FB-101: UTR Validation Permissiveness
- **User Feedback**: *"When I copy UTR from Google Pay, it often includes leading/trailing spaces or lowercase letters. The app showed 'Invalid UTR format' instead of cleaning it up."*
- **Reproduction**: Copy ` 123456789012 ` or `utr123456789` into payment modal UTR field.
- **Root Cause**: `validateUtr(raw)` regex required strict 12 uppercase alphanumeric characters without auto-sanitizing whitespace or case.
- **Resolution**: Updated `validateUtr` in `src/lib/paymentUtils.ts` to `raw.trim().toUpperCase()`. Sanitized input before regex evaluation and Firestore submission.
- **Status**: `FIXED`

---

### FB-102: Printable Digital Receipt Responsive Print Styling
- **User Feedback**: *"When downloading or printing receipt from mobile Chrome, header and footer elements appeared around receipt and margins clipped."*
- **Reproduction**: Open verified appointment receipt modal and click "Print Receipt" on mobile screen.
- **Root Cause**: Print styles lacked `@page { margin: 1cm; }` and did not suppress background navigation bars in standard print stylesheets.
- **Resolution**: Added `@media print` rules in `globals.css` that hide navigation, sidebar, and banners, rendering strictly the receipt container centered on the page.
- **Status**: `FIXED`

---

### FB-103: Dynamic Reschedule Minimum Date
- **User Feedback**: *"If the dashboard tab was open overnight, clicking reschedule would let me pick yesterday or today, then error out."*
- **Reproduction**: Open client dashboard, advance system time by 24h without page refresh, open reschedule modal.
- **Root Cause**: `minRescheduleDate` was calculated only once in the page's top-level `useEffect([], ...)` instead of when the modal opens.
- **Resolution**: Recalculate `minRescheduleDate = new Date(Date.now() + 86400000).toISOString().split("T")[0]` dynamically inside `handleOpenRescheduleModal`.
- **Status**: `FIXED`

---

### FB-104: Offline Network Warning Indicator
- **User Feedback**: *"I was submitting my counselling form on mobile data while travelling and the network disconnected. The button just stayed in 'Submitting...' indefinitely."*
- **Reproduction**: Disable network connection (airplane mode) while on a submission form.
- **Root Cause**: Lack of real-time `online`/`offline` window event listener.
- **Resolution**: Added non-intrusive bilingual floating toast informing user that network connection was lost.
- **Status**: `FIXED`

---

### FB-105: Clear "No Slots Available" Notice in Booking Scheduler
- **User Feedback**: *"When I picked a fully booked date, the time dropdown was completely blank. I thought the website was broken."*
- **Reproduction**: Select a date where all available time slots are locked or confirmed.
- **Root Cause**: Dropdown rendered empty select list without an informative placeholder option.
- **Resolution**: When `availableSlots.length === 0`, display disabled option with explicit text *"No slots available on this date. Please pick another date / इस तिथि पर कोई स्लॉट रिक्त नहीं है"*.
- **Status**: `FIXED`
