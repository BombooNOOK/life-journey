"use client";

import { GuestReadingFontSizeBand } from "@/components/reading/GuestReadingFontSizeBand";
import { useAboutPageCtaAudienceContext } from "@/components/about/AboutPageCtaAudienceProvider";

/** 未登録向けの文字サイズ帯（既存ユーザーには不要） */
export function AboutPageGuestReadingFontSizeBand() {
  const { ready, showReturningUserCtas } = useAboutPageCtaAudienceContext();

  if (!ready || showReturningUserCtas) {
    return null;
  }

  return <GuestReadingFontSizeBand pageKey="about" />;
}
