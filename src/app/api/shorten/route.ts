import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { generateSlug, isReservedPath } from "@/lib/slug";
import { validateUrl } from "@/lib/url";
import { rateLimiter } from "@/lib/rate-limit";
import { resolvePublicBaseUrl } from "@/lib/public-url";
import {
  getTurnstileExpectedHostname,
  isTurnstileEnabled,
  verifyTurnstileToken,
} from "@/lib/turnstile";

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const expectedHostname = getTurnstileExpectedHostname(forwardedHost || host);

  try {
    if (!rateLimiter.check(ip)) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다" },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body?.url || !validateUrl(body.url)) {
      return NextResponse.json(
        { error: "올바른 URL을 입력해주세요" },
        { status: 400 }
      );
    }

    if (isTurnstileEnabled()) {
      const verification = await verifyTurnstileToken({
        token: body.turnstileToken,
        remoteIp: ip,
        expectedHostname,
      });

      if (!verification.success) {
        console.error("Turnstile verification failed", {
          errorCodes: verification.errorCodes,
          expectedHostname,
          verifiedHostname: verification.hostname || null,
          forwardedHost,
          host,
          ip,
        });
        return NextResponse.json(
          { error: "보안 확인에 실패했습니다. 다시 시도해주세요" },
          { status: 403 }
        );
      }
    }

    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      const slug = generateSlug();
      if (isReservedPath(slug)) continue;

      try {
        await db.insert(links).values({ slug, url: body.url });
        const baseUrl = resolvePublicBaseUrl(request);
        return NextResponse.json({ shortUrl: `${baseUrl}/${slug}`, slug });
      } catch (error) {
        if (isUniqueViolation(error)) {
          continue;
        }

        throw error;
      }
    }

    console.error("Slug generation failed after max retries");
    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Shorten API unexpected error", {
      error,
      expectedHostname,
      forwardedHost,
      host,
      ip,
    });
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요" },
      { status: 500 }
    );
  }
}
