"use client";

import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";
import type { GuestReadingFontSizePageKey } from "@/lib/reading/guestReadingFontSizePages";
import { GUEST_READING_FONT_SIZE_PAGES } from "@/lib/reading/guestReadingFontSizePages";

type Props = {
  pageKey: GuestReadingFontSizePageKey;
};

/** 未ログイン向けページの末尾：文字サイズ切り替え */
export function GuestReadingFontSizeBand({ pageKey }: Props) {
  const page = GUEST_READING_FONT_SIZE_PAGES.find((entry) => entry.key === pageKey);
  if (!page) return null;

  return (
    <section
      id={page.sectionId}
      className="scroll-mt-24 rounded-2xl border border-stone-200/75 bg-[#fffdf9] px-4 py-3 shadow-sm sm:px-5"
      aria-label="文字の大きさ"
    >
      <ReadingFontSizeControl variant="hero" comfortable />
      <p className="mt-3 text-center">
        <button
          type="button"
          className="text-sm text-stone-600 underline-offset-2 transition hover:text-stone-900 hover:underline"
          onClick={() => {
            document.getElementById(page.topId)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          一番上へ
        </button>
      </p>
    </section>
  );
}
