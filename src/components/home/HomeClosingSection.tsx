import Image from "next/image";
import Link from "next/link";

import {
  heroCtaClosingMicrocopyClass,
  heroCtaClosingStackClass,
  heroCtaMicrocopyBelowButtonClass,
  heroCtaPrimaryClass,
} from "@/components/home/heroCtaStyles";
import { HOME_CLOSING_GROUP_IMAGE } from "@/lib/home/homeClosingSection";

const BODY_PARAGRAPHS = [
  "Life Journey Diaryは、日々のきもちや出来事を、スマホから気軽に残せる記録ノートです。",
  "そのときは何気なく書いた一言も、あとから読み返すと、今の自分を支えてくれる小さな宝物になることがあります。",
  "デジタルで残した毎日は、いつか手元に残る「日記ブック」として、未来の自分へ、そして大切な家族へ届ける一冊に育っていきます。",
  "まずは、あなたの数字を知るところから。森のどうぶつ鑑定士たちと一緒に、人生の旅の記録をはじめてみませんか。",
] as const;

/** トップ最下部：やさしい締めのCTA＋鑑定士集合イラスト */
export function HomeClosingSection() {
  return (
    <section className="rounded-2xl border border-stone-200/75 bg-[#fdfaf4] px-4 py-8 shadow-sm sm:px-6 sm:py-10 md:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[clamp(1.05rem,0.9rem+1.2vw,1.35rem)] font-semibold leading-snug tracking-tight text-stone-900">
          今日の記録が、いつか大切な一冊になる。
        </h2>

        <div className="mx-auto mt-5 max-w-xl space-y-3.5 text-left sm:mt-6 sm:space-y-4">
          {BODY_PARAGRAPHS.map((paragraph) => (
            <p
              key={paragraph}
              className="lj-read-body text-stone-600"
            >
              {paragraph}
            </p>
          ))}
        </div>

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
