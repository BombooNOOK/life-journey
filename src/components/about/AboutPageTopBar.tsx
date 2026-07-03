"use client";

import Link from "next/link";

import { useAboutPageCtaAudienceContext } from "@/components/about/AboutPageCtaAudienceProvider";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";

/** /about 上部の戻りリンク（既存ユーザーはマイページへ） */
export function AboutPageTopBar() {
  const { ready, showReturningUserCtas } = useAboutPageCtaAudienceContext();

  if (!ready) {
    return (
      <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
        ← トップ
      </Link>
    );
  }

  if (showReturningUserCtas) {
    return (
      <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
        {LOG_HOUSE_BACK_LINK.label}
      </Link>
    );
  }

  return (
    <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
      ← トップ
    </Link>
  );
}
