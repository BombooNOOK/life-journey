import Link from "next/link";

/** はじめての方へ：動画リンク仮置き（将来 Instagram リールへ差し替え） */
export function HomeVideoIntroSection() {
  const videoHref = "https://www.instagram.com/";

  return (
    <section
      className="rounded-2xl border border-stone-200/75 bg-[#fffdf9] p-4 shadow-sm sm:p-5"
      aria-labelledby="home-video-intro-heading"
    >
      <h2 id="home-video-intro-heading" className="sr-only">
        動画で知る
      </h2>
      <a
        href={videoHref}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-stone-200/80 bg-gradient-to-br from-[#f3ebe0] via-[#faf6ef] to-[#e8dfd0]">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-xl text-emerald-800 shadow-md ring-1 ring-stone-200/80 transition group-hover:scale-105"
            aria-hidden
          >
            ▶
          </div>
          <p className="absolute bottom-3 left-3 rounded-md bg-white/85 px-2 py-1 text-[10px] font-medium text-stone-500 ring-1 ring-stone-200/70">
            準備中
          </p>
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-stone-800 group-hover:text-emerald-900">
          LJDの流れを20秒で見る
        </p>
        <p className="mt-1 text-center text-xs text-stone-500">外部リンク（Instagramリール予定）</p>
      </a>
    </section>
  );
}
