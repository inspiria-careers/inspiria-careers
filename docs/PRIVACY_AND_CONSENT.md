# 🔒 Privacy & Consent Framework — Inspiria Careers

This document details how client consultation data is handled, stored, protected, exported, and deleted, along with bilingual draft policies.

> [!IMPORTANT]
> **Legal Disclaimer**: The draft texts provided below are for architectural and informational purposes. The final privacy policy and terms of service should be reviewed by a licensed legal professional to ensure full compliance with the Digital Personal Data Protection Act (DPDPA), GDPR, or local regulations.

---

## 1. Storage & Confidentiality Architecture

1. **Client Notes & Documents**:
   - Stored in Cloud Firestore (`clientNotes`) and Firebase Storage / secure base64 blocks (`clientDocuments`).
   - Default visibility is **Private to Client Only**.
   - Optional `"Share with counsellor"` toggle: When checked, the designated Counsellor can view the file during session planning.
   - The Administrator does not have automatic read permission to personal notes or files.
2. **Consultation Records & Appointments**:
   - Contact numbers and session notes are visible only to the attending Counsellor and Administrator for scheduling and verification purposes.
3. **Data Portability (Export)**:
   - Clients can download a complete JSON archive of their appointments, notes, and profile by clicking **"Export My Data"** in their personal dashboard.
4. **Right to Erasure (Delete Account & Data)**:
   - Clients can click **"Delete My Account & Data"** in their dashboard. This triggers a batch deletion of their user doc, appointments, private notes, and documents.

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
