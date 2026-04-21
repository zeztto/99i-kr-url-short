import { afterEach, describe, expect, it } from "vitest";
import { resolvePublicBaseUrl } from "@/lib/public-url";

const originalBaseUrl = process.env.BASE_URL;

afterEach(() => {
  process.env.BASE_URL = originalBaseUrl;
});

describe("resolvePublicBaseUrl", () => {
  it("uses configured BASE_URL instead of an untrusted forwarded host", () => {
    process.env.BASE_URL = "https://99i.kr";

    const result = resolvePublicBaseUrl({
      headers: new Headers({
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "https",
      }),
      nextUrl: new URL("http://internal:3000"),
    });

    expect(result).toBe("https://99i.kr");
  });

  it("allows localhost origin for local development", () => {
    process.env.BASE_URL = "https://99i.kr";

    const result = resolvePublicBaseUrl({
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/path"),
    });

    expect(result).toBe("http://localhost:3000");
  });

  it("uses BASE_URL when request origin is unavailable", () => {
    process.env.BASE_URL = "https://99i.kr/";

    const result = resolvePublicBaseUrl({
      headers: new Headers(),
    });

    expect(result).toBe("https://99i.kr");
  });
});
