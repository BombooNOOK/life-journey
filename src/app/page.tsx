import Image from "next/image";
import Link from "next/link";

import { HomeMyPageNavButton } from "@/components/home/HomeMyPageNavButton";
import { HomeRecommendedForSection } from "@/components/home/HomeRecommendedForSection";
import {
  heroCtaMicrocopyClass,
  heroCtaMicrocopyDetailClass,
  heroCtaMicrocopyLeadClass,
  heroCtaPrimaryClass,
  heroCtaSecondaryHintClass,
  heroCtaStackClass,
} from "@/components/home/heroCtaStyles";

export default function HomePage() {
  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-[#f6f4ef] p-3 pb-14 shadow-sm sm:p-6 sm:pb-14 md:min-h-[480px] md:p-8 md:pb-12 lg:min-h-[520px]">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 md:hidden">
          <div className="relative mx-auto w-[74%]">
            <img
              src="/images/mainhaikei-smartphone.png"
              alt=""
              className="block w-full [mask-image:linear-gradient(to_right,transparent_0%,#000_20%,#000_80%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_20%,#000_80%,transparent_100%)]"
            />
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="absolute inset-0 bg-[#f6f4ef]" />
          <div className="absolute inset-0 bg-[url('/images/mainhaikei-smartphone.png')] bg-no-repeat bg-[length:auto_min(88%,480px)] bg-[position:100%_100%] lg:bg-[length:auto_min(90%,520px)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f6f4ef] from-[38%] via-[#f6f4ef]/90 via-[52%] to-transparent to-[78%]" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#f6f4ef]/80 to-transparent" />
        </div>
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[26%] bg-gradient-to-b from-white/72 via-white/20 to-transparent md:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl md:hidden"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-amber-200/30 blur-2xl md:hidden"
        />
        <div className="relative z-10 grid gap-1.5 p-1.5 sm:gap-3 sm:p-3 md:max-w-xl md:gap-5 lg:max-w-2xl">
          <div className="min-w-0 rounded-2xl bg-[#fffdf9]/72 p-2.5 backdrop-blur-[1px] sm:p-4 md:bg-[#fffdf9]/78">
            <p className="whitespace-nowrap text-[clamp(8.5px,2.3vw,11px)] leading-none tracking-[0.1em] text-emerald-800 md:text-xs md:tracking-[0.2em]">
              BAMBOONOOK / LIFE JOURNEY
            </p>
            <div className="mt-2 flex items-center gap-2 sm:gap-3 md:mt-2">
              <h1 className="min-w-0 flex-1 font-extrabold leading-[1.12] tracking-tight text-stone-900 text-[clamp(1.5rem,0.9rem+4vw,2.375rem)] sm:text-3xl md:text-4xl md:leading-[1.12] lg:text-[2.75rem]">
                <span className="flex flex-col md:hidden">
                  <span className="block">数字で紡ぐ、</span>
                  <span className="block">人生の旅</span>
                </span>
                <span className="hidden md:flex md:flex-col md:gap-0.5">
                  <span className="block">数字で紡ぐ、</span>
                  <span className="block">人生の旅</span>
                </span>
              </h1>
              <Image
                src="/decorations/ljd-logo-sm.png"
                alt=""
                aria-hidden
                width={72}
                height={72}
                className="h-[2.65rem] w-[2.65rem] shrink-0 object-contain sm:h-[3.25rem] sm:w-[3.25rem] md:h-16 md:w-16 lg:h-[4.5rem] lg:w-[4.5rem]"
              />
            </div>
            <p className="mt-3 whitespace-pre-line text-[15px] font-semibold leading-[1.45] text-emerald-900 sm:mt-3.5 sm:text-lg sm:leading-8 md:text-xl md:leading-8">
              数秘術鑑定からはじまる、{"\n"}あなただけの人生記録ノート。
            </p>
            <div className="mt-3 space-y-1 text-[13px] leading-[1.45] text-stone-500 sm:mt-3 sm:space-y-2 sm:text-[15px] sm:leading-7">
              <p>
                森のどうぶつ鑑定士たちと
                <br className="block md:hidden" />
                日々のきもちをやさしくひも解き、
                <br />
                あなたのことばや写真とともに記録
              </p>
              <p>
                デジタルで残した日々を、手元に残る
                <br />
                <span className="font-semibold text-stone-600">世界に一冊の「日記ブック」</span>へ
                <br className="block md:hidden" />
                育てていくサービスです。
              </p>
            </div>
          </div>

          <div className={heroCtaStackClass}>
            <div className="space-y-1.5 sm:space-y-2">
              <div className={heroCtaMicrocopyClass}>
                <p className={heroCtaMicrocopyLeadClass}>登録不要</p>
                <p className={heroCtaMicrocopyDetailClass}>お名前と生年月日だけで鑑定できます</p>
              </div>
              <Link href="/order" className={heroCtaPrimaryClass}>
                無料鑑定をはじめる
              </Link>
            </div>
            <div className="space-y-1 pb-1 sm:pb-0">
              <p className={heroCtaSecondaryHintClass}>日記や本棚の確認はこちら</p>
              <HomeMyPageNavButton />
            </div>
          </div>
        </div>
      </section>

      <HomeRecommendedForSection />

      <section className="rounded-2xl border border-stone-200/75 bg-[#faf8f5] p-4 sm:p-5">
        <h2 className="text-base font-semibold leading-snug text-stone-900">
          Life Journey Diary の歩き方
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-stone-600">
          Life Journey Diary の考え方や、鑑定書と日記のつながりを知りたい方へ。
        </p>
        <Link
          href="/diary-guide"
          className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-900 underline-offset-2 transition hover:text-emerald-950 hover:underline"
        >
          Life Journey Diary の歩き方を読む →
        </Link>
      </section>
    </div>
  );
}
