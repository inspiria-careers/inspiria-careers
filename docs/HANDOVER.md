# 🤝 Project Handover & Maintenance Guide (HANDOVER.md)

> [!IMPORTANT]
> **Security Notice:** In strict accordance with AGENTS.md rules, **no passwords, secret API keys, or private credentials are stored in this document**. Use password managers (Bitwarden / 1Password) to manage credentials securely.

---

## 1. Account Ownership & Infrastructure Registry

| Service | Primary Owner / Registrar | Purpose | Access Level |
| :--- | :--- | :--- | :--- |
| **GitHub** | Client / Developer Org | Source Code & Version Control Repository | Admin / Maintainer |
| **Firebase Console** | Google Account (Owner) | User Authentication, Firestore Database, Storage | Project Owner |
| **Vercel** | Team / Company Account | Next.js Hosting, Edge CDN, Automated SSL & Vercel Crons | Admin |
| **Domain Registrar** | Hostinger / GoDaddy / Namecheap | Custom Domain Registration & DNS Nameservers | Domain Owner |

---

## 2. Team Roles & Access Matrix

- **System Administrator (`admin`):**
  - Manages site branding tokens (brand colors, fonts, site name).
  - Promotes or demotes user roles (`client`, `counsellor`, `admin`).
  - Has authority to deactivate/disable problematic user accounts.
  - Reviews immutable audit logs (`auditLogs`) to see who changed settings, deleted reviews, or updated roles.
  - Downloads full system CSV exports (all appointments and client reviews).
  - Does **NOT** have access to client private counselling notes or confidential documents.

- **Counsellor (`counsellor`):**
  - Updates professional profile (biography, qualifications, specializations, photo, contact numbers, office hours).
  - Configures services, fees, blocked dates/holidays, and cancellation cutoff hours.
  - Reviews, confirms, reschedules, or cancels consultation requests.
  - Sets meeting links (Google Meet, Zoom) for online sessions.
  - Reads and replies to contact form inquiries (`/dashboard/counsellor → Inbox`).
  - Moderates client feedback (approves or rejects public reviews).
  - Publishes and edits guidance articles on the blog (`/posts`).
  - Accesses client notes & documents only if the client explicitly toggled "Shared with Counsellor".

- **Client (`client`):**
  - Self-registers via Email/Password or Google One-Tap.
  - Books online or in-person consultation slots.
  - Receives calendar links (`.ics` / Google Calendar) and meeting links upon confirmation.
  - Requests appointment rescheduling (if outside the 24-hour cutoff window).
  - Keeps confidential private notes and uploads documents in their personal vault.
  - Exports complete data archive or permanently deletes account and records.

---

## 3. काउंसलर के लिए सहायता मार्गदर्शिका (Troubleshooting Guide in Hindi)

अगर वेबसाइट में कभी कोई समस्या आए या कुछ काम न करे, तो घबराएं नहीं। नीचे दिए गए आसान चरणों का पालन करें:

### 1. वेबसाइट खुल नहीं रही या बहुत धीमी चल रही है
- **कारण:** इंटरनेट कनेक्शन या ब्राउज़र कैश में पुरानी फाइलें हो सकती हैं।
- **समाधान:** 
  1. अपने कीबोर्ड पर `Ctrl + Shift + R` (या Mac पर `Cmd + Shift + R`) दबाकर हार्ड रीफ्रेश करें।
  2. अपने फोन के मोबाइल डेटा पर वेबसाइट खोलकर जांचें।
  3. [Vercel Status](https://www.vercel-status.com/) पर जाकर देखें कि क्या ग्लोबल सर्वर सक्रिय है।

### 2. कोई क्लाइंट कह रहा है कि वे अपॉइंटमेंट बुक नहीं कर पा रहे
- **कारण:** हो सकता है वह दिन "Blocked Dates" (अवकाश) में शामिल हो, या वह समय स्लॉट किसी और ने पहले ही बुक कर लिया हो।
- **समाधान:**
  1. अपने काउंसलर डैशबोर्ड में **"Blocked Dates & Holidays"** टैब देखें। यदि वह तिथि ब्लॉक है, तो उसे हटाएं।
  2. "Appointments" टैब में जांचें कि क्या उस समय पर पहले से कोई बुकिंग मौजूद है।

### 3. ऑनलाइन मीटिंग लिंक क्लाइंट को नहीं दिख रहा
- **कारण:** मीटिंग लिंक केवल **Confirmed (पुष्टि हुई)** अपॉइंटमेंट पर ही क्लाइंट को दिखाई देता है।
- **समाधान:**
  1. काउंसलर डैशबोर्ड में अपॉइंटमेंट की स्थिति "Confirmed" करें।
  2. "Meeting Link" बॉक्स में सही गूगल मीट या ज़ूम लिंक (जैसे `https://meet.google.com/...`) पेस्ट करके सहेजें।

### 4. कोई नया रिव्यू वेबसाइट पर नहीं दिख रहा
- **कारण:** सुरक्षा और गोपनीयता के लिए सभी रिव्यू डिफ़ॉल्ट रूप से अप्रकाशित रहते हैं।
- **समाधान:**
  1. काउंसलर डैशबोर्ड में **"Review Moderation"** टैब पर जाएं।
  2. क्लाइंट का रिव्यू पढ़ें और **"Approve (स्वीकार करें)"** बटन दबाएं। वह तुरंत वेबसाइट पर दिखने लगेगा।

### 5. पासवर्ड भूल गए हैं
- **समाधान:**
  1. लॉगिन पेज पर **"Forgot Password / पासवर्ड भूल गए?"** लिंक पर क्लिक करें।
  2. अपना पंजीकृत ईमेल दर्ज करें। आपके इनबॉक्स में पासवर्ड रीसेट करने का एक सुरक्षित लिंक आ जाएगा।

### 6. तकनीकी समस्या के लिए डेवलपर से संपर्क
- यदि उपरोक्त चरणों से समस्या हल न हो, तो डेवलपर को निम्न जानकारी भेजें:
  1. समस्या किस पेज पर आ रही है (URL).
  2. स्क्रीनशॉट या स्क्रीन रिकॉर्डिंग.
  3. क्या कोई एरर मैसेज स्क्रीन पर दिखाई दे रहा है.

---

## 4. Phase 6 Optional Feature Flags Guide (वैकल्पिक सुविधाएं चालू/बंद करना)

वेबसाइट में आधुनिक मॉड्यूलर फीचर फ्लैग दिए गए हैं। काउंसलर जब चाहें अपने डैशबोर्ड (`/dashboard/counsellor → Profile & Bio`) से इन्हें चालू (Enable) या बंद (Disable) कर सकती हैं:

1. **सुरक्षित संदेश (Secure Async Messaging)**:
   - चालू करने पर क्लाइंट और काउंसलर के बीच निजी चैट थ्रेड सक्रिय हो जाता है।
   - काउंसलर अपना अपेक्षित उत्तर समय (जैसे "1-2 कार्य दिवस") निर्धारित कर सकती हैं।
   - यह एंड-टू-एंड एन्क्रिप्टेड नहीं है (फायरस्टोर सुरक्षा नियमों द्वारा संरक्षित है)।
2. **व्हाट्सएप / एसएमएस स्मरण (Reminders)**:
   - चालू करने पर क्लाइंट्स को डैशबोर्ड में 24 घंटे पूर्व रिमाइंडर प्राप्त करने का चेकबॉक्स दिखेगा।
   - डिफ़ॉल्ट रूप से यह सुरक्षित ड्राई-रन मोड (Dry-run) में काम करता है।
3. **सत्र फ़ीडबैक व फॉलो-अप (Session Feedback & Follow-up)**:
   - चालू करने पर पूर्ण हो चुके सत्रों पर क्लाइंट निजी फ़ीडबैक (1-5 स्टार रेटिंग और सुझाव) दे सकते हैं।
   - काउंसलर डैशबोर्ड में 7 दिन पुराने क्लाइंट्स का फॉलो-अप क्यू दिखेगा जिससे एक क्लिक में फॉलो-अप संदेश भेजा जा सकता है।
4. **न्यूज़लेटर सदस्यता (Newsletter Subscription)**:
   - चालू करने पर वेबसाइट के फुटर में करियर टिप्स सदस्यता फॉर्म सक्रिय हो जाता है।
   - यह डबल ऑप्ट-इन और एक-क्लिक अनसब्सक्राइब लिंक के साथ पूर्णतः कानूनन सुरक्षित है।

