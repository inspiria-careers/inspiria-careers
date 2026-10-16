import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteProvider } from "@/contexts/SiteContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "INSPIRIA CAREERS | Expert Career & Academic Guidance",
  description: "INSPIRIA CAREERS provides expert career, academic, and admission counseling for students, parents, and professionals. Connect with our experienced counselor for personalized guidance.",
  keywords: "counseling, career guidance, academic counseling, student counselor, Inspiria, Inspiria Careers",
  openGraph: {
    title: "INSPIRIA CAREERS",
    description: "Expert career and academic guidance for students, parents and professionals.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Source+Sans+3:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
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
