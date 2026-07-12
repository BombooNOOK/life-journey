import { AboutPageClosingCta } from "@/components/about/AboutPageClosingCta";
import { AboutPageGuestReadingFontSizeBand } from "@/components/about/AboutPageGuestReadingFontSizeBand";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeAppraiserProfilesSection } from "@/components/home/HomeAppraiserProfilesSection";
import { HomeFaqSection } from "@/components/home/HomeFaqSection";
import { HomeOwlNavigatorIntroSection } from "@/components/home/HomeOwlNavigatorIntroSection";
import { HomeProductMockSection } from "@/components/home/HomeProductMockSection";
import { HomeRecommendedForSection } from "@/components/home/HomeRecommendedForSection";

type Props = {
  className?: string;
  /** /about では true。案内所の「LJD とは」では鑑定士・FAQ を TOC 独立項目へ出すため false */
  showAppraisers?: boolean;
  showFaq?: boolean;
};

/** /about と同内容の LP セクション一式（ページ見出し・戻りリンクは含まない） */
export function LjdAboutLpSections({
  className = "",
  showAppraisers = true,
  showFaq = true,
}: Props) {
  return (
    <div className={["space-y-4 sm:space-y-5", className].filter(Boolean).join(" ")}>
      <HomeAboutSection />
      <HomeOwlNavigatorIntroSection />
      <HomeRecommendedForSection />
      <HomeProductMockSection />
      {showAppraisers ? <HomeAppraiserProfilesSection /> : null}
      {showFaq ? <HomeFaqSection /> : null}
      <AboutPageClosingCta />
      <AboutPageGuestReadingFontSizeBand />
    </div>
  );
}
