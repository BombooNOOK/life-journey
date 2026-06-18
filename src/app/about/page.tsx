import type { Metadata } from "next";
import Link from "next/link";

import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeAppraiserProfilesSection } from "@/components/home/HomeAppraiserProfilesSection";
import { HomeClosingSection } from "@/components/home/HomeClosingSection";
import { HomeFaqSection } from "@/components/home/HomeFaqSection";
import { HomeProductMockSection } from "@/components/home/HomeProductMockSection";
import { HomeQuickStartSection } from "@/components/home/HomeQuickStartSection";
import { HomeRecommendedForSection } from "@/components/home/HomeRecommendedForSection";
import { HomeVideoIntroSection } from "@/components/home/HomeVideoIntroSection";

export const metadata: Metadata = {
  title: "はじめての方へ",
  description:
    "Life Journey Diaryの考え方や、数秘術鑑定からはじまる人生記録ノートの流れをご紹介します。",
};

export default function AboutPage() {
  return (
    <div className="home-read-scope -mt-2 space-y-4 sm:mt-0 sm:space-y-5">
      <div>
        <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
          ← トップ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">はじめての方へ</h1>
        <p className="mt-1 text-sm text-stone-600">Life Journey Diaryのことを、ゆっくりご紹介します。</p>
      </div>

      <HomeAboutSection />

      <HomeVideoIntroSection />

      <HomeQuickStartSection />

      <HomeRecommendedForSection />

      <HomeProductMockSection />

      <HomeAppraiserProfilesSection />

      <HomeFaqSection />

      <HomeClosingSection />
    </div>
  );
}
