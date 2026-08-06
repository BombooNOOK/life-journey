"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  DiaryBookFreeWritingPage,
  DiaryBookMonthBodyOddAdjustmentPage,
  DiaryBookNumerologyQuickReferencePage,
  DiaryBookPreBackCoverIllustrationPage,
} from "@/components/journal/DiaryBookBoundPages";
import { DiaryPreviewScaledViewport } from "@/components/journal/DiaryPreviewScaledViewport";

const TAIL_PAGE_OPTIONS = [
  { id: "quick-reference", label: "今日のすうじ 早見表" },
  { id: "adjustment", label: "本文調整イラスト（③）" },
  { id: "free-writing-left", label: "自由記入 · 左" },
  { id: "free-writing-right", label: "自由記入 · 右" },
  { id: "pre-back", label: "裏表紙前" },
] as const;

type TailPageId = (typeof TAIL_PAGE_OPTIONS)[number]["id"];

function parseTailPage(raw: string | null): TailPageId {
  return TAIL_PAGE_OPTIONS.some(({ id }) => id === raw) ? (raw as TailPageId) : "quick-reference";
}

function buildHref(page: TailPageId): string {
  return `/preview/diary-book-tail?page=${page}`;
}

function TailPagePreview({ page }: { page: TailPageId }) {
  switch (page) {
    case "quick-reference":
      return <DiaryBookNumerologyQuickReferencePage />;
    case "adjustment":
      return <DiaryBookMonthBodyOddAdjustmentPage year={2026} monthIndex={5} />;
    case "free-writing-left":
      return <DiaryBookFreeWritingPage spreadSide="left" />;
    case "free-writing-right":
      return <DiaryBookFreeWritingPage spreadSide="right" />;
    case "pre-back":
      return <DiaryBookPreBackCoverIllustrationPage />;
  }
}

export function DiaryBookTailPreviewClient() {
  const searchParams = useSearchParams();
  const page = parseTailPage(searchParams.get("page"));

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-semibold text-stone-800">あしあとブック末尾ページ（製本イメージ）</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          最終月のあしあと本文のあとに続く固定ページです。724×1024 の製本イメージで表示します。ログイン不要。
        </p>
        <p className="mt-2 text-sm text-stone-600">
          <Link href="/preview" className="underline hover:text-stone-900">
            校正メニューへ
          </Link>
        </p>

        <div className="mt-6 space-y-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">ページ切替</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TAIL_PAGE_OPTIONS.map(({ id, label }) => (
                <Link
                  key={id}
                  href={buildHref(id)}
                  className={[
                    "rounded-md border px-3 py-1.5 text-sm",
                    page === id
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                  ].join(" ")}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-xs leading-relaxed text-stone-500">
            製本時の順番：… → あしあと本文 →（奇数枚なら調整）→ 早見表 → 自由記入2P → 裏表紙前 → 裏表紙
          </p>
        </div>

        <div className="mt-6">
          <DiaryPreviewScaledViewport fitMode="width">
            <TailPagePreview page={page} />
          </DiaryPreviewScaledViewport>
        </div>
      </div>
    </div>
  );
}
