"use client";

import type { DailyNumberGeneratedPayload } from "@/lib/admin/post-atelier/daily-number/types";
import { formatDailyNumberVariantUsageLabel } from "@/lib/admin/post-atelier/daily-number/variantMode";

function BlockPreview({
  block,
}: {
  block: DailyNumberGeneratedPayload["pages"][number]["blocks"][number];
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm font-semibold text-violet-900">{block.displayName}</p>
      <p className="mt-1 text-xs text-stone-500">{block.subtitle}</p>
      <p className="mt-3 text-sm leading-relaxed text-stone-800">{block.body}</p>
      <p className="mt-3 text-xs text-stone-600">
        <span className="font-medium">おまもりカラー：</span>
        {block.colorName}
      </p>
      <ul className="mt-2 list-inside list-disc text-xs text-stone-700">
        <li>{block.actions[0]}</li>
        <li>{block.actions[1]}</li>
      </ul>
    </div>
  );
}

export function DailyNumberPostPreview({ payload }: { payload: DailyNumberGeneratedPayload }) {
  const variantLabel = formatDailyNumberVariantUsageLabel({
    variantMode: payload.variantMode ?? payload.cover.variant ?? "A",
    variant: payload.variant ?? payload.cover.variant ?? "A",
  });

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium text-violet-900">{variantLabel}</p>
      <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
        <p className="text-xs font-medium text-violet-800">表紙プレビュー</p>
        <p className="mt-2 text-lg font-semibold text-stone-900">{payload.seriesTitle}</p>
        <p className="mt-3 text-3xl font-bold tabular-nums text-violet-900">
          今日のすうじ：{payload.todayNumber}
        </p>
        <p className="mt-2 text-base font-medium text-stone-900">{payload.cover.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-700">{payload.cover.summaryMessage}</p>
        <p className="mt-3 text-sm text-stone-600">
          <span className="font-medium">おまもりカラー：</span>
          {payload.cover.colorName}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-900">個別ページプレビュー</h2>
        {payload.pages.map((page) => (
          <div key={page.pageIndex} className="space-y-2">
            <p className="text-xs font-medium text-stone-500">
              ページ {page.pageIndex + 1}
              {page.blocks.length === 2
                ? `（すうじ${page.blocks[0]?.lifePathNumber}・すうじ${page.blocks[1]?.lifePathNumber}）`
                : null}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {page.blocks.map((block) => (
                <BlockPreview key={block.lifePathNumber} block={block} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
