"use client";

import Image from "next/image";

import { LJD_DIARY_BOOK_GUIDE_COVER_PREVIEW_LABEL } from "@/lib/help/ljdDiaryBookGuideCopy";
import { ashiatoCoverOptions, diaryCoverImagePath } from "@/lib/journal/coverAssets";

/** 案内所用：あしあとブック表紙の雰囲気プレビュー */
export function LjdDiaryBookGuideCoverPreview() {
  return (
    <figure className="rounded-xl border border-stone-200/90 bg-[#faf8f4] p-3 sm:p-4">
      <figcaption className="mb-3 text-xs font-medium text-stone-500">
        {LJD_DIARY_BOOK_GUIDE_COVER_PREVIEW_LABEL}
      </figcaption>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {ashiatoCoverOptions.map((cover) => (
          <div key={cover.id} className="space-y-1.5 text-center">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[9rem] overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-sm">
              <Image
                src={diaryCoverImagePath(cover.id)}
                alt={`${cover.label}の表紙例`}
                fill
                className="object-cover object-center"
                sizes="9rem"
                unoptimized
              />
            </div>
            <p className="text-xs font-medium text-stone-600">{cover.label}</p>
          </div>
        ))}
      </div>
    </figure>
  );
}
