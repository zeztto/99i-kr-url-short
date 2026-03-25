import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { generateSlug, isReservedPath } from "@/lib/slug";
import { validateUrl } from "@/lib/url";
import { rateLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

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

  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    const slug = generateSlug();
    if (isReservedPath(slug)) continue;

    try {
      await db.insert(links).values({ slug, url: body.url });
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      return NextResponse.json({ shortUrl: `${baseUrl}/${slug}`, slug });
    } catch (error: any) {
      if (error?.message?.includes("UNIQUE constraint")) continue;
      throw error;
    }
  }

  console.error("Slug generation failed after max retries");
  return NextResponse.json(
    { error: "잠시 후 다시 시도해주세요" },
    { status: 500 }
  );
}
