import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About the Counsellor",
  description: "Learn about our certified counsellor's educational background, guidance approach, credentials, and experience.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About the Counsellor | Inspiria Careers",
    description: "Learn about our certified counsellor's educational background, guidance approach, credentials, and experience.",
    url: "/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
