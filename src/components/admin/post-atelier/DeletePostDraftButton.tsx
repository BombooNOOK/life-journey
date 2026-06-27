"use client";

import { deleteSocialPostDraft } from "@/app/admin/post-atelier/actions";

type Props = {
  draftId: string;
  label?: string;
};

export function DeletePostDraftButton({ draftId, label = "削除" }: Props) {
  return (
    <form
      action={deleteSocialPostDraft}
      className="inline"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "この投稿案を一覧から削除します。元に戻せません。よろしいですか？",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={draftId} />
      <button
        type="submit"
        className="text-red-700 underline-offset-2 hover:underline"
      >
        {label}
      </button>
    </form>
  );
}
