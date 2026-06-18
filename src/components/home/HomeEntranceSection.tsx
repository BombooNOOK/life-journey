import Image from "next/image";
import Link from "next/link";

import { HomeHeroSubNavLink } from "@/components/home/HomeHeroSubNavLink";
import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";
import {
  heroCtaButtonsGroupClass,
  heroCtaMicrocopyAboveButtonClass,
  heroCtaMicrocopyGroupClass,
  heroCtaPrimaryClass,
} from "@/components/home/heroCtaStyles";
import {
  HOME_HERO_FOREST_BG_SRC,
  HOME_HERO_OWL_TEACHER_SRC,
} from "@/lib/home/homeHeroAssets";

const entranceCtaStackClass =
  "mx-auto flex w-full max-w-[13.25rem] flex-col items-stretch sm:max-w-[14rem]";
const entranceCtaButtonClass = `${heroCtaPrimaryClass} !min-w-0 px-3 py-3 text-[13px] sm:min-h-[48px] sm:py-3 sm:text-sm`;
const entranceContinueButtonClass = "!min-w-0 px-3 py-2.5 sm:px-3 sm:py-3";
const entranceFontSizeControlBandClass =
  "mx-auto mt-2 w-full max-w-[13.25rem] border-t border-stone-300/40 px-1 pb-2.5 pt-2 sm:max-w-[14rem]";

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
        sizes="(max-width: 640px) 44vw, 34vw"
        className="pointer-events-none absolute bottom-0 right-[-0.5rem] z-[6] h-[11.5rem] w-auto max-w-[46%] object-contain object-bottom sm:right-0 sm:h-[13.5rem] sm:max-w-[42%] md:right-3 md:h-[19rem] md:max-w-[36%] lg:right-6 lg:h-[21.5rem]"
        priority
      />

      <div className="relative z-20 flex flex-1 flex-col px-4 pb-6 pt-8 sm:px-6 sm:pt-10">
        <div className="min-w-0 max-w-xl">
          <p className="whitespace-nowrap text-[clamp(10px,2.5vw,13px)] font-medium leading-none tracking-[0.1em] text-emerald-800">
            Life Journey Diary
          </p>
          <h1 className="mt-2 font-extrabold leading-[1.02] tracking-tight text-stone-900 text-[clamp(2rem,1.1rem+6vw,3.25rem)] sm:text-[2.75rem] md:text-5xl">
            <span className="flex flex-col gap-[0.1em]">
              <span className="block whitespace-nowrap">数字で紡ぐ、</span>
              <span className="block">人生の旅</span>
            </span>
          </h1>
          <p className="lj-read-desc mt-3 whitespace-pre-line text-[clamp(1rem,0.9rem+1.2vw,1.375rem)] font-semibold leading-[1.5] text-emerald-900 sm:mt-4 sm:text-xl sm:leading-8 md:text-[1.35rem]">
            数秘術鑑定からはじまる、{"\n"}あなただけの人生記録ノート。
          </p>
        </div>

        <div className="relative z-10 mt-6 flex flex-col items-center sm:mt-7">
          <div className={entranceCtaStackClass}>
            <div className={heroCtaMicrocopyGroupClass}>
              <p className={heroCtaMicrocopyAboveButtonClass}>
                クレジットカード登録なし／2週間無料お試し
              </p>
            </div>
            <div className={`mt-2 ${heroCtaButtonsGroupClass}`}>
              <Link href="/about" className={entranceCtaButtonClass}>
                はじめての方はこちら
              </Link>
              <HomeHeroSubNavLink className={entranceContinueButtonClass} />
            </div>
          </div>

          <div className={entranceFontSizeControlBandClass}>
            <ReadingFontSizeControl variant="hero" />
          </div>
        </div>
      </div>
    </section>
  );
}
