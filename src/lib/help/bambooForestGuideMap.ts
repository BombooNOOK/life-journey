import type { FirstVisitWelcomeViewport } from "@/lib/onboarding/firstVisitWizard/welcomeAssets";

/** BambooNOOKの森の案内図（案内所追加版・地図のみ） */
export const BAMBOO_FOREST_GUIDE_MAP_SRC: Record<FirstVisitWelcomeViewport, string> = {
  mobile: "/images/ljd/first-visit/forest-guide/forest_guide_map_mobile.png",
  desktop: "/images/ljd/first-visit/forest-guide/forest_guide_map_desktop.png",
};

export const BAMBOO_FOREST_GUIDE_MAP_INTRINSIC: Record<
  FirstVisitWelcomeViewport,
  { widthPx: number; heightPx: number }
> = {
  mobile: { widthPx: 576, heightPx: 1024 },
  desktop: { widthPx: 1024, heightPx: 576 },
};

export function bambooForestGuideMapSrc(viewport: FirstVisitWelcomeViewport): string {
  return BAMBOO_FOREST_GUIDE_MAP_SRC[viewport];
}
