import type { Metadata } from "next";

import { AboutPageCtaAudienceProvider } from "@/components/about/AboutPageCtaAudienceProvider";
import { LjdAboutLpSections } from "@/components/about/LjdAboutLpSections";
import { AboutPageTopBar } from "@/components/about/AboutPageTopBar";

export const metadata: Metadata = {
  title: "Life Journey Diaryとは",
  description:
    "Life Journey Diaryの考え方や、数秘術鑑定からはじまる人生記録ノートの流れをご紹介します。",
};

export default function AboutPage() {
  return (
    <AboutPageCtaAudienceProvider>
      <div className="home-read-scope -mt-2 space-y-4 sm:mt-0 sm:space-y-5">
        <div id="about-top" className="scroll-mt-24">
          <AboutPageTopBar />
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Life Journey Diaryとは</h1>
          <p className="mt-1 text-sm text-stone-600">
            Life Journey Diaryのことを、ゆっくりご紹介します。
          </p>
        </div>

        <LjdAboutLpSections />
      </div>
    </AboutPageCtaAudienceProvider>
  );
}
