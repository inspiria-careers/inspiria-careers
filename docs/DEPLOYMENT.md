# 🚀 Production Deployment Guide — Inspiria Careers

This guide covers deploying the Next.js application to Vercel, configuring Firebase, attaching custom domains, deploying security rules, and setting up daily cron reminders.

---

## 1. Firebase Project Setup

1. Open [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g. `inspiria-careers`).
2. **Enable Authentication**:
   - Go to **Build** -> **Authentication** -> **Sign-in method**.
   - Enable **Google** provider and **Email/Password** provider.
   - Under **Authorized Domains**, add:
     - `localhost`
     - `your-app.vercel.app` (your Vercel preview & production URLs)
     - `yourcustomdomain.com` (and `www.yourcustomdomain.com`)
3. **Enable Firestore Database**:
   - Go to **Build** -> **Firestore Database** -> Click **Create Database** (Start in production mode).
   - Choose a location close to your users (`asia-south1` Mumbai recommended for India).
4. **Enable Cloud Storage**:
   - Go to **Build** -> **Storage** -> Click **Get Started** (Start in production mode).
5. **Get App Credentials**:
   - Go to **Project Settings** (gear icon) -> **General** -> **Your apps** -> Web App `</>`.
   - Copy the configuration keys for your environment file.
6. **(Optional) Enable Firebase App Check**:
   - Go to **Build** -> **App Check** -> Register Web App with **reCAPTCHA v3**.
   - Copy the reCAPTCHA v3 Site Key.

---

## 2. Environment Variables Checklist

Set these variables in your Vercel Project Settings (**Settings** -> **Environment Variables**):

| Variable Name | Environment | Required | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Production, Preview | **Yes** | Public Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Production, Preview | **Yes** | `[project-id].firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Production, Preview | **Yes** | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Production, Preview | **Yes** | `[project-id].firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview | **Yes** | Sender ID number |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Production, Preview | **Yes** | Firebase Web App ID |
| `NEXT_PUBLIC_SITE_URL` | Production, Preview | **Yes** | e.g. `https://inspiriacareers.com` (for SEO & Calendar) |
| `CRON_SECRET` | Production | **Yes** | 32+ character random secret string protecting `/api/cron/reminders` |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Production | Optional | reCAPTCHA v3 site key for App Check bot protection |

---

## 3. Deploying to Vercel & Configuring Cron

1. Push your latest code to GitHub:
   ```bash
   git add -A
   git commit -m "Phase 3: Production Release"
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
3. Import your GitHub repository (`inspiria-careers`).
4. In the **Environment Variables** section, paste the variables listed above.
5. Click **Deploy**. Vercel will build and deploy the Next.js site in ~1 minute.
6. **Vercel Cron Setup**:
   - The repository includes `vercel.json` configured with:
     ```json
     {
       "crons": [
         {
           "path": "/api/cron/reminders",
           "schedule": "0 2 * * *"
         }
       ]
     }
     ```
   - On deployment, Vercel automatically registers this cron job under Project **Settings** -> **Cron Jobs**.
   - Vercel automatically passes `Authorization: Bearer <CRON_SECRET>` when invoking this route daily.

---

## 4. Connecting a Custom Domain

1. In Vercel, navigate to your project -> **Settings** -> **Domains**.
2. Enter your purchased domain (e.g., `inspiriacareers.com` or `www.inspiriacareers.com`).
3. Add the DNS records provided by Vercel into your Domain Registrar (Hostinger, GoDaddy, Namecheap):
   - **Type A**: `@` -> `76.76.21.21`
   - **Type CNAME**: `www` -> `cname.vercel-dns.com`
4. In Firebase Console -> **Authentication** -> **Settings** -> **Authorized Domains**, add your custom domain (`inspiriacareers.com`) so Google Sign-In operates correctly.

---

## 5. Deploying Security Rules

Install the Firebase CLI locally to deploy rules:
```bash
npm install -g firebase-tools
firebase login
firebase use --add [your-project-id]
```

Deploy Firestore and Storage rules:
```bash
firebase deploy --only firestore:rules,storage
```
Alternatively, copy the contents of `firestore.rules` and `storage.rules` directly into the Firebase Console web editor under **Firestore Database** -> **Rules** and **Storage** -> **Rules**.
