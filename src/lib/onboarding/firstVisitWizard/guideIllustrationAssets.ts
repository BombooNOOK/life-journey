import { FOREST_DIRECTION_SIGN_SRC } from "@/lib/onboarding/forestDirectionSignLayout";
import { FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_SRC } from "@/lib/onboarding/firstVisitResidentRegistrationFrameLayout";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** 初回導線ページ URL に対応するイラスト PNG（なければ null） */
export function firstVisitGuideIllustrationForHref(href: string): string | null {
  const path = href.split("?")[0] ?? href;
  if (path === FIRST_VISIT_ROUTES.kanteiReady) return FOREST_DIRECTION_SIGN_SRC;
  if (path === FIRST_VISIT_ROUTES.guideStationSign) return FOREST_DIRECTION_SIGN_SRC;
  return null;
}

/** ready ページ（ゲスト）で先読みするフクロウ枠 */
export function firstVisitGuestOwlPromptIllustration(): string {
  return FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_SRC;
}
