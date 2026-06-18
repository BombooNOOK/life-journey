import Image from "next/image";
import Link from "next/link";

import { HomeHeroSubNavLink } from "@/components/home/HomeHeroSubNavLink";
import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";
import {
  heroCtaContinueClass,
  heroCtaMicrocopyAboveButtonClass,
  heroFontSizeControlBandClass,
} from "@/components/home/heroCtaStyles";
import {
  HOME_HERO_FOREST_BG_SRC,
  HOME_HERO_OWL_TEACHER_SRC,
} from "@/lib/home/homeHeroAssets";

const newcomerButtonClass = [
  heroCtaContinueClass,
  "!min-w-0 max-w-[9.5rem] px-3 py-3 sm:max-w-[10.5rem] sm:px-3.5",
].join(" ");

const newcomerLineClass = "block text-sm font-semibold leading-snug text-emerald-950 sm:text-base";

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

      <div className="relative z-20 flex min-h-[100dvh] flex-col px-4 pb-3 pt-8 sm:px-6 sm:pt-10">
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

        <div className="mt-6 flex flex-1 flex-col items-center justify-center pb-36 sm:mt-8 sm:pb-40">
          <div className="w-full max-w-[min(20rem,90vw)] sm:max-w-[21rem]">
            <HomeHeroSubNavLink variant="entrance" className="mx-auto" />
          </div>
        </div>

        <div className="absolute bottom-[5rem] left-7 z-20 sm:bottom-[5.75rem] sm:left-11">
          <div className="flex flex-col items-start gap-1.5">
            <p className={heroCtaMicrocopyAboveButtonClass}>
              クレジットカード登録なし／2週間無料お試し
            </p>
            <Link href="/about" className={newcomerButtonClass}>
              <span className={newcomerLineClass}>はじめての方は</span>
              <span className={`${newcomerLineClass} mt-0.5`}>こちら</span>
            </Link>
          </div>
        </div>

        <div className={`relative z-20 ${heroFontSizeControlBandClass}`}>
          <ReadingFontSizeControl variant="hero" />
        </div>
      </div>
    </section>
  );
}
