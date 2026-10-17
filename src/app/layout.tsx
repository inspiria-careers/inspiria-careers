import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteProvider } from "@/contexts/SiteContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Inspiria Careers | Professional Counselling",
  description: "Expert career and academic counselling. Book a session with our experienced counsellor today.",
  keywords: "counselling, career guidance, academic counselling, student counsellor, Inspiria Careers",
  openGraph: {
    title: "Inspiria Careers | Professional Counselling",
    description: "Expert career and academic counselling.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <SiteProvider>
            <Navbar />
            {children}
            <Footer />
          </SiteProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
