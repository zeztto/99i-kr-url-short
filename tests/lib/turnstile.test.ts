import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getTurnstileSecretKey,
  getTurnstileSiteKey,
  isTurnstileEnabled,
  verifyTurnstileToken,
} from "@/lib/turnstile";

const originalSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const originalSecretKey = process.env.TURNSTILE_SECRET_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalSiteKey;
  process.env.TURNSTILE_SECRET_KEY = originalSecretKey;
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
});
