import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { links, clicks } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const linkResult = await db
    .select()
    .from(links)
    .where(eq(links.slug, slug))
    .limit(1);

  if (linkResult.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const link = linkResult[0];
  const period = request.nextUrl.searchParams.get("period") || "7d";
  const days = period === "30d" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);

  const allClicks = await db
    .select()
    .from(clicks)
    .where(and(eq(clicks.linkId, link.id), gte(clicks.clickedAt, since)));

  const totalClicks = allClicks.length;

  const clicksByDateMap = new Map<string, number>();
  const refererMap = new Map<string, number>();
  const countryMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const osMap = new Map<string, number>();

  for (const click of allClicks) {
    const date = click.clickedAt?.slice(0, 10) || "unknown";
    clicksByDateMap.set(date, (clicksByDateMap.get(date) || 0) + 1);

    const ref = click.referer || "(direct)";
    refererMap.set(ref, (refererMap.get(ref) || 0) + 1);

    const country = click.country || "Unknown";
    countryMap.set(country, (countryMap.get(country) || 0) + 1);

    const device = click.device || "Unknown";
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);

    const browser = click.browser || "Unknown";
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);

    const os = click.os || "Unknown";
    osMap.set(os, (osMap.get(os) || 0) + 1);
  }

  const mapToSorted = (map: Map<string, number>, key: string) =>
    Array.from(map.entries())
      .map(([k, v]) => ({ [key]: k, clicks: v }))
      .sort((a, b) => b.clicks - a.clicks);

  return NextResponse.json({
    slug: link.slug,
    url: link.url,
    totalClicks,
    createdAt: link.createdAt,
    clicksByDate: mapToSorted(clicksByDateMap, "date").sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
    topReferers: mapToSorted(refererMap, "referer").slice(0, 10),
    countries: mapToSorted(countryMap, "country"),
    devices: mapToSorted(deviceMap, "device"),
    browsers: mapToSorted(browserMap, "browser"),
    os: mapToSorted(osMap, "os"),
  });
}
