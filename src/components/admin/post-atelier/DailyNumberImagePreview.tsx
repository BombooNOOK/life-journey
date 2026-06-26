"use client";

import Link from "next/link";

import {
  buildDailyNumberLayoutRulerHref,
  carouselIndexToLayoutSlide,
  dailyNumberEditPath,
} from "@/lib/admin/post-atelier/daily-number/layoutRulerUrls";

type Props = {
  draftId: string;
};

const SLIDES = [
  { index: 1, label: "1. 表紙" },
  { index: 2, label: "2. 説明" },
  { index: 3, label: "3. すうじ1・2" },
  { index: 4, label: "4. すうじ3・4" },
  { index: 5, label: "5. すうじ5・6" },
  { index: 6, label: "6. すうじ7・8" },
  { index: 7, label: "7. すうじ9・11" },
  { index: 8, label: "8. すうじ22・33" },
  { index: 9, label: "9. ラストページ" },
] as const;

export function DailyNumberImagePreview({ draftId }: Props) {
  const zipHref = `/api/admin/post-atelier/daily-number/${draftId}/images`;
  const editPath = dailyNumberEditPath(draftId);
  const rulerHref =
    process.env.NODE_ENV === "development"
      ? buildDailyNumberLayoutRulerHref({ returnTo: editPath })
      : null;

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Instagram用画像（合成プレビュー）</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            テンプレートに文案を流し込んだ 4:5 画像です。カルーセルは 1 枚目から順に投稿してください。
          </p>
          {rulerHref ? (
            <p className="mt-2">
              <Link
                href={rulerHref}
                className="text-xs font-medium text-violet-800 underline hover:text-violet-950"
              >
                文字位置の調整 → レイアウト定規を開く
              </Link>
            </p>
          ) : null}
        </div>
        <a
          href={zipHref}
          className="inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          ZIPダウンロード（9枚）
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SLIDES.map(({ index, label }) => {
          const src = `${zipHref}?slide=${index}&t=${draftId}`;
          const slideRulerHref =
            process.env.NODE_ENV === "development"
              ? (() => {
                  const slideId = carouselIndexToLayoutSlide(index);
                  return slideId
                    ? buildDailyNumberLayoutRulerHref({ returnTo: editPath, slide: slideId })
                    : null;
                })()
              : null;
          return (
            <figure
              key={index}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 border-b border-stone-100 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700">
                <span>{label}</span>
                {slideRulerHref ? (
                  <Link
                    href={slideRulerHref}
                    className="shrink-0 font-normal text-violet-800 underline hover:text-violet-950"
                  >
                    定規
                  </Link>
                ) : null}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={label}
                className="block h-auto w-full bg-stone-100"
                loading="lazy"
              />
            </figure>
          );
        })}
      </div>
    </section>
  );
}
