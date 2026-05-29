import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://rabochiilist.ru";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/templates", "/marketplace", "/pricing", "/offer", "/privacy", "/terms"],
        // Приватные и API-маршруты не индексируем.
        disallow: ["/my", "/dashboard", "/settings", "/billing", "/check", "/api/", "/share/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
