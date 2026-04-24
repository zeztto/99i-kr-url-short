import type { MetadataRoute } from "next";
import { getSeoBaseUrl } from "@/lib/seo-base-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSeoBaseUrl();

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
