import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles & Insights",
  description: "Helpful guidance articles, entrance exam tips, admission advice, and career roadmaps written by our counsellor.",
  alternates: {
    canonical: "/posts",
  },
  openGraph: {
    title: "Articles & Insights | Inspiria Careers",
    description: "Helpful guidance articles, entrance exam tips, admission advice, and career roadmaps.",
    url: "/posts",
  },
};

export default function PostsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
