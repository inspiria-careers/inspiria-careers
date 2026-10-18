import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Testimonials & Reviews",
  description: "Read verified feedback and guidance experiences shared by students, parents, and working professionals.",
  alternates: {
    canonical: "/reviews",
  },
  openGraph: {
    title: "Client Testimonials & Reviews | Inspiria Careers",
    description: "Read verified feedback and guidance experiences shared by students and parents.",
    url: "/reviews",
  },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
