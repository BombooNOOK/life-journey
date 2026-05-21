"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getBookPlan, type BookPlanResult } from "@/lib/order/bookBindingPlan";

function PlanSummaryBlock({ plan }: { plan: BookPlanResult }) {
  if (plan.plan === "over_limit") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/80 px-3 py-3 text-sm text-red-900">
        <p className="font-medium">{plan.overLimitMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200/90 bg-white/80 px-3 py-3 text-sm text-stone-800">
      <p className="text-xs font-medium text-stone-600">選択されるプラン</p>
      <p className="mt-1 font-semibold text-emerald-950">{plan.productName}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-stone-700">
        最大{plan.maxPages}ページまで
        {plan.periodHint ? `（${plan.periodHint}）` : null}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-stone-900">{plan.priceDisplay}</p>
      {plan.priceNote ? (
        <p className="mt-1 text-[12px] leading-snug text-stone-600">{plan.priceNote}</p>
      ) : null}
    </div>
  );
}

function navigateToShop(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const BINDING_CONFIRM_CHECK_ITEMS = [
  { id: "date", label: "掲載する日付を確認しました" },
  { id: "content", label: "日記本文を確認しました" },
  { id: "photo", label: "写真を確認しました" },
  { id: "consent", label: "表示内容を確認し、この内容で製本に進むことを了承します" },
] as const;

type BindingConfirmCheckId = (typeof BINDING_CONFIRM_CHECK_ITEMS)[number]["id"];

const INITIAL_BINDING_CHECKS: Record<BindingConfirmCheckId, boolean> = {
  date: false,
  content: false,
  photo: false,
  consent: false,
};

type ModalStep = "confirm" | "code";

type IssuedBinding = {
  diaryBindingCode: string;
  baseShopUrl: string;
};

function allBindingChecksComplete(checks: Record<BindingConfirmCheckId, boolean>): boolean {
  return BINDING_CONFIRM_CHECK_ITEMS.every((item) => checks[item.id]);
}

function DiaryBindingCodePanel({
  code,
  baseShopUrl,
  copyToast,
  onCopy,
  onGoToBase,
  variant = "inline",
  baseOrderable = true,
}: {
  code: string;
  baseShopUrl: string;
  copyToast: string | null;
  onCopy: () => void;
  onGoToBase: () => void;
  variant?: "inline" | "modal";
  baseOrderable?: boolean;
}) {
  const title =
    variant === "inline" ? "発行済みの製本申込コード" : "製本申込コード";
  const helpText =
    variant === "inline"
      ? "このコードは、BASEで注文するときに必要です。コピーし忘れた場合も、ここから再度コピーできます。"
      : "このコードは、どの日記を製本するか確認するために必要です。BASEの商品ページで「製本申込コード」欄に必ず貼り付けてください。";

  return (
    <div className={variant === "inline" ? "space-y-3" : "space-y-4"}>
      <div>
        <p className="text-sm font-semibold text-stone-900">{title}</p>
        <div
          className={[
            "mt-2 rounded-lg border border-emerald-200 bg-emerald-50/50 text-center",
            variant === "modal" ? "px-4 py-4" : "px-3 py-3",
          ].join(" ")}
        >
          {variant === "modal" ? (
            <p className="text-xs font-medium text-stone-600">製本申込コード</p>
          ) : null}
          <p
            className={[
              "break-all font-mono font-bold tracking-wide text-emerald-950",
              variant === "modal" ? "mt-2 text-xl sm:text-2xl" : "text-lg sm:text-xl",
            ].join(" ")}
          >
            {code}
          </p>
        </div>
      </div>
      <p className="text-xs leading-relaxed text-stone-700">{helpText}</p>
      {copyToast ? (
        <p className="text-center text-xs font-medium text-emerald-800">{copyToast}</p>
      ) : null}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => void onCopy()}
          className="w-full rounded-lg border border-emerald-400 bg-white px-4 py-2.5 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
        >
          コードをコピー
        </button>
        <button
          type="button"
          disabled={!baseShopUrl || !baseOrderable}
          onClick={onGoToBase}
          className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          BASEで注文へ進む
        </button>
      </div>
    </div>
  );
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
  const [modalStep, setModalStep] = useState<ModalStep>("confirm");
  const [bindingChecks, setBindingChecks] =
    useState<Record<BindingConfirmCheckId, boolean>>(INITIAL_BINDING_CHECKS);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [pendingBinding, setPendingBinding] = useState<IssuedBinding | null>(null);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [contentUpdatedNotice, setContentUpdatedNotice] = useState(false);
  const [modalBinding, setModalBinding] = useState<IssuedBinding | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const copyToastTimerRef = useRef<number | null>(null);

  const checksComplete = allBindingChecksComplete(bindingChecks);
  const activeCode = modalStep === "code" && modalBinding ? modalBinding.diaryBindingCode : null;
  const copyTargetCode = activeCode ?? pendingBinding?.diaryBindingCode ?? null;
  const copyTargetBaseUrl = modalBinding?.baseShopUrl ?? pendingBinding?.baseShopUrl ?? null;

  const fetchPendingBinding = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await fetch(`/api/journal/bookshelf/${year}/diary-book-binding`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        pending?: IssuedBinding | null;
        contentUpdated?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setPendingBinding(null);
        return;
      }
      if (data.pending?.diaryBindingCode && data.pending?.baseShopUrl) {
        setPendingBinding({
          diaryBindingCode: data.pending.diaryBindingCode,
          baseShopUrl: data.pending.baseShopUrl,
        });
        setContentUpdatedNotice(Boolean(data.contentUpdated));
      } else {
        setPendingBinding(null);
        setContentUpdatedNotice(false);
      }
    } catch {
      setPendingBinding(null);
    } finally {
      setPendingLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void fetchPendingBinding();
  }, [fetchPendingBinding, pageCount]);

  const resetModalState = useCallback(() => {
    setModalStep("confirm");
    setBindingChecks({ ...INITIAL_BINDING_CHECKS });
    setIssueLoading(false);
    setIssueError(null);
    setModalBinding(null);
    setCopyToast(null);
  }, []);

  const closeModal = useCallback(() => {
    setConfirmOpen(false);
    resetModalState();
  }, [resetModalState]);

  useEffect(() => {
    if (!confirmOpen) return;
    resetModalState();
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [confirmOpen, closeModal, resetModalState]);

  useEffect(() => {
    return () => {
      if (copyToastTimerRef.current !== null) {
        window.clearTimeout(copyToastTimerRef.current);
      }
    };
  }, []);

  const showCopyToast = useCallback((message: string) => {
    setCopyToast(message);
    if (copyToastTimerRef.current !== null) {
      window.clearTimeout(copyToastTimerRef.current);
    }
    copyToastTimerRef.current = window.setTimeout(() => {
      setCopyToast(null);
      copyToastTimerRef.current = null;
    }, 2200);
  }, []);

  const handleCopyCode = useCallback(async () => {
    if (!copyTargetCode) return;
    try {
      await navigator.clipboard.writeText(copyTargetCode);
      showCopyToast("コピーしました");
    } catch {
      showCopyToast("コピーできませんでした。コードを手動で選択してください。");
    }
  }, [copyTargetCode, showCopyToast]);

  const handleGoToBase = useCallback(() => {
    const url = copyTargetBaseUrl;
    if (!url) return;
    navigateToShop(url);
  }, [copyTargetBaseUrl]);

  const applyIssueResult = useCallback(
    (data: {
      diaryBindingCode: string;
      baseShopUrl: string;
      contentUpdated?: boolean;
    }) => {
      const binding = {
        diaryBindingCode: data.diaryBindingCode,
        baseShopUrl: data.baseShopUrl,
      };
      setPendingBinding(binding);
      setModalBinding(binding);
      if (data.contentUpdated) {
        setContentUpdatedNotice(true);
      }
    },
    [],
  );

  const handleIssueCode = async () => {
    if (!checksComplete || issueLoading) return;
    setIssueLoading(true);
    setIssueError(null);
    try {
      const res = await fetch(`/api/journal/bookshelf/${year}/diary-book-binding`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        diaryBindingCode?: string;
        baseShopUrl?: string;
        contentUpdated?: boolean;
        error?: string;
      };
      if (!res.ok || !data.diaryBindingCode || !data.baseShopUrl) {
        throw new Error(data.error ?? "製本申込コードの発行に失敗しました。");
      }
      applyIssueResult({
        diaryBindingCode: data.diaryBindingCode,
        baseShopUrl: data.baseShopUrl,
        contentUpdated: data.contentUpdated,
      });
      setModalStep("code");
    } catch (e) {
      setIssueError(e instanceof Error ? e.message : "製本申込コードの発行に失敗しました。");
    } finally {
      setIssueLoading(false);
    }
  };

  const hasPages = pageCount > 0;
  const canOrder = hasPages && planData.orderable;
  const showPendingBlock = !pendingLoading && pendingBinding && planData.orderable;

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
            <span className="font-semibold text-stone-900">現在の製本対象：{pageCount}ページ</span>
          </p>
          <p className="text-[12px] leading-snug text-stone-600">
            ※日記本文のみを数えます（1投稿＝1ページ）。表紙・カレンダー・振り返り等は含みません。
          </p>
          {!hasPages ? (
            <p className="text-[13px] leading-relaxed text-amber-900">
              本に入れるページがありません。製本したい日記をONにしてください。
            </p>
          ) : (
            <PlanSummaryBlock plan={planData} />
          )}
        </div>

        {showPendingBlock ? (
          <div className="mt-4 rounded-lg border border-emerald-300/80 bg-emerald-50/60 p-3">
            {contentUpdatedNotice ? (
              <p className="mb-3 rounded-md border border-amber-200/90 bg-amber-50/90 px-2.5 py-2 text-xs leading-relaxed text-amber-950">
                現在の掲載内容に合わせて、申込内容を更新しました。コードは同じままお使いいただけます。
              </p>
            ) : null}
            <DiaryBindingCodePanel
              variant="inline"
              code={pendingBinding.diaryBindingCode}
              baseShopUrl={pendingBinding.baseShopUrl}
              copyToast={confirmOpen ? null : copyToast}
              onCopy={handleCopyCode}
              onGoToBase={handleGoToBase}
              baseOrderable={canOrder}
            />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!canOrder}
          className="mt-4 w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingBinding ? "製本内容を確認して注文する" : "この内容で注文する"}
        </button>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
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
            {modalStep === "confirm" ? (
              <>
                <h2 id="binding-confirm-title" className="text-base font-semibold text-stone-900">
                  この内容で製本しますか？
                </h2>

                <div className="mt-4 space-y-2.5 rounded-lg border border-emerald-200/90 bg-emerald-50/40 px-3 py-3 text-xs leading-relaxed text-stone-800">
                  <p className="font-medium text-stone-900">
                    製本前に、プレビューで内容をご確認ください。
                  </p>
                  <p>
                    掲載する日付・日記本文・写真に誤りがないか、ご自身で確認してからお進みください。
                  </p>
                  <p>
                    運営側では、日記本文を読んで校正したり、内容を確認したりすることはありません。
                  </p>
                  <p>
                    ご本人が確認した内容をもとに、製本用データを作成し、原則としてそのまま印刷・製本手配に使用します。
                  </p>
                </div>

                <div className="mt-4 space-y-2 text-sm text-stone-800">
                  <p>
                    <span className="text-stone-600">現在の製本対象：</span>
                    <span className="font-semibold">{pageCount}ページ</span>
                  </p>
                  <PlanSummaryBlock plan={planData} />
                </div>

                <fieldset className="mt-4 space-y-2.5">
                  <legend className="text-sm font-medium text-stone-900">ご確認</legend>
                  {BINDING_CONFIRM_CHECK_ITEMS.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-start gap-2.5 rounded-md border border-stone-200 bg-stone-50/80 px-3 py-2.5 text-sm text-stone-800"
                    >
                      <input
                        type="checkbox"
                        checked={bindingChecks[item.id]}
                        onChange={(e) =>
                          setBindingChecks((prev) => ({ ...prev, [item.id]: e.target.checked }))
                        }
                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="leading-snug">{item.label}</span>
                    </label>
                  ))}
                </fieldset>

                <p className="mt-4 text-sm font-medium text-amber-900">この内容は後から変更できません。</p>
                <p className="mt-2 text-[11px] leading-snug text-stone-500">
                  ※ページ数はご注文時の内容で確定します。
                </p>

                {issueError ? (
                  <p className="mt-3 text-sm text-red-700">{issueError}</p>
                ) : null}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
                    onClick={closeModal}
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    disabled={!checksComplete || issueLoading || !canOrder}
                    className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => void handleIssueCode()}
                  >
                    {issueLoading
                      ? "発行中…"
                      : pendingBinding
                        ? "製本申込コードを表示する"
                        : "製本申込コードを発行する"}
                  </button>
                </div>
                {!checksComplete ? (
                  <p className="mt-2 text-center text-[11px] text-stone-500 sm:text-right">
                    すべての確認項目にチェックを入れるとコードを発行できます。
                  </p>
                ) : null}
              </>
            ) : modalBinding ? (
              <>
                <h2 id="binding-confirm-title" className="text-base font-semibold text-stone-900">
                  製本申込コード
                </h2>
                <p className="mt-1 text-xs text-stone-600">
                  BASEの商品ページで「製本申込コード」欄に必ず貼り付けてください。
                </p>
                {contentUpdatedNotice ? (
                  <p className="mt-3 rounded-md border border-amber-200/90 bg-amber-50/90 px-2.5 py-2 text-xs leading-relaxed text-amber-950">
                    現在の掲載内容に合わせて、申込内容を更新しました。コードは同じままお使いいただけます。
                  </p>
                ) : null}
                <div className="mt-4">
                  <DiaryBindingCodePanel
                    variant="modal"
                    code={modalBinding.diaryBindingCode}
                    baseShopUrl={modalBinding.baseShopUrl}
                    copyToast={copyToast}
                    onCopy={handleCopyCode}
                    onGoToBase={handleGoToBase}
                    baseOrderable={canOrder}
                  />
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
                  onClick={closeModal}
                >
                  閉じる
                </button>
                <p className="mt-2 text-center text-[11px] text-stone-500">
                  閉じたあとも、下の「発行済みの製本申込コード」から再度コピーできます。
                </p>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
