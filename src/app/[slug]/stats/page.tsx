import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { links, clicks } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { ClicksChart, PieChartCard } from "./charts";

export default async function StatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { slug } = await params;
  const { period = "7d" } = await searchParams;

  const linkResult = await db
    .select()
    .from(links)
    .where(eq(links.slug, slug))
    .limit(1);

  if (linkResult.length === 0) notFound();

  const link = linkResult[0];
  const days = period === "30d" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);

  const allClicks = await db
    .select()
    .from(clicks)
    .where(and(eq(clicks.linkId, link.id), gte(clicks.clickedAt, since)));

  // Aggregate
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

  const toSorted = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([k, v]) => ({ name: k, value: v }))
      .sort((a, b) => b.value - a.value);

  const clicksByDate = Array.from(clicksByDateMap.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">qqwe.kr/{slug}</h1>
      <p className="text-gray-500 text-sm mb-6 truncate">{link.url}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="총 클릭수" value={allClicks.length} />
        <StatCard label="국가" value={countryMap.size} />
        <StatCard label="리퍼러" value={refererMap.size} />
      </div>

      <div className="flex gap-2 mb-6">
        <PeriodLink slug={slug} period="7d" active={period !== "30d"} />
        <PeriodLink slug={slug} period="30d" active={period === "30d"} />
      </div>

      <Section title="일별 클릭">
        <ClicksChart data={clicksByDate} />
      </Section>

      <Section title="리퍼러 Top 10">
        <StatsList items={toSorted(refererMap).slice(0, 10)} />
      </Section>

      <Section title="국가">
        <PieChartCard data={toSorted(countryMap)} />
      </Section>

      <Section title="디바이스">
        <PieChartCard data={toSorted(deviceMap)} />
      </Section>

      <Section title="브라우저">
        <PieChartCard data={toSorted(browserMap)} />
      </Section>

      <Section title="OS">
        <PieChartCard data={toSorted(osMap)} />
      </Section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}

function PeriodLink({
  slug,
  period,
  active,
}: {
  slug: string;
  period: string;
  active: boolean;
}) {
  return (
    <a
      href={`/${slug}/stats?period=${period}`}
      className={`px-3 py-1 rounded text-sm ${
        active ? "bg-blue-600 text-white" : "bg-gray-100"
      }`}
    >
      {period === "7d" ? "7일" : "30일"}
    </a>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 rounded-lg border mb-4">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function StatsList({ items }: { items: { name: string; value: number }[] }) {
  if (items.length === 0)
    return <p className="text-gray-400 text-sm">데이터 없음</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex justify-between text-sm">
          <span className="truncate mr-4">{item.name}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
