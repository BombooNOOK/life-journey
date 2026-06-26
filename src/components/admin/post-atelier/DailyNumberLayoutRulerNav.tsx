import Link from "next/link";

import {
  buildDailyNumberLayoutRulerHref,
  dailyNumberEditPath,
} from "@/lib/admin/post-atelier/daily-number/layoutRulerUrls";

type Props = {
  draftId: string;
  variant?: "edit" | "ruler";
};

/** dev のみ表示（本番ではレイアウト定規ページ自体が 404） */
export function DailyNumberLayoutRulerNav({ draftId, variant = "edit" }: Props) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const editHref = dailyNumberEditPath(draftId);
  const rulerHref = buildDailyNumberLayoutRulerHref({ returnTo: editHref });

  if (variant === "ruler") {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3">
        <p className="text-xs font-medium text-violet-900">レイアウト調整中</p>
        <Link
          href={editHref}
          className="mt-2 inline-flex rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100"
        >
          ← 編集・画像プレビューへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm">
      <span className="text-xs font-medium text-violet-900">画像レイアウト（dev）</span>
      <Link
        href={rulerHref}
        className="inline-flex rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-900 hover:bg-violet-100"
      >
        レイアウト定規を開く（表紙） →
      </Link>
      <span className="text-xs text-violet-800/80">
        個別ページは定規内のスライド切替、または下の画像プレビューから
      </span>
    </div>
  );
}
