import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top 10 International Universities Admission Guide | Cost, Aid & Strategy",
  description:
    "Comprehensive admissions guide to the top 10 global universities (MIT, Oxford, Stanford, Cambridge, NUS, Harvard, Toronto, ETH Zurich, Melbourne, LSE). Compare tuition, cost of attendance, scholarships, deadlines, and expert counsellor tips.",
  keywords: [
    "top international universities",
    "study abroad admission guide",
    "MIT admission deadlines",
    "Oxford personal statement tips",
    "Stanford intellectual vitality",
    "Cambridge tripos admission",
    "NUS international students",
    "Harvard need blind scholarships",
    "University of Toronto PEY co-op",
    "ETH Zurich tuition fees",
    "Melbourne model",
    "LSE economics admission",
    "overseas education counselling",
  ],
  alternates: {
    canonical: "/universities",
  },
  openGraph: {
    title: "Top 10 International Universities Admission Guide | Inspiria Careers",
    description:
      "Explore tuition fees, living costs, 100% need-met scholarships, UCAS and Common App deadlines, and counsellor tips for the world's leading universities.",
    url: "/universities",
    type: "website",
  },
};

export default function UniversitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
