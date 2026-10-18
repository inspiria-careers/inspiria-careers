# 🔒 Privacy & Consent Framework — Inspiria Careers

This document details how client consultation data is handled, stored, protected, exported, and deleted, along with bilingual draft policies.

> [!IMPORTANT]
> **Legal Disclaimer**: The draft texts provided below are for architectural and informational purposes. The final privacy policy and terms of service should be reviewed by a licensed legal professional to ensure full compliance with the Digital Personal Data Protection Act (DPDPA), GDPR, or local regulations.

---

## 1. Storage & Confidentiality Architecture

1. **Confidential Client Intake & Minor Safeguards**:
   - Stored in Cloud Firestore (`clientIntake/{userId}`).
   - Contains age group, city, purpose of counselling, previous counselling history, emergency contact, and language preference.
   - For minors (under 18), **Parent / Legal Guardian name, phone, and explicit parental consent** are strictly mandatory before appointment confirmation.
   - Read/write access is restricted exclusively to the client and their attending counsellor. **Platform Admin has ZERO read access.**

2. **Counsellor Clinical Session Notes**:
   - Stored in Cloud Firestore (`sessionNotes/{appointmentId}`).
   - Contains clinical summaries, behavioural observations, risk indicators, homework tasks, and next session timeframe.
   - Access is restricted exclusively to the authenticated Counsellor (`getUserRole() == 'counsellor'`).
   - Neither the Client nor Platform Admin has database read access to counsellor clinical session notes.

3. **Client Mindfulness & Reflection Journal**:
   - Stored in Cloud Firestore (`clientJournal/{entryId}`).
   - 100% private to the client (`auth.uid == userId`) by default.
   - Zero third-party AI processing or analytics applied to personal journal entries.
   - Client can optionally toggle "Share with Counsellor" for specific entries. Platform Admin has ZERO access.

4. **Dynamic Versioned Informed Consent**:
   - Counsellor defines consent terms and version identifier (e.g. `v2.0-2026`) in `siteContent/settings`.
   - On booking, client timestamp and accepted version (`acceptedConsentVersion`) are recorded.
   - If the counsellor updates the terms, the intake workflow re-prompts clients for the updated version.

5. **DPDPA 2023 Formal Deletion Pipeline & Data Portability**:
   - Clients can submit a formal Digital Personal Data Protection Act (DPDPA 2023) deletion request directly from `/dashboard/client` (Privacy tab).
   - Logged in Firestore (`deletionRequests/{id}`) and queued in the Counsellor Dashboard for statutory 30-day compliance.
   - Clients can instantly download a complete JSON archive of all personal records, documents, tasks, and journals via "Export My Data".

6. **Secure Asynchronous Messaging (Phase 6 Part A)**:
   - Stored in Cloud Firestore (`threads/{clientId}/messages/{messageId}`).
   - Accessible strictly to the client owner and attending counsellor. **Platform Admin has ZERO access.**
   - 10-minute edit and soft-delete grace window. Soft-deleted messages clear content while preserving audit continuity.
   - Clear disclaimer that messages are stored securely in Firestore with least-privilege rules, but are not end-to-end encrypted (no false cryptographic E2EE claims).
   - Emergency banner prominently displayed with expected counsellor response times.

7. **Transactional Reminders & Opt-in Safeguards (Phase 6 Part C)**:
   - Requires explicit client opt-in via Client Dashboard.
   - Strictly transactional: payloads contain ONLY date, time, and counsellor branding.
   - Prohibited from containing clinical notes, diagnostic terms, or session topics.

8. **Private Session Feedback (Phase 6 Part E)**:
   - Stored in Cloud Firestore (`sessionFeedback/{feedbackId}`).
   - Isolated from public testimonials/reviews (`reviews`).
   - Accessible exclusively to the counsellor to improve session delivery; **Platform Admin has ZERO access**.

9. **Double Opt-in Newsletter (Phase 6 Part F)**:
   - Requires explicit email confirmation via unique cryptographic token.
   - Mandatory one-click unsubscribe URL in every communication.
   - Subscribers stored in isolated `subscribers` collection.

---

## 2. Bilingual Policy Draft (Hindi & English)

### English Version
> **Privacy Policy & Code of Ethics**
>
> 1. **Confidentiality Guarantee**: All conversations, assessments, career goals, and psychological notes shared during counselling sessions are held in strict professional confidence. No information is disclosed without prior written authorization.
> 2. **Data We Collect**: We collect only details necessary to schedule sessions and provide educational guidance (Name, Email, Phone, Academic Background).
> 3. **Your Control**: You maintain full ownership of your data. You may download an export of your information or permanently delete your account at any time from your dashboard.
> 4. **Emergency Disclaimer**: This service provides career and academic guidance. In an acute mental health crisis, please contact verified 24/7 helplines: **iCall: 9152987821** or **Vandrevala Foundation: 1860-2662-345**.

### हिन्दी संस्करण (Hindi Version)
> **गोपनीयता नीति एवं आचार संहिता**
>
> 1. **पूर्ण गोपनीयता की गारंटी**: परामर्श सत्रों के दौरान साझा की गई आपकी सभी बातचीत, शैक्षणिक लक्ष्य और व्यक्तिगत विचार पूर्णतः गोपनीय रखे जाते हैं। आपकी स्पष्ट लिखित अनुमति के बिना कोई भी विवरण किसी तीसरे पक्ष के साथ साझा नहीं किया जाता।
> 2. **एकत्रित जानकारी**: हम केवल वही आवश्यक विवरण लेते हैं जो अपॉइंटमेंट समय निर्धारण और सटीक करियर मार्गदर्शन के लिए आवश्यक हों (नाम, ईमेल, फोन नंबर, शैक्षणिक पृष्ठभूमि)।
> 3. **आपका नियंत्रण और अधिकार**: आपके डेटा पर आपका पूरा नियंत्रण है। आप अपने डैशबोर्ड से कभी भी अपनी जानकारी डाउनलोड (Export) कर सकते हैं अथवा अपना खाता व समस्त डेटा स्थायी रूप से मिटा (Delete) सकते हैं।
> 4. **आपातकालीन अस्वीकरण**: यह मंच करियर और शैक्षणिक परामर्श के लिए है। किसी भी गंभीर मानसिक स्वास्थ्य संकट की स्थिति में कृपया 24×7 उपलब्ध आपातकालीन हेल्पलाइन पर संपर्क करें: **iCall: 9152987821** अथवा **वंद्रेवाला फाउंडेशन: 1860-2662-345**।
