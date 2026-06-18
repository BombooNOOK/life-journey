"use client";

import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";

/** はじめての方へ：ログイン前でも使える文字サイズ帯 */
export function AboutReadingFontSizeBand() {
  return (
    <section
      id="about-font-size"
      className="scroll-mt-24 rounded-2xl border border-stone-200/75 bg-[#fffdf9] px-4 py-3 shadow-sm sm:px-5"
      aria-label="文字の大きさ"
    >
      <ReadingFontSizeControl variant="hero" comfortable />
    </section>
  );
}
