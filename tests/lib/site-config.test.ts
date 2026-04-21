import { afterEach, describe, expect, it } from "vitest";
import { resolveSiteConfig } from "@/lib/site-config";

const originalBaseUrl = process.env.BASE_URL;
const originalSiteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN;
const originalSiteName = process.env.NEXT_PUBLIC_SITE_NAME;
const originalSiteTitle = process.env.NEXT_PUBLIC_SITE_TITLE;

afterEach(() => {
  process.env.BASE_URL = originalBaseUrl;
  process.env.NEXT_PUBLIC_SITE_DOMAIN = originalSiteDomain;
  process.env.NEXT_PUBLIC_SITE_NAME = originalSiteName;
  process.env.NEXT_PUBLIC_SITE_TITLE = originalSiteTitle;
});

describe("resolveSiteConfig", () => {
  it("uses configured branding when the request host is untrusted", () => {
    process.env.BASE_URL = "https://qqwe.kr";
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "qqwe.kr";
    process.env.NEXT_PUBLIC_SITE_NAME = "qqwe.kr";
    process.env.NEXT_PUBLIC_SITE_TITLE = "qqwe.kr - URL 단축 서비스";

    const config = resolveSiteConfig({
      host: "evil.example",
      proto: "https",
    });

    expect(config.domain).toBe("qqwe.kr");
    expect(config.name).toBe("qqwe.kr");
    expect(config.baseUrl).toBe("https://qqwe.kr");
    expect(config.title).toBe("qqwe.kr - URL 단축 서비스");
  });

  it("allows localhost branding for local development", () => {
    process.env.BASE_URL = "https://99i.kr";
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "99i.kr";
    process.env.NEXT_PUBLIC_SITE_NAME = "99i.kr";

    const config = resolveSiteConfig({
      host: "localhost:3000",
      proto: "http",
    });

    expect(config.domain).toBe("localhost:3000");
    expect(config.name).toBe("localhost:3000");
    expect(config.baseUrl).toBe("http://localhost:3000");
  });

  it("uses env branding when request host is unavailable", () => {
    process.env.BASE_URL = "https://99i.kr";
    process.env.NEXT_PUBLIC_SITE_DOMAIN = "99i.kr";
    process.env.NEXT_PUBLIC_SITE_NAME = "99i.kr";

    const config = resolveSiteConfig();

    expect(config.domain).toBe("99i.kr");
    expect(config.name).toBe("99i.kr");
    expect(config.baseUrl).toBe("https://99i.kr");
  });

  it("falls back to localhost for local development", () => {
    delete process.env.BASE_URL;
    delete process.env.NEXT_PUBLIC_SITE_DOMAIN;
    delete process.env.NEXT_PUBLIC_SITE_NAME;
    delete process.env.NEXT_PUBLIC_SITE_TITLE;

    const config = resolveSiteConfig();

    expect(config.domain).toBe("localhost:3000");
    expect(config.name).toBe("localhost:3000");
    expect(config.baseUrl).toBe("http://localhost:3000");
  });
});
