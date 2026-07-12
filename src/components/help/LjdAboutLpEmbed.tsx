"use client";

import { AboutPageCtaAudienceProvider } from "@/components/about/AboutPageCtaAudienceProvider";
import { LjdAboutLpSections } from "@/components/about/LjdAboutLpSections";

/** 案内所 TOC「LJD とは」用。鑑定士・FAQ は TOC の独立項目へ移した */
export function LjdAboutLpEmbed() {
  return (
    <AboutPageCtaAudienceProvider>
      <LjdAboutLpSections showAppraisers={false} showFaq={false} />
    </AboutPageCtaAudienceProvider>
  );
}
