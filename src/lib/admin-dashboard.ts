import { clicks, links } from "@/lib/db/schema";
import { db } from "@/lib/db";

export interface AdminOverview {
  totalLinks: number;
  totalClicks: number;
  linksCreated7d: number;
  clicks7d: number;
}

export interface AdminLinkRow {
  id: number;
  slug: string;
  url: string;
  createdAt: string | null;
  totalClicks: number;
  clicks7d: number;
  lastClickedAt: string | null;
}

export interface AdminDashboardData {
  overview: AdminOverview;
  links: AdminLinkRow[];
}

function getSinceTimestamp(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [allLinks, allClicks] = await Promise.all([
    db.select().from(links),
    db.select().from(clicks),
  ]);

  const since7d = getSinceTimestamp(7);
  const clickStatsByLinkId = new Map<
    number,
    { totalClicks: number; clicks7d: number; lastClickedAt: string | null }
  >();

  for (const click of allClicks) {
    const existing = clickStatsByLinkId.get(click.linkId) ?? {
      totalClicks: 0,
      clicks7d: 0,
      lastClickedAt: null,
    };

    existing.totalClicks += 1;

    if (click.clickedAt && click.clickedAt >= since7d) {
      existing.clicks7d += 1;
    }

    if (
      click.clickedAt &&
      (!existing.lastClickedAt || click.clickedAt > existing.lastClickedAt)
    ) {
      existing.lastClickedAt = click.clickedAt;
    }

    clickStatsByLinkId.set(click.linkId, existing);
  }

  const rows = allLinks
    .map((link) => {
      const stats = clickStatsByLinkId.get(link.id) ?? {
        totalClicks: 0,
        clicks7d: 0,
        lastClickedAt: null,
      };

      return {
        id: link.id,
        slug: link.slug,
        url: link.url,
        createdAt: link.createdAt ?? null,
        totalClicks: stats.totalClicks,
        clicks7d: stats.clicks7d,
        lastClickedAt: stats.lastClickedAt,
      };
    })
    .sort((a, b) => {
      if (b.totalClicks !== a.totalClicks) {
        return b.totalClicks - a.totalClicks;
      }

      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });

  const linksCreated7d = allLinks.filter(
    (link) => link.createdAt && link.createdAt >= since7d
  ).length;
  const clicks7d = allClicks.filter(
    (click) => click.clickedAt && click.clickedAt >= since7d
  ).length;

  return {
    overview: {
      totalLinks: allLinks.length,
      totalClicks: allClicks.length,
      linksCreated7d,
      clicks7d,
    },
    links: rows,
  };
}
