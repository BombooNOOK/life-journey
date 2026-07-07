import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";

/** 旧 ready URL・ログイン済み保険導線の行き先 */
export function firstVisitReadyNextHref(branch: FirstVisitReadyBranch): string {
  if (branch === "guest") return FIRST_VISIT_ROUTES.guideStationSign;
  if (branch === "needsKantei") return FIRST_VISIT_ROUTES.residentCard;
  return FIRST_VISIT_ROUTES.alreadyReady;
}
