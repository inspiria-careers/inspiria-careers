import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Location",
  description: "Get in touch with our counselling centre. Find our office address, phone, email, and interactive inquiry form.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact & Location | Inspiria Careers",
    description: "Get in touch with our counselling centre. Find our office address, phone, and email.",
    url: "/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
