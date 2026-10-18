"use client";
import React from "react";
import { useSite } from "@/contexts/SiteContext";

export default function JsonLd() {
  const siteContext = useSite();
  const profile = siteContext?.profile;

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": profile?.siteName || "Inspiria Careers",
    "description": profile?.subTagline || "Professional career and educational counselling services",
    "url": typeof window !== "undefined" ? window.location.origin : "https://inspiria-careers.vercel.app",
    ...(profile?.phone ? { telephone: profile.phone } : {}),
    ...(profile?.email ? { email: profile.email } : {}),
    ...(profile?.address ? {
      address: {
        "@type": "PostalAddress",
        "streetAddress": profile.address,
      },
    } : {}),
    ...(profile?.counsellorName ? {
      founder: {
        "@type": "Person",
        "name": profile.counsellorName,
        "jobTitle": profile.counsellorTitle || "Counsellor",
        ...(profile.qualifications ? { honorificSuffix: profile.qualifications.replace(/\n/g, ", ") } : {}),
        ...(profile.counsellorBio ? { description: profile.counsellorBio } : {}),
      },
    } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
