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
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 text-[var(--text-primary)]">
      <div className="mb-6">
        <Link href="/" className="text-sm font-medium text-[var(--accent-green)] hover:text-[var(--accent-green-strong)]">
          ← {siteConfig.name}
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">
        {siteConfig.domain}/{slug}
      </h1>
      <p className="mb-6 truncate text-sm text-[var(--text-secondary)]">{stats.url}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="총 클릭수" value={stats.totalClicks} />
        <StatCard label="국가" value={stats.uniqueCountries} />
        <StatCard label="리퍼러" value={stats.uniqueReferers} />
      </div>

      {stats.totalClicks === 0 && (
        <div className="mb-8 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
          아직 클릭이 없습니다. 단축 링크가 실제로 열려야 통계가 기록됩니다.
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 font-medium text-[var(--accent-green)] underline underline-offset-4"
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
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-small)]">
      <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-sm text-[var(--text-secondary)]">{label}</p>
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
          ? "bg-[var(--accent-green)] text-[var(--text-inverse)]"
          : "bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-sage)]"
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
    <div className="mb-4 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-small)]">
      <h2 className="mb-3 font-semibold text-[var(--text-primary)]">{title}</h2>
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
          <span className="mr-4 truncate text-[var(--text-secondary)]">{item.name}</span>
          <span className="font-medium text-[var(--text-primary)]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
