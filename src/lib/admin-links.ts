import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clicks, links } from "@/lib/db/schema";

export function parseAdminLinkId(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const id = Number(trimmed);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function deleteAdminLinkById(linkId: number): Promise<boolean> {
  if (!Number.isSafeInteger(linkId) || linkId <= 0) {
    throw new Error("Invalid link id");
  }

  const deletedLinks = await db.transaction(async (tx) => {
    await tx.delete(clicks).where(eq(clicks.linkId, linkId));

    return tx
      .delete(links)
      .where(eq(links.id, linkId))
      .returning({ id: links.id });
  });

  return deletedLinks.length > 0;
}
