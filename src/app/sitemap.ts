import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://www.foodpatrons.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [restaurants, posts] = await Promise.all([
    supabase.from("restaurants").select("id"),
    supabase.from("blog_posts").select("slug, published_at").eq("is_published", true),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/offers`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/events`, changeFrequency: "daily", priority: 0.6 },
    { url: `${BASE_URL}/community`, changeFrequency: "hourly", priority: 0.5 },
    { url: `${BASE_URL}/guides`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/advertise`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const restaurantRoutes: MetadataRoute.Sitemap = (restaurants.data ?? []).map((r) => ({
    url: `${BASE_URL}/restaurant/${r.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const guideRoutes: MetadataRoute.Sitemap = (posts.data ?? []).map((p) => ({
    url: `${BASE_URL}/guides/${p.slug}`,
    lastModified: p.published_at ? new Date(p.published_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...restaurantRoutes, ...guideRoutes];
}
