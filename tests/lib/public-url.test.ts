import { afterEach, describe, expect, it } from "vitest";
import { resolvePublicBaseUrl } from "@/lib/public-url";

const originalBaseUrl = process.env.BASE_URL;

afterEach(() => {
  process.env.BASE_URL = originalBaseUrl;
});

describe("resolvePublicBaseUrl", () => {
  it("prefers forwarded host and protocol", () => {
    const result = resolvePublicBaseUrl({
      headers: new Headers({
        "x-forwarded-host": "99i.kr",
        "x-forwarded-proto": "https",
      }),
      nextUrl: new URL("http://internal:3000"),
    });

    expect(result).toBe("https://99i.kr");
  });

  it("falls back to nextUrl origin", () => {
    const result = resolvePublicBaseUrl({
      headers: new Headers(),
      nextUrl: new URL("https://preview.99i.kr/path"),
    });

    expect(result).toBe("https://preview.99i.kr");
  });

  it("uses BASE_URL when request origin is unavailable", () => {
    process.env.BASE_URL = "https://99i.kr/";

    const result = resolvePublicBaseUrl({
      headers: new Headers(),
    });

    expect(result).toBe("https://99i.kr");
  });
});
