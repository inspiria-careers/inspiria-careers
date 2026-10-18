import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description: "Schedule a confidential one-on-one guidance session with our counsellor. Choose online or in-person mode at your convenience.",
  alternates: {
    canonical: "/book",
  },
  openGraph: {
    title: "Book a Consultation | Inspiria Careers",
    description: "Schedule a confidential one-on-one guidance session with our counsellor.",
    url: "/book",
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
