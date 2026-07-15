"use client";

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
  /** 定規埋め込み時は説明バナーを隠す */
  compact?: boolean;
};

/** PCでもスマホ縦枠で森の本棚を確認するプレビュー */
export function ForestBookshelfPreviewClient({
  itemLayoutOverride,
  spotLayoutOverride,
  compact = false,
}: Props = {}) {
  return (
    <div className={compact ? "w-full" : "mx-auto min-h-[100dvh] max-w-lg px-3 py-5"}>
      {compact ? null : (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-[11px] leading-relaxed text-amber-950 shadow-sm">
          <p>
            <strong>プレビュー</strong>（ログイン不要）。森の本棚の配置・小カード・背表紙一覧を確認できます。
          </p>
          <p className="mt-1">
            <a href="/preview" className="font-medium underline-offset-2 hover:underline">
              一覧へ戻る
            </a>
          </p>
        </div>
      )}
      <ForestBookshelfClient
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
