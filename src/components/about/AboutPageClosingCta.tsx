"use client";

import Image from "next/image";
import Link from "next/link";

import {
  heroCtaClosingMicrocopyClass,
  heroCtaClosingStackClass,
  heroCtaPrimaryClass,
} from "@/components/home/heroCtaStyles";
import { HOME_CLOSING_GROUP_IMAGE } from "@/lib/home/homeClosingSection";
import { useAboutPageCtaAudienceContext } from "@/components/about/AboutPageCtaAudienceProvider";

const BODY_PARAGRAPHS = [
  "Life Journey Diaryは、日々のきもちや出来事を、スマホから気軽に残せる記録ノートです。",
  "そのときは何気なく書いた一言も、あとから読み返すと、今の自分を支えてくれる小さな宝物になることがあります。",
  "デジタルで残した毎日は、いつか手元に残る「日記ブック」として、未来の自分へ、そして大切な家族へ届ける一冊に育っていきます。",
  "まずは、あなたの数字を知るところから。森のどうぶつ鑑定士たちと一緒に、人生の旅の記録をはじめてみませんか。",
] as const;

const RETURNING_TAIL =
  "これまでに残してきた記録も、これから書く言葉も、あなたの歩みをそっと支えてくれます。" as const;

function ClosingPlaceholder() {
  return (
    <section className="rounded-2xl border border-stone-200/75 bg-[#fdfaf4] px-4 py-8 shadow-sm sm:px-6 sm:py-10" aria-hidden>
      <div className="mx-auto h-6 w-56 rounded bg-stone-200/70" />
      <div className="mx-auto mt-6 h-12 w-full max-w-xs rounded-xl bg-stone-200/55" />
    </section>
  );
}

/** /about 下部：新規向け締めCTA or 既存ユーザー向け（登録導線なし） */
export function AboutPageClosingCta() {
  const { ready, showReturningUserCtas } = useAboutPageCtaAudienceContext();

  if (!ready) {
    return <ClosingPlaceholder />;
  }

  const paragraphs = showReturningUserCtas
    ? [...BODY_PARAGRAPHS.slice(0, 3), RETURNING_TAIL]
    : [...BODY_PARAGRAPHS];

  return (
    <section className="rounded-2xl border border-stone-200/75 bg-[#fdfaf4] px-4 py-8 shadow-sm sm:px-6 sm:py-10 md:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[clamp(1.05rem,0.9rem+1.2vw,1.35rem)] font-semibold leading-snug tracking-tight text-stone-900">
          今日の記録が、いつか大切な一冊になる。
        </h2>

        <div className="mx-auto mt-5 max-w-xl space-y-3.5 text-left sm:mt-6 sm:space-y-4">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="lj-read-body text-stone-600">
              {paragraph}
            </p>
          ))}
        </div>

        {showReturningUserCtas ? null : (
          <div className={`mt-6 sm:mt-8 ${heroCtaClosingStackClass}`}>
            <Link href="/order" className={heroCtaPrimaryClass}>
              はじめての方はこちら
            </Link>
            <p className={`mt-3 ${heroCtaClosingMicrocopyClass}`}>
              お名前と生年月日だけで無料鑑定へ。
              <br className="sm:hidden" />
              クレジットカード登録なしで、2週間日記をお試しいただけます。
            </p>
          </div>
        )}

        <figure className="mx-auto mt-8 max-w-xl sm:mt-10 md:mt-12">
          <div className="overflow-hidden rounded-2xl border border-stone-200/60 bg-[#faf8f5] shadow-[0_8px_24px_rgba(92,74,58,0.08)]">
            <Image
              src={HOME_CLOSING_GROUP_IMAGE.src}
              alt={HOME_CLOSING_GROUP_IMAGE.alt}
              width={HOME_CLOSING_GROUP_IMAGE.width}
              height={HOME_CLOSING_GROUP_IMAGE.height}
              sizes="(max-width: 640px) 92vw, (max-width: 768px) 85vw, 36rem"
              className="h-auto w-full object-cover"
              priority={false}
            />
          </div>
        </figure>
      </div>
    </section>
  );
}
