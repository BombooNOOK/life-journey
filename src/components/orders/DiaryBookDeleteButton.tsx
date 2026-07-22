"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookId: string;
  bookTitle: string;
  /** 削除後の遷移先（既定: 本棚） */
  redirectHref?: string;
  className?: string;
  buttonLabel?: string;
};

export function DiaryBookDeleteButton({
  bookId,
  bookTitle,
  redirectHref = "/orders/bookshelf",
  className = "text-xs font-medium text-rose-700 underline-offset-2 hover:text-rose-900 hover:underline",
  buttonLabel = "このあしあとブックを削除",
}: Props) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    if (deleting) return;
    setOpen(false);
    setError(null);
  }, [deleting]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/journal/diary-books/${encodeURIComponent(bookId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { error?: string; code?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "あしあとブックの削除に失敗しました。");
      }
      setOpen(false);
      router.push(redirectHref);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "あしあとブックの削除に失敗しました。");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-stone-900/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-5 shadow-lg"
          >
            <h2 id={titleId} className="text-base font-semibold text-stone-900">
              あしあとブックを削除しますか？
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-700">
              <span className="font-medium text-stone-900">「{bookTitle}」</span>
              を削除します。
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              このあしあとブックを削除します。あしあと本文は削除されません。
            </p>
            {error ? (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                {error}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                disabled={deleting}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60"
              >
                {deleting ? "削除しています…" : "削除する"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
