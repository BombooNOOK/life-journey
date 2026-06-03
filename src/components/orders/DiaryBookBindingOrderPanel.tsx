"use client";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

import { useCallback, useEffect, useRef, useState } from "react";

import { diaryBookBindingOverviewValue } from "@/lib/journal/diaryBookBindingOffer";
import { BOOK_PLAN_LABELS_JA, getBookPlan, type BookPlanId } from "@/lib/order/bookBindingPlan";

type IssuedBinding = {
  diaryBindingCode: string;
  baseShopUrl: string;
};

type Props = {
  bookId: string;
  pageCount: number;
  planId: BookPlanId;
  orderable: boolean;
};

const COPY_FAIL_MESSAGE =
  "お使いの端末では自動コピーできない場合があります。\n製本コードを長押ししてコピーしてください。";

const CODE_DISPLAY_CLASS =
  "mt-2 cursor-text touch-manipulation select-all rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-5 text-center font-mono text-[1.35rem] font-bold leading-snug tracking-wide text-emerald-950 shadow-inner sm:text-2xl";

function openBaseShop(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Clipboard API → execCommand の順で試す（HTTP / iOS Safari 向け） */
async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* secure context 外や権限拒否時はフォールバックへ */
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function DiaryBookBindingOrderPanel({ bookId, pageCount, planId, orderable }: Props) {
  const plan = getBookPlan(pageCount);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [issued, setIssued] = useState<IssuedBinding | null>(null);
  const [contentUpdatedNotice, setContentUpdatedNotice] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const copyToastTimerRef = useRef<number | null>(null);
  const codeRef = useRef<HTMLParagraphElement>(null);

  const showCopyToast = useCallback((message: string) => {
    setCopyToast(message);
    if (copyToastTimerRef.current) window.clearTimeout(copyToastTimerRef.current);
    copyToastTimerRef.current = window.setTimeout(() => setCopyToast(null), 4000);
  }, []);

  const selectCodeText = useCallback(() => {
    const el = codeRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  const fetchPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await fetch(`/api/journal/diary-books/${bookId}/diary-book-binding`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        pending?: IssuedBinding | null;
        contentUpdated?: boolean;
      };
      if (res.ok && data.pending?.diaryBindingCode && data.pending?.baseShopUrl) {
        setIssued({
          diaryBindingCode: data.pending.diaryBindingCode,
          baseShopUrl: data.pending.baseShopUrl,
        });
        setContentUpdatedNotice(Boolean(data.contentUpdated));
      } else {
        setIssued(null);
        setContentUpdatedNotice(false);
      }
    } catch {
      setIssued(null);
    } finally {
      setPendingLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    void fetchPending();
  }, [fetchPending]);

  const handleIssue = async () => {
    setIssueLoading(true);
    setIssueError(null);
    try {
      const res = await fetch(`/api/journal/diary-books/${bookId}/diary-book-binding`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as IssuedBinding & { error?: string; contentUpdated?: boolean };
      if (!res.ok || !data.diaryBindingCode || !data.baseShopUrl) {
        throw new Error(data.error ?? "製本申込コードの発行に失敗しました。");
      }
      setIssued({
        diaryBindingCode: data.diaryBindingCode,
        baseShopUrl: data.baseShopUrl,
      });
      setContentUpdatedNotice(Boolean(data.contentUpdated));
    } catch (e) {
      setIssueError(e instanceof Error ? e.message : "製本申込コードの発行に失敗しました。");
    } finally {
      setIssueLoading(false);
    }
  };

  const handleCopy = async () => {
    const code = issued?.diaryBindingCode;
    if (!code) return;
    const ok = await copyTextToClipboard(code);
    if (ok) {
      showCopyToast("コピーしました");
      return;
    }
    selectCodeText();
    showCopyToast(COPY_FAIL_MESSAGE);
  };

  const handleCodeTap = () => {
    selectCodeText();
  };

  if (!orderable) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        {plan.overLimitMessage ?? "ページ数が多いため、個別相談が必要です"}
      </div>
    );
  }

  if (pendingLoading) {
    return <p className="text-sm text-stone-500">申込状況を確認しています…</p>;
  }

  if (issued) {
    return (
      <div className="space-y-4">
        {contentUpdatedNotice ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            日記ブックの内容が更新されたため、ページ数とプラン情報を最新の状態に更新しました。製本コードはそのままお使いいただけます。
          </p>
        ) : null}
        <div>
          <p className="text-sm font-medium text-stone-800">製本コード</p>
          <p
            ref={codeRef}
            role="textbox"
            tabIndex={0}
            aria-label={`製本コード ${issued.diaryBindingCode}`}
            className={CODE_DISPLAY_CLASS}
            onClick={handleCodeTap}
            onFocus={handleCodeTap}
          >
            {issued.diaryBindingCode}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            このコードをBASEの商品ページの製本コード欄に入力してください。
          </p>
          <p className="mt-1 text-xs text-stone-500">
            製本対象：{diaryBookBindingOverviewValue(plan)}
          </p>
        </div>
        {copyToast ? (
          <p className="whitespace-pre-line text-center text-xs font-medium leading-relaxed text-emerald-800">
            {copyToast}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex-1 rounded-lg border border-emerald-400 bg-white px-4 py-2.5 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
          >
            コードをコピー
          </button>
          <button
            type="button"
            onClick={() => openBaseShop(issued.baseShopUrl)}
            className="flex-1 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
          >
            BASEの商品ページへ進む
          </button>
        </div>
        <button
          type="button"
          onClick={() => void handleIssue()}
          disabled={issueLoading}
          aria-busy={issueLoading}
          className="text-xs text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline disabled:opacity-50"
        >
          {issueLoading ? (
            <OwlLoadingInline label="注文ページを準備しています…" size="sm" />
          ) : (
            "申込内容を最新の日記に合わせて更新する"
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-700">
        製本対象：{BOOK_PLAN_LABELS_JA[planId]}（総ページ数 {pageCount} ページ）
      </p>
      <button
        type="button"
        onClick={() => void handleIssue()}
        disabled={issueLoading}
        aria-busy={issueLoading}
        className="inline-flex rounded-lg border border-violet-300 bg-violet-50 px-5 py-2.5 text-sm font-medium text-violet-950 hover:bg-violet-100 disabled:opacity-60"
      >
        {issueLoading ? (
          <OwlLoadingInline label="注文ページを準備しています…" size="sm" />
        ) : (
          "製本版を注文する"
        )}
      </button>
      {issueError ? <p className="text-xs text-red-700">{issueError}</p> : null}
    </div>
  );
}
