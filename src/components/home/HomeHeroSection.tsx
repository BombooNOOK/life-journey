import Image from "next/image";
import Link from "next/link";

import { HomeHeroSubNavLink } from "@/components/home/HomeHeroSubNavLink";
import {
  heroCtaMicrocopyAboveButtonClass,
  heroCtaMicrocopyBelowButtonClass,
  heroCtaPrimaryClass,
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
      <div className="relative z-20 p-3 sm:p-6 md:pb-4">
        <div className="min-w-0 rounded-2xl bg-[#fffdf9]/72 p-2.5 backdrop-blur-[1px] sm:p-4 md:max-w-2xl md:bg-[#fffdf9]/78">
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
          <p className="mt-3 whitespace-pre-line text-[15px] font-semibold leading-[1.45] text-emerald-900 sm:mt-3.5 sm:text-lg sm:leading-8 md:text-xl md:leading-8">
            数秘術鑑定からはじまる、{"\n"}あなただけの人生記録ノート。
          </p>
        </div>
      </div>

      <div className="relative min-h-[18rem] sm:min-h-[20rem] md:min-h-[22rem] lg:min-h-[24rem]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <Image
            src={HOME_HERO_FOREST_BG_SRC}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover object-[44%_68%] sm:object-[50%_64%] md:object-[50%_72%] lg:object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f6f4ef]/95 via-[#fffdf9]/80 to-[#fffdf9]/45 md:from-[#f6f4ef]/90 md:via-[#fffdf9]/62 md:to-[#fffdf9]/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/62 to-white/5 md:from-white/88 md:via-white/42 md:to-transparent md:max-w-[70%]" />
        </div>

        <Image
          src={HOME_HERO_OWL_TEACHER_SRC}
          alt=""
          aria-hidden
          width={568}
          height={781}
          sizes="(max-width: 640px) 42vw, (max-width: 1024px) 34vw, 280px"
          className="pointer-events-none absolute bottom-0 right-[-0.5rem] z-[6] h-[10.75rem] w-auto max-w-[44%] object-contain object-bottom sm:right-0 sm:h-[12.5rem] sm:max-w-[40%] md:h-[19rem] md:max-w-[34%] md:right-3 lg:right-8 lg:h-[21rem]"
          priority
        />

        <div className="relative z-10 flex min-h-full flex-col justify-end px-3 pb-4 pt-1 sm:px-6 sm:pb-6 md:max-w-xs md:pb-8 lg:max-w-sm">
          <div className="rounded-2xl bg-[#fffdf9]/84 p-2 backdrop-blur-[2px] sm:bg-[#fffdf9]/78 sm:p-3 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <div className={heroCtaStackClass}>
              <div className="space-y-1.5 sm:space-y-2">
                <p className={heroCtaMicrocopyAboveButtonClass}>
                  クレジットカード登録なしで、2週間無料お試し
                </p>
                <Link href="/order" className={heroCtaPrimaryClass}>
                  はじめての方はこちら
                </Link>
                <p className={heroCtaMicrocopyBelowButtonClass}>
                  ※まずは、お名前と生年月日だけで無料鑑定へ
                </p>
                <HomeHeroSubNavLink />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
