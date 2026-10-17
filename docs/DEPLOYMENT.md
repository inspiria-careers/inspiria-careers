# 🚀 Production Deployment Guide — Inspiria Careers

This guide covers deploying the Next.js application to Vercel, configuring Firebase, attaching custom domains, and deploying security rules.

---

## 1. Firebase Project Setup

1. Open [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g. `inspiria-careers`).
2. **Enable Authentication**:
   - Go to **Build** -> **Authentication** -> **Sign-in method**.
   - Enable **Google** provider and **Email/Password** provider.
   - Under authorized domains, add `localhost` and your Vercel deployment domain (e.g. `your-app.vercel.app` or custom domain).
3. **Enable Firestore Database**:
   - Go to **Build** -> **Firestore Database** -> Click **Create Database** (Start in production mode).
   - Choose a location close to your users (e.g., `asia-south1` for India).
4. **Enable Cloud Storage**:
   - Go to **Build** -> **Storage** -> Click **Get Started** (Start in production mode).
5. **Get App Credentials**:
   - Go to **Project Settings** (gear icon) -> **General** -> **Your apps** -> Web App `</>`.
   - Copy the configuration keys for your environment file.

---

## 2. Environment Variables Checklist

Set these variables in your Vercel Project Settings (**Settings** -> **Environment Variables**):

| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Production, Preview | Public Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Production, Preview | `[project-id].firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Production, Preview | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Production, Preview | `[project-id].firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Production, Preview | Sender ID number |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Production, Preview | Firebase Web App ID |

---

## 3. Deploying to Vercel

1. Push your latest code to GitHub:
   ```bash
   git add -A
   git commit -m "Deploy production release"
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
3. Import your GitHub repository (`inspiria-careers`).
4. In the **Environment Variables** section, paste the 6 Firebase variables listed above.
5. Click **Deploy**. Vercel will build and deploy the Next.js site in ~1 minute.

---

## 4. Connecting a Custom Domain

1. In Vercel, navigate to your project -> **Settings** -> **Domains**.
2. Enter your purchased domain (e.g., `inspiriacareers.com` or `www.inspiriacareers.com`).
3. Add the DNS records provided by Vercel into your Domain Registrar (GoDaddy, Namecheap, Google Domains):
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
