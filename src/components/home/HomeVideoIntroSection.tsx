import { LjdIntroVideoPlayer } from "@/components/home/LjdIntroVideoPlayer";

/** はじめての方へ：LJD紹介動画（軽量MP4・タップ後に読み込み） */
export function HomeVideoIntroSection() {
  return (
    <section
      className="rounded-2xl border border-stone-200/75 bg-[#fffdf9] p-4 shadow-sm sm:p-5"
      aria-labelledby="home-video-intro-heading"
    >
      <h2
        id="home-video-intro-heading"
        className="text-base font-semibold leading-snug text-stone-900 sm:text-[1.05rem]"
      >
        LJDの流れを約20秒で見る
      </h2>
      <p className="lj-read-desc mt-2 leading-[1.55] text-stone-600 sm:mt-2.5 sm:leading-7">
        何気ない日々が、一冊に育っていくイメージを短い動画でご紹介します。
      </p>

      <div className="mt-4 sm:mt-5">
        <LjdIntroVideoPlayer />
      </div>

      <p className="mt-3 text-center text-[0.6875rem] leading-relaxed text-stone-500 sm:text-xs">
        約20秒／ページ内で再生できます
      </p>
    </section>
  );
}
