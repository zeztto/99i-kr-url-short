import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { isAdminSession } from "@/lib/admin-auth";

export default async function AdminUnauthorizedPage() {
  const session = await auth();

  if (isAdminSession(session)) {
    redirect("/admin");
  }

  async function switchAccount() {
    "use server";

    const currentSession = await auth();

    if (currentSession) {
      await signOut({ redirectTo: "/admin/login" });
      return;
    }

    redirect("/admin/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-red-950 bg-gray-900/90 p-6 shadow-2xl shadow-black/20">
        <p className="text-sm font-medium text-red-400">Access denied</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Admin 계정만 접근할 수 있습니다
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          현재 로그인한 계정에는 admin 접근 권한이 없습니다. 필요한 경우
          서비스 관리자에게 접근 권한을 요청하세요.
        </p>
        {session?.user?.email && (
          <p className="mt-2 text-sm text-gray-500">
            현재 세션 이메일:
            {" "}
            <span className="text-gray-300">{session.user.email}</span>
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <form action={switchAccount}>
            <button
              type="submit"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900"
            >
              다른 Google 계정으로 다시 시도
            </button>
          </form>
          <Link
            href="/"
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </main>
  );
}
