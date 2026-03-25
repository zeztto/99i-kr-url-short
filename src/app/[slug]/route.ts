import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { db } from "@/lib/db";
import { links, clicks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseClickData } from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const result = await db
    .select()
    .from(links)
    .where(eq(links.slug, slug))
    .limit(1);

  if (result.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const link = result[0];

  after(async () => {
    try {
      const clickData = parseClickData(request.headers);
      await db.insert(clicks).values({
        linkId: link.id,
        referer: clickData.referer,
        country: clickData.country,
        device: clickData.device,
        browser: clickData.browser,
        os: clickData.os,
      });
    } catch (error) {
      console.error("Failed to record click:", error);
    }
  });

  return NextResponse.redirect(link.url, 302);
}
