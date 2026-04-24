"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin-auth";
import { deleteAdminLinkById, parseAdminLinkId } from "@/lib/admin-links";

export async function deleteAdminLinkAction(formData: FormData) {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  if (!isAdminSession(session)) {
    redirect("/admin/unauthorized");
  }

  const linkId = parseAdminLinkId(formData.get("linkId"));
  if (linkId === null) {
    throw new Error("Invalid link id");
  }

  await deleteAdminLinkById(linkId);
  revalidatePath("/admin");
}
