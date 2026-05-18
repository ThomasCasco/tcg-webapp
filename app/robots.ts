import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/shared/app-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/inventory",
        "/listings",
        "/transactions",
        "/disputes",
        "/alerts",
        "/account",
        "/onboarding",
        "/my-auctions",
        "/my-claims",
        "/trade-proposals",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/ui-kit",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
