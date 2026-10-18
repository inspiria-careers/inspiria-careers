import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery & Moments",
  description: "View photos from our workshops, seminars, student mentoring sessions, and campus interactions.",
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Gallery & Moments | Inspiria Careers",
    description: "View photos from our workshops, seminars, student mentoring sessions, and campus interactions.",
    url: "/gallery",
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
