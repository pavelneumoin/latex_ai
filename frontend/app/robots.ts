import type { MetadataRoute } from "next";
import { FEATURES } from "@/lib/features";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://rabochiilist.ru";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/templates",
          ...(FEATURES.teacherMarketplace ? ["/marketplace"] : []),
          "/pricing",
          "/offer",
          "/privacy",
          "/terms",
        ],
        // Приватные и API-маршруты не индексируем.
        disallow: [
          "/my",
          "/dashboard",
          "/settings",
          "/billing",
          "/check",
          "/api/",
          "/share/",
          ...(!FEATURES.teacherMarketplace ? ["/marketplace"] : []),
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
