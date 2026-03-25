import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { clicks, links } from "@/lib/db/schema";

export type StatsPeriod = "7d" | "30d";

export interface LinkStats {
  slug: string;
  url: string;
  totalClicks: number;
  createdAt: string | null;
  uniqueCountries: number;
  uniqueReferers: number;
  clicksByDate: { date: string; clicks: number }[];
  topReferers: { referer: string; clicks: number }[];
  countries: { country: string; clicks: number }[];
  devices: { device: string; clicks: number }[];
  browsers: { browser: string; clicks: number }[];
  os: { os: string; clicks: number }[];
}

export function normalizeStatsPeriod(period?: string): StatsPeriod {
  return period === "30d" ? "30d" : "7d";
}

function getSinceTimestamp(period: StatsPeriod): string {
  const days = period === "30d" ? 30 : 7;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
}

function mapToSorted<K extends string>(map: Map<string, number>, key: K) {
  return Array.from(map.entries())
    .map(([name, clicks]) => ({ [key]: name, clicks }) as Record<K, string> & {
      clicks: number;
    })
    .sort((a, b) => b.clicks - a.clicks);
}

export async function getLinkStats(
  slug: string,
  rawPeriod?: string
): Promise<LinkStats | null> {
  const linkResult = await db
    .select()
    .from(links)
    .where(eq(links.slug, slug))
    .limit(1);

  if (linkResult.length === 0) {
    return null;
  }

  const link = linkResult[0];
  const period = normalizeStatsPeriod(rawPeriod);
  const since = getSinceTimestamp(period);

  const allClicks = await db
    .select()
    .from(clicks)
    .where(and(eq(clicks.linkId, link.id), gte(clicks.clickedAt, since)));

  const clicksByDateMap = new Map<string, number>();
  const refererMap = new Map<string, number>();
  const countryMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const osMap = new Map<string, number>();

  for (const click of allClicks) {
    const date = click.clickedAt?.slice(0, 10) || "unknown";
    clicksByDateMap.set(date, (clicksByDateMap.get(date) || 0) + 1);

    const referer = click.referer || "(direct)";
    refererMap.set(referer, (refererMap.get(referer) || 0) + 1);

    const country = click.country || "Unknown";
    countryMap.set(country, (countryMap.get(country) || 0) + 1);

    const device = click.device || "Unknown";
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);

    const browser = click.browser || "Unknown";
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);

    const os = click.os || "Unknown";
    osMap.set(os, (osMap.get(os) || 0) + 1);
  }

  return {
    slug: link.slug,
    url: link.url,
    totalClicks: allClicks.length,
    createdAt: link.createdAt ?? null,
    uniqueCountries: countryMap.size,
    uniqueReferers: refererMap.size,
    clicksByDate: mapToSorted(clicksByDateMap, "date").sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
    topReferers: mapToSorted(refererMap, "referer").slice(0, 10),
    countries: mapToSorted(countryMap, "country"),
    devices: mapToSorted(deviceMap, "device"),
    browsers: mapToSorted(browserMap, "browser"),
    os: mapToSorted(osMap, "os"),
  };
}
