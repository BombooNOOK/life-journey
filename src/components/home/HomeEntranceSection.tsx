import Image from "next/image";
import Link from "next/link";

import { HomeHeroSubNavLink } from "@/components/home/HomeHeroSubNavLink";
import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";
import {
  heroCtaAreaClass,
  heroCtaAreaInnerClass,
  heroCtaButtonsGroupClass,
  heroCtaMicrocopyAboveButtonClass,
  heroCtaMicrocopyGroupClass,
  heroCtaPrimaryClass,
  heroCtaStackClass,
  heroCtaTextBandClass,
  heroFontSizeControlBandClass,
} from "@/components/home/heroCtaStyles";
import {
  HOME_HERO_FOREST_BG_SRC,
  HOME_HERO_OWL_TEACHER_SRC,
} from "@/lib/home/homeHeroAssets";

/** アプリ玄関：1画面の森ヒーロー＋2導線 */
export function HomeEntranceSection() {
  return (
    <section className="home-read-scope relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#f6f4ef]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <Image
          src={HOME_HERO_FOREST_BG_SRC}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[44%_42%] sm:object-[50%_48%] md:object-[50%_55%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fffdf9]/55 via-[#fffdf9]/18 to-[#f6f4ef]/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/55 via-white/12 to-transparent md:max-w-[68%]" />
      </div>

      <Image
        src={HOME_HERO_OWL_TEACHER_SRC}
        alt=""
        aria-hidden
        width={682}
        height={1024}
        sizes="(max-width: 640px) 46vw, 34vw"
        className="pointer-events-none absolute bottom-[5.5rem] right-[-0.25rem] z-[6] h-[11.5rem] w-auto max-w-[46%] object-contain object-bottom sm:bottom-[6rem] sm:right-0 sm:h-[13.5rem] sm:max-w-[42%] md:bottom-[7rem] md:h-[18rem] md:max-w-[36%]"
        priority
      />

      <div className="relative z-20 flex flex-1 flex-col px-4 pb-6 pt-8 sm:px-6 sm:pt-10">
        <div className="min-w-0 max-w-xl">
          <p className="whitespace-nowrap text-[clamp(10px,2.5vw,12px)] font-medium leading-none tracking-[0.1em] text-emerald-800">
            Life Journey Diary
          </p>
          <h1 className="mt-2 font-extrabold leading-none tracking-tight text-stone-900 text-[clamp(1.625rem,1rem+4.5vw,2.5rem)] sm:text-4xl">
            <span className="flex flex-col gap-[0.12em]">
              <span className="block whitespace-nowrap">数字で紡ぐ、</span>
              <span className="block">人生の旅</span>
            </span>
          </h1>
          <p className="lj-read-desc mt-3 whitespace-pre-line font-semibold leading-[1.45] text-emerald-900 sm:mt-4 sm:text-lg sm:leading-8">
            数秘術鑑定からはじまる、{"\n"}あなただけの人生記録ノート。
          </p>
        </div>

        <div className={`mt-auto ${heroCtaAreaClass}`}>
          <div className={heroCtaAreaInnerClass}>
            <div className={heroCtaTextBandClass}>
              <div className={heroCtaMicrocopyGroupClass}>
                <p className={heroCtaMicrocopyAboveButtonClass}>
                  クレジットカード登録なし／2週間無料お試し
                </p>
              </div>
            </div>
            <div className={heroCtaStackClass}>
              <div className={heroCtaButtonsGroupClass}>
                <Link href="/about" className={heroCtaPrimaryClass}>
                  はじめての方はこちら
                </Link>
                <HomeHeroSubNavLink />
              </div>
            </div>
          </div>
        </div>

        <div className={`relative z-10 ${heroFontSizeControlBandClass}`}>
          <ReadingFontSizeControl variant="hero" />
        </div>
      </div>
    </section>
  );
}
