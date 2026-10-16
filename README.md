# 🌟 INSPIRIA CAREERS - 3D Educational & Career Guidance Platform

A premium, interactive 3D web platform built for **Principal Ma'am** (Senior Educational & Career Counselor) to share guidance articles, attach photos/videos/PDF documents, connect with students and parents, and manage all website settings dynamically.

---

## 🚀 Live Local Server

The development server is running locally at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Quick 1-Click Access (Testing Right Now!)

Go to **[http://localhost:3000/login](http://localhost:3000/login)** to access the instant 1-click demo buttons:

| Role | 1-Click Demo Button | Target Route | Capabilities |
| :--- | :--- | :--- | :--- |
| **Principal Ma'am** | 👩‍🏫 **Principal Ma'am** | `/dashboard` | Publish posts (photo/video/PDF attachments), edit website name & bio live, view contact messages |
| **Administrator** | 🛡️ **Admin Panel** | `/admin` | Manage user roles, moderate posts, delete inquiries, master site settings |
| **Student / Parent** | 🎓 **Student / Parent** | `/posts` | Personalized post reading, interactive likes, full access to downloads |

---

## 📧 How to Set Principal Ma'am's & Admin's Real Gmail

Open the [`.env.local`](.env.local) file in the project root:

```env
# Principal Ma'am's Gmail (Automatically gets counselor dashboard access)
NEXT_PUBLIC_PRINCIPAL_EMAIL=principalmam@gmail.com

# Your Admin Gmail (Automatically gets full administrative privileges)
NEXT_PUBLIC_ADMIN_EMAIL=youradmin@gmail.com
```

Whenever she clicks **"Continue with Google"** with that Gmail, she will automatically be recognized as **Principal Ma'am** and directed to her Dashboard!

*(Optional: You can add multiple emails separated by commas: `email1@gmail.com,email2@gmail.com`)*

---

## ✨ Features Built Specifically to Your Requirements

1. **Official e-Counselling Portal Theme & Interactive Hero Slider**:
   - Modeled after the **National Informatics Centre (NIC) e-Counselling Division** portal.
   - **Interactive 3-Slide Infographic Carousel**: Features the dual-branch examination and admission flow (Examination Provisioning, Admit Card, Answer Key, Seat Matrix, Multiple Round Allotment, Document Verification) with interactive arrow controls, auto-play, indicator dots, and bottom-left pause/play button (`⏸️`/`▶️`).
   - **3-Tier Portal Header**: Top government utility bar with accessibility font controls (`A-` `A` `A+`), white branding bar with red script `e` emblem and bold *e-Counselling Division* title, and Institutional Navy Navbar (`#002147`) with bright teal active tab (`#009ea9`).
   - **Official Announcement Ticker**: Real-time ticker banner for admission and counseling updates.
   - **Portal Typography**: Clean, authoritative Indian institutional sans-serif font (**Roboto** & **Source Sans 3**).

2. **Principal Ma'am's Complete Dashboard (`/dashboard`)**:
   - **🏠 Home Page All Details Customizer**: Principal Ma'am has complete dynamic control of every section, card, heading, photo, and text on the Home Page without writing a single line of code:
     1. **📢 Announcements & Ticker**: Live marquee announcement scrolling text, badge tag, and e-counselling introductory mandate paragraph.
     2. **🎯 Strategic Goals & Mandates**: Section tags, titles, subtitles, and all 3 Core Principle cards with custom emoji or uploaded PNG icons.
     3. **👩‍🏫 Counselor Profile & Passport Photo**: Upload high-resolution passport photo directly from device, change designation, badges, short bio, and personal philosophy.
     4. **🌟 Guidance Offerings / Services**: Section titles, add/edit/delete service cards, and upload custom PNG icons.
     5. **📊 Portal Statistics Counters**: Modify all 4 milestone numbers and descriptions (e.g. 15,000+ Students, 15+ Years Experience, 98% Success Rate).
     6. **🎞️ Hero Slider & Banners**: Customize left/right flow branch titles, center taglines, and target examination lists across all 3 interactive carousel slides.
     7. **💳 Payment Gateway & Consultation Fees**: Toggle paid sessions on/off, set fee amount (₹), configure UPI ID, upload UPI QR code image from PC, and provide bank account transfer info.
     8. **📞 Helpline & Contact Details**: Update official WhatsApp helpline, phone numbers, contact email, office consultation hours, and address.
     9. **🌐 Social Media Links**: Add / update links for Facebook, Instagram, YouTube, LinkedIn, and Twitter/X.
     10. **📣 Home Page Call to Action Banner**: Customize the bottom banner heading, motivational pitch, and button label.
     11. **🏛️ Portal Branding & Header**: Customize portal title, division name, and emblem logo.
     12. **📖 About Us & Story**: Extended multi-paragraph story and counseling philosophy.
     13. **🚀 Developer & Footer Attribution**: Customize "Designed & Developed by" text, portfolio URL, and copyright statement.
   - **⚡ 1-Click Overview Jump Hub**: Direct shortcut buttons on the Dashboard Overview to immediately open and edit any Home Page section with 1 click.
   - **✍️ Rich Post Publisher**: Publish articles with category tags, cover photos, YouTube video embeds, and downloadable PDF study guides.
   - **🏆 Honors & Achievements Manager**: Add or remove awards, books, and keynote talks.
   - **🖼️ Photo & Video Gallery Manager**: Upload gallery photos from PC, add YouTube videos, captions, and filters.
   - **📬 Bookings & Inquiries Inbox**: Read consultation session requests and inquiries from students and parents.

3. **Master Admin Panel (`/admin`)**:
   - **👥 User Role Management**: Promote any registered user to `Principal` or `Admin` with 1 click.
   - **⚙️ Master Website Configuration**: Full 13-tab administrative suite matching all site settings, hero slider configurations, and developer credits.
   - **📑 Global Post Moderation**: Review and delete articles across the platform.
   - **📬 Contact Form Inquiries**: View and moderate all incoming inquiries.

4. **Public Sections**:
   - **Home (`/`)**: 3D hero, services cards, counselor introduction, stats, and call-to-actions.
   - **About (`/about`)**: Principal Ma'am's biography, philosophy, educational degrees, and certifications.
   - **Posts & Articles (`/posts`)**: Category filters, like buttons, embedded video guides, and PDF downloads.
   - **Achievements (`/achievements`)**: Timeline of national awards, published books, TEDx speeches, and honors.
   - **News & Events (`/news`)**: Upcoming workshops, parent-student camps, and webinar registration.
   - **Gallery (`/gallery`)**: Visual highlight cards with stateful category filtering.
   - **Testimonials (`/testimonials`)**: Success stories from IIT, AIIMS, Oxford, and Google alumni with 5-star ratings.
   - **Contact Us (`/contact`)**: Instant contact form saving directly to the counselor's inbox.

5. **Personalization & Authentication Gate**:
   - Unauthenticated visitors see an attractive teaser of posts prompting them to sign in.
   - Sign in with Google (OAuth) or Email/Password.
   - Upon sign-in, unlocks full reading, PDF downloads, and interactive likes.

---

## 🌐 100% Free Hosting Deployment Guide

### Step 1: Deploy Website on Vercel (100% Free)
1. Push this project folder to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Insersia Counseling"
   git remote add origin https://github.com/your-username/insersia-counseling.git
   git push -u origin main
   ```
2. Go to **[vercel.com](https://vercel.com)**, click **Add New Project**, and import your repository.
3. In Environment Variables, paste the variables from your `.env.local`.
4. Click **Deploy** — your website is live worldwide with free SSL (e.g., `insersia.vercel.app`)!

### Step 2: Firebase Free Tier Setup (Spark Plan - $0/month)
1. Go to **[console.firebase.google.com](https://console.firebase.google.com)** and create a free project.
2. In **Authentication**, enable **Google** and **Email/Password** sign-in providers.
3. In **Firestore Database**, create a database in test or production mode.
4. In **Storage**, create a bucket for photo/PDF uploads.
5. Copy the configuration keys into `.env.local` and Vercel environment variables.

---

## 🛠️ Commands

```bash
# Run local dev server
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```
