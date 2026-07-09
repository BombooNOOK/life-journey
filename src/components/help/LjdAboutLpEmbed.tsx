"use client";

import { AboutPageCtaAudienceProvider } from "@/components/about/AboutPageCtaAudienceProvider";
import { LjdAboutLpSections } from "@/components/about/LjdAboutLpSections";

/** 森の案内所などへ埋め込む LJDとは LP（CTA 出し分け付き） */
export function LjdAboutLpEmbed() {
  return (
    <AboutPageCtaAudienceProvider>
      <LjdAboutLpSections />
    </AboutPageCtaAudienceProvider>
  );
}
