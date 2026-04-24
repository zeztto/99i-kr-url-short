import { afterEach, describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const originalBaseUrl = process.env.BASE_URL;
const originalSiteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN;
const originalSiteName = process.env.NEXT_PUBLIC_SITE_NAME;

afterEach(() => {
  process.env.BASE_URL = originalBaseUrl;
  process.env.NEXT_PUBLIC_SITE_DOMAIN = originalSiteDomain;
  process.env.NEXT_PUBLIC_SITE_NAME = originalSiteName;
});

describe("SEO metadata routes", () => {
  it("generates a robots.txt policy for the public site", () => {
    process.env.BASE_URL = "https://99i.kr";
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "99i.kr";
    process.env.NEXT_PUBLIC_SITE_NAME = "99i.kr";

    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;

    expect(rules).toMatchObject({
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    });
    expect(result.sitemap).toBe("https://99i.kr/sitemap.xml");
  });

  it("publishes the homepage in the sitemap", () => {
    process.env.BASE_URL = "https://99i.kr";
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "99i.kr";
    process.env.NEXT_PUBLIC_SITE_NAME = "99i.kr";

    const result = sitemap();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      url: "https://99i.kr",
      changeFrequency: "daily",
      priority: 1,
    });
    expect(result[0]?.lastModified).toBeInstanceOf(Date);
  });

  it("falls back to the production canonical domain when build env is missing", () => {
    delete process.env.BASE_URL;
    delete process.env.NEXT_PUBLIC_SITE_DOMAIN;
    delete process.env.NEXT_PUBLIC_SITE_NAME;

    expect(robots().sitemap).toBe("https://99i.kr/sitemap.xml");
    expect(sitemap()[0]?.url).toBe("https://99i.kr");
  });
});
