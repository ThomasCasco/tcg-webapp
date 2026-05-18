import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/shared/app-url";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { listClaimSessions, listListings } from "@/lib/server/repository";

export const dynamic = "force-dynamic";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/market", changeFrequency: "hourly", priority: 0.95 },
  { path: "/auctions", changeFrequency: "hourly", priority: 0.85 },
  { path: "/claims", changeFrequency: "hourly", priority: 0.8 },
  { path: "/trades", changeFrequency: "daily", priority: 0.75 },
  { path: "/profiles", changeFrequency: "daily", priority: 0.65 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.55 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.25 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.25 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  if (!isSupabaseConfigured()) {
    return entries;
  }

  const [listings, claims] = await Promise.all([
    listListings({ statuses: ["active"], onlyPublic: true }).catch(() => []),
    listClaimSessions({ status: ["active"] }).catch(() => []),
  ]);

  for (const listing of listings) {
    if (listing.listingType === "mystery_pack") continue;
    entries.push({
      url: `${baseUrl}/market/${listing.id}`,
      lastModified: new Date(listing.createdAt),
      changeFrequency: "daily",
      priority: 0.7,
      images: listing.imageUrl ? [listing.imageUrl] : undefined,
    });
  }

  for (const claim of claims) {
    entries.push({
      url: `${baseUrl}/claims/${claim.id}`,
      lastModified: new Date(claim.createdAt),
      changeFrequency: "hourly",
      priority: 0.65,
    });
  }

  return entries;
}
