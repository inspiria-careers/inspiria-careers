# 🔌 Integrations & Provider Connection Guide (Phase 6)

This document provides complete technical specifications for connecting optional third-party communication channels (WhatsApp, SMS, Newsletter/Email) when production credentials and DLT/Meta approvals become available.

---

## 🛡️ Core Architecture Principle

All integrations follow the **Provider-Agnostic Abstraction Pattern**:
1. Zero third-party paid SDKs are loaded by default.
2. The core system operates in **Dry-Run Mode** out of the box (logging dispatch attempts to the console with minimal metadata).
3. **Zero Clinical Disclosures**: Reminder and email templates are strictly transactional (e.g. appointment date, time, and counsellor branding). Diagnostic impressions, personal reflections, and clinical session notes are strictly prohibited from email, SMS, and WhatsApp payloads.

---

## 1. 📱 WhatsApp Cloud API Integration (Part C)

### Provider Overview
- **Service**: Meta WhatsApp Business Cloud API
- **Implementation File**: `src/lib/reminderService.ts`

### Regulatory & Meta Compliance
- **Opt-In Requirement**: Per WhatsApp Business Policy and India's Digital Personal Data Protection Act (DPDPA 2023), recipients must explicitly consent to receive business notifications. Inspiria Careers enforces this through a mandatory opt-in checkbox in the Client Dashboard.
- **24-Hour Messaging Window**: Businesses cannot initiate freeform messages outside a 24-hour window from the user's last message. All outbound reminders must use **Pre-Approved Message Templates**.

### Pre-Approved Template Configuration
Submit the following templates in Meta WhatsApp Business Manager:

#### Template 1: Appointment Reminder
- **Category**: `UTILITY`
- **Languages**: `en` (English), `hi` (Hindi)
- **English Body**:
  ```
  Hello {{1}}, your appointment is tomorrow at {{2}} on {{3}}. — Inspiria Careers
  ```
- **Hindi Body**:
  ```
  नमस्ते {{1}}, आपका परामर्श सत्र कल {{3}} को {{2}} पर है। — Inspiria Careers
  ```

#### Template 2: Follow-up Nudge
- **Category**: `UTILITY`
- **English Body**:
  ```
  Hello {{1}}, your counsellor has suggested a follow-up session. Visit Inspiria Careers to book. — Inspiria Careers
  ```
- **Hindi Body**:
  ```
  नमस्ते {{1}}, आपके काउंसलर ने फॉलो-अप सत्र का सुझाव दिया है। बुक करने के लिए Inspiria Careers देखें।
  ```

### Environment Variables
When ready to connect, configure:
```env
REMINDER_PROVIDER=whatsapp
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_meta_system_user_token
WHATSAPP_TEMPLATE_NAMESPACE=your_meta_namespace
```

---

## 2. ✉️ SMS Gateway & Telecom DLT Compliance (India)

### Indian Telecom Regulations (TRAI / DLT)
Under the Telecom Commercial Communications Customer Preference Regulations (TCCCPR 2018), sending SMS in India requires:
1. **Principal Entity (PE) Registration**: Register on any telecom DLT portal (e.g. Jio, Airtel, Vilpower/Vodafone, BSNL).
2. **Sender ID (Header)**: 6-character alphabetic header (e.g. `INSPRA` or `INSPCA`).
3. **Content Template Registration**:
   - Route Type: `Service Implicit` (Transactional)
   - Title: `Appointment Reminder`
   - Template Message:
     ```text
     Hello {#var#}, your appointment is tomorrow at {#var#} on {#var#}. - Inspiria Careers
     ```

### Environment Variables
```env
REMINDER_PROVIDER=sms
SMS_PROVIDER_NAME=fast2sms # or msg91, twilio
SMS_API_KEY=your_sms_gateway_key
SMS_SENDER_ID=INSPRA
SMS_DLT_TE_ID=your_dlt_template_entity_id
```

---

## 3. 📧 Newsletter & Email Delivery (Part F)

### Double Opt-In Workflow
1. User enters their email and optional name in the footer form.
2. Endpoint `POST /api/newsletter/subscribe` creates a subscriber document with `confirmed: false`, `active: false`, and generates a secure random cryptographic token (`confirmationToken`).
3. Confirmation link is sent to user's inbox:
   ```text
   https://yourdomain.com/api/newsletter/confirm?token={confirmationToken}
   ```
4. User clicks link: token is verified and consumed, subscriber status becomes `confirmed: true`, `active: true`.
5. Every outbound newsletter includes a mandatory one-click unsubscribe link:
   ```text
   https://yourdomain.com/api/newsletter/unsubscribe?token={unsubscribeToken}
   ```

### Recommended Email Providers
- **Resend** (Recommended for Next.js App Router, 3,000 free emails/month)
- **SendGrid** or **Amazon SES** (Enterprise scale)

### Environment Variables
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_123456789
EMAIL_FROM="Inspiria Careers <updates@yourdomain.com>"
```

---

## 4. ⏰ Vercel Cron Scheduling Limits

### Free Hobby Tier
- Execution frequency: Max **once per day** (`0 9 * * *`).
- Endpoint: `/api/cron/reminders`
- Protection: `Authorization: Bearer CRON_SECRET` header.
- Execution timeout: 10 seconds.

### Pro Tier
- Supports minute/hourly precision crons (e.g., `0 * * * *`).
- Execution timeout: Up to 300 seconds.
