"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AshiatoPageShapePicker } from "@/components/orders/AshiatoPageShapePicker";
import {
  ashiatoCoverOptions,
  diaryCoverImagePath,
  type AshiatoCoverId,
} from "@/lib/journal/coverAssets";
import {
  ASHIATO_COMPANION_TEMPLATE_SLUGS,
  ashiatoPageTemplateBodyPathForCompanion,
  ashiatoPageTemplateOptions,
  ashiatoPageTemplatePreviewPath,
  DEFAULT_ASHIATO_PAGE_TEMPLATE_ID,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";

const COMPANION_LABELS: Record<(typeof ASHIATO_COMPANION_TEMPLATE_SLUGS)[number], string> = {
  drfukuro: "フクロウ",
  harinezumi: "ハリネズミ",
  namakemono: "ナマケモノ",
  risu: "リス",
  kerosion: "ケロシオン",
};

const COMPANION_TYPE_BY_SLUG = {
  drfukuro: "owl",
  harinezumi: "hedgehog",
  namakemono: "sloth",
  risu: "squirrel",
  kerosion: "frog",
} as const;

export function AshiatoTemplatesPreviewClient() {
  const [coverId, setCoverId] = useState<AshiatoCoverId>("cover_mori_standard");
  const [pageId, setPageId] = useState<AshiatoPageTemplateId>(DEFAULT_ASHIATO_PAGE_TEMPLATE_ID);
  const [companionSlug, setCompanionSlug] =
    useState<(typeof ASHIATO_COMPANION_TEMPLATE_SLUGS)[number]>("drfukuro");

  const pageDef = useMemo(
    () => ashiatoPageTemplateOptions.find((o) => o.id === pageId)!,
    [pageId],
  );

  const companionPreviewSrc = useMemo(() => {
    if (pageDef.files.kind !== "companion") {
      return ashiatoPageTemplatePreviewPath(pageId);
    }
    return ashiatoPageTemplateBodyPathForCompanion(
      pageId,
      COMPANION_TYPE_BY_SLUG[companionSlug],
    );
  }, [companionSlug, pageDef.files.kind, pageId]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-16">
      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-stone-900">表紙（3種）</h2>
        <p className="mt-1 text-xs text-stone-600">作成画面と同じサムネ＋選択です。</p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {ashiatoCoverOptions.map((opt) => {
            const selected = coverId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCoverId(opt.id)}
                className={`rounded-lg border-2 p-1.5 text-left transition sm:p-2 ${
                  selected
                    ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="relative aspect-[724/1024] overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                  <Image
                    src={diaryCoverImagePath(opt.id)}
                    alt={opt.label}
                    fill
                    className="object-cover"
                    sizes="160px"
                    unoptimized
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-stone-900 sm:text-sm">
                  {opt.label}
                </p>
              </button>
            );
          })}
        </div>
        <div className="relative mx-auto mt-4 aspect-[724/1024] w-full max-w-xs overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
          <Image
            src={diaryCoverImagePath(coverId)}
            alt={`${ashiatoCoverOptions.find((o) => o.id === coverId)?.label ?? ""}の大きめ表示`}
            fill
            className="object-contain"
            sizes="20rem"
            unoptimized
            priority
          />
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-stone-900">ページのかたち（4種）</h2>
        <p className="mt-1 text-xs text-stone-600">
          「大きく見る」で合成プレビューと入る内容を確認できます。
        </p>
        <div className="mt-4">
          <AshiatoPageShapePicker value={pageId} onChange={setPageId} />
        </div>
      </section>

      {pageDef.files.kind === "companion" ? (
        <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-stone-900">
            キャラ別プレビュー（{pageDef.label}）
          </h2>
          <p className="mt-1 text-xs text-stone-600">すうじ系は5キャラ分の1枚完結テンプレです。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ASHIATO_COMPANION_TEMPLATE_SLUGS.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => setCompanionSlug(slug)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  companionSlug === slug
                    ? "bg-emerald-800 text-white"
                    : "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50"
                }`}
              >
                {COMPANION_LABELS[slug]}
              </button>
            ))}
          </div>
          <div className="relative mx-auto mt-4 aspect-[721/1024] w-full max-w-sm overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
            <Image
              src={companionPreviewSrc}
              alt={`${pageDef.label}（${COMPANION_LABELS[companionSlug]}）`}
              fill
              className="object-contain"
              sizes="24rem"
              unoptimized
            />
          </div>
        </section>
      ) : null}

      <p className="text-center text-xs text-stone-500">
        <Link href="/preview/ashiato-templates/layout" className="underline-offset-2 hover:underline">
          レイアウト定規へ
        </Link>
        {" · "}
        <Link href="/preview" className="underline-offset-2 hover:underline">
          プレビュー一覧へ戻る
        </Link>
        {" · "}
        <Link href="/orders/bookshelf" className="underline-offset-2 hover:underline">
          本棚の作成フォームでも確認可
        </Link>
      </p>
    </div>
  );
}
