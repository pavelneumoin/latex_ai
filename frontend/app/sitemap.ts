import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://rabochiilist.ru";

// Статический sitemap публичных страниц. Маркетплейсные листы добавим, когда появится
// публичный каталог с устойчивыми URL.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/demo", priority: 0.85, changeFrequency: "monthly" as const },
    { path: "/templates", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/marketplace", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/pricing", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/offer", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/register", priority: 0.6, changeFrequency: "monthly" as const },
  ];
  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
