import type { MetadataRoute } from "next";
import { getSeoBaseUrl } from "@/lib/seo-base-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSeoBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: new URL("/sitemap.xml", baseUrl).toString(),
  };
}
