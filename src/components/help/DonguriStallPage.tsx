import Image from "next/image";
import Link from "next/link";

import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import {
  DONGURI_STALL_ILLUSTRATION_SRC,
  DONGURI_STALL_INTRO_PARAGRAPHS,
  DONGURI_STALL_OFFERS,
  DONGURI_STALL_PAGE_TITLE,
  DONGURI_STALL_PREPARING_NOTICE,
} from "@/lib/help/donguriStallCopy";
import { FOREST_MAP_PAGE_PATH } from "@/lib/help/forestMapAssets";
import { DONGURI_PAGE_PATH } from "@/lib/loghouse/donguriTypes";

type BackLink = { href: string; label: string };

type Props = {
  backLink: BackLink;
};

/** どんぐり売店（購入は準備中・Stripe 非接続） */
export function DonguriStallPage({ backLink }: Props) {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6 sm:px-5">
      <div>
        <Link href={backLink.href} className="text-sm text-stone-600 hover:text-stone-900">
          {backLink.label}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{DONGURI_STALL_PAGE_TITLE}</h1>

        <div className="relative mx-auto mt-4 aspect-square w-full max-w-[280px]">
          <Image
            src={DONGURI_STALL_ILLUSTRATION_SRC}
            alt="どんぐり売店の屋台"
            fill
            className="object-contain object-bottom drop-shadow-[0_8px_18px_rgba(60,40,20,0.18)]"
            sizes="280px"
            priority
            unoptimized
          />
        </div>

        <div className="mt-4 space-y-2 text-sm leading-relaxed text-stone-700">
          {DONGURI_STALL_INTRO_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50/80 px-3.5 py-3 text-sm font-medium leading-relaxed text-amber-950">
          {DONGURI_STALL_PREPARING_NOTICE}
        </p>
      </div>

      <div className="grid gap-3">
        {DONGURI_STALL_OFFERS.map((offer) => (
          <article
            key={offer.id}
            className="rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-[#f7f2ea] px-4 py-4 shadow-sm"
          >
            <h2 className="text-base font-semibold text-stone-900">{offer.title}</h2>
            <p className="mt-1 text-lg font-bold text-amber-900">{offer.detail}</p>
            <p className="mt-2 text-sm font-medium text-stone-600">{offer.status}</p>
            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-lg bg-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600"
            >
              準備中
            </button>
          </article>
        ))}
      </div>

      <section className="space-y-2 rounded-xl border border-stone-200 bg-white px-4 py-4 text-sm leading-relaxed text-stone-700 shadow-sm">
        <h2 className="text-base font-semibold text-stone-900">いまできること</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>ヤギさん郵便やお祝いのおとどけで、どんぐりを受け取れます</li>
          <li>日記の下書きはどんぐりなしで残せます</li>
          <li>森にあしあとを残すときは、どんぐりを使います</li>
        </ul>
        <p className="pt-1 text-xs text-stone-600">
          残高は
          <Link
            href={DONGURI_PAGE_PATH}
            className="mx-0.5 font-medium text-stone-800 underline-offset-2 hover:underline"
          >
            どんぐり帳
          </Link>
          から確認できます。案内図へ戻る場合は
          <Link
            href={FOREST_MAP_PAGE_PATH}
            className="mx-0.5 font-medium text-stone-800 underline-offset-2 hover:underline"
          >
            森の案内図
          </Link>
          へ。
        </p>
      </section>

      <div className="space-y-2 rounded-xl border border-stone-200 bg-[#faf8f5] px-4 py-4 text-xs leading-relaxed text-stone-600 sm:text-sm">
        <p>購入や定期便のお手続きは、いまはまだ始まりません。</p>
        <LegalFooterLinks />
      </div>
    </div>
  );
}
