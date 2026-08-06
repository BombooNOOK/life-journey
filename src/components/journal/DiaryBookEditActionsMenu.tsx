"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { BookshelfEditIncludesNavButton } from "@/components/orders/BookshelfEditIncludesNavButton";
import { BookshelfEditPeriodNavButton } from "@/components/orders/BookshelfEditPeriodNavButton";
import { DiaryBookDeleteButton } from "@/components/orders/DiaryBookDeleteButton";
import { BodyPortal, IMMERSIVE_OVERLAY_Z_CLASS } from "@/components/ui/BodyPortal";
import { OwlNavButton } from "@/components/ui/OwlNavButton";

const MENU_TRIGGER_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-[#faf8f5] px-3 py-1.5 text-xs font-medium text-stone-900 shadow-sm transition hover:border-stone-400 hover:bg-white active:scale-[0.98] sm:text-sm";

const MENU_ITEM_CLASS =
  "block w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm font-medium text-stone-900 transition hover:border-emerald-300 hover:bg-emerald-50/70";

type Props = {
  bookId: string;
  bookTitle: string;
  showEditPeriod?: boolean;
  showEditIncludes?: boolean;
  /** 現在ページがあしあと本文のときだけ渡す */
  entryEditHref?: string | null;
};

export function DiaryBookEditActionsMenu({
  bookId,
  bookTitle,
  showEditPeriod = false,
  showEditIncludes = false,
  entryEditHref = null,
}: Props) {
  const titleId = useId();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const hasBookEdits = showEditIncludes || showEditPeriod;
  const hasEntryEdit = Boolean(entryEditHref);
  if (!hasBookEdits && !hasEntryEdit) return null;

  return (
    <>
      <button type="button" className={MENU_TRIGGER_CLASS} onClick={() => setOpen(true)}>
        このあしあとブックを編集
      </button>

      {open ? (
        <BodyPortal>
          <div
            className={`fixed inset-0 ${IMMERSIVE_OVERLAY_Z_CLASS} flex items-end justify-center bg-stone-900/45 p-3 sm:items-center sm:p-6`}
            role="presentation"
            onClick={close}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-stone-200 bg-[#faf8f5] p-4 shadow-xl sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id={titleId} className="text-base font-semibold text-stone-900">
                    このあしあとブックを編集
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">
                    変更したい項目を選んでください。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                >
                  閉じる
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {showEditPeriod ? (
                  <BookshelfEditPeriodNavButton
                    bookId={bookId}
                    className={MENU_ITEM_CLASS}
                  >
                    対象期間を変更
                  </BookshelfEditPeriodNavButton>
                ) : null}

                {showEditIncludes ? (
                  <BookshelfEditIncludesNavButton
                    bookId={bookId}
                    className={MENU_ITEM_CLASS}
                  >
                    本に入れるあしあとを編集
                  </BookshelfEditIncludesNavButton>
                ) : null}

                {entryEditHref ? (
                  <OwlNavButton
                    href={entryEditHref}
                    loadingLabel="このあしあとを開いています…"
                    className={MENU_ITEM_CLASS}
                  >
                    このあしあとを編集
                  </OwlNavButton>
                ) : null}

                {showEditIncludes ? (
                  <div className="border-t border-stone-200 pt-2">
                    <DiaryBookDeleteButton
                      bookId={bookId}
                      bookTitle={bookTitle}
                      buttonLabel="このあしあとブックを削除"
                      className={`${MENU_ITEM_CLASS} border-rose-200 text-rose-800 hover:border-rose-300 hover:bg-rose-50`}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </BodyPortal>
      ) : null}
    </>
  );
}
