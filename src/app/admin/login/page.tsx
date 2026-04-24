import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import {
  getAdminAuthSetupIssues,
  isAdminSession,
} from "@/lib/admin-auth";
import { AutoSubmitForm } from "./auto-submit-form";

export default async function AdminLoginPage() {
  if (getAdminAuthSetupIssues().length > 0) {
    redirect("/admin/unauthorized");
  }

  const session = await auth();

  if (isAdminSession(session)) {
    redirect("/admin");
  }

  async function signInWithGoogle(formData: FormData) {
    "use server";

    void formData;
    await signIn("google", { redirectTo: "/admin" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-[var(--text-primary)]">
      <AutoSubmitForm action={signInWithGoogle} />
    </main>
  );
}
