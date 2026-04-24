import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { DeleteLinkForm } from "@/app/admin/delete-link-form";
import { getAdminAuthSetupIssues, isAdminSession } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/lib/admin-dashboard";
import { getRequestSiteConfig } from "@/lib/site-config";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  if (getAdminAuthSetupIssues().length > 0 || !isAdminSession(session)) {
    redirect("/admin/unauthorized");
  }

  async function handleSignOut() {
    "use server";

    await signOut({ redirectTo: "/" });
  }

  const dashboard = await getAdminDashboardData();
  const siteConfig = await getRequestSiteConfig();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-10">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-800 bg-gray-900/80 p-6 shadow-2xl shadow-black/20 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            생성된 주소와 전체 통계를 한 번에 확인합니다
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            로그인 계정:
            {" "}
            <span className="text-gray-200">{session.user?.email}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300"
          >
            홈으로 이동
          </Link>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="총 링크 수" value={dashboard.overview.totalLinks} />
        <StatCard label="총 클릭 수" value={dashboard.overview.totalClicks} />
        <StatCard label="최근 7일 신규 링크" value={dashboard.overview.linksCreated7d} />
        <StatCard label="최근 7일 클릭" value={dashboard.overview.clicks7d} />
      </section>

      <section className="mt-8 rounded-3xl border border-gray-800 bg-gray-900/80 p-4 shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between px-2 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">링크 목록</h2>
            <p className="text-sm text-gray-400">
              slug별 누적 클릭과 최근 활동을 함께 표시합니다
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-gray-500">
              <tr className="border-b border-gray-800">
                <th className="px-3 py-3 font-medium">Short URL</th>
                <th className="px-3 py-3 font-medium">Original URL</th>
                <th className="px-3 py-3 font-medium">생성일</th>
                <th className="px-3 py-3 font-medium">총 클릭</th>
                <th className="px-3 py-3 font-medium">최근 7일</th>
                <th className="px-3 py-3 font-medium">마지막 클릭</th>
                <th className="px-3 py-3 font-medium">상세</th>
                <th className="px-3 py-3 font-medium">삭제</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.links.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-10 text-center text-sm text-gray-500"
                  >
                    아직 생성된 링크가 없습니다.
                  </td>
                </tr>
              ) : (
                dashboard.links.map((link) => (
                  <tr
                    key={link.id}
                    className="border-b border-gray-900/80 align-top last:border-b-0"
                  >
                    <td className="px-3 py-4">
                      <a
                        href={`${siteConfig.baseUrl}/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-400 hover:text-blue-300"
                      >
                        {siteConfig.domain}/{link.slug}
                      </a>
                    </td>
                    <td className="px-3 py-4">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block max-w-md truncate text-gray-300 hover:text-white"
                        title={link.url}
                      >
                        {link.url}
                      </a>
                    </td>
                    <td className="px-3 py-4 text-gray-300">
                      {link.createdAt ?? "-"}
                    </td>
                    <td className="px-3 py-4 text-white">{link.totalClicks}</td>
                    <td className="px-3 py-4 text-white">{link.clicks7d}</td>
                    <td className="px-3 py-4 text-gray-300">
                      {link.lastClickedAt ?? "-"}
                    </td>
                    <td className="px-3 py-4">
                      <Link
                        href={`/${link.slug}/stats`}
                        className="text-gray-300 hover:text-white"
                      >
                        링크 통계
                      </Link>
                    </td>
                    <td className="px-3 py-4">
                      <DeleteLinkForm linkId={link.id} slug={link.slug} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
