import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";

/** 鑑定のやかた案内（ready）で「次へ」を押したあとの行き先 */
export function firstVisitReadyNextHref(branch: FirstVisitReadyBranch): string {
  if (branch === "guest") return FIRST_VISIT_ROUTES.register;
  if (branch === "needsKantei") return FIRST_VISIT_ROUTES.kanteiReady;
  return FIRST_VISIT_ROUTES.alreadyReady;
}
