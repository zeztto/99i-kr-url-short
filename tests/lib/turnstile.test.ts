import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getTurnstileExpectedHostname,
  getTurnstileSecretKey,
  getTurnstileSiteKey,
  isTurnstileEnabled,
  verifyTurnstileToken,
} from "@/lib/turnstile";

const originalSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const originalLegacySiteKey = process.env.TURNSTILE_SITE_KEY;
const originalSecretKey = process.env.TURNSTILE_SECRET_KEY;
const originalExpectedHostname = process.env.TURNSTILE_EXPECTED_HOSTNAME;
const originalBaseUrl = process.env.BASE_URL;
const originalTurnstileEnabled = process.env.TURNSTILE_ENABLED;

afterEach(() => {
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalSiteKey;
  process.env.TURNSTILE_SITE_KEY = originalLegacySiteKey;
  process.env.TURNSTILE_SECRET_KEY = originalSecretKey;
  process.env.TURNSTILE_EXPECTED_HOSTNAME = originalExpectedHostname;
  process.env.BASE_URL = originalBaseUrl;
  process.env.TURNSTILE_ENABLED = originalTurnstileEnabled;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("turnstile env helpers", () => {
  it("detects when turnstile is enabled", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";
    process.env.TURNSTILE_SECRET_KEY = "secret-key";

    expect(getTurnstileSiteKey()).toBe("site-key");
    expect(getTurnstileSecretKey()).toBe("secret-key");
    expect(isTurnstileEnabled()).toBe(true);
  });

  it("is disabled when either key is missing", () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;

    expect(isTurnstileEnabled()).toBe(false);
  });

  it("accepts TURNSTILE_SITE_KEY as a fallback alias", () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    process.env.TURNSTILE_SITE_KEY = "legacy-site-key";
    process.env.TURNSTILE_SECRET_KEY = "secret-key";

    expect(getTurnstileSiteKey()).toBe("legacy-site-key");
    expect(isTurnstileEnabled()).toBe(true);
  });

  it("is disabled when TURNSTILE_ENABLED is false", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";
    process.env.TURNSTILE_SECRET_KEY = "secret-key";
    process.env.TURNSTILE_ENABLED = "false";

    expect(isTurnstileEnabled()).toBe(false);
  });

  it("prefers TURNSTILE_EXPECTED_HOSTNAME over request host", () => {
    process.env.TURNSTILE_EXPECTED_HOSTNAME = "99i.kr";
    process.env.BASE_URL = "https://fallback.example";

    expect(getTurnstileExpectedHostname("proxy.internal:3000")).toBe("99i.kr");
  });

  it("normalizes forwarded request hosts with ports and comma-separated values", () => {
    delete process.env.TURNSTILE_EXPECTED_HOSTNAME;

    expect(getTurnstileExpectedHostname("https://99i.kr, proxy.internal")).toBe(
      "99i.kr"
    );
    expect(getTurnstileExpectedHostname("99i.kr:443")).toBe("99i.kr");
  });

  it("falls back to BASE_URL hostname when request host is unavailable", () => {
    delete process.env.TURNSTILE_EXPECTED_HOSTNAME;
    process.env.BASE_URL = "https://99i.kr/path";

    expect(getTurnstileExpectedHostname()).toBe("99i.kr");
  });
});

describe("verifyTurnstileToken", () => {
  it("fails when the token is missing", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret-key";

    await expect(verifyTurnstileToken({ token: "" })).resolves.toEqual({
      success: false,
      errorCodes: ["missing-input-response"],
    });
  });

  it("returns success when Cloudflare accepts the token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            hostname: "99i.kr",
          }),
          { status: 200 }
        )
      )
    );

    await expect(
      verifyTurnstileToken({
        token: "valid-token",
        expectedHostname: "99i.kr",
      })
    ).resolves.toEqual({
      success: true,
      errorCodes: [],
      hostname: "99i.kr",
    });
  });

  it("fails when the verified hostname does not match", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            hostname: "qqwe.kr",
          }),
          { status: 200 }
        )
      )
    );

    await expect(
      verifyTurnstileToken({
        token: "valid-token",
        expectedHostname: "99i.kr",
      })
    ).resolves.toEqual({
      success: false,
      errorCodes: ["hostname-mismatch"],
      hostname: "qqwe.kr",
    });
  });

  it("allows hostname differences for Cloudflare test secret keys", async () => {
    process.env.TURNSTILE_SECRET_KEY =
      "1x0000000000000000000000000000000AA";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            hostname: "example.com",
          }),
          { status: 200 }
        )
      )
    );

    await expect(
      verifyTurnstileToken({
        token: "test-token",
        expectedHostname: "localhost",
      })
    ).resolves.toEqual({
      success: true,
      errorCodes: [],
      hostname: "example.com",
    });
  });


  it("returns Cloudflare validation errors", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            "error-codes": ["timeout-or-duplicate"],
          }),
          { status: 200 }
        )
      )
    );

    await expect(
      verifyTurnstileToken({ token: "expired-token" })
    ).resolves.toEqual({
      success: false,
      errorCodes: ["timeout-or-duplicate"],
    });
  });

  it("sends remoteip only when it is a valid IP address", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret-key";
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await verifyTurnstileToken({
      token: "valid-token",
      remoteIp: "203.0.113.10, 198.51.100.10",
    });

    const firstBody = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(firstBody.get("remoteip")).toBe("203.0.113.10");

    await verifyTurnstileToken({
      token: "valid-token",
      remoteIp: "unknown",
    });

    const secondBody = fetchMock.mock.calls[1]?.[1]?.body as URLSearchParams;
    expect(secondBody.has("remoteip")).toBe(false);
  });
});
