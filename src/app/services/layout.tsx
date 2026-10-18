import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Counselling & Guidance Services",
  description: "Explore our personalized academic planning, stream selection, career roadmapping, and personal guidance services.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Counselling & Guidance Services | Inspiria Careers",
    description: "Explore our personalized academic planning, stream selection, career roadmapping, and personal guidance services.",
    url: "/services",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
