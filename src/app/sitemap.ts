import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inspiria-careers.vercel.app";
  const now = new Date();

  const routes = [
    "",
    "/about",
    "/services",
    "/gallery",
    "/contact",
    "/reviews",
    "/posts",
    "/book",
    "/workshops",
    "/resources",
    "/faq",
    "/emergency",
    "/privacy",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/posts" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/book" || route === "/services" ? 0.9 : 0.7,
  }));
}
