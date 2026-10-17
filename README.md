# 🌟 Inspiria Careers — Professional Counsellor & Career Guidance Portal

A clean, modern, and accessible web portal designed for educational, psychological, and career counsellors. The application connects students, parents, and candidates with expert guidance through seamless online consultation booking, confidential client notes and documents, a dynamic guidance blog, verified client reviews, bilingual Hindi/English switching, and comprehensive role-based dashboards.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Core**: React 19, TypeScript
- **Backend & Cloud Database**: Google Firebase (Authentication, Firestore Database, Cloud Storage)
- **Styling**: Vanilla CSS (`src/app/globals.css`) with dynamic CSS custom properties for instant admin theme customisation
- **Internationalization (i18n)**: Bilingual English / हिन्दी switcher (`src/translations/index.ts`)

---

## 📁 Project Structure

```text
├── docs/                     # Architecture, roles, Firestore schema, security, and guides
│   ├── ARCHITECTURE.md
│   ├── ROLES_AND_PERMISSIONS.md
│   ├── FIRESTORE_SCHEMA.md
│   ├── SECURITY.md
│   ├── PRIVACY_AND_CONSENT.md
│   ├── CONTENT_GUIDE.md      # Simple Hindi guide for non-technical counsellors
│   ├── DEPLOYMENT.md
│   └── ROADMAP.md
├── public/                   # Static assets & icons
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx          # Public Home
│   │   ├── about/            # About Counsellor & Ethics
│   │   ├── services/         # Offerings list
│   │   ├── gallery/          # Photos & Videos
│   │   ├── posts/            # Guidance blog list & [slug] reader
│   │   ├── reviews/          # Verified client testimonials
│   │   ├── book/             # Appointment scheduling
│   │   ├── contact/          # Contact details & inquiry form
│   │   ├── privacy/          # Privacy policy & data protection
│   │   ├── login/            # Google & Email/Password sign-in
│   │   ├── signup/           # Client registration
│   │   ├── forgot-password/  # Password reset via Firebase
│   │   └── dashboard/        # Role-based panels
│   │       ├── admin/        # Users & roles, theme presets, site settings
│   │       ├── counsellor/   # Profile, services, gallery, appointments, posts
│   │       └── client/       # Appointments history, private notes/docs, feedback
│   ├── components/           # Reusable UI (Navbar, Footer, Modals)
│   ├── contexts/             # AuthContext (roles) & SiteContext (Firestore sync)
│   ├── lib/                  # Firebase initialization & image utilities
│   ├── middleware.ts         # Edge route guard for /dashboard/*
│   └── translations/         # English & Hindi translation dictionaries
├── firestore.rules           # Granular Firestore security rules
├── storage.rules             # Secure Storage rules for client documents
├── AGENTS.md                 # Rules for AI & team contributors
├── CHANGELOG.md              # Version releases & changes
└── .env.example              # Environment variables template
```

---

## 🚀 Local Setup Instructions

### 1. Prerequisites
- **Node.js**: v18.18 or higher (v20+ recommended)
- **npm** or **pnpm**

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/inspiria-careers/inspiria-careers.git
cd inspiria-careers
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file to create `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Firebase credentials in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📜 Available NPM Scripts

- `npm run dev`: Starts the development server with Next.js Turbopack.
- `npm run build`: Validates TypeScript, checks routes, and creates an optimized production bundle.
- `npm run start`: Runs the production build server locally.
- `npm run lint`: Executes ESLint code quality checks.

---

## 🌐 Deployment

- **Production URL**: [https://inspiria-careers.vercel.app](https://inspiria-careers.vercel.app)
- **Deploy Provider**: Vercel (Auto-deployed from the `main` branch).
- Detailed deployment instructions for Firebase and custom domains are documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
