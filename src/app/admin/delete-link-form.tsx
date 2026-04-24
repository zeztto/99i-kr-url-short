"use client";

import { useFormStatus } from "react-dom";
import { deleteAdminLinkAction } from "@/app/admin/actions";

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-red-900/70 px-3 py-1.5 text-sm font-medium text-red-300 hover:border-red-700 hover:bg-red-950/40 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "삭제 중" : "삭제"}
    </button>
  );
}

export function DeleteLinkForm({
  linkId,
  slug,
}: {
  linkId: number;
  slug: string;
}) {
  return (
    <form
      action={deleteAdminLinkAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `${slug} 링크를 삭제할까요? 클릭 기록도 함께 삭제됩니다.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="linkId" value={linkId} />
      <DeleteButton />
    </form>
  );
}
