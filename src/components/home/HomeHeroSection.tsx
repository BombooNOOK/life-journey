import Image from "next/image";
import Link from "next/link";

import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";
import { HomeHeroSubNavLink } from "@/components/home/HomeHeroSubNavLink";
import {
  heroCtaMicrocopyAboveButtonClass,
  heroCtaMicrocopyBelowButtonClass,
  heroCtaMicrocopyGroupClass,
  heroCtaPrimaryClass,
  heroCtaPrimaryGroupClass,
  heroCtaStackClass,
} from "@/components/home/heroCtaStyles";
import {
  HOME_HERO_FOREST_BG_SRC,
  HOME_HERO_OWL_TEACHER_SRC,
} from "@/lib/home/homeHeroAssets";

/** トップヒーロー（見出し＋森背景＋フクロウ先生＋導線） */
export function HomeHeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-[#f6f4ef] shadow-sm">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <Image
          src={HOME_HERO_FOREST_BG_SRC}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover object-[44%_42%] sm:object-[50%_48%] md:object-[50%_55%] lg:object-[center_50%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fffdf9]/55 via-[#fffdf9]/20 to-[#f6f4ef]/55 md:from-[#fffdf9]/45 md:via-transparent md:to-[#f6f4ef]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/15 to-transparent md:max-w-[62%]" />
      </div>

      <Image
        src={HOME_HERO_OWL_TEACHER_SRC}
        alt=""
        aria-hidden
        width={682}
        height={1024}
        sizes="(max-width: 640px) 42vw, (max-width: 1024px) 34vw, 280px"
        className="pointer-events-none absolute bottom-0 right-[-0.5rem] z-[6] h-[10.75rem] w-auto max-w-[44%] object-contain object-bottom sm:right-0 sm:h-[12.5rem] sm:max-w-[40%] md:h-[19rem] md:max-w-[34%] md:right-3 lg:right-8 lg:h-[21rem]"
        priority
      />

      <div className="relative z-20 p-3 sm:p-6 md:pb-2">
        <div className="min-w-0 rounded-2xl bg-[#fffdf9]/28 p-2.5 backdrop-blur-[0.5px] sm:p-4 md:max-w-2xl md:bg-[#fffdf9]/22">
          <div className="relative">
            <p className="relative z-[1] whitespace-nowrap text-[clamp(9px,2.4vw,12px)] font-medium leading-none tracking-[0.08em] text-emerald-800 md:text-xs md:tracking-[0.16em]">
              Life Journey Diary
            </p>
            <h1 className="relative z-[1] mt-2 font-extrabold leading-none tracking-tight text-stone-900 text-[clamp(1.5rem,0.9rem+4vw,2.375rem)] sm:text-3xl md:mt-2 md:text-4xl md:leading-[1.12] lg:text-[2.75rem]">
              <span className="flex flex-col gap-[0.14em] md:hidden">
                <span className="block whitespace-nowrap">数字で紡ぐ、</span>
                <span className="block">人生の旅</span>
              </span>
              <span className="hidden md:flex md:flex-col md:gap-0.5">
                <span className="block">数字で紡ぐ、</span>
                <span className="block">人生の旅</span>
              </span>
            </h1>
            <img
              src="/decorations/ljd-logo-sm.png"
              alt=""
              aria-hidden
              width={132}
              height={132}
              style={{ opacity: 0.5 }}
              className="pointer-events-none absolute -right-1 top-0 z-0 h-[8.25rem] w-[8.25rem] object-contain object-top sm:right-0 sm:h-36 sm:w-36 lg:-right-1 lg:h-[9.75rem] lg:w-[9.75rem]"
            />
          </div>
          <p className="lj-read-desc mt-3 whitespace-pre-line font-semibold leading-[1.45] text-emerald-900 sm:mt-3.5 md:text-xl md:leading-8">
            数秘術鑑定からはじまる、{"\n"}あなただけの人生記録ノート。
          </p>
        </div>
      </div>

      <div className="relative z-10 min-h-[14rem] sm:min-h-[16rem] md:min-h-[18rem] lg:min-h-[20rem]">
        <div className="flex min-h-full flex-col items-start justify-end px-2 pb-4 pt-2 sm:px-6 sm:pb-6 md:pb-8">
          <div className={heroCtaStackClass}>
            <div className="space-y-2 sm:space-y-2.5">
              <div className={heroCtaPrimaryGroupClass}>
                <div className={heroCtaMicrocopyGroupClass}>
                  <p className={heroCtaMicrocopyAboveButtonClass}>
                    クレジットカード登録なしで、2週間無料お試し
                  </p>
                  <p className={heroCtaMicrocopyBelowButtonClass}>
                    ※まずは、お名前と生年月日だけで無料鑑定へ
                  </p>
                </div>
                <Link href="/order" className={heroCtaPrimaryClass}>
                  はじめての方はこちら
                </Link>
              </div>
              <HomeHeroSubNavLink />
              <ReadingFontSizeControl variant="hero" className="mt-2 border-t border-stone-300/40 pt-2" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
