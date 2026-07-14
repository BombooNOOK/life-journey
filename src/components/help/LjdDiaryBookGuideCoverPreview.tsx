"use client";

import Image from "next/image";

import { LJD_DIARY_BOOK_GUIDE_COVER_PREVIEW_LABEL } from "@/lib/help/ljdDiaryBookGuideCopy";

const COVER_PREVIEWS = [
  {
    src: "/images/diary-cover-kireime-drfukuro.png",
    label: "きれいめ",
  },
  {
    src: "/images/diary-cover-casual-drfukuro.png",
    label: "シンプル",
  },
] as const;

/** 案内所用：日記ブック表紙の雰囲気プレビュー */
export function LjdDiaryBookGuideCoverPreview() {
  return (
    <figure className="rounded-xl border border-stone-200/90 bg-[#faf8f4] p-3 sm:p-4">
      <figcaption className="mb-3 text-xs font-medium text-stone-500">
        {LJD_DIARY_BOOK_GUIDE_COVER_PREVIEW_LABEL}
      </figcaption>
      <div className="grid grid-cols-2 gap-3">
        {COVER_PREVIEWS.map((cover) => (
          <div key={cover.src} className="space-y-1.5 text-center">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[9rem] overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-sm">
              <Image
                src={cover.src}
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
