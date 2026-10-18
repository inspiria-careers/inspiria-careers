import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteProvider } from "@/contexts/SiteContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import OfflineNotice from "@/components/OfflineNotice";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://inspiria-careers.vercel.app"),
  title: {
    default: "Inspiria Careers | Professional Guidance & Academic Counselling",
    template: "%s | Inspiria Careers",
  },
  description: "Expert career, academic, and mental wellness guidance. Schedule a confidential consultation with our certified counsellor.",
  keywords: ["counselling", "career guidance", "academic counselling", "student guidance", "Inspiria Careers", "admissions"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Inspiria Careers | Professional Guidance & Academic Counselling",
    description: "Expert career, academic, and mental wellness guidance. Schedule a confidential consultation.",
    url: "/",
    siteName: "Inspiria Careers",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#1a3a8f" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <SiteProvider>
            <JsonLd />
            <Navbar />
            {children}
            <FloatingWhatsApp />
            <OfflineNotice />
            <Footer />
          </SiteProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
