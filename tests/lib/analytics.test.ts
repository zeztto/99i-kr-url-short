import { describe, it, expect } from "vitest";
import { parseClickData } from "@/lib/analytics";

describe("parseClickData", () => {
  it("parses desktop Chrome on Windows", () => {
    const headers = new Headers({
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      referer: "https://twitter.com/post/123",
    });
    const result = parseClickData(headers);
    expect(result.device).toBe("desktop");
    expect(result.browser).toBe("Chrome");
    expect(result.os).toBe("Windows");
    expect(result.referer).toBe("https://twitter.com/post/123");
  });

  it("parses mobile Safari on iOS", () => {
    const headers = new Headers({
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const result = parseClickData(headers);
    expect(result.device).toBe("mobile");
    expect(result.browser).toBe("Mobile Safari");
    expect(result.os).toBe("iOS");
    expect(result.referer).toBeNull();
  });

  it("extracts country from geo headers", () => {
    const headers = new Headers({
      "user-agent": "Mozilla/5.0",
      "x-vercel-ip-country": "KR",
    });
    const result = parseClickData(headers);
    expect(result.country).toBe("KR");
  });

  it("returns null country when no geo header", () => {
    const headers = new Headers({ "user-agent": "Mozilla/5.0" });
    const result = parseClickData(headers);
    expect(result.country).toBeNull();
  });
});
