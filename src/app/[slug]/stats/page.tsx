import Link from "next/link";
import { notFound } from "next/navigation";
import { ClicksChart, PieChartCard } from "./charts";
import { getLinkStats } from "@/lib/stats";
import { getRequestSiteConfig } from "@/lib/site-config";

export default async function StatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { slug } = await params;
  const { period = "7d" } = await searchParams;
  const stats = await getLinkStats(slug, period);
  const siteConfig = await getRequestSiteConfig();

  if (!stats) notFound();

  const toChartData = <T extends string>(
    items: Array<Record<T, string> & { clicks: number }>,
    key: T
  ) => items.map((item) => ({ name: item[key], value: item.clicks }));

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-200">
          ← {siteConfig.name}
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-1 text-white">
        {siteConfig.domain}/{slug}
      </h1>
      <p className="text-gray-400 text-sm mb-6 truncate">{stats.url}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="총 클릭수" value={stats.totalClicks} />
        <StatCard label="국가" value={stats.uniqueCountries} />
        <StatCard label="리퍼러" value={stats.uniqueReferers} />
      </div>

      {stats.totalClicks === 0 && (
        <div className="mb-8 rounded-lg border border-blue-800 bg-blue-950 p-4 text-sm text-blue-200">
          아직 클릭이 없습니다. 단축 링크가 실제로 열려야 통계가 기록됩니다.
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 font-medium text-blue-400 underline underline-offset-4"
          >
            단축 링크 열기
          </a>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <PeriodLink slug={slug} period="7d" active={period !== "30d"} />
        <PeriodLink slug={slug} period="30d" active={period === "30d"} />
      </div>

      <Section title="일별 클릭">
        <ClicksChart data={stats.clicksByDate} />
      </Section>

      <Section title="리퍼러 Top 10">
        <StatsList items={toChartData(stats.topReferers, "referer")} />
      </Section>

      <Section title="국가">
        <PieChartCard data={toChartData(stats.countries, "country")} />
      </Section>

      <Section title="디바이스">
        <PieChartCard data={toChartData(stats.devices, "device")} />
      </Section>

      <Section title="브라우저">
        <PieChartCard data={toChartData(stats.browsers, "browser")} />
      </Section>

      <Section title="OS">
        <PieChartCard data={toChartData(stats.os, "os")} />
      </Section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
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
    <Link
      href={`/${slug}/stats?period=${period}`}
      className={`px-3 py-1 rounded text-sm ${
        active
          ? "bg-blue-600 text-white"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
      }`}
    >
      {period === "7d" ? "7일" : "30일"}
    </Link>
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
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4">
      <h2 className="font-semibold mb-3 text-gray-200">{title}</h2>
      {children}
    </div>
  );
}

function StatsList({ items }: { items: { name: string; value: number }[] }) {
  if (items.length === 0)
    return <p className="text-gray-500 text-sm">데이터 없음</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex justify-between text-sm">
          <span className="truncate mr-4 text-gray-300">{item.name}</span>
          <span className="font-medium text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
