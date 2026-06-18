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
      <p className="mt-3 text-center">
        <button
          type="button"
          className="text-sm text-stone-600 underline-offset-2 transition hover:text-stone-900 hover:underline"
          onClick={() => {
            document.getElementById("about-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          一番上へ
        </button>
      </p>
    </section>
  );
}
