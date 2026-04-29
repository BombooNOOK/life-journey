"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { STANDARD_URL, getBookPlan } from "@/lib/order/bookBindingPlan";

function navigateToShop(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function BookshelfDiaryBindingOrder({
  year,
  pageCount,
}: {
  year: number;
  /** 製本ページ数の目安（記録件数など） */
  pageCount: number;
}) {
  const planData = useMemo(() => getBookPlan(pageCount), [pageCount]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!confirmOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [confirmOpen]);

  const handleConfirmOrder = () => {
    setConfirmOpen(false);
    if (planData.plan === "standard_plus") {
      navigateToShop(STANDARD_URL);
      return;
    }
    navigateToShop(planData.baseUrl);
  };

  const planName = planData.label;
  const hasPages = pageCount > 0;

  return (
    <>
      <div className="mt-3 border-t border-emerald-100/80 pt-3">
        <p className="text-sm font-semibold text-stone-900">
          <span aria-hidden className="mr-1">
            📖
          </span>
          {year}年の記録
        </p>
        <div className="mt-3 space-y-2 text-sm text-stone-800">
          <p>
            <span className="font-semibold text-stone-900">本に入れるページ数：{pageCount}ページ</span>
          </p>
          {hasPages ? (
            <p className="text-[13px] leading-relaxed">
              この内容は<span className="font-semibold text-emerald-900">「{planName}」</span>
              で製本されます。
            </p>
          ) : (
            <p className="text-[13px] leading-relaxed text-amber-900">
              本に入れるページがありません。製本したい日記をONにしてください。
            </p>
          )}
          <p className="text-[12px] leading-snug text-stone-600">
            ※ページ数に応じて自動で選択されています。
          </p>
          <p className="rounded-md bg-white/70 px-2 py-2 text-[12px] font-medium leading-snug text-emerald-950">
            あなたのページ数に合わせて、最適なプランが自動選択されています。
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!hasPages}
          className="mt-4 w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          この内容で注文する
        </button>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="binding-confirm-title"
            tabIndex={-1}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-stone-200 bg-white p-5 shadow-xl outline-none"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="binding-confirm-title" className="text-base font-semibold text-stone-900">
              この内容で製本しますか？
            </h2>

            <ul className="mt-4 space-y-2 text-sm text-stone-800">
              <li>
                <span className="text-stone-600">本に入れるページ数：</span>
                <span className="font-semibold">{pageCount}ページ</span>
              </li>
              <li>
                <span className="text-stone-600">プラン：</span>
                <span className="font-semibold">{planName}</span>
              </li>
            </ul>

            {planData.plan === "standard_plus" ? (
              <p className="mt-4 text-xs leading-relaxed text-stone-700">
                120ページを超えるため、「スタンダード版」と「追加ページ（20ページ単位）」の組み合わせになります。追加の目安は約{" "}
                <span className="font-semibold">{planData.extra}</span>{" "}
                単位です。まずスタンダードの商品ページへ進み、続けて追加ページも注文画面でご確認ください。
              </p>
            ) : null}

            <p className="mt-4 text-sm font-medium text-amber-900">この内容は後から変更できません。</p>
            <p className="mt-2 text-[11px] leading-snug text-stone-500">
              ※ページ数はご注文時の内容で確定します。
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
                onClick={() => setConfirmOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
                onClick={() => void handleConfirmOrder()}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
