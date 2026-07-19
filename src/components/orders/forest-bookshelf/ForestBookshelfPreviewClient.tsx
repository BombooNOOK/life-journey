"use client";

import Link from "next/link";

import { ForestBookshelfClient } from "@/components/orders/forest-bookshelf/ForestBookshelfClient";
import { FOREST_BOOKSHELF_ASSETS } from "@/lib/ljd/forestBookshelfAssets";
import type {
  ForestBookshelfItemId,
  ForestBookshelfRect,
  ForestBookshelfSpotId,
} from "@/lib/ljd/forestBookshelfLayout";

const PREVIEW_DIARY = [
  {
    id: "preview-diary-1",
    title: "7月の記録",
    periodLabel: "2026/07/01 〜 2026/07/31",
    createdLabel: "2026/07/10",
    entryCount: 12,
    href: "/preview",
    coverSrc: "/images/kantei-cover.png?v=1",
  },
  {
    id: "preview-diary-2",
    title: "春のあしあと",
    periodLabel: "2026/03/01 〜 2026/05/31",
    createdLabel: "2026/06/01",
    entryCount: 20,
    href: "/preview",
    coverSrc: FOREST_BOOKSHELF_ASSETS.placeholderGreen,
  },
] as const;

const PREVIEW_KANTEI = [
  {
    id: "preview-kantei-1",
    title: "鑑定書（サンプル）",
    createdLabel: "2026/04/12",
    subtitle: "ライフジャーニーの鑑定書です。",
    href: "/preview",
    coverSrc: "/images/kantei-cover.png?v=1",
  },
] as const;

const PREVIEW_ENTITLEMENT = {
  tier: "subscriber" as const,
  showTrialBanner: false,
  bannerVariant: "none" as const,
  canUseContinuedFeatures: true,
  canCreateFirstJournal: true,
  trialDaysRemaining: null,
  trialDayIndex: null,
};

type Props = {
  /** レイアウト定規からの下書き反映など */
  itemLayoutOverride?: Partial<Record<ForestBookshelfItemId, ForestBookshelfRect>>;
  spotLayoutOverride?: Partial<Record<ForestBookshelfSpotId, ForestBookshelfRect>>;
  /** 定規埋め込み時は説明バナーを隠し、棚だけ表示 */
  compact?: boolean;
  /**
   * true = 本番と同じ没入全画面（スクロール不可・重なりやすい）
   * false = 枠付きでページスクロール可能（校正・Cursor内ブラウザ向け）
   */
  immersive?: boolean;
};

/** 森の本棚プレビュー（枠付きスクロール／没入は任意） */
export function ForestBookshelfPreviewClient({
  itemLayoutOverride,
  spotLayoutOverride,
  compact = false,
  immersive = false,
}: Props = {}) {
  if (compact) {
    return (
      <ForestBookshelfClient
        layout="framed"
        hideChrome
        activeProfileLabel="モグ"
        activeProfileId="preview"
        entitlement={PREVIEW_ENTITLEMENT}
        kanteiBooks={[...PREVIEW_KANTEI]}
        diaryBooks={[...PREVIEW_DIARY]}
        blockCreate={false}
        itemLayoutOverride={itemLayoutOverride}
        spotLayoutOverride={spotLayoutOverride}
      />
    );
  }

  if (immersive) {
    return (
      <div className="relative min-h-[100dvh] w-full">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="pointer-events-auto mx-auto max-w-md rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-[11px] leading-relaxed text-amber-950 shadow-sm backdrop-blur-[2px]">
            <p>
              <strong>プレビュー</strong>（没入表示）。スクロールできません。見づらいときは{" "}
              <Link href="/preview/forest-bookshelf" className="font-medium underline underline-offset-2">
                枠付き表示
              </Link>
              へ。
            </p>
          </div>
        </div>
        <ForestBookshelfClient
          layout="immersive"
          activeProfileLabel="モグ"
          activeProfileId="preview"
          entitlement={PREVIEW_ENTITLEMENT}
          kanteiBooks={[...PREVIEW_KANTEI]}
          diaryBooks={[...PREVIEW_DIARY]}
          blockCreate={false}
          itemLayoutOverride={itemLayoutOverride}
          spotLayoutOverride={spotLayoutOverride}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[#2c1f14] text-stone-100">
      <div className="mx-auto max-w-lg space-y-3 px-3 py-4 sm:px-4">
        <div className="rounded-xl border border-amber-200/40 bg-[#fffdf8] px-3 py-2 text-[12px] leading-relaxed text-amber-950 shadow-sm">
          <p className="font-medium">プレビュー（枠付き・スクロール可）</p>
          <p className="mt-1 text-[11px] text-stone-700">
            上部余白は本棚用の部屋背景です。位置合わせは{" "}
            <Link
              href="/preview/forest-bookshelf/layout"
              className="font-medium text-amber-900 underline underline-offset-2"
            >
              レイアウト定規
            </Link>
            。本番と同じ見え方は{" "}
            <Link
              href="/preview/forest-bookshelf?immersive=1"
              className="font-medium text-amber-900 underline underline-offset-2"
            >
              没入表示
            </Link>
            。
          </p>
          <p className="mt-1">
            <Link href="/preview" className="text-[11px] font-medium text-stone-600 underline-offset-2 hover:underline">
              校正一覧へ戻る
            </Link>
          </p>
        </div>
        <ForestBookshelfClient
          layout="framed"
          hideChrome
          activeProfileLabel="モグ"
          activeProfileId="preview"
          entitlement={PREVIEW_ENTITLEMENT}
          kanteiBooks={[...PREVIEW_KANTEI]}
          diaryBooks={[...PREVIEW_DIARY]}
          blockCreate={false}
          itemLayoutOverride={itemLayoutOverride}
          spotLayoutOverride={spotLayoutOverride}
        />
      </div>
    </div>
  );
}
