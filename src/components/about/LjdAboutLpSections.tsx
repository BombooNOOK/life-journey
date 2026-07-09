import { AboutPageClosingCta } from "@/components/about/AboutPageClosingCta";
import { AboutPageGuestReadingFontSizeBand } from "@/components/about/AboutPageGuestReadingFontSizeBand";
import { AboutPageQuickStartCta } from "@/components/about/AboutPageQuickStartCta";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeAppraiserProfilesSection } from "@/components/home/HomeAppraiserProfilesSection";
import { HomeFaqSection } from "@/components/home/HomeFaqSection";
import { HomeOwlNavigatorIntroSection } from "@/components/home/HomeOwlNavigatorIntroSection";
import { HomeProductMockSection } from "@/components/home/HomeProductMockSection";
import { HomeRecommendedForSection } from "@/components/home/HomeRecommendedForSection";

type Props = {
  className?: string;
};

/** /about と同内容の LP セクション一式（ページ見出し・戻りリンクは含まない） */
export function LjdAboutLpSections({ className = "" }: Props) {
  return (
    <div className={["space-y-4 sm:space-y-5", className].filter(Boolean).join(" ")}>
      <HomeAboutSection />
      <HomeOwlNavigatorIntroSection />
      <AboutPageQuickStartCta />
      <HomeRecommendedForSection />
      <HomeProductMockSection />
      <HomeAppraiserProfilesSection />
      <HomeFaqSection />
      <AboutPageClosingCta />
      <AboutPageGuestReadingFontSizeBand />
    </div>
  );
}
