import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeAppraiserProfilesSection } from "@/components/home/HomeAppraiserProfilesSection";
import { HomeClosingSection } from "@/components/home/HomeClosingSection";
import { HomeFaqSection } from "@/components/home/HomeFaqSection";
import { HomeHeroSection } from "@/components/home/HomeHeroSection";
import { HomeHomeScreenSection } from "@/components/home/HomeHomeScreenSection";
import { HomeProductMockSection } from "@/components/home/HomeProductMockSection";
import { HomeRecommendedForSection } from "@/components/home/HomeRecommendedForSection";

export default function HomePage() {
  return (
    <div className="home-read-scope -mt-2 space-y-4 sm:mt-0 sm:space-y-5">
      <HomeHeroSection />

      <HomeAboutSection />

      <HomeRecommendedForSection />

      <HomeProductMockSection />

      <HomeHomeScreenSection />

      <HomeAppraiserProfilesSection />

      <HomeFaqSection />

      <HomeClosingSection />
    </div>
  );
}
