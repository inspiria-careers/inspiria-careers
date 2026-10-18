import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Confidentiality",
  description: "Our commitment to client privacy, session confidentiality, data protection, and adherence to professional counselling ethics.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy & Confidentiality | Inspiria Careers",
    description: "Our commitment to client privacy, session confidentiality, and data protection.",
    url: "/privacy",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
