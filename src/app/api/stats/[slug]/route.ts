import { NextRequest, NextResponse } from "next/server";
import { getLinkStats } from "@/lib/stats";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const period = request.nextUrl.searchParams.get("period") || "7d";
  const stats = await getLinkStats(slug, period);

  if (!stats) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...stats,
  });
}
