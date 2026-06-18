import Image from "next/image";
import Link from "next/link";

import { HomeHeroSubNavLink } from "@/components/home/HomeHeroSubNavLink";
import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";
import {
  heroCtaContinueClass,
  heroCtaMicrocopyAboveButtonClass,
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

/** PC玄関：ログイン・初回導線・文字サイズの左端を揃える */
const pcEntranceActionsClass = "flex w-full max-w-[17rem] flex-col gap-6";

const pcEntranceFontSizeBandClass =
  "w-full border-t border-stone-300/40 pb-2.5 pt-2";

/** スマホ・タブレット縦：文字サイズ帯（md 用の左マージンは入れない） */
const mobileEntranceFontSizeBandClass =
  "relative z-20 ml-2 mr-auto mt-1 w-max max-w-[calc(100%-0.75rem)] border-t border-stone-300/40 px-1 pb-2.5 pt-2 sm:mt-1.5";

function NewcomerBlock() {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <p className={heroCtaMicrocopyAboveButtonClass}>
        クレジットカード登録なし／2週間無料お試し
      </p>
      <Link href="/about" className={newcomerButtonClass}>
        <span className={newcomerLineClass}>はじめての方は</span>
        <span className={`${newcomerLineClass} mt-0.5`}>こちら</span>
      </Link>
    </div>
  );
}

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
          className="object-cover object-[44%_42%] sm:object-[50%_48%] lg:object-[50%_55%]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fffdf9]/55 via-[#fffdf9]/18 to-[#f6f4ef]/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/55 via-white/12 to-transparent lg:max-w-[68%]" />
      </div>

      <div className="relative z-20 mx-auto w-full max-w-3xl px-4 pb-3 pt-10 sm:px-6 sm:pt-11 lg:py-12">
        {/* スマホ：右下のフクロウ */}
        <Image
          src={HOME_HERO_OWL_TEACHER_SRC}
          alt=""
          aria-hidden
          width={682}
          height={1024}
          sizes="(max-width: 767px) 44vw, 280px"
          className="pointer-events-none absolute bottom-4 right-[-0.5rem] z-[6] h-[11.5rem] w-auto max-w-[46%] object-contain object-bottom sm:bottom-5 sm:right-0 sm:h-[13.5rem] sm:max-w-[42%] lg:hidden"
          priority
        />

        {/* スマホ：従来レイアウト */}
        <div className="flex min-h-[calc(100dvh-2.75rem)] flex-col lg:hidden">
          <div className="min-w-0 max-w-xl">
            <p className="whitespace-nowrap text-[clamp(11px,2.8vw,15px)] font-medium leading-none tracking-[0.12em] text-emerald-800 sm:text-sm">
              Life Journey Diary
            </p>
            <h1 className="mt-3 font-extrabold leading-[1.1] tracking-tight text-stone-900 text-[clamp(2rem,1.1rem+6vw,3.25rem)] sm:mt-3.5 sm:text-[2.75rem]">
              <span className="flex flex-col gap-1">
                <span className="block whitespace-nowrap">数字で紡ぐ、</span>
                <span className="block">人生の旅</span>
              </span>
            </h1>
            <p className="lj-read-desc mt-5 whitespace-pre-line text-[clamp(1rem,0.9rem+1.2vw,1.375rem)] font-semibold leading-[1.62] text-emerald-900 sm:mt-5 sm:text-xl sm:leading-[1.75]">
              数秘術鑑定からはじまる、{"\n"}あなただけの人生記録ノート。
            </p>
          </div>

          <div className="mt-8 flex flex-1 flex-col items-center justify-center pb-32 sm:mt-9 sm:pb-36">
            <div className="w-full max-w-[min(16rem,78vw)] sm:max-w-[17rem]">
              <HomeHeroSubNavLink variant="entrance" className="mx-auto" />
            </div>
          </div>

          <div className="absolute bottom-[6.5rem] left-10 z-20 sm:bottom-[7.25rem] sm:left-14">
            <NewcomerBlock />
          </div>

          <div className={mobileEntranceFontSizeBandClass}>
            <ReadingFontSizeControl variant="hero" comfortable />
          </div>
        </div>

        {/* PC：左にコンテンツを縦積み、右にフクロウ */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_12.5rem] lg:items-end lg:gap-6 xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-8">
          <div className="flex flex-col gap-8">
            <div className="min-w-0 max-w-xl">
              <p className="whitespace-nowrap text-base font-medium leading-none tracking-[0.12em] text-emerald-800">
                Life Journey Diary
              </p>
              <h1 className="mt-2 text-5xl font-extrabold leading-[1.02] tracking-tight text-stone-900">
                <span className="flex flex-col gap-[0.1em]">
                  <span className="block whitespace-nowrap">数字で紡ぐ、</span>
                  <span className="block">人生の旅</span>
                </span>
              </h1>
              <p className="lj-read-desc mt-4 whitespace-pre-line text-[1.35rem] font-semibold leading-[1.5] text-emerald-900">
                数秘術鑑定からはじまる、{"\n"}あなただけの人生記録ノート。
              </p>
            </div>

            <div className={pcEntranceActionsClass}>
              <HomeHeroSubNavLink variant="entrance" className="!max-w-none w-full" />

              <NewcomerBlock />

              <div className={pcEntranceFontSizeBandClass}>
                <ReadingFontSizeControl variant="hero" comfortable />
              </div>
            </div>
          </div>

          <div className="flex items-end justify-end pb-1">
            <Image
              src={HOME_HERO_OWL_TEACHER_SRC}
              alt=""
              aria-hidden
              width={682}
              height={1024}
              sizes="224px"
              className="h-[19rem] w-auto max-w-full object-contain object-bottom xl:h-[21.5rem]"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
